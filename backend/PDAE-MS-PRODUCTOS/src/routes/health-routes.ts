import { healthRoute } from 'shared';
import { FastifyInstance } from 'fastify';

export default async function rutasSalud(fastify: FastifyInstance) {
  await healthRoute(fastify, 'PDAE-MS-PRODUCTOS-1');
}
