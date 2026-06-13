import { FastifyRequest, FastifyReply } from 'fastify';
import { UsuariosService } from '../services/usuarios.service';
import { transformAndValidate } from 'shared';
import {
  CrearUsuarioEntradaDto,
  ListarUsuariosConsultaDto,
  ActualizarUsuarioEntradaDto,
} from '../models/usuarios.dtos';

/** Capa HTTP: valida DTOs y delega en {@link UsuariosService}. */
export class UsuariosController {
  private servicio: UsuariosService;

  constructor() {
    this.servicio = new UsuariosService();
  }

  async manejarCrearUsuario(solicitud: FastifyRequest, respuesta: FastifyReply) {
    solicitud.log?.debug?.({ procedimiento: 'sp_crear_usuario' }, 'ejecutando procedimiento');

    try {
      const datos = solicitud.method === 'GET' ? solicitud.query : solicitud.body;
      const entrada = await transformAndValidate(CrearUsuarioEntradaDto, datos);
      const resultado = await this.servicio.crearUsuario(entrada);

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
        { error: error.message, procedimiento: 'sp_crear_usuario' },
        'Error en ejecución de procedimiento',
      );
      return respuesta.status(500).send({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  }

  async manejarListarUsuarios(solicitud: FastifyRequest, respuesta: FastifyReply) {
    solicitud.log?.debug?.({ procedimiento: 'sp_listar_usuarios' }, 'ejecutando procedimiento');

    try {
      const datos = solicitud.method === 'GET' ? solicitud.query : solicitud.body;
      const entrada = await transformAndValidate(ListarUsuariosConsultaDto, datos);
      const resultado = await this.servicio.listarUsuarios(entrada);

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
        { error: error.message, procedimiento: 'sp_listar_usuarios' },
        'Error en ejecución de procedimiento',
      );
      return respuesta.status(500).send({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  }

  async manejarActualizarUsuario(solicitud: FastifyRequest, respuesta: FastifyReply) {
    solicitud.log?.debug?.({ procedimiento: 'sp_actualizar_usuario' }, 'ejecutando procedimiento');

    try {
      const datos = solicitud.method === 'GET' ? solicitud.query : solicitud.body;
      const entrada = await transformAndValidate(ActualizarUsuarioEntradaDto, datos);
      const resultado = await this.servicio.actualizarUsuario(entrada);

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
        { error: error.message, procedimiento: 'sp_actualizar_usuario' },
        'Error en ejecución de procedimiento',
      );
      return respuesta.status(500).send({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  }
}
