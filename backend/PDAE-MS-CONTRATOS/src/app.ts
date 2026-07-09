import { createMicroserviceApp } from 'shared';
import rutasContratos from './routes/contratos.routes';
import { ContratosService } from './services/contratos.service';

export const createServer = async () => {
  return createMicroserviceApp({
    name: 'PDAE-MS-CONTRATOS-1',
    swagger: {
      defaultPort: 3002,
      title: 'PDAE · Microservicio Contratos',
      description:
        'Contratos: crear, listar, actualizar y finalizar bajo `/api/contratos`. Los IDs en JSON son cadenas numéricas (BIGSERIAL en base de datos).',
      tags: [
        { name: 'Contratos', description: 'Operaciones de contrato.' },
        { name: 'Sistema', description: 'Salud del servicio.' },
      ],
    },
    registerRoutes: async (app) => {
      await app.register(rutasContratos, { prefix: '/api' });

      const isTest = process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined;
      if (!isTest) {
        const servicio = new ContratosService();
        const intervalTime = Number(process.env.CRON_EXPIRATION_INTERVAL_MS) || 3600000;

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

        setTimeout(runExpirationCron, 5000);
        const intervalId = setInterval(runExpirationCron, intervalTime);
        app.addHook('onClose', async () => clearInterval(intervalId));
      }
    },
  });
};
