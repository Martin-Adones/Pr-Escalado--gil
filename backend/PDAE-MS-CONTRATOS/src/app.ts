import 'reflect-metadata';
import Fastify, { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import cors from '@fastify/cors';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifyHelmet from '@fastify/helmet';
import fastifyMetrics from 'fastify-metrics';
import { registerSwagger } from './utils/api-doc/swagger';


import healthRoutes from './routes/health-routes';
import rutasContratos from './routes/contratos.routes';
import { ContratosService } from './services/contratos.service';

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
  await app.register(rutasContratos, { prefix: '/api' });

  // Configuración del temporizador de expiración automática de contratos (solo si no es entorno de test)
  if (!isTest) {
    const servicio = new ContratosService();
    const intervalTime = Number(process.env.CRON_EXPIRATION_INTERVAL_MS) || 3600000; // Por defecto cada 1 hora

    app.log.info(`[Cron] Iniciando temporizador de expiración de contratos cada ${intervalTime}ms`);

    const runExpirationCron = async () => {
      try {
        app.log.info('[Cron] Ejecutando expiración de contratos automática...');
        const resultado = await servicio.ejecutarProcesoExpiracion();
        app.log.info(`[Cron] Expiración automática finalizada: ${resultado.procesados} contratos procesados`);
      } catch (err) {
        app.log.error({ err }, '[Cron] Error al ejecutar expiración automática de contratos');
      }
    };

    let intervalId: NodeJS.Timeout;

    app.ready(() => {
      // Ejecución inicial ligera diferida
      setTimeout(runExpirationCron, 5000);
      intervalId = setInterval(runExpirationCron, intervalTime);
    });

    app.addHook('onClose', async () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    });
  }

  return app;
};
