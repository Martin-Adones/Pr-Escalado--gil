import { FastifyRequest, FastifyReply } from 'fastify';
import { PlanesService } from '../services/planes.service';
import { transformAndValidate } from 'shared';
import {
  CrearPlanEntradaDto,
  ListarPlanesConsultaDto,
  ActualizarPlanEntradaDto,
  DesactivarPlanEntradaDto,
  RegistrarProductosPlanEntradaDto,
} from '../models/planes.dtos';

export class PlanesController {
  private servicio: PlanesService;

  constructor() {
    this.servicio = new PlanesService();
  }

  async manejarCrearPlan(solicitud: FastifyRequest, respuesta: FastifyReply) {
    const datos = solicitud.method === 'GET' ? solicitud.query : solicitud.body;
    const entrada = await transformAndValidate(CrearPlanEntradaDto, datos);
    const resultado = await this.servicio.crearPlan(entrada);
    return respuesta.status(200).send({ success: true, data: resultado });
  }

  async manejarListarPlanes(solicitud: FastifyRequest, respuesta: FastifyReply) {
    const datos = solicitud.method === 'GET' ? solicitud.query : solicitud.body;
    const entrada = await transformAndValidate(ListarPlanesConsultaDto, datos);
    const resultado = await this.servicio.listarPlanes(entrada);
    return respuesta.status(200).send({ success: true, data: resultado });
  }

  async manejarActualizarPlan(solicitud: FastifyRequest, respuesta: FastifyReply) {
    const datos = solicitud.method === 'GET' ? solicitud.query : solicitud.body;
    const entrada = await transformAndValidate(ActualizarPlanEntradaDto, datos);
    const resultado = await this.servicio.actualizarPlan(entrada);
    return respuesta.status(200).send({ success: true, data: resultado });
  }

  async manejarDesactivarPlan(solicitud: FastifyRequest, respuesta: FastifyReply) {
    const datos = solicitud.method === 'GET' ? solicitud.query : solicitud.body;
    const entrada = await transformAndValidate(DesactivarPlanEntradaDto, datos);
    const resultado = await this.servicio.desactivarPlan(entrada);
    return respuesta.status(200).send({ success: true, data: resultado });
  }

  async manejarRegistrarProductosPlan(solicitud: FastifyRequest, respuesta: FastifyReply) {
    const datos = solicitud.method === 'GET' ? solicitud.query : solicitud.body;
    const entrada = await transformAndValidate(RegistrarProductosPlanEntradaDto, datos);
    const resultado = await this.servicio.registrarProductosPlan(entrada);
    return respuesta.status(200).send({ success: true, data: resultado });
  }
}
