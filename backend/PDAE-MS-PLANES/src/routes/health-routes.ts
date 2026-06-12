import { FastifyInstance } from 'fastify';
import { healthRoute } from 'shared';

export default async function (fastify: FastifyInstance) {
  await healthRoute(fastify, 'PDAE-MS-PLANES-1');
}
