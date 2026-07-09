import { BaseRepository } from './base-repository';
import {
  CrearTicketEntradaDto,
  ListarTicketsConsultaDto,
  ActualizarTicketEntradaDto,
  FilaTicket,
  FilaTicketListado,
} from '../models/soporte.dtos';

/**
 * Acceso a datos de soporte: procedimientos en `database/soporte/soporte_funciones.sql`.
 */
export class SoporteRepository extends BaseRepository {
  async ejecutarCrearTicket(dto: CrearTicketEntradaDto): Promise<FilaTicket[]> {
    const params = [
      dto.id_contracts,
      dto.asunto,
      dto.status ?? 'open',
    ];
    return await this.callProcedure<FilaTicket>('sp_crear_ticket', params, undefined);
  }

  async ejecutarListarTickets(dto: ListarTicketsConsultaDto): Promise<FilaTicketListado[]> {
    const params = [
      dto.id_support ?? null,
      dto.id_contracts ?? null,
      dto.id_users ?? null,
      dto.status ?? null,
      dto.page_size,
      dto.page_number,
    ];
    return await this.callProcedure<FilaTicketListado>('sp_listar_tickets', params, undefined);
  }

  async ejecutarActualizarTicket(dto: ActualizarTicketEntradaDto): Promise<FilaTicket[]> {
    const params = [
      dto.id_support,
      dto.id_contracts ?? null,
      dto.description ?? null,
      dto.status ?? null,
    ];
    return await this.callProcedure<FilaTicket>('sp_actualizar_ticket', params, undefined);
  }

  async guardarCrmTicketId(idSupport: string, crmTicketId: string): Promise<void> {
    const db = this.getDb();
    await db.query(
      `UPDATE "Support" SET "crm_ticket_id" = $1, "updated_at" = CURRENT_TIMESTAMP WHERE "id_support" = $2`,
      [crmTicketId, idSupport]
    );
  }

  async sincronizarEstadoCrm(idSupport: string, status: string): Promise<void> {
    const db = this.getDb();
    await db.query(
      `UPDATE "Support" SET "status" = $1, "updated_at" = CURRENT_TIMESTAMP WHERE "id_support" = $2`,
      [status, idSupport]
    );
  }

  async obtenerDetallesContrato(idContracts: string): Promise<{ id_users: string; plan_name: string } | null> {
    const db = this.getDb();
    const isMock = process.env.NODE_ENV === 'mock' || process.env.NODE_ENV === 'test';
    if (isMock) {
      return { id_users: '12345', plan_name: 'Básico' };
    }
    const result = await db.query(
      `SELECT c."id_users"::text as "id_users", p."name" as "plan_name"
       FROM "Contracts" c
       JOIN "Plans" p ON c."id_plans" = p."id_plans"
       WHERE c."id_contracts" = $1`,
      [idContracts]
    );
    return result.rows[0] || null;
  }
}
