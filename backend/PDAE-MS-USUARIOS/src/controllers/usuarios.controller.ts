import { FastifyRequest, FastifyReply } from "fastify";
import { UsuariosService } from "../services/usuarios.service";
import { transformAndValidate, extraerSubDeJwt, extraerBearerToken } from "shared";
import {
  CrearUsuarioEntradaDto,
  ListarUsuariosConsultaDto,
  ActualizarUsuarioEntradaDto,
  SincronizarUsuarioEntradaDto,
} from "../models/usuarios.dtos";

export class UsuariosController {
  private servicio: UsuariosService;

  constructor() {
    this.servicio = new UsuariosService();
  }

  async manejarCrearUsuario(solicitud: FastifyRequest, respuesta: FastifyReply) {
    const datos = solicitud.method === "GET" ? solicitud.query : solicitud.body;
    const entrada = await transformAndValidate(CrearUsuarioEntradaDto, datos);
    const resultado = await this.servicio.crearUsuario(entrada);
    return respuesta.status(200).send({ success: true, data: resultado });
  }

  async manejarListarUsuarios(solicitud: FastifyRequest, respuesta: FastifyReply) {
    const datos = solicitud.method === "GET" ? solicitud.query : solicitud.body;
    const entrada = await transformAndValidate(ListarUsuariosConsultaDto, datos);
    const resultado = await this.servicio.listarUsuarios(entrada);
    return respuesta.status(200).send({ success: true, data: resultado });
  }

  async manejarActualizarUsuario(solicitud: FastifyRequest, respuesta: FastifyReply) {
    const datos = solicitud.method === "GET" ? solicitud.query : solicitud.body;
    const entrada = await transformAndValidate(ActualizarUsuarioEntradaDto, datos);
    const resultado = await this.servicio.actualizarUsuario(entrada);
    return respuesta.status(200).send({ success: true, data: resultado });
  }

  async manejarObtenerUsuarioActual(solicitud: FastifyRequest, respuesta: FastifyReply) {
    const keycloakId = (solicitud as any).keycloakId as string;
    const usuario = await this.servicio.buscarUsuarioActual(keycloakId);

    if (!usuario) {
      return respuesta.status(404).send({
        success: false,
        message: "No existe un usuario vinculado a esta cuenta de Keycloak",
      });
    }

    return respuesta.status(200).send({ success: true, data: usuario });
  }

  async manejarSincronizarUsuario(solicitud: FastifyRequest, respuesta: FastifyReply) {
    const token = extraerBearerToken(solicitud.headers.authorization);
    if (!token) {
      return respuesta.status(401).send({ success: false, message: "Falta el header Authorization Bearer <token>" });
    }

    let sub: string;
    try {
      sub = extraerSubDeJwt(token);
    } catch (error: any) {
      solicitud.log?.warn?.({ error: error.message }, "JWT inválido en /usuarios/sincronizar");
      return respuesta.status(401).send({ success: false, message: "Token inválido o expirado" });
    }

    const body = (solicitud.body as Record<string, unknown>) ?? {};
    const entrada = await transformAndValidate(SincronizarUsuarioEntradaDto, {
      keycloak_id: sub,
      type: body.type as string | undefined,
      isActive: body.isActive as boolean | undefined,
    });

    const usuario = await this.servicio.sincronizarUsuario(entrada);
    return respuesta.status(200).send({ success: true, data: usuario });
  }
}
