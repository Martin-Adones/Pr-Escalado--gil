import { FastifyInstance } from 'fastify';
import { registerSwagger as sharedRegisterSwagger } from 'shared';

const INFO_DESCRIPTION =
  'Soporte: endpoints del dominio soporte bajo `/api/soporte` (pendiente de implementacion).';

export const registerSwagger = async (app: FastifyInstance) => {
  await sharedRegisterSwagger(app, {
    defaultPort: 3006,
    title: 'PDAE · Microservicio Soporte',
    description: INFO_DESCRIPTION,
    tags: [
      { name: 'Soporte', description: 'Operaciones de soporte (pendiente).' },
      { name: 'Sistema', description: 'Salud del servicio.' },
    ],
  });
};
