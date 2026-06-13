import { SoporteRepository } from '../repositories/soporte.repository';
import {
  CrearTicketEntradaDto,
  ListarTicketsConsultaDto,
  ActualizarTicketEntradaDto,
  FilaTicket,
  FilaTicketListado,
} from '../models/soporte.dtos';

/**
 * Caso de uso de soporte: orquesta el repositorio (sin conocer HTTP).
 */
export class SoporteService {
  private repositorio: SoporteRepository;

  constructor() {
    this.repositorio = new SoporteRepository();
  }

  async crearTicket(
    dto: CrearTicketEntradaDto | CrearTicketEntradaDto[]
  ): Promise<FilaTicket[]> {
    const resultados: FilaTicket[] = [];
    const tickets = Array.isArray(dto) ? dto : [dto];

    for (const ticket of tickets) {
      const res = await this.repositorio.ejecutarCrearTicket(ticket);
      if (Array.isArray(res)) {
        resultados.push(...res);
      }
    }

    return resultados;
  }

  async listarTickets(dto: ListarTicketsConsultaDto): Promise<FilaTicketListado[]> {
    return await this.repositorio.ejecutarListarTickets(dto);
  }

  async actualizarTicket(dto: ActualizarTicketEntradaDto): Promise<FilaTicket[]> {
    return await this.repositorio.ejecutarActualizarTicket(dto);
  }
}
