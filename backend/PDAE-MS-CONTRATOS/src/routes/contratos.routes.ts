import { FastifyInstance } from 'fastify';
import { ContratosController } from '../controllers/contratos.controller';
import {
  esquemaGetListarContratos,
  esquemaPostActualizarContrato,
  esquemaPostCrearContrato,
  esquemaPostFinalizarContrato,
} from '../utils/api-doc/contratos-route-schemas';

/**
 * Rutas REST bajo el prefijo `/api` (ver `app.ts`).
 * Los esquemas OpenAPI/validación están en `utils/api-doc/contratos-route-schemas.ts`.
 */
export default async function rutasContratos(fastify: FastifyInstance) {
  const controlador = new ContratosController();

  fastify.post(
    '/contratos/crear',
    { schema: esquemaPostCrearContrato },
    controlador.manejarCrearContrato.bind(controlador),
  );
  fastify.post(
    '/contratos/finalizar',
    { schema: esquemaPostFinalizarContrato },
    controlador.manejarFinalizarContrato.bind(controlador),
  );
  fastify.get(
    '/contratos/listar',
    { schema: esquemaGetListarContratos },
    controlador.manejarListarContratos.bind(controlador),
  );
  fastify.post(
    '/contratos/actualizar',
    { schema: esquemaPostActualizarContrato },
    controlador.manejarActualizarContrato.bind(controlador),
  );
}
