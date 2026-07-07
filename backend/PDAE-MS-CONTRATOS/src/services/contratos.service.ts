import { ContratosRepository } from '../repositories/contratos.repository';
import {
  notificarSubscriptionCreated,
  notificarRenewalSuccess,
  notificarRenewalFailed,
  notificarPaymentSuccess,
  notificarPaymentFailed,
} from '../utils/analytics.client';
import { notificarEmail, notificarEmailConFallbackSms } from '../utils/notifications.client';
import {
  CrearContratoEntradaDto,
  FinalizarContratoEntradaDto,
  ListarContratosConsultaDto,
  ActualizarContratoEntradaDto,
  WebhookPagosEntradaDto,
  FilaContrato,
  FilaContratoListado,
} from '../models/contratos.dtos';

/**
 * Caso de uso de contratos: orquesta el repositorio (sin conocer HTTP).
 */
export class ContratosService {
  private repositorio: ContratosRepository;

  constructor() {
    this.repositorio = new ContratosRepository();
  }

  async crearContrato(dto: CrearContratoEntradaDto): Promise<FilaContrato[]> {
    const resultado = await this.repositorio.ejecutarCrearContrato(dto);

    if (resultado && resultado.length > 0) {
      const contrato = resultado[0];

      await this.repositorio.registrarLogAuditoria(
        contrato.id_contracts,
        'CREAR_CONTRATO',
        'sistema'
      );
      const payload = {
        contract_id: String(contrato.id_contracts),
        user_id: String(contrato.id_users),
        plan_id: Number(contrato.id_plans),
        start_date: contrato.start_date ?? null,
        status: contrato.status ?? null,
        end_date: contrato.end_date ?? null,
        ...(contrato.status === 'ACTIVE' ? { renewed: false, auto_service: true, billing_success: true } : {}),
      };
      console.log('[analytics] Enviando subscription_created:', JSON.stringify(payload));
      notificarSubscriptionCreated(payload);

      if (contrato.status === 'ACTIVE') {
        const pagoPayload = {
          contract_id: String(contrato.id_contracts),
          user_id: String(contrato.id_users),
          plan_id: Number(contrato.id_plans),
        };
        console.log('[analytics] Enviando payment_success (pago ya confirmado):', JSON.stringify(pagoPayload));
        notificarPaymentSuccess(pagoPayload);
      }
    }

    return resultado;
  }

  async finalizarContrato(dto: FinalizarContratoEntradaDto): Promise<FilaContrato[]> {
    const resultado = await this.repositorio.ejecutarFinalizarContrato(dto);

    if (resultado && resultado.length > 0) {
      await this.repositorio.registrarLogAuditoria(
        resultado[0].id_contracts,
        'FINALIZAR_CONTRATO',
        'sistema'
      );
    }

    return resultado;
  }

  async listarContratos(dto: ListarContratosConsultaDto): Promise<FilaContratoListado[]> {
    return await this.repositorio.ejecutarListarContratos(dto);
  }

  async actualizarContrato(dto: ActualizarContratoEntradaDto): Promise<FilaContrato[]> {
    const resultado = await this.repositorio.ejecutarActualizarContrato(dto);

    if (resultado && resultado.length > 0) {
      let accion = 'ACTUALIZAR_CONTRATO';
      if (dto.id_plans) {
        accion = 'CAMBIO_PLAN';
      } else if (dto.status) {
        if (dto.status === 'SUSPENDED') {
          accion = 'SUSPENDER_CONTRATO';
        } else if (dto.status === 'TERMINATED') {
          accion = 'FINALIZAR_CONTRATO';
        } else if (dto.status === 'ACTIVE') {
          accion = 'ACTIVAR_CONTRATO';
        }
      }
      await this.repositorio.registrarLogAuditoria(
        resultado[0].id_contracts,
        accion,
        'sistema'
      );
    }

    return resultado;
  }

  /**
   * Procesa la notificación del Webhook de pagos
   */
  async procesarPagoWebhook(dto: WebhookPagosEntradaDto): Promise<FilaContrato[]> {
    const esCompletado = dto.event === 'pago.completado';
    const nuevoEstado = esCompletado ? 'ACTIVE' : 'SUSPENDED';
    const estadoCiclo = esCompletado ? 'completed' : 'failed';
    const intentosReintento = esCompletado ? 0 : 1;

    // 1. Actualizar el estado del contrato
    const contratoActualizado = await this.repositorio.ejecutarActualizarContrato({
      id_contracts: dto.id_contracts,
      status: nuevoEstado,
    } as any);

    // 2. Insertar en billing_cycles
    await this.repositorio.registrarCicloDeCobro(
      dto.id_contracts,
      dto.amount,
      estadoCiclo,
      intentosReintento
    );

    // 3. Crear log de auditoría
    await this.repositorio.registrarLogAuditoria(
      dto.id_contracts,
      esCompletado ? 'PAGO_COMPLETADO_WEBHOOK' : 'PAGO_FALLIDO_WEBHOOK',
      'sistema'
    );

    // 4. Notificar a analítica
    if (contratoActualizado && contratoActualizado.length > 0) {
      const contrato = contratoActualizado[0];
      const payload = {
        contract_id: String(contrato.id_contracts),
        user_id: String(contrato.id_users),
        plan_id: Number(contrato.id_plans),
      };
      if (esCompletado) {
        notificarRenewalSuccess(payload);
        notificarPaymentSuccess(payload);
      } else {
        notificarRenewalFailed(payload);
        notificarPaymentFailed(payload);
      }
    }

    // 5. Notificar al usuario por email si viene especificado
    if (dto.user_email) {
      if (esCompletado) {
        notificarEmail({
          email: dto.user_email,
          subject: 'Pago recibido exitosamente',
          htmlBody: `<p>Hemos recibido tu pago correctamente.</p><p>Monto: $${dto.amount}</p>`,
        });
      } else {
        notificarEmail({
          email: dto.user_email,
          subject: 'Pago fallido',
          htmlBody: `<p>Tu pago no pudo ser procesado.</p><p>Monto: $${dto.amount}</p><p>Por favor, intenta nuevamente.</p>`,
        });
      }
    }

    return contratoActualizado;
  }

  /**
   * Ejecuta el cron job en lote para marcar contratos expirados como TERMINATED
   */
  async ejecutarProcesoExpiracion(): Promise<{ procesados: number; detalles: any[] }> {
    const expiredContracts = await this.repositorio.obtenerContratosExpirados();
    const detalles: any[] = [];

    for (const c of expiredContracts) {
      // 1. Finaliza el contrato llamando a la lógica del SP sp_finalizar_contrato
      const res = await this.repositorio.ejecutarFinalizarContrato({
        id_contracts: String(c.id_contracts)
      });
      
      // 2. Registrar en auditoría
      await this.repositorio.registrarLogAuditoria(
        String(c.id_contracts),
        'FINALIZAR_CONTRATO_CRON',
        'sistema'
      );

      detalles.push({
        id_contracts: c.id_contracts,
        old_status: c.status,
        new_status: 'TERMINATED',
        end_date: c.end_date
      });
    }

    return {
      procesados: expiredContracts.length,
      detalles
    };
  }
}
