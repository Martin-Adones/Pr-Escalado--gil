import { FastifyInstance } from 'fastify';
import { healthRoute as sharedHealthRoute } from 'shared';

export default async function healthRoutes(fastify: FastifyInstance) {
  await sharedHealthRoute(fastify, 'PDAE-MS-SOPORTE-1');
}
