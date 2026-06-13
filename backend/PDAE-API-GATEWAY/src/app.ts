import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifyHelmet from '@fastify/helmet';
import fastifyProxy from '@fastify/http-proxy';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { SwaggerMerger } from './utils/api-doc/swagger-merger';

import { microservices, logLevel } from './config';

export const createServer = async (): Promise<FastifyInstance> => {
  const isDev = process.env.NODE_ENV !== 'production';
  const isTest = process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined;

  const app = Fastify({
    logger: isTest
      ? false
      : {
          level: logLevel,
          transport: isDev
            ? {
                target: 'pino-pretty',
                options: {
                  translateTime: 'HH:MM:ss Z',
                  ignore: 'pid,hostname',
                  colorize: true,
                  singleLine: true,
                },
              }
            : undefined,
        },
  });

  // Configurar CORS
  const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
  await app.register(cors, {
    origin: corsOrigin === '*' ? true : corsOrigin.split(',').map(s => s.trim()),
    credentials: true,
  });

  // Rate limit
  await app.register(fastifyRateLimit, {
    max: 200,
    timeWindow: '1 minute',
  });

  // Configuración de Helmet para seguridad de cabeceras HTTP
  await app.register(fastifyHelmet, {
    global: true,
    contentSecurityPolicy: false,
  });

  // Registramos Swagger de forma básica
  await app.register(swagger, {
    openapi: {
      openapi: '3.0.3',
      info: {
        title: 'PDAE · API Gateway',
        version: '1.0.0',
      },
    },
  });

  const swaggerMerger = new SwaggerMerger();

  // Caché en memoria para almacenar la especificación OpenAPI unificada
  let cachedSpec: any = {
    openapi: '3.0.3',
    info: {
      title: 'PDAE · API Gateway',
      version: '1.0.0',
      description: 'Cargando especificaciones de los microservicios...',
    },
    paths: {},
  };

  // Función para actualizar la caché en segundo plano de manera asíncrona
  const updateSwaggerCache = async () => {
    try {
      const spec = await swaggerMerger.getUnifiedSchema();
      
      // Inyectamos el endpoint de salud del API Gateway en la especificación
      if (!spec.paths) spec.paths = {};
      spec.paths['/api/health'] = {
        get: {
          summary: 'Chequeo de salud del Gateway',
          description: 'Chequeo de salud consolidado del Gateway y sus microservicios asociados.',
          tags: ['Sistema'],
          responses: {
            200: {
              description: 'Salud del sistema correcta (UP)',
            },
            503: {
              description: 'Algún microservicio o dependencia se encuentra caído (DEGRADED)',
            },
          },
        },
      };

      // Inyectamos la definición del tag Sistema
      if (!spec.tags) spec.tags = [];
      if (!spec.tags.some((t: any) => t.name === 'Sistema')) {
        spec.tags.push({
          name: 'Sistema',
          description: 'Monitoreo e información del estado de la plataforma.',
        });
      }

      cachedSpec = spec;
    } catch (error) {
      app.log.error({ err: error }, 'Error al actualizar la caché de Swagger');
    }
  };

  // Ejecutamos la primera carga de inmediato y configuramos actualización periódica cada 15 segundos
  updateSwaggerCache();
  const cacheInterval = setInterval(updateSwaggerCache, 15000);

  // Limpiamos el intervalo al cerrar la app para evitar fugas de memoria
  app.addHook('onClose', async () => {
    clearInterval(cacheInterval);
  });

  // Registramos el UI de Swagger utilizando transformSpecification de forma síncrona
  await app.register(swaggerUi, {
    routePrefix: '/api-doc',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
      displayRequestDuration: true,
      filter: true,
    },
    transformSpecification: (swaggerObject, request, reply) => {
      // Retornamos la caché de manera síncrona (evitando retornar un Promise)
      return cachedSpec;
    },
    transformSpecificationClone: true,
  });

  // Endpoint de salud (Health Check) del Gateway y dependencias
  app.get(
    '/api/health',
    {
      schema: {
        description: 'Chequeo de salud consolidado del Gateway y sus microservicios asociados.',
        tags: ['Sistema'],
      },
    },
    async (request, reply) => {
    const checkService = async (url: string) => {
      try {
        const res = await fetch(`${url}/api/health`, { signal: AbortSignal.timeout(2000) });
        if (res.ok) {
          const data = await res.json();
          return { status: 'UP', details: data };
        }
        return { status: 'DOWN', reason: `HTTP status ${res.status}` };
      } catch (err: any) {
        return { status: 'DOWN', reason: err.message };
      }
    };

    // Consultar todos los microservicios en paralelo
    const results = await Promise.all(
      microservices.map(async (ms) => {
        const health = await checkService(ms.url);
        return { prefix: ms.prefix, health };
      })
    );

    const servicesHealth: Record<string, any> = {
      gateway: { status: 'UP' }
    };

    let isAllOk = true;
    for (const res of results) {
      servicesHealth[res.prefix] = res.health;
      if (res.health.status !== 'UP') {
        isAllOk = false;
      }
    }

    reply.status(isAllOk ? 200 : 503).send({
      status: isAllOk ? 'UP' : 'DEGRADED',
      timestamp: new Date().toISOString(),
      services: servicesHealth,
    });
  });

  // Hook para decodificar el token de sesión simulado e inyectar cabeceras de identidad seguras
  app.addHook('preHandler', async (request, reply) => {
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
        if (decoded && decoded.type) {
          if (decoded.id_users) {
            request.headers['x-user-id'] = String(decoded.id_users);
          }
          request.headers['x-user-role'] = String(decoded.type);
        }
      } catch (err) {
        app.log.warn('Error al decodificar token de identidad en Gateway');
      }
    }
  });

  // Configuración dinámica de Proxies hacia los microservicios
  for (const service of microservices) {
    app.log.info(`[Proxy] Configurando redirección /api/${service.prefix}/* -> ${service.url}/api/${service.prefix}/*`);
    await app.register(fastifyProxy, {
      upstream: service.url,
      prefix: `/api/${service.prefix}`,
      rewritePrefix: `/api/${service.prefix}`,
    });
  }

  return app;
};
