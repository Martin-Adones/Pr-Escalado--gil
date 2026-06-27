import { PagosRepository } from '../repositories/pagos.repository';
import {
  CrearPagoEntradaDto,
  UcnpayWebhookEntradaDto,
  FilaPago,
  RegistrarTarjetaEntradaDto,
  FilaUserCard
} from '../models/pagos.dtos';

export class PagosService {
  private repository: PagosRepository;
  private ucnpayUrl: string;
  private privateKey: string;

  constructor() {
    this.repository = new PagosRepository();
    this.ucnpayUrl = process.env.UCNPAY_BASE_URL || 'https://proyectogestionti.onrender.com/api';
    this.privateKey = process.env.UCNPAY_PRIVATE_KEY || 'mock_private_key_proyecto_10';
  }

  // --- Integración con UCNPAY Pasarela ---

  async registrarTarjeta(dto: RegistrarTarjetaEntradaDto): Promise<FilaUserCard> {
    try {
      const keycloakId = await this.repository.obtenerKeycloakIdUsuario(dto.id_users);
      if (!keycloakId) {
        throw new Error(`Usuario con id_users ${dto.id_users} no encontrado`);
      }

      console.log(`[UCNPAY] Registrando tarjeta para usuario: ${dto.id_users} (Keycloak: ${keycloakId}) en ${this.ucnpayUrl}/ucnpay/init/suscription`);
      
      const response = await fetch(`${this.ucnpayUrl}/ucnpay/init/suscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-private-key': this.privateKey,
        },
        body: JSON.stringify({
          userId: keycloakId,
          tarjeta: {
            numero: dto.tarjeta.numero,
            exp_mes: dto.tarjeta.exp_mes,
            exp_ano: dto.tarjeta.exp_ano,
            cvc: dto.tarjeta.cvc,
          },
          titular: dto.titular
        })
      });

      if (!response.ok) {
        const bodyText = await response.text();
        throw new Error(`Error pasarela UCNPAY (${response.status}): ${bodyText}`);
      }

      const resJson = (await response.json()) as any;

      if (resJson.status !== 'APROBADO') {
        throw new Error(`UCNPAY rechazó el registro: ${resJson.message || 'Error desconocido'}`);
      }

      // Guardar localmente en la base de datos
      const localCard = await this.repository.registrarTarjeta(
        dto.id_users,
        resJson.paymentMethodToken,
        resJson.card?.brand || 'VISA',
        resJson.card?.last4 || '4444',
        dto.titular
      );

      return localCard;
    } catch (error: any) {
      console.error('[UCNPAY] Error en registrarTarjeta:', error);
      throw error;
    }
  }

  async obtenerTarjetasUsuario(idUsers: string): Promise<FilaUserCard[]> {
    return await this.repository.obtenerTarjetasUsuario(idUsers);
  }

  async eliminarTarjeta(idUsers: string, token: string): Promise<boolean> {
    try {
      const keycloakId = await this.repository.obtenerKeycloakIdUsuario(idUsers);
      if (!keycloakId) {
        throw new Error(`Usuario con id_users ${idUsers} no encontrado`);
      }

      console.log(`[UCNPAY] Eliminando tarjeta para usuario: ${idUsers} (Keycloak: ${keycloakId}) en ${this.ucnpayUrl}/ucnpay/tarjeta`);

      const response = await fetch(`${this.ucnpayUrl}/ucnpay/tarjeta`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-private-key': this.privateKey,
        },
        body: JSON.stringify({
          userId: keycloakId,
          token: token
        })
      });

      if (response.ok) {
        await this.repository.eliminarTarjeta(idUsers, token);
        return true;
      }
      return false;
    } catch (error) {
      console.error('[UCNPAY] Error al eliminar tarjeta:', error);
      return false;
    }
  }

  async crearPago(dto: CrearPagoEntradaDto): Promise<{ pago: FilaPago; redirectUrl?: string }> {
    // 1. Guardar el pago en estado PENDIENTE en base de datos local
    const pago = await this.repository.crearPago(
      dto.id_users,
      dto.amount,
      dto.concept,
      dto.id_billing_cycles
    );

    // 2. Revisar si el usuario ya tiene una tarjeta guardada
    const primeraTarjeta = await this.repository.obtenerPrimerTarjetaUsuario(dto.id_users);

    if (primeraTarjeta) {
      // Intentar cobro automático recurrente (MIT) directamente
      try {
        console.log(`[UCNPAY] Tarjeta encontrada. Ejecutando cargo recurrente automático para el pago: ${pago.id_payments}`);
        
        const response = await fetch(`${this.ucnpayUrl}/ucnpay/suscription/authorize`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-private-key': this.privateKey,
          },
          body: JSON.stringify({
            idOrden: `PAG-${pago.id_payments}`,
            monto: Number(pago.amount),
            moneda: 'CLP',
            paymentMethodToken: primeraTarjeta.payment_method_token,
            customer: primeraTarjeta.holder_name
          })
        });

        if (!response.ok) {
          const bodyText = await response.text();
          throw new Error(`UCNPAY cobro rechazado por red (${response.status}): ${bodyText}`);
        }

        const resJson = (await response.json()) as any;

        // 3. Procesar respuesta del cargo recurrente
        const webhookPayload: UcnpayWebhookEntradaDto = {
          event: resJson.status === 'APROBADO' ? 'transaction.approved' : 'transaction.rejected',
          transactionId: resJson.transactionId || `unknown_${Date.now()}`,
          idOrden: `PAG-${pago.id_payments}`,
          status: resJson.status,
          monto: Number(pago.amount),
          reason: resJson.message,
          paymentMethodToken: resJson.paymentMethodToken,
          mandateId: resJson.mandateId,
          card: resJson.card
        };

        const pagoActualizado = await this.procesarPagoWebhook(webhookPayload);
        if (pagoActualizado) {
          return { pago: pagoActualizado };
        }
      } catch (error) {
        console.error('[UCNPAY] Cargo automático fallido, cayendo a flujo manual:', error);
      }
    }

    // 4. Si no tiene tarjeta o el cobro falló, devolver la URL del Checkout interactivo
    const gatewayPort = process.env.GATEWAY_PORT || '4000';
    const redirectUrl = `http://localhost:${gatewayPort}/api/pagos/mock-externo/checkout-page?paymentId=${pago.id_payments}&amount=${pago.amount}&concept=${encodeURIComponent(pago.concept)}&id_users=${dto.id_users}`;

    return { pago, redirectUrl };
  }

  async obtenerPagoPorId(idPayments: string): Promise<FilaPago | null> {
    return await this.repository.obtenerPagoPorId(idPayments);
  }

  async obtenerPagosPorUsuario(idUsers: string): Promise<FilaPago[]> {
    return await this.repository.obtenerPagosPorUsuario(idUsers);
  }

  async procesarPagoWebhook(dto: UcnpayWebhookEntradaDto): Promise<FilaPago | null> {
    const isCompleted = dto.status === 'APROBADO';
    const statusDb = isCompleted ? 'APROBADO' : 'RECHAZADO';
    const cleanPaymentId = dto.idOrden.replace('PAG-', '');

    // 1. Actualizar estado local del pago
    const pagoActualizado = await this.repository.actualizarEstadoPago(
      cleanPaymentId,
      statusDb,
      dto.transactionId
    );

    if (!pagoActualizado) return null;

    // 2. Si el pago está enlazado a un ciclo de cobro de contratos
    if (pagoActualizado.id_billing_cycles) {
      const infoContrato = await this.repository.obtenerContratoPorBillingCycle(pagoActualizado.id_billing_cycles);
      
      if (infoContrato) {
        const msContratosUrl = process.env.MS_CONTRATOS_URL || 'http://localhost:3002';
        const webhookPayload = {
          event: isCompleted ? 'pago.completado' : 'pago.fallido',
          id_contracts: infoContrato.id_contracts,
          amount: Number(pagoActualizado.amount),
        };

        console.log(`[PagosService] Notificando a Contratos webhook: ${msContratosUrl}/api/contratos/webhook-pagos`, webhookPayload);

        try {
          const res = await fetch(`${msContratosUrl}/api/contratos/webhook-pagos`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(webhookPayload),
          });

          if (!res.ok) {
            console.error(`[PagosService] Error al notificar webhook de contratos. Status: ${res.status}`);
          } else {
            console.log('[PagosService] Sincronización con contratos exitosa.');
          }
        } catch (error) {
          console.error('[PagosService] Excepción de red al notificar webhook de contratos:', error);
        }
      }
    }

    return pagoActualizado;
  }
}
