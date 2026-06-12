import { FastifyInstance } from 'fastify';
import { registerSwagger as sharedRegisterSwagger } from 'shared';

export async function registerSwagger(app: FastifyInstance) {
  await sharedRegisterSwagger(app, {
    defaultPort: 3007,
    title: 'PDAE · Microservicio Auditoría',
    description:
      'Auditoría: listado y filtrado de logs bajo `/api/auditoria`.',
    tags: [
      { name: 'Auditoría', description: 'Logs de auditoría del sistema.' },
      { name: 'Sistema', description: 'Salud del servicio.' },
    ],
  });
}
