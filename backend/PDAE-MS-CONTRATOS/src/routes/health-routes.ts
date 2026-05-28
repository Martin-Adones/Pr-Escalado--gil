import { FastifyInstance } from 'fastify';

/** Ruta mínima para comprobar que el proceso Node está vivo (balanceadores, k8s, etc.). */
export default async function rutasSalud(fastify: FastifyInstance) {
  fastify.get('/health', {
    schema: {
      operationId: 'healthCheck',
      summary: 'Estado del servicio',
      description:
        'Indica si la API responde. Úsalo como readiness/liveness. Respuesta típica: status **UP** y nombre del servicio.',
      tags: ['Sistema'],
      response: {
        200: {
          description: 'Servicio operativo',
          type: 'object',
          properties: {
            status: {
              type: 'string',
              description: 'UP si el proceso está sirviendo peticiones',
            },
            service: {
              type: 'string',
              description: 'Nombre lógico del microservicio',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Momento de la respuesta en ISO-8601',
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    return { 
      status: 'UP', 
      service: 'PDAE-MS-CONTRATOS-1',
      timestamp: new Date().toISOString()
    };
  });

}
