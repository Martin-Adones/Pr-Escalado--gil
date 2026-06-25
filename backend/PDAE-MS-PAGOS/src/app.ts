import 'reflect-metadata';
import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifyHelmet from '@fastify/helmet';
import fastifyMetrics from 'fastify-metrics';
import { registerSwagger } from './utils/api-doc/swagger';

import healthRoutes from './routes/health-routes';
import pagosRoutes from './routes/pagos.routes';

/**
 * Construye la app Fastify para el microservicio de pagos.
 */
export const createServer = async (): Promise<FastifyInstance> => {
  const isTest = process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined;
  const isDev = process.env.NODE_ENV !== 'production';
  const isProd = process.env.NODE_ENV === 'production';
  const logHttp = isProd ? process.env.REQUEST_LOG !== '0' : process.env.REQUEST_LOG === '1';
  const logLevel = process.env.LOG_LEVEL || (isProd ? 'info' : logHttp ? 'info' : 'warn');

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

  await app.register(cors);

  await app.register(fastifyRateLimit, {
    max: 100,
    timeWindow: '1 minute'
  });

  await app.register(fastifyHelmet, {
    global: true,
    contentSecurityPolicy: false, // Permitir cargado del mock HTML desde el iframe/sandbox
  });

  if (!isTest) {
    await app.register(fastifyMetrics, {
      endpoint: '/monitor'
    });
  }

  await registerSwagger(app);

  await app.register(healthRoutes, { prefix: '/api' });
  await app.register(pagosRoutes, { prefix: '/api' });

  return app;
};
