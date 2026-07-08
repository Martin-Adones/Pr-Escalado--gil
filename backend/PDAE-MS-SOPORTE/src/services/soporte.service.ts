import { SoporteRepository } from '../repositories/soporte.repository';
import {
  CrearTicketEntradaDto,
  ListarTicketsConsultaDto,
  ActualizarTicketEntradaDto,
  FilaTicket,
  FilaTicketListado,
} from '../models/soporte.dtos';
import { verificarTokenKeycloak } from 'shared';

/**
 * Caso de uso de soporte: orquesta el repositorio (sin conocer HTTP).
 */
export class SoporteService {
  private repositorio: SoporteRepository;

  constructor() {
    this.repositorio = new SoporteRepository();
  }

  async crearTicket(
    dto: CrearTicketEntradaDto | CrearTicketEntradaDto[],
    token?: string
  ): Promise<FilaTicket[]> {
    const resultados: FilaTicket[] = [];
    const tickets = Array.isArray(dto) ? dto : [dto];

    for (const ticket of tickets) {
      const res = await this.repositorio.ejecutarCrearTicket(ticket);
      if (Array.isArray(res)) {
        resultados.push(...res);
        for (const t of res) {
          this.enviarTicketAlCrm(t, ticket, token).catch((err) =>
            console.error('[CRM] Fallo al iniciar enviarTicketAlCrm:', err)
          );
        }
      }
    }

    return resultados;
  }

  private async enviarTicketAlCrm(ticket: FilaTicket, dto: CrearTicketEntradaDto, token?: string): Promise<void> {
    try {
      const detalles = await this.repositorio.obtenerDetallesContrato(ticket.id_contracts);
      let prioridad: 'baja' | 'media' | 'alta' | 'critica' = 'media';
      if (detalles) {
        const name = detalles.plan_name.toLowerCase();
        if (name.includes('básico') || name.includes('basico')) prioridad = 'baja';
        else if (name.includes('profesional') || name.includes('pyme')) prioridad = 'media';
        else if (name.includes('enterprise') || name.includes('corporativo')) prioridad = 'alta';
      }

      let email = dto.cliente_email;
      if (!email && token) {
        try {
          const payloadToken = await verificarTokenKeycloak(token);
          if (payloadToken.email) {
            email = payloadToken.email;
          }
        } catch (err) {
          console.error('[CRM] Error al verificar token en enviarTicketAlCrm:', err);
        }
      }

      const payload = {
        asunto: dto.asunto,
        descripcion: dto.description || undefined,
        prioridad,
        sistema_origen: 'suscripciones',
        sistema_id: 'P10',
        cliente_nombre: dto.cliente_nombre || ticket.id_users,
        cliente_email: email || `${ticket.id_users}@suscripciones.com`,
        cliente_telefono: dto.cliente_telefono || undefined,
        suscripcion_id_ref: `SUB-${ticket.id_contracts}`
      };

      console.log(`[CRM] Enviando ticket #${ticket.id_support} al CRM... Payload:`, JSON.stringify(payload));

      const response = await fetch('https://pgti-proyecto-crm-backend.vercel.app/api/v1/tickets/externo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'suscripciones_secret_p10'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[CRM] Error al enviar ticket al CRM (Status ${response.status}):`, errorText);
      } else {
        const data = await response.json();
        console.log(`[CRM] Ticket #${ticket.id_support} enviado con éxito al CRM:`, JSON.stringify(data));
      }
    } catch (error) {
      console.error(`[CRM] Error de red o ejecución al enviar ticket #${ticket.id_support} al CRM:`, error);
    }
  }

  async listarTickets(dto: ListarTicketsConsultaDto): Promise<FilaTicketListado[]> {
    return await this.repositorio.ejecutarListarTickets(dto);
  }

  async actualizarTicket(dto: ActualizarTicketEntradaDto): Promise<FilaTicket[]> {
    return await this.repositorio.ejecutarActualizarTicket(dto);
  }
}
