import { FastifyInstance } from 'fastify';
import { PagosController } from '../controllers/pagos.controller';
import {
  esquemaPostCrearPago,
  esquemaGetObtenerPagoPorId,
  esquemaGetObtenerPagosPorUsuario,
  esquemaPostRegistrarTarjeta,
  esquemaGetObtenerTarjetasUsuario,
  esquemaDeleteEliminarTarjeta,
  esquemaPostWebhookPagos,
} from '../utils/api-doc/pagos-route-schemas';

export default async function rutasPagos(fastify: FastifyInstance) {
  const controlador = new PagosController();

  // Endpoints principales de Pagos
  fastify.post(
    '/pagos/crear',
    { schema: esquemaPostCrearPago },
    controlador.manejarCrearPago.bind(controlador)
  );
  fastify.get(
    '/pagos/:id_payments',
    { schema: esquemaGetObtenerPagoPorId },
    controlador.manejarObtenerPagoPorId.bind(controlador)
  );
  fastify.get(
    '/pagos/usuario/:id_users',
    { schema: esquemaGetObtenerPagosPorUsuario },
    controlador.manejarObtenerPagosPorUsuario.bind(controlador)
  );

  // Endpoints para Gestión de Tarjetas y Mandatos (Suscripciones)
  fastify.post(
    '/pagos/tarjeta',
    { schema: esquemaPostRegistrarTarjeta },
    controlador.manejarRegistrarTarjeta.bind(controlador)
  );
  fastify.get(
    '/pagos/tarjeta/:id_users',
    { schema: esquemaGetObtenerTarjetasUsuario },
    controlador.manejarObtenerTarjetasUsuario.bind(controlador)
  );
  fastify.delete(
    '/pagos/tarjeta/:token',
    { schema: esquemaDeleteEliminarTarjeta },
    controlador.manejarEliminarTarjeta.bind(controlador)
  );

  // Webhook de la pasarela UCNPAY
  fastify.post(
    '/pagos/webhook',
    { schema: esquemaPostWebhookPagos },
    controlador.manejarWebhookPagos.bind(controlador)
  );
}
