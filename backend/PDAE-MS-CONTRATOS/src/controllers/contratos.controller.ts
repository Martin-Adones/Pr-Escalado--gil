import { FastifyRequest, FastifyReply } from 'fastify';
import { ContratosService } from '../services/contratos.service';
import { transformAndValidate } from '../utils/validator';
import {
  CrearContratoEntradaDto,
  FinalizarContratoEntradaDto,
  ListarContratosConsultaDto,
  ActualizarContratoEntradaDto,
} from '../models/contratos.dtos';

/**
 * Capa HTTP: valida DTOs y delega en {@link ContratosService}.
 */
export class ContratosController {
  private servicio: ContratosService;

  constructor() {
    this.servicio = new ContratosService();
  }

  async manejarCrearContrato(solicitud: FastifyRequest, respuesta: FastifyReply) {
    solicitud.log?.debug?.({ procedimiento: 'sp_crear_contrato' }, 'ejecutando procedimiento');

    try {
      const datos = solicitud.method === 'GET' ? solicitud.query : solicitud.body;
      const entrada = await transformAndValidate(CrearContratoEntradaDto, datos);
      const resultado = await this.servicio.crearContrato(entrada);

      return respuesta.status(200).send({
        success: true,
        data: resultado,
      });
    } catch (error: any) {
      if (error.message.startsWith('Error de Validación:')) {
        return respuesta.status(400).send({
          success: false,
          message: error.message,
        });
      }

      solicitud.log?.error?.(
        { error: error.message, procedimiento: 'sp_crear_contrato' },
        'Error en ejecución de procedimiento'
      );
      return respuesta.status(500).send({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  }

  async manejarFinalizarContrato(solicitud: FastifyRequest, respuesta: FastifyReply) {
    solicitud.log?.debug?.({ procedimiento: 'sp_finalizar_contrato' }, 'ejecutando procedimiento');

    try {
      const datos = solicitud.method === 'GET' ? solicitud.query : solicitud.body;
      const entrada = await transformAndValidate(FinalizarContratoEntradaDto, datos);
      const resultado = await this.servicio.finalizarContrato(entrada);

      return respuesta.status(200).send({
        success: true,
        data: resultado,
      });
    } catch (error: any) {
      if (error.message.startsWith('Error de Validación:')) {
        return respuesta.status(400).send({
          success: false,
          message: error.message,
        });
      }

      solicitud.log?.error?.(
        { error: error.message, procedimiento: 'sp_finalizar_contrato' },
        'Error en ejecución de procedimiento'
      );
      return respuesta.status(500).send({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  }

  async manejarListarContratos(solicitud: FastifyRequest, respuesta: FastifyReply) {
    solicitud.log?.debug?.({ procedimiento: 'sp_listar_contratos' }, 'ejecutando procedimiento');

    try {
      const datos = solicitud.method === 'GET' ? solicitud.query : solicitud.body;
      const entrada = await transformAndValidate(ListarContratosConsultaDto, datos);
      const resultado = await this.servicio.listarContratos(entrada);

      return respuesta.status(200).send({
        success: true,
        data: resultado,
      });
    } catch (error: any) {
      if (error.message.startsWith('Error de Validación:')) {
        return respuesta.status(400).send({
          success: false,
          message: error.message,
        });
      }

      solicitud.log?.error?.(
        { error: error.message, procedimiento: 'sp_listar_contratos' },
        'Error en ejecución de procedimiento'
      );
      return respuesta.status(500).send({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  }

  async manejarActualizarContrato(solicitud: FastifyRequest, respuesta: FastifyReply) {
    solicitud.log?.debug?.({ procedimiento: 'sp_actualizar_contrato' }, 'ejecutando procedimiento');

    try {
      const datos = solicitud.method === 'GET' ? solicitud.query : solicitud.body;
      const entrada = await transformAndValidate(ActualizarContratoEntradaDto, datos);
      const resultado = await this.servicio.actualizarContrato(entrada);

      return respuesta.status(200).send({
        success: true,
        data: resultado,
      });
    } catch (error: any) {
      if (error.message.startsWith('Error de Validación:')) {
        return respuesta.status(400).send({
          success: false,
          message: error.message,
        });
      }

      solicitud.log?.error?.(
        { error: error.message, procedimiento: 'sp_actualizar_contrato' },
        'Error en ejecución de procedimiento'
      );
      return respuesta.status(500).send({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  }
}
