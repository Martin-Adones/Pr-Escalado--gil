import { BaseRepository } from './base-repository';
import { db } from '../database/pg-client';
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
   * Registra un ciclo de cobro de forma directa en la base de datos.
   */
  async registrarCicloDeCobro(idContracts: string, amount: number, status: string, retryAttempts: number): Promise<void> {
    const query = `
      INSERT INTO "billing_cycles" ("id_contracts", "amount", "status", "retry_attempts")
      VALUES ($1, $2, $3, $4)
    `;
    await db.query(query, [idContracts, amount, status, retryAttempts]);
  }

  /**
   * Registra un log de auditoría relacionado con contratos.
   */
  async registrarLogAuditoria(idContracts: string, action: string, assignetTo: string): Promise<void> {
    const query = `
      INSERT INTO "audit_logs" ("id_contracts", "action", "assignet_to")
      VALUES ($1, $2, $3)
    `;
    await db.query(query, [idContracts, action, assignetTo]);
  }

  /**
   * Obtiene todos los contratos que han expirado y siguen activos/suspendidos.
   */
  async obtenerContratosExpirados(): Promise<any[]> {
    const query = `
      SELECT "id_contracts", "id_users", "id_plans", "status", "start_date", "end_date"
      FROM "Contracts"
      WHERE "end_date" < CURRENT_DATE AND "status" IN ('ACTIVE', 'SUSPENDED')
    `;
    const result = await db.query(query);
    return result.rows;
  }

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
