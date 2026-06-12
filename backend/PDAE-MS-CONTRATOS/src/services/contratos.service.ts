import { ContratosRepository } from '../repositories/contratos.repository';
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
    return await this.repositorio.ejecutarCrearContrato(dto);
  }

  async finalizarContrato(dto: FinalizarContratoEntradaDto): Promise<FilaContrato[]> {
    return await this.repositorio.ejecutarFinalizarContrato(dto);
  }

  async listarContratos(dto: ListarContratosConsultaDto): Promise<FilaContratoListado[]> {
    return await this.repositorio.ejecutarListarContratos(dto);
  }

  async actualizarContrato(dto: ActualizarContratoEntradaDto): Promise<FilaContrato[]> {
    return await this.repositorio.ejecutarActualizarContrato(dto);
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
