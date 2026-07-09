import { createMicroserviceApp } from 'shared';
import rutasUsuarios from './routes/usuarios.routes';

export const createServer = async () => {
  return createMicroserviceApp({
    name: 'PDAE-MS-USUARIOS-1',
    swagger: {
      defaultPort: 3003,
      title: 'PDAE · Microservicio Usuarios',
      description:
        'Usuarios: crear, listar y actualizar bajo `/api/usuarios`. id_users en JSON como cadena numérica (BIGSERIAL) y isActive como booleano.',
      tags: [
        { name: 'Usuarios', description: 'Alta, listado y actualización de usuarios.' },
        { name: 'Sistema', description: 'Salud del servicio.' },
      ],
    },
    registerRoutes: async (app) => {
      await app.register(rutasUsuarios, { prefix: '/api' });
    },
  });
};
