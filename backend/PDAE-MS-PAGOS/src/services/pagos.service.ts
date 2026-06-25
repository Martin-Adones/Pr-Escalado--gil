import { PagosRepository } from '../repositories/pagos.repository';
import { CrearPagoEntradaDto, WebhookProveedorEntradaDto, FilaPago } from '../models/pagos.dtos';

export class PagosService {
  private repository: PagosRepository;

  constructor() {
    this.repository = new PagosRepository();
  }

  async crearPago(dto: CrearPagoEntradaDto): Promise<{ pago: FilaPago; redirectUrl: string }> {
    const pago = await this.repository.crearPago(
      dto.id_users,
      dto.amount,
      dto.concept,
      dto.id_billing_cycles
    );

    // Generar la URL de redirección simulada de la pasarela de pagos
    const gatewayPort = process.env.GATEWAY_PORT || '4000';
    const redirectUrl = `http://localhost:${gatewayPort}/api/pagos/mock-externo/checkout-page?paymentId=${pago.id_payments}&amount=${pago.amount}&concept=${encodeURIComponent(pago.concept)}`;

    return { pago, redirectUrl };
  }

  async obtenerPagoPorId(idPayments: string): Promise<FilaPago | null> {
    return await this.repository.obtenerPagoPorId(idPayments);
  }

  async obtenerPagosPorUsuario(idUsers: string): Promise<FilaPago[]> {
    return await this.repository.obtenerPagosPorUsuario(idUsers);
  }

  async procesarPagoWebhook(dto: WebhookProveedorEntradaDto): Promise<FilaPago | null> {
    const isCompleted = dto.status === 'APROBADO' || dto.status === 'completed';
    const statusDb = isCompleted ? 'APROBADO' : 'RECHAZADO';

    // 1. Actualizar el estado del pago en la base de datos
    const pagoActualizado = await this.repository.actualizarEstadoPago(
      dto.id_payments,
      statusDb,
      dto.external_tx_id
    );

    if (!pagoActualizado) return null;

    // 2. Si está enlazado a un ciclo de cobro, sincronizar con el microservicio de contratos
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
