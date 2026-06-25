import { FastifyInstance } from 'fastify';
import { healthRoute } from 'shared';

export default async function rutasSalud(fastify: FastifyInstance) {
  await healthRoute(fastify, 'PDAE-MS-PAGOS-1');
}
