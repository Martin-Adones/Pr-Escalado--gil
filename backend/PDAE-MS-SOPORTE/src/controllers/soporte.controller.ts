import { FastifyRequest, FastifyReply } from 'fastify';
import { SoporteService } from '../services/soporte.service';
import { transformAndValidate } from 'shared';
import {
  CrearTicketEntradaDto,
  ListarTicketsConsultaDto,
  ActualizarTicketEntradaDto,
} from '../models/soporte.dtos';

/**
 * Capa HTTP: valida DTOs y delega en {@link SoporteService}.
 */
export class SoporteController {
  private servicio: SoporteService;

  constructor() {
    this.servicio = new SoporteService();
  }

  async manejarCrearTicket(solicitud: FastifyRequest, respuesta: FastifyReply) {
    solicitud.log?.debug?.({ procedimiento: 'sp_crear_ticket' }, 'ejecutando procedimiento');

    try {
      const datos = solicitud.method === 'GET' ? solicitud.query : solicitud.body;

      const rawTickets = Array.isArray(datos)
        ? datos
        : datos && Array.isArray((datos as any).tickets)
          ? (datos as any).tickets
          : [datos];

      const entradas = await Promise.all(
        rawTickets.map((item: any) => transformAndValidate(CrearTicketEntradaDto, item))
      );
      const resultado = await this.servicio.crearTicket(entradas.length === 1 ? entradas[0] : entradas);

      return respuesta.status(200).send({ success: true, data: resultado });
    } catch (error: any) {
      if (error.message.startsWith('Error de Validacion:')) {
        return respuesta.status(400).send({
          success: false,
          message: error.message,
        });
      }

      solicitud.log?.error?.(
        { error: error.message, procedimiento: 'sp_crear_ticket' },
        'Error en ejecucion de procedimiento'
      );
      return respuesta.status(500).send({
        success: false,
        message: error.message || 'Error interno del servidor',
      });
    }
  }

  async manejarListarTickets(solicitud: FastifyRequest, respuesta: FastifyReply) {
    solicitud.log?.debug?.({ procedimiento: 'sp_listar_tickets' }, 'ejecutando procedimiento');

    try {
      const datos = solicitud.method === 'GET' ? solicitud.query : solicitud.body;
      const entrada = await transformAndValidate(ListarTicketsConsultaDto, datos);
      const resultado = await this.servicio.listarTickets(entrada);

      return respuesta.status(200).send({
        success: true,
        data: resultado,
      });
    } catch (error: any) {
      if (error.message.startsWith('Error de Validacion:')) {
        return respuesta.status(400).send({
          success: false,
          message: error.message,
        });
      }

      solicitud.log?.error?.(
        { error: error.message, procedimiento: 'sp_listar_tickets' },
        'Error en ejecucion de procedimiento'
      );
      return respuesta.status(500).send({
        success: false,
        message: error.message || 'Error interno del servidor',
      });
    }
  }

  async manejarActualizarTicket(solicitud: FastifyRequest, respuesta: FastifyReply) {
    solicitud.log?.debug?.({ procedimiento: 'sp_actualizar_ticket' }, 'ejecutando procedimiento');

    try {
      const datos = solicitud.method === 'GET' ? solicitud.query : solicitud.body;
      const entrada = await transformAndValidate(ActualizarTicketEntradaDto, datos);
      const resultado = await this.servicio.actualizarTicket(entrada);

      return respuesta.status(200).send({
        success: true,
        data: resultado,
      });
    } catch (error: any) {
      if (error.message.startsWith('Error de Validacion:')) {
        return respuesta.status(400).send({
          success: false,
          message: error.message,
        });
      }

      solicitud.log?.error?.(
        { error: error.message, procedimiento: 'sp_actualizar_ticket' },
        'Error en ejecucion de procedimiento'
      );
      return respuesta.status(500).send({
        success: false,
        message: error.message || 'Error interno del servidor',
      });
    }
  }
}
