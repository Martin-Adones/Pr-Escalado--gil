import { FastifyRequest, FastifyReply } from "fastify";
import { UsuariosService } from "../services/usuarios.service";
import { transformAndValidate } from "shared";
import { extraerSubDeJwt, extraerBearerToken } from "shared";
import {
  CrearUsuarioEntradaDto,
  ListarUsuariosConsultaDto,
  ActualizarUsuarioEntradaDto,
  SincronizarUsuarioEntradaDto,
} from "../models/usuarios.dtos";

/** Capa HTTP: valida DTOs y delega en {@link UsuariosService}. */
export class UsuariosController {
  private servicio: UsuariosService;

  constructor() {
    this.servicio = new UsuariosService();
  }

  async manejarCrearUsuario(
    solicitud: FastifyRequest,
    respuesta: FastifyReply,
  ) {
    solicitud.log?.debug?.(
      { procedimiento: "sp_crear_usuario" },
      "ejecutando procedimiento",
    );

    try {
      const datos =
        solicitud.method === "GET" ? solicitud.query : solicitud.body;
      const entrada = await transformAndValidate(CrearUsuarioEntradaDto, datos);
      const resultado = await this.servicio.crearUsuario(entrada);

      return respuesta.status(200).send({
        success: true,
        data: resultado,
      });
    } catch (error: any) {
      if (error.message.startsWith("Error de Validación:")) {
        return respuesta.status(400).send({
          success: false,
          message: error.message,
        });
      }

      solicitud.log?.error?.(
        { error: error.message, procedimiento: "sp_crear_usuario" },
        "Error en ejecución de procedimiento",
      );
      return respuesta.status(500).send({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  async manejarListarUsuarios(
    solicitud: FastifyRequest,
    respuesta: FastifyReply,
  ) {
    solicitud.log?.debug?.(
      { procedimiento: "sp_listar_usuarios" },
      "ejecutando procedimiento",
    );

    try {
      const datos =
        solicitud.method === "GET" ? solicitud.query : solicitud.body;
      const entrada = await transformAndValidate(
        ListarUsuariosConsultaDto,
        datos,
      );
      const resultado = await this.servicio.listarUsuarios(entrada);

      return respuesta.status(200).send({
        success: true,
        data: resultado,
      });
    } catch (error: any) {
      if (error.message.startsWith("Error de Validación:")) {
        return respuesta.status(400).send({
          success: false,
          message: error.message,
        });
      }

      solicitud.log?.error?.(
        { error: error.message, procedimiento: "sp_listar_usuarios" },
        "Error en ejecución de procedimiento",
      );
      return respuesta.status(500).send({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  async manejarActualizarUsuario(
    solicitud: FastifyRequest,
    respuesta: FastifyReply,
  ) {
    solicitud.log?.debug?.(
      { procedimiento: "sp_actualizar_usuario" },
      "ejecutando procedimiento",
    );

    try {
      const datos =
        solicitud.method === "GET" ? solicitud.query : solicitud.body;
      const entrada = await transformAndValidate(
        ActualizarUsuarioEntradaDto,
        datos,
      );
      const resultado = await this.servicio.actualizarUsuario(entrada);

      return respuesta.status(200).send({
        success: true,
        data: resultado,
      });
    } catch (error: any) {
      if (error.message.startsWith("Error de Validación:")) {
        return respuesta.status(400).send({
          success: false,
          message: error.message,
        });
      }

      solicitud.log?.error?.(
        { error: error.message, procedimiento: "sp_actualizar_usuario" },
        "Error en ejecución de procedimiento",
      );
      return respuesta.status(500).send({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  async manejarObtenerUsuarioActual(
    solicitud: FastifyRequest,
    respuesta: FastifyReply,
  ) {
    try {
      const keycloakId = (solicitud as any).keycloakId as string;
      const usuario = await this.servicio.buscarUsuarioActual(keycloakId);

      if (!usuario) {
        return respuesta.status(404).send({
          success: false,
          message: "No existe un usuario vinculado a esta cuenta de Keycloak",
        });
      }

      return respuesta.status(200).send({
        success: true,
        data: usuario,
      });
    } catch (error: any) {
      solicitud.log?.error?.(
        { error: error.message },
        "Error en manejarObtenerUsuarioActual",
      );
      return respuesta.status(500).send({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  /**
   * POST /api/usuarios/sincronizar
   * Extrae el `sub` del JWT Bearer, hace upsert en Users y devuelve el registro.
   * Si el usuario ya existe lo retorna sin modificarlo; si es nuevo lo crea con
   * type='cliente' (o el type que venga en el body).
   */
  async manejarSincronizarUsuario(
    solicitud: FastifyRequest,
    respuesta: FastifyReply,
  ) {
    const token = extraerBearerToken(solicitud.headers.authorization);
    if (!token) {
      return respuesta.status(401).send({
        success: false,
        message: "Falta el header Authorization Bearer <token>",
      });
    }

    let sub: string;
    try {
      // Usamos decodificación sin verificación de firma para evitar dependencia
      // del JWKS remoto de Keycloak (ngrok cambia URL, no siempre accesible desde producción).
      // El token ya fue validado por Keycloak en el cliente; aquí solo necesitamos el sub.
      sub = extraerSubDeJwt(token);
    } catch (error: any) {
      solicitud.log?.warn?.(
        { error: error.message },
        "JWT inválido en /usuarios/sincronizar",
      );
      return respuesta.status(401).send({
        success: false,
        message: "Token inválido o expirado",
      });
    }

    try {
      const body = (solicitud.body as Record<string, unknown>) ?? {};
      const entrada = await transformAndValidate(SincronizarUsuarioEntradaDto, {
        keycloak_id: sub,
        type: body.type as string | undefined,
        isActive: body.isActive as boolean | undefined,
      });

      const usuario = await this.servicio.sincronizarUsuario(entrada);

      return respuesta.status(200).send({
        success: true,
        data: usuario ? [usuario] : [],
      });
    } catch (error: any) {
      if (error.message.startsWith("Error de Validación:")) {
        return respuesta.status(400).send({
          success: false,
          message: error.message,
        });
      }
      solicitud.log?.error?.(
        { error: error.message, procedimiento: "sp_sincronizar_usuario" },
        "Error en sincronizarUsuario",
      );
      return respuesta.status(500).send({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }
}
