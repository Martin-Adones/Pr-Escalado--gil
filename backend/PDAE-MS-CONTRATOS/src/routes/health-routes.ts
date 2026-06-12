import { healthRoute } from 'shared';
import { FastifyInstance } from 'fastify';

export default async function healthRoutes(fastify: FastifyInstance) {
  await healthRoute(fastify, 'PDAE-MS-CONTRATOS-1');
}
