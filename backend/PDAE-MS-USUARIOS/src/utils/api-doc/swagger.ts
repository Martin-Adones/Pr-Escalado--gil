import { FastifyInstance } from 'fastify';
import { registerSwagger as sharedRegisterSwagger } from 'shared';

export async function registerSwagger(app: FastifyInstance) {
  await sharedRegisterSwagger(app, {
    defaultPort: 3003,
    title: 'PDAE · Microservicio Usuarios',
    description: 'Usuarios: crear, listar y actualizar bajo `/api/usuarios`. id_users en JSON como cadena numérica (BIGSERIAL) y isActive como booleano.',
    tags: [
      { name: 'Usuarios', description: 'Alta, listado y actualización de usuarios.' },
      { name: 'Sistema', description: 'Salud del servicio.' },
    ],
  });
}
