import { BaseRepository } from './base-repository';
import {
  CrearContratoEntradaDto,
  FinalizarContratoEntradaDto,
  ListarContratosConsultaDto,
  ActualizarContratoEntradaDto,
  FilaContrato,
  FilaContratoListado,
} from '../models/contratos.dtos';

/**
 * Acceso a datos de contratos: llama a los procedimientos definidos en
 * `database/contratos/contratos_funciones.sql` (nombres en español en PostgreSQL).
 */
export class ContratosRepository extends BaseRepository {
  /**
   * Alta de contrato. Orden de parámetros = orden de `sp_crear_contrato` en SQL.
   */
  async ejecutarCrearContrato(dto: CrearContratoEntradaDto): Promise<FilaContrato[]> {
    const params = [dto.id_users, dto.id_plans, dto.status, dto.start_date, dto.end_date];
    return await this.callProcedure<FilaContrato>('sp_crear_contrato', params, undefined);
  }

  /**
   * Marca el contrato como TERMINATED sin borrar la fila (`sp_finalizar_contrato`).
   */
  async ejecutarFinalizarContrato(dto: FinalizarContratoEntradaDto): Promise<FilaContrato[]> {
    const params = [dto.id_contracts];
    return await this.callProcedure<FilaContrato>('sp_finalizar_contrato', params, undefined);
  }

  /**
   * Listado paginado con filtros opcionales (`sp_listar_contratos`).
   */
  async ejecutarListarContratos(dto: ListarContratosConsultaDto): Promise<FilaContratoListado[]> {
    const params = [
      dto.id_contracts,
      dto.id_users,
      dto.id_plans,
      dto.status,
      dto.start_date_from,
      dto.start_date_to,
      dto.end_date_from,
      dto.end_date_to,
      dto.page_size,
      dto.page_number,
    ];
    return await this.callProcedure<FilaContratoListado>('sp_listar_contratos', params, undefined);
  }

  /**
   * Actualización parcial de contrato (`sp_actualizar_contrato`).
   */
  async ejecutarActualizarContrato(dto: ActualizarContratoEntradaDto): Promise<FilaContrato[]> {
    const params = [
      dto.id_contracts,
      dto.id_users,
      dto.id_plans,
      dto.status,
      dto.start_date,
      dto.end_date,
    ];
    return await this.callProcedure<FilaContrato>('sp_actualizar_contrato', params, undefined);
  }
}
