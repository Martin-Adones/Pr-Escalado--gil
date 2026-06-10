import { FastifyRequest, FastifyReply } from 'fastify';
import { PlanesService } from '../services/planes.service';
import { transformAndValidate } from '../utils/validator';
import {
  CrearPlanEntradaDto,
  ListarPlanesConsultaDto,
  ActualizarPlanEntradaDto,
  DesactivarPlanEntradaDto,
  RegistrarProductosPlanEntradaDto,
} from '../models/planes.dtos';

/**
 * Capa HTTP: valida DTOs y delega en {@link PlanesService}.
 */
export class PlanesController {
  private servicio: PlanesService;

  constructor() {
    this.servicio = new PlanesService();
  }

  async manejarCrearPlan(solicitud: FastifyRequest, respuesta: FastifyReply) {
    solicitud.log?.debug?.({ procedimiento: 'sp_crear_plan' }, 'ejecutando procedimiento');

    try {
      const datos = solicitud.method === 'GET' ? solicitud.query : solicitud.body;
      const entrada = await transformAndValidate(CrearPlanEntradaDto, datos);
      const resultado = await this.servicio.crearPlan(entrada);

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
        { error: error.message, procedimiento: 'sp_crear_plan' },
        'Error en ejecucion de procedimiento'
      );
      return respuesta.status(500).send({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  }

  async manejarListarPlanes(solicitud: FastifyRequest, respuesta: FastifyReply) {
    solicitud.log?.debug?.({ procedimiento: 'sp_listar_planes' }, 'ejecutando procedimiento');

    try {
      const datos = solicitud.method === 'GET' ? solicitud.query : solicitud.body;
      const entrada = await transformAndValidate(ListarPlanesConsultaDto, datos);
      const resultado = await this.servicio.listarPlanes(entrada);

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
        { error: error.message, procedimiento: 'sp_listar_planes' },
        'Error en ejecucion de procedimiento'
      );
      return respuesta.status(500).send({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  }

  async manejarActualizarPlan(solicitud: FastifyRequest, respuesta: FastifyReply) {
    solicitud.log?.debug?.({ procedimiento: 'sp_actualizar_plan' }, 'ejecutando procedimiento');

    try {
      const datos = solicitud.method === 'GET' ? solicitud.query : solicitud.body;
      const entrada = await transformAndValidate(ActualizarPlanEntradaDto, datos);
      const resultado = await this.servicio.actualizarPlan(entrada);

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
        { error: error.message, procedimiento: 'sp_actualizar_plan' },
        'Error en ejecucion de procedimiento'
      );
      return respuesta.status(500).send({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  }

  async manejarDesactivarPlan(solicitud: FastifyRequest, respuesta: FastifyReply) {
    solicitud.log?.debug?.({ procedimiento: 'sp_desactivar_plan' }, 'ejecutando procedimiento');

    try {
      const datos = solicitud.method === 'GET' ? solicitud.query : solicitud.body;
      const entrada = await transformAndValidate(DesactivarPlanEntradaDto, datos);
      const resultado = await this.servicio.desactivarPlan(entrada);

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
        { error: error.message, procedimiento: 'sp_desactivar_plan' },
        'Error en ejecucion de procedimiento'
      );
      return respuesta.status(500).send({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  }

  async manejarRegistrarProductosPlan(solicitud: FastifyRequest, respuesta: FastifyReply) {
    solicitud.log?.debug?.({ procedimiento: 'sp_registrar_productos_plan' }, 'ejecutando procedimiento');

    try {
      const datos = solicitud.method === 'GET' ? solicitud.query : solicitud.body;
      const entrada = await transformAndValidate(RegistrarProductosPlanEntradaDto, datos);
      const resultado = await this.servicio.registrarProductosPlan(entrada);

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
        { error: error.message, procedimiento: 'sp_registrar_productos_plan' },
        'Error en ejecucion de procedimiento'
      );
      return respuesta.status(500).send({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  }
}
