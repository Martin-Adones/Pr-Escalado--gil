import { FastifyInstance } from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

const DEFAULT_PORT = 3003;

/**
 * Servidores OpenAPI para "Probar solicitud" en Swagger UI.
 * - PUBLIC_URL: URL pública detrás de reverse proxy (sin barra final).
 * - Sin PUBLIC_URL: http://localhost:PORT (PORT por defecto 3003) + mismo origen.
 */
function resolveLocalSwaggerHost(): string {
  const raw = (process.env.SWAGGER_HOST || 'localhost').trim().replace(/\/$/, '');
  if (raw === '127.0.0.1' || raw === '::1') {
    return 'localhost';
  }
  return raw || 'localhost';
}

function getOpenApiServers(): { url: string; description: string }[] {
  const publicUrl = process.env.PUBLIC_URL?.trim().replace(/\/$/, '');
  if (publicUrl) {
    return [
      {
        url: publicUrl,
        description: 'Entorno configurado (variable PUBLIC_URL). Debe coincidir con el host desde el que consumes la API.',
      },
    ];
  }

  const port = Number(process.env.PORT) || DEFAULT_PORT;
  const host = resolveLocalSwaggerHost();

  return [
    {
      url: `http://${host}:${port}`,
      description: `Base en local (localhost). Mismo puerto que el MS (por defecto PORT=${DEFAULT_PORT}). Ejemplo: http://localhost:${port}/api/health`,
    },
    {
      url: '/',
      description:
        'Mismo host y puerto desde el que abres esta documentación (/api-doc). Útil si no quieres fijar el puerto en el desplegable.',
    },
  ];
}

/** Texto breve en la portada de Swagger; el detalle va en cada operación (esquema y descripciones por ruta). */
const INFO_DESCRIPTION =
  'Usuarios: crear, listar y actualizar bajo `/api/usuarios`. id_users en JSON como cadena numérica (BIGSERIAL).';

export const registerSwagger = async (app: FastifyInstance) => {
  await app.register(swagger, {
    openapi: {
      openapi: '3.0.3',
      info: {
        title: 'PDAE · Microservicio Usuarios',
        description: INFO_DESCRIPTION,
        version: '1.0.0',
        contact: {
          name: 'Equipo PDAE',
        },
      },
      servers: getOpenApiServers(),
      tags: [
        { name: 'Usuarios', description: 'Alta, listado y actualización de usuarios.' },
        { name: 'Sistema', description: 'Salud del servicio.' },
      ],
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/api-doc',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
      defaultModelsExpandDepth: 2,
      defaultModelExpandDepth: 2,
      displayRequestDuration: true,
      filter: true,
      syntaxHighlight: { activate: true, theme: 'agate' },
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
  });
};
