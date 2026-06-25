import { FastifyInstance } from 'fastify';
import { PagosController } from '../controllers/pagos.controller';

export default async function rutasPagos(fastify: FastifyInstance) {
  const controlador = new PagosController();

  // Endpoints principales expuestos al cliente / administrador
  fastify.post('/pagos/crear', controlador.manejarCrearPago.bind(controlador));
  fastify.get('/pagos/:id_payments', controlador.manejarObtenerPagoPorId.bind(controlador));
  fastify.get('/pagos/usuario/:id_users', controlador.manejarObtenerPagosPorUsuario.bind(controlador));

  // Webhook del sistema externo de pagos
  fastify.post('/pagos/webhook', controlador.manejarWebhookPagos.bind(controlador));

  // Simulación de la pasarela externa de pagos ("Proyecto Pagos")
  fastify.get('/pagos/mock-externo/checkout-page', controlador.manejarMockCheckoutPage.bind(controlador));
  fastify.post('/pagos/mock-externo/procesar', controlador.manejarMockProcesar.bind(controlador));
}
