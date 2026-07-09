import { createMicroserviceApp } from 'shared';
import auditoriaRoutes from './routes/auditoria.routes';

export const createServer = async () => {
  return createMicroserviceApp({
    name: 'PDAE-MS-AUDITORIA-1',
    swagger: {
      defaultPort: 3007,
      title: 'PDAE · Microservicio Auditoría',
      description:
        'Auditoría: listar logs bajo `/api/auditoria`.',
      tags: [
        { name: 'Auditoría', description: 'Operaciones de auditoría.' },
        { name: 'Sistema', description: 'Salud del servicio.' },
      ],
    },
    registerRoutes: async (app) => {
      await app.register(auditoriaRoutes, { prefix: '/api' });
    },
  });
};
