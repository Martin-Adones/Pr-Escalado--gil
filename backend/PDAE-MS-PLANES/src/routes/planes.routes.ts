import { FastifyInstance } from 'fastify';
import { PlanesController } from '../controllers/planes.controller';
import {
  esquemaGetListarPlanes,
  esquemaPostActualizarPlan,
  esquemaPostCrearPlan,
  esquemaPostDesactivarPlan,
  esquemaPostRegistrarProductosPlan,
} from '../utils/api-doc/planes-route-schemas';

/**
 * Rutas REST bajo el prefijo `/api` (ver `app.ts`).
 * Los esquemas OpenAPI/validacion estan en `utils/api-doc/planes-route-schemas.ts`.
 */
export default async function rutasPlanes(fastify: FastifyInstance) {
  const controlador = new PlanesController();

  fastify.post(
    '/planes/crear',
    { schema: esquemaPostCrearPlan },
    controlador.manejarCrearPlan.bind(controlador),
  );
  fastify.get(
    '/planes/listar',
    { schema: esquemaGetListarPlanes },
    controlador.manejarListarPlanes.bind(controlador),
  );
  fastify.post(
    '/planes/actualizar',
    { schema: esquemaPostActualizarPlan },
    controlador.manejarActualizarPlan.bind(controlador),
  );
  fastify.post(
    '/planes/desactivar',
    { schema: esquemaPostDesactivarPlan },
    controlador.manejarDesactivarPlan.bind(controlador),
  );
  fastify.post(
    '/planes/registrar-productos',
    { schema: esquemaPostRegistrarProductosPlan },
    controlador.manejarRegistrarProductosPlan.bind(controlador),
  );
}
