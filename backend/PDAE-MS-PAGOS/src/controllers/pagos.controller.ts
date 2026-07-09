import { FastifyRequest, FastifyReply } from 'fastify';
import { PagosService } from '../services/pagos.service';
import { transformAndValidate } from 'shared';
import { CrearPagoEntradaDto, UcnpayWebhookEntradaDto, RegistrarTarjetaEntradaDto } from '../models/pagos.dtos';

export class PagosController {
  private servicio: PagosService;

  constructor() {
    this.servicio = new PagosService();
  }

  // --- Endpoints de Pagos ---

  async manejarCrearPago(solicitud: FastifyRequest, respuesta: FastifyReply) {
    try {
      const datos = (solicitud.method === 'GET' ? solicitud.query : solicitud.body) as any;

      // Prevención de IDOR
      const userRole = solicitud.headers?.['x-user-role'];
      const userId = solicitud.headers?.['x-user-id'];
      if (userRole === 'client') {
        if (!userId) {
          return respuesta.status(401).send({ success: false, message: 'No autenticado' });
        }
        datos.id_users = String(userId);
      }

      const entrada = await transformAndValidate(CrearPagoEntradaDto, datos);
      const resultado = await this.servicio.crearPago(entrada);

      return respuesta.status(200).send({
        success: true,
        data: resultado,
      });
    } catch (error: any) {
      console.error('ERROR EN crearPago CONTROLLER:', error);
      if (error.message?.startsWith('Error de Validación:')) {
        return respuesta.status(400).send({ success: false, message: error.message });
      }
      return respuesta.status(500).send({ success: false, message: error.message || 'Error interno del servidor' });
    }
  }

  async manejarObtenerPagoPorId(solicitud: FastifyRequest, respuesta: FastifyReply) {
    try {
      const { id_payments } = solicitud.params as any;
      const pago = await this.servicio.obtenerPagoPorId(id_payments);

      if (!pago) {
        return respuesta.status(404).send({ success: false, message: 'Pago no encontrado' });
      }

      // Prevención de IDOR
      const userRole = solicitud.headers?.['x-user-role'];
      const userId = solicitud.headers?.['x-user-id'];
      if (userRole === 'client' && String(pago.id_users) !== String(userId)) {
        return respuesta.status(403).send({ success: false, message: 'Acceso no autorizado a este registro de pago' });
      }

      return respuesta.status(200).send({
        success: true,
        data: pago,
      });
    } catch (error: any) {
      return respuesta.status(500).send({ success: false, message: 'Error interno del servidor' });
    }
  }

  async manejarObtenerPagosPorUsuario(solicitud: FastifyRequest, respuesta: FastifyReply) {
    try {
      const { id_users } = solicitud.params as any;

      // Prevención de IDOR
      const userRole = solicitud.headers?.['x-user-role'];
      const userId = solicitud.headers?.['x-user-id'];
      let targetUserId = id_users;
      if (userRole === 'client') {
        if (!userId) {
          return respuesta.status(401).send({ success: false, message: 'No autenticado' });
        }
        targetUserId = String(userId);
      }

      const pagos = await this.servicio.obtenerPagosPorUsuario(targetUserId);

      return respuesta.status(200).send({
        success: true,
        data: pagos,
      });
    } catch (error: any) {
      return respuesta.status(500).send({ success: false, message: 'Error interno del servidor' });
    }
  }

  // --- Endpoints de Gestión de Tarjetas (UCNPAY) ---

  async manejarRegistrarTarjeta(solicitud: FastifyRequest, respuesta: FastifyReply) {
    try {
      const datos = solicitud.body as any;

      // Prevención de IDOR
      const userRole = solicitud.headers?.['x-user-role'];
      const userId = solicitud.headers?.['x-user-id'];
      if (userRole === 'client') {
        if (!userId) {
          return respuesta.status(401).send({ success: false, message: 'No autenticado' });
        }
        datos.id_users = String(userId);
      }

      const entrada = await transformAndValidate(RegistrarTarjetaEntradaDto, datos);
      const resultado = await this.servicio.registrarTarjeta(entrada);

      return respuesta.status(200).send({
        success: true,
        data: resultado,
      });
    } catch (error: any) {
      console.error('ERROR EN registrarTarjeta CONTROLLER:', error);
      if (error.message?.startsWith('Error de Validación:')) {
        return respuesta.status(400).send({ success: false, message: error.message });
      }
      return respuesta.status(500).send({ success: false, message: error.message || 'Error interno del servidor' });
    }
  }

  async manejarObtenerTarjetasUsuario(solicitud: FastifyRequest, respuesta: FastifyReply) {
    try {
      const { id_users } = solicitud.params as any;

      // Prevención de IDOR
      const userRole = solicitud.headers?.['x-user-role'];
      const userId = solicitud.headers?.['x-user-id'];
      let targetUserId = id_users;
      if (userRole === 'client') {
        if (!userId) {
          return respuesta.status(401).send({ success: false, message: 'No autenticado' });
        }
        targetUserId = String(userId);
      }

      const tarjetas = await this.servicio.obtenerTarjetasUsuario(targetUserId);

      return respuesta.status(200).send({
        success: true,
        data: tarjetas,
      });
    } catch (error: any) {
      return respuesta.status(500).send({ success: false, message: 'Error interno del servidor' });
    }
  }

  async manejarEliminarTarjeta(solicitud: FastifyRequest, respuesta: FastifyReply) {
    try {
      const { token } = solicitud.params as any;

      // Prevención de IDOR
      const userRole = solicitud.headers?.['x-user-role'];
      const userId = solicitud.headers?.['x-user-id'];
      if (userRole === 'client' && !userId) {
        return respuesta.status(401).send({ success: false, message: 'No autenticado' });
      }

      const exitoso = await this.servicio.eliminarTarjeta(String(userId), token);

      return respuesta.status(200).send({
        success: exitoso,
        message: exitoso ? 'Tarjeta eliminada con éxito' : 'No se pudo eliminar la tarjeta',
      });
    } catch (error: any) {
      return respuesta.status(500).send({ success: false, message: 'Error interno del servidor' });
    }
  }

  // --- Webhook Pasarela UCNPAY ---

  async manejarWebhookPagos(solicitud: FastifyRequest, respuesta: FastifyReply) {
    try {
      const datos = solicitud.body;
      const entrada = await transformAndValidate(UcnpayWebhookEntradaDto, datos as any);
      const resultado = await this.servicio.procesarPagoWebhook(entrada);

      return respuesta.status(200).send({
        success: true,
        message: 'Webhook procesado con éxito',
        data: resultado,
      });
    } catch (error: any) {
      console.error('ERROR EN manejarWebhookPagos CONTROLLER:', error);
      if (error.message?.startsWith('Error de Validación:')) {
        return respuesta.status(400).send({ success: false, message: error.message });
      }
      return respuesta.status(500).send({ success: false, message: 'Error interno al procesar el webhook' });
    }
  }
}
