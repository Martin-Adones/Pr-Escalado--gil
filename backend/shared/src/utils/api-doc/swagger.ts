import { FastifyInstance } from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

export interface SwaggerConfig {
  defaultPort: number;
  title: string;
  description: string;
  tags: { name: string; description: string }[];
}

function resolveLocalSwaggerHost(): string {
  const raw = (process.env.SWAGGER_HOST || 'localhost').trim().replace(/\/$/, '');
  if (raw === '127.0.0.1' || raw === '::1') {
    return 'localhost';
  }
  return raw || 'localhost';
}

function getOpenApiServers(defaultPort: number): { url: string; description: string }[] {
  const publicUrl = process.env.PUBLIC_URL?.trim().replace(/\/$/, '');
  if (publicUrl) {
    return [
      {
        url: publicUrl,
        description: 'Entorno configurado (variable PUBLIC_URL). Debe coincidir con el host desde el que consumes la API.',
      },
    ];
  }

  const port = Number(process.env.PORT) || defaultPort;
  const host = resolveLocalSwaggerHost();

  return [
    {
      url: `http://${host}:${port}`,
      description: `Base en local (localhost). Mismo puerto que el MS (por defecto PORT=${defaultPort}). Ejemplo: http://localhost:${port}/api/health`,
    },
    {
      url: '/',
      description:
        'Mismo host y puerto desde el que abres esta documentación (/api-doc). Útil si no quieres fijar el puerto en el desplegable.',
    },
  ];
}

export async function registerSwagger(app: FastifyInstance, config: SwaggerConfig) {
  await app.register(swagger, {
    openapi: {
      openapi: '3.0.3',
      info: {
        title: config.title,
        description: config.description,
        version: '1.0.0',
        contact: {
          name: 'Equipo PDAE',
        },
      },
      servers: getOpenApiServers(config.defaultPort),
      tags: config.tags,
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
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
    transformStaticCSP: (header: any) => header,
  });
}
