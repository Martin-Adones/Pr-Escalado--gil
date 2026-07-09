import { createMicroserviceApp } from 'shared';
import planesRoutes from './routes/planes.routes';

export const createServer = async () => {
  return createMicroserviceApp({
    name: 'PDAE-MS-PLANES-1',
    swagger: {
      defaultPort: 3004,
      title: 'PDAE · Microservicio Planes',
      description:
        'Planes: crear, listar, actualizar, desactivar y registrar productos bajo `/api/planes`.',
      tags: [
        { name: 'Planes', description: 'Operaciones de planes.' },
        { name: 'Sistema', description: 'Salud del servicio.' },
      ],
    },
    registerRoutes: async (app) => {
      await app.register(planesRoutes, { prefix: '/api' });
    },
  });
};
