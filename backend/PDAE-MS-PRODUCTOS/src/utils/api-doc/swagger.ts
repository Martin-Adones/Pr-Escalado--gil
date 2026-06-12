import { registerSwagger as sharedRegisterSwagger } from 'shared';
import { FastifyInstance } from 'fastify';

const INFO_DESCRIPTION =
  'Productos: crear, listar, actualizar y desactivar bajo `/api/productos`. Los IDs en JSON son cadenas numericas (BIGSERIAL en base de datos).';

export const registerSwagger = async (app: FastifyInstance) => {
  await sharedRegisterSwagger(app, {
    defaultPort: 3005,
    title: 'PDAE · Microservicio Productos',
    description: INFO_DESCRIPTION,
    tags: [
      { name: 'Productos', description: 'Operaciones de productos.' },
      { name: 'Sistema', description: 'Salud del servicio.' },
    ],
  });
};
