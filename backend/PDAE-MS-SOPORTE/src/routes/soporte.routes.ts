import { FastifyInstance } from 'fastify';
import { SoporteController } from '../controllers/soporte.controller';
import {
  esquemaPostCrearTicket,
  esquemaGetListarTickets,
  esquemaPostActualizarTicket,
} from '../utils/api-doc/soporte-route-schemas';

/**
 * Rutas REST bajo el prefijo `/api` (ver `app.ts`).
 * Los esquemas OpenAPI/validación están en `utils/api-doc/soporte-route-schemas.ts`.
 */
export default async function rutasSoporte(fastify: FastifyInstance) {
  const controlador = new SoporteController();

  fastify.post(
    '/soporte/crear',
    { schema: esquemaPostCrearTicket },
    controlador.manejarCrearTicket.bind(controlador),
  );
  fastify.get(
    '/soporte/listar',
    { schema: esquemaGetListarTickets },
    controlador.manejarListarTickets.bind(controlador),
  );
  fastify.post(
    '/soporte/actualizar',
    { schema: esquemaPostActualizarTicket },
    controlador.manejarActualizarTicket.bind(controlador),
  );
}
