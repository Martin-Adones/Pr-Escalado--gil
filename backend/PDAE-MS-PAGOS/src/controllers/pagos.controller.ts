import { FastifyRequest, FastifyReply } from 'fastify';
import { PagosService } from '../services/pagos.service';
import { transformAndValidate } from 'shared';
import { CrearPagoEntradaDto, UcnpayWebhookEntradaDto, RegistrarTarjetaEntradaDto } from '../models/pagos.dtos';

export class PagosController {
  private servicio: PagosService;

  constructor() {
    this.servicio = new PagosService();
  }

  async manejarCrearPago(solicitud: FastifyRequest, respuesta: FastifyReply) {
    const datos = (solicitud.method === 'GET' ? solicitud.query : solicitud.body) as any;

    const userRole = solicitud.headers?.['x-user-role'];
    const userId = solicitud.headers?.['x-user-id'];
    if (userRole === 'client') {
      if (!userId) {
        return respuesta.status(401).send({ success: false, message: 'No autenticado' });
      }
      datos.id_users = String(userId);
    }

    const userEmail = solicitud.headers?.['x-user-email'] as string | undefined;
    if (userEmail) {
      datos.user_email = userEmail;
    }

    const entrada = await transformAndValidate(CrearPagoEntradaDto, datos);
    const resultado = await this.servicio.crearPago(entrada);

    return respuesta.status(200).send({ success: true, data: resultado });
  }

  async manejarObtenerPagoPorId(solicitud: FastifyRequest, respuesta: FastifyReply) {
    const { id_payments } = solicitud.params as any;
    const pago = await this.servicio.obtenerPagoPorId(id_payments);

    if (!pago) {
      return respuesta.status(404).send({ success: false, message: 'Pago no encontrado' });
    }

    const userRole = solicitud.headers?.['x-user-role'];
    const userId = solicitud.headers?.['x-user-id'];
    if (userRole === 'client' && String(pago.id_users) !== String(userId)) {
      return respuesta.status(403).send({ success: false, message: 'Acceso no autorizado a este registro de pago' });
    }

    return respuesta.status(200).send({ success: true, data: pago });
  }

  async manejarObtenerPagosPorUsuario(solicitud: FastifyRequest, respuesta: FastifyReply) {
    const { id_users } = solicitud.params as any;

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
    return respuesta.status(200).send({ success: true, data: pagos });
  }

  async manejarRegistrarTarjeta(solicitud: FastifyRequest, respuesta: FastifyReply) {
    const datos = solicitud.body as any;

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

    return respuesta.status(200).send({ success: true, data: resultado });
  }

  async manejarObtenerTarjetasUsuario(solicitud: FastifyRequest, respuesta: FastifyReply) {
    const { id_users } = solicitud.params as any;

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
    return respuesta.status(200).send({ success: true, data: tarjetas });
  }

  async manejarEliminarTarjeta(solicitud: FastifyRequest, respuesta: FastifyReply) {
    const { token } = solicitud.params as any;

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
  }

  async manejarWebhookPagos(solicitud: FastifyRequest, respuesta: FastifyReply) {
    const datos = solicitud.body;
    const entrada = await transformAndValidate(UcnpayWebhookEntradaDto, datos as any);
    const resultado = await this.servicio.procesarPagoWebhook(entrada);

    return respuesta.status(200).send({
      success: true,
      message: 'Webhook procesado con éxito',
      data: resultado,
    });
  }
}
