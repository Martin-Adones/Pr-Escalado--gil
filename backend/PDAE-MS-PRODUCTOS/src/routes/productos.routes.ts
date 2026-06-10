import { FastifyInstance } from 'fastify';
import { ProductosController } from '../controllers/productos.controller';
import {
  esquemaGetListarProductos,
  esquemaPostActualizarProducto,
  esquemaPostCrearProducto,
  esquemaPostDesactivarProducto,
} from '../utils/api-doc/productos-route-schemas';

/**
 * Rutas REST bajo el prefijo `/api` (ver `app.ts`).
 * Los esquemas OpenAPI/validacion estan en `utils/api-doc/productos-route-schemas.ts`.
 */
export default async function rutasProductos(fastify: FastifyInstance) {
  const controlador = new ProductosController();

  fastify.post(
    '/productos/crear',
    { schema: esquemaPostCrearProducto },
    controlador.manejarCrearProducto.bind(controlador),
  );
  fastify.get(
    '/productos/listar',
    { schema: esquemaGetListarProductos },
    controlador.manejarListarProductos.bind(controlador),
  );
  fastify.post(
    '/productos/actualizar',
    { schema: esquemaPostActualizarProducto },
    controlador.manejarActualizarProducto.bind(controlador),
  );
  fastify.post(
    '/productos/desactivar',
    { schema: esquemaPostDesactivarProducto },
    controlador.manejarDesactivarProducto.bind(controlador),
  );
}
