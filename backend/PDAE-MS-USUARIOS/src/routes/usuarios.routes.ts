import { FastifyInstance } from 'fastify';
import { UsuariosController } from '../controllers/usuarios.controller';
import {
  esquemaGetListarUsuarios,
  esquemaPostActualizarUsuario,
  esquemaPostCrearUsuario,
} from '../utils/api-doc/usuarios-route-schemas';

/**
 * Rutas bajo prefijo `/api` (ver `app.ts`).
 * Esquemas en `utils/api-doc/usuarios-route-schemas.ts`.
 */
export default async function rutasUsuarios(fastify: FastifyInstance) {
  const controlador = new UsuariosController();

  fastify.post(
    '/usuarios/crear',
    { schema: esquemaPostCrearUsuario },
    controlador.manejarCrearUsuario.bind(controlador),
  );
  fastify.get(
    '/usuarios/listar',
    { schema: esquemaGetListarUsuarios },
    controlador.manejarListarUsuarios.bind(controlador),
  );
  fastify.post(
    '/usuarios/actualizar',
    { schema: esquemaPostActualizarUsuario },
    controlador.manejarActualizarUsuario.bind(controlador),
  );
}
