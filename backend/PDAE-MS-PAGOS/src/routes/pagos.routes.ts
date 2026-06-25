import { FastifyInstance } from 'fastify';
import { PagosController } from '../controllers/pagos.controller';

export default async function rutasPagos(fastify: FastifyInstance) {
  const controlador = new PagosController();

  // Endpoints principales de Pagos
  fastify.post('/pagos/crear', controlador.manejarCrearPago.bind(controlador));
  fastify.get('/pagos/:id_payments', controlador.manejarObtenerPagoPorId.bind(controlador));
  fastify.get('/pagos/usuario/:id_users', controlador.manejarObtenerPagosPorUsuario.bind(controlador));

  // Endpoints para Gestión de Tarjetas y Mandatos (Suscripciones)
  fastify.post('/pagos/tarjeta', controlador.manejarRegistrarTarjeta.bind(controlador));
  fastify.get('/pagos/tarjeta/:id_users', controlador.manejarObtenerTarjetasUsuario.bind(controlador));
  fastify.delete('/pagos/tarjeta/:token', controlador.manejarEliminarTarjeta.bind(controlador));

  // Webhook de la pasarela UCNPAY
  fastify.post('/pagos/webhook', controlador.manejarWebhookPagos.bind(controlador));

  // Simulación de pasarela UCNPAY
  fastify.get('/pagos/mock-externo/checkout-page', controlador.manejarMockCheckoutPage.bind(controlador));
  fastify.post('/pagos/mock-externo/procesar', controlador.manejarMockProcesar.bind(controlador));
}
