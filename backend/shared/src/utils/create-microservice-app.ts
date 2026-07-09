import 'reflect-metadata';
import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifyHelmet from '@fastify/helmet';
import fastifyMetrics from 'fastify-metrics';
import { registerSwagger, type SwaggerConfig } from './api-doc/swagger';

export interface MicroserviceAppOptions {
  name: string;
  swagger: SwaggerConfig;
  registerRoutes: (app: FastifyInstance) => Promise<void>;
  onReady?: (app: FastifyInstance) => Promise<void>;
  rateLimitMax?: number;
  helmetOptions?: Record<string, any>;
  disableMetrics?: boolean;
}

export async function createMicroserviceApp(
  options: MicroserviceAppOptions,
): Promise<FastifyInstance> {
  const isTest =
    process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined;
  const isDev = process.env.NODE_ENV !== 'production';
  const isProd = process.env.NODE_ENV === 'production';
  const logHttp = isProd
    ? process.env.REQUEST_LOG !== '0'
    : process.env.REQUEST_LOG === '1';
  const logLevel =
    process.env.LOG_LEVEL || (isProd ? 'info' : logHttp ? 'info' : 'warn');

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
    disableRequestLogging: isTest || !logHttp,
  });

  app.setErrorHandler(async (error, request, reply) => {
    if (error.name === 'AppError') {
      return reply.status((error as any).statusCode || 400).send({
        success: false,
        message: error.message,
      });
    }
    if ((error as any).statusCode && (error as any).statusCode < 500) {
      return reply.status((error as any).statusCode).send({
        success: false,
        message: error.message,
      });
    }
    if (error.message?.startsWith('Error de Validación:')) {
      return reply.status(400).send({
        success: false,
        message: error.message,
      });
    }
    request.log?.error?.({ error: error.message }, 'Error en ejecución de procedimiento');
    return reply.status(500).send({
      success: false,
      message: 'Error interno del servidor',
    });
  });

  await app.register(cors);

  await app.register(fastifyRateLimit, {
    max: options.rateLimitMax || 100,
    timeWindow: '1 minute',
  });

  await app.register(fastifyHelmet, {
    global: true,
    ...options.helmetOptions,
  });

  if (!isTest && !options.disableMetrics) {
    await app.register(fastifyMetrics, {
      endpoint: '/monitor',
    });
  }

  await registerSwagger(app, options.swagger);

  app.get('/api/health', async () => ({
    status: 'UP',
    service: options.name,
    timestamp: new Date().toISOString(),
  }));

  await options.registerRoutes(app);

  if (options.onReady) {
    await options.onReady(app);
  }

  return app;
}
