import { createMicroserviceApp } from 'shared';
import soporteRoutes from './routes/soporte.routes';

export const createServer = async () => {
  return createMicroserviceApp({
    name: 'PDAE-MS-SOPORTE-1',
    swagger: {
      defaultPort: 3006,
      title: 'PDAE · Microservicio Soporte',
      description:
        'Soporte: crear, listar y actualizar tickets bajo `/api/soporte`.',
      tags: [
        { name: 'Soporte', description: 'Operaciones de tickets de soporte.' },
        { name: 'Sistema', description: 'Salud del servicio.' },
      ],
    },
    registerRoutes: async (app) => {
      await app.register(soporteRoutes, { prefix: '/api' });
    },
  });
};
