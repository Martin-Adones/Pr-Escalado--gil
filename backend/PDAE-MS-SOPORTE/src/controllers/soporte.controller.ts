import { FastifyRequest, FastifyReply } from 'fastify';
import { SoporteService } from '../services/soporte.service';
import { transformAndValidate, extraerBearerToken } from 'shared';
import {
  CrearTicketEntradaDto,
  ListarTicketsConsultaDto,
  ActualizarTicketEntradaDto,
} from '../models/soporte.dtos';

export class SoporteController {
  private servicio: SoporteService;

  constructor() {
    this.servicio = new SoporteService();
  }

  async manejarCrearTicket(solicitud: FastifyRequest, respuesta: FastifyReply) {
    const datos = solicitud.method === 'GET' ? solicitud.query : solicitud.body;

    const rawTickets = Array.isArray(datos)
      ? datos
      : datos && Array.isArray((datos as any).tickets)
        ? (datos as any).tickets
        : [datos];

    const entradas = await Promise.all(
      rawTickets.map((item: any) => transformAndValidate(CrearTicketEntradaDto, item))
    );
    const token = extraerBearerToken(solicitud.headers.authorization) || undefined;
    const resultado = await this.servicio.crearTicket(
      entradas.length === 1 ? entradas[0] : entradas,
      token
    );

    return respuesta.status(200).send({ success: true, data: resultado });
  }

  async manejarListarTickets(solicitud: FastifyRequest, respuesta: FastifyReply) {
    const datos = solicitud.method === 'GET' ? solicitud.query : solicitud.body;
    const entrada = await transformAndValidate(ListarTicketsConsultaDto, datos);
    const resultado = await this.servicio.listarTickets(entrada);
    return respuesta.status(200).send({ success: true, data: resultado });
  }

  async manejarActualizarTicket(solicitud: FastifyRequest, respuesta: FastifyReply) {
    const datos = solicitud.method === 'GET' ? solicitud.query : solicitud.body;
    const entrada = await transformAndValidate(ActualizarTicketEntradaDto, datos);
    const resultado = await this.servicio.actualizarTicket(entrada);
    return respuesta.status(200).send({ success: true, data: resultado });
  }

  async manejarSincronizarCrm(solicitud: FastifyRequest, respuesta: FastifyReply) {
    const { id_support } = solicitud.params as any;
    const resultado = await this.servicio.sincronizarEstadoCrm(id_support);
    if (!resultado) {
      return respuesta.status(404).send({ success: false, message: 'Ticket no encontrado' });
    }
    return respuesta.status(200).send({ success: true, data: resultado });
  }
}
