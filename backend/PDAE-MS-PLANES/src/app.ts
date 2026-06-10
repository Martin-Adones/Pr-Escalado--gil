import 'reflect-metadata';
import Fastify, { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import cors from '@fastify/cors';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifyHelmet from '@fastify/helmet';
import fastifyMetrics from 'fastify-metrics';
import { registerSwagger } from './utils/api-doc/swagger';

import healthRoutes from './routes/health-routes';
import planesRoutes from './routes/planes.routes';

/**
 * Construye la app Fastify: plugins de seguridad, Swagger y rutas bajo `/api`.
 */
export const createServer = async (): Promise<FastifyInstance> => {
  // En tests también existe JEST_WORKER_ID aunque NODE_ENV no sea "test"
  const isTest = process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined;
  const isDev = process.env.NODE_ENV !== 'production';
  const isProd = process.env.NODE_ENV === 'production';
  /** En desarrollo: sin REQUEST_LOG=1 no se imprime cada GET (api-doc, estáticos, etc.) */
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
    global: true
  });

  if (!isTest) {
    await app.register(fastifyMetrics, {
      endpoint: '/monitor'
    });
  }

  

  await registerSwagger(app);

  await app.register(healthRoutes, { prefix: '/api' });
  await app.register(planesRoutes, { prefix: '/api' });

  return app;
};
