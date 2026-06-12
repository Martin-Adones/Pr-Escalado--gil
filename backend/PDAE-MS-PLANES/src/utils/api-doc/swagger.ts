import { FastifyInstance } from 'fastify';
import { registerSwagger as sharedRegisterSwagger } from 'shared';

const INFO_DESCRIPTION =
  'Planes: crear, listar, actualizar, desactivar y registrar productos bajo `/api/planes`. Los IDs en JSON son cadenas numericas (BIGSERIAL en base de datos).';

export const registerSwagger = async (app: FastifyInstance) => {
  await sharedRegisterSwagger(app, {
    defaultPort: 3004,
    title: 'PDAE Â· Microservicio Planes',
    description: INFO_DESCRIPTION,
    tags: [
      { name: 'Planes', description: 'Operaciones de planes.' },
      { name: 'Sistema', description: 'Salud del servicio.' },
    ],
  });
};
