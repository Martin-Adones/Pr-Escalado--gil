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
      dto.description,
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
}
