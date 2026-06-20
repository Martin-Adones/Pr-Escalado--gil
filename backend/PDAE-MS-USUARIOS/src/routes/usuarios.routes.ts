import { FastifyInstance } from "fastify";
import { UsuariosController } from "../controllers/usuarios.controller";
import { verificarTokenKeycloak, extraerBearerToken } from "shared";
import {
  esquemaGetListarUsuarios,
  esquemaPostActualizarUsuario,
  esquemaPostCrearUsuario,
} from "../utils/api-doc/usuarios-route-schemas";

/**
 * Rutas bajo prefijo `/api` (ver `app.ts`).
 * Esquemas en `utils/api-doc/usuarios-route-schemas.ts`.
 */
export default async function rutasUsuarios(fastify: FastifyInstance) {
  const controlador = new UsuariosController();

  fastify.post(
    "/usuarios/crear",
    { schema: esquemaPostCrearUsuario },
    controlador.manejarCrearUsuario.bind(controlador),
  );
  fastify.get(
    "/usuarios/listar",
    { schema: esquemaGetListarUsuarios },
    controlador.manejarListarUsuarios.bind(controlador),
  );
  fastify.post(
    "/usuarios/actualizar",
    { schema: esquemaPostActualizarUsuario },
    controlador.manejarActualizarUsuario.bind(controlador),
  );

  fastify.get("/usuarios/me", async (solicitud, respuesta) => {
    const token = extraerBearerToken(solicitud.headers.authorization);
    if (!token) {
      return respuesta.status(401).send({
        success: false,
        message: "Falta el header Authorization Bearer <token>",
      });
    }

    try {
      const payload = await verificarTokenKeycloak(token);
      (solicitud as any).keycloakId = payload.sub;
    } catch (error: any) {
      solicitud.log?.warn?.(
        { error: error.message },
        "JWT inválido en /usuarios/me",
      );
      return respuesta.status(401).send({
        success: false,
        message: "Token inválido o expirado",
      });
    }

    return controlador.manejarObtenerUsuarioActual(solicitud, respuesta);
  });
}
