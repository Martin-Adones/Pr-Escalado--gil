import { FastifyInstance } from 'fastify';
import { registerSwagger as sharedRegisterSwagger } from 'shared';

export async function registerSwagger(app: FastifyInstance) {
  await sharedRegisterSwagger(app, {
    defaultPort: 3008,
    title: 'PDAE · Microservicio Pagos',
    description:
      'Pagos: Gestión y procesamiento de cobros e intermediario con pasarela de pagos externa.',
    tags: [
      { name: 'Pagos', description: 'Operaciones de pago e intermediario con pasarela externa.' },
      { name: 'Sistema', description: 'Salud del servicio.' },
    ],
  });
}
