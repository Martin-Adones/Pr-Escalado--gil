import { createMicroserviceApp } from 'shared';
import productosRoutes from './routes/productos.routes';

export const createServer = async () => {
  return createMicroserviceApp({
    name: 'PDAE-MS-PRODUCTOS-1',
    swagger: {
      defaultPort: 3005,
      title: 'PDAE · Microservicio Productos',
      description:
        'Productos: crear, listar, actualizar y desactivar bajo `/api/productos`.',
      tags: [
        { name: 'Productos', description: 'Operaciones de productos.' },
        { name: 'Sistema', description: 'Salud del servicio.' },
      ],
    },
    registerRoutes: async (app) => {
      await app.register(productosRoutes, { prefix: '/api' });
    },
  });
};
