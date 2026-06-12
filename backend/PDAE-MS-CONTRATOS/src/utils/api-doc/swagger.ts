import { registerSwagger as sharedRegisterSwagger } from 'shared';
import { FastifyInstance } from 'fastify';

const INFO_DESCRIPTION =
  'Contratos: crear, listar, actualizar y finalizar bajo `/api/contratos`. Los IDs en JSON son cadenas numéricas (BIGSERIAL en base de datos).';

export async function registerSwagger(app: FastifyInstance) {
  await sharedRegisterSwagger(app, {
    defaultPort: 3002,
    title: 'PDAE · Microservicio Contratos',
    description: INFO_DESCRIPTION,
    tags: [
      { name: 'Contratos', description: 'Operaciones de contrato.' },
      { name: 'Sistema', description: 'Salud del servicio.' },
    ],
  });
}
