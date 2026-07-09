import { createMicroserviceApp } from 'shared';
import pagosRoutes from './routes/pagos.routes';

export const createServer = async () => {
  return createMicroserviceApp({
    name: 'PDAE-MS-PAGOS-1',
    swagger: {
      defaultPort: 3008,
      title: 'PDAE · Microservicio Pagos',
      description:
        'Pagos: registro de tarjetas, creación de pagos y webhook UCNPAY bajo `/api/pagos`.',
      tags: [
        { name: 'Pagos', description: 'Operaciones de pagos y tarjetas.' },
        { name: 'Sistema', description: 'Salud del servicio.' },
      ],
    },
    registerRoutes: async (app) => {
      await app.register(pagosRoutes, { prefix: '/api' });
    },
  });
};
