import { FastifyRequest, FastifyReply } from 'fastify';
import { ContratosService } from '../services/contratos.service';
import { transformAndValidate } from 'shared';
import {
  CrearContratoEntradaDto,
  FinalizarContratoEntradaDto,
  ListarContratosConsultaDto,
  ActualizarContratoEntradaDto,
  WebhookPagosEntradaDto,
} from '../models/contratos.dtos';
import { notificarEmail } from '../utils/notifications.client';

export class ContratosController {
  private servicio: ContratosService;

  constructor() {
    this.servicio = new ContratosService();
  }

  private async verificarPropiedadContrato(idContracts: string, userId: string): Promise<boolean> {
    try {
      const contratos = await this.servicio.listarContratos({
        id_contracts: idContracts,
        page_size: 1,
        page_number: 1,
      } as any);
      if (contratos && contratos.length > 0) {
        return String(contratos[0].id_users) === String(userId);
      }
      return false;
    } catch (err) {
      console.error('Error en verificarPropiedadContrato:', err);
      return false;
    }
  }

  async manejarCrearContrato(solicitud: FastifyRequest, respuesta: FastifyReply) {
    const datos = (solicitud.method === 'GET' ? solicitud.query : solicitud.body) as any;

    const userRole = solicitud.headers?.['x-user-role'];
    const userId = solicitud.headers?.['x-user-id'];
    if (userRole === 'client') {
      if (!userId) {
        return respuesta.status(401).send({ success: false, message: 'No autenticado' });
      }
      datos.id_users = String(userId);
    }

    const entrada = await transformAndValidate(CrearContratoEntradaDto, datos);
    const resultado = await this.servicio.crearContrato(entrada);

    if (resultado && resultado.length > 0) {
      const userEmail = solicitud.headers?.['x-user-email'] as string | undefined;
      if (userEmail) {
        notificarEmail({
          email: userEmail,
          subject: 'Contrato creado exitosamente',
          htmlBody: `<p>Tu contrato ha sido creado exitosamente.</p><p>ID de contrato: ${resultado[0].id_contracts}</p>`,
        });
      }
    }

    return respuesta.status(200).send({ success: true, data: resultado });
  }

  async manejarFinalizarContrato(solicitud: FastifyRequest, respuesta: FastifyReply) {
    const datos = (solicitud.method === 'GET' ? solicitud.query : solicitud.body) as any;
    const entrada = await transformAndValidate(FinalizarContratoEntradaDto, datos);

    const userRole = solicitud.headers?.['x-user-role'];
    const userId = solicitud.headers?.['x-user-id'];
    if (userRole === 'client') {
      if (!userId) {
        return respuesta.status(401).send({ success: false, message: 'No autenticado' });
      }
      const esPropio = await this.verificarPropiedadContrato(entrada.id_contracts, String(userId));
      if (!esPropio) {
        return respuesta.status(403).send({ success: false, message: 'No tienes permiso para modificar este contrato' });
      }
    }

    const resultado = await this.servicio.finalizarContrato(entrada);
    return respuesta.status(200).send({ success: true, data: resultado });
  }

  async manejarListarContratos(solicitud: FastifyRequest, respuesta: FastifyReply) {
    const datos = (solicitud.method === 'GET' ? solicitud.query : solicitud.body) as any;

    const userRole = solicitud.headers?.['x-user-role'];
    const userId = solicitud.headers?.['x-user-id'];
    if (userRole === 'client') {
      if (!userId) {
        return respuesta.status(401).send({ success: false, message: 'No autenticado' });
      }
      datos.id_users = String(userId);
    }

    const entrada = await transformAndValidate(ListarContratosConsultaDto, datos);
    const resultado = await this.servicio.listarContratos(entrada);

    return respuesta.status(200).send({ success: true, data: resultado });
  }

  async manejarActualizarContrato(solicitud: FastifyRequest, respuesta: FastifyReply) {
    const datos = (solicitud.method === 'GET' ? solicitud.query : solicitud.body) as any;
    const entrada = await transformAndValidate(ActualizarContratoEntradaDto, datos);

    const userRole = solicitud.headers?.['x-user-role'];
    const userId = solicitud.headers?.['x-user-id'];
    if (userRole === 'client') {
      if (!userId) {
        return respuesta.status(401).send({ success: false, message: 'No autenticado' });
      }
      const esPropio = await this.verificarPropiedadContrato(entrada.id_contracts, String(userId));
      if (!esPropio) {
        return respuesta.status(403).send({ success: false, message: 'No tienes permiso para modificar este contrato' });
      }
      if (entrada.id_users && String(entrada.id_users) !== String(userId)) {
        return respuesta.status(403).send({ success: false, message: 'No puedes transferir la propiedad del contrato' });
      }
    }

    const resultado = await this.servicio.actualizarContrato(entrada);
    return respuesta.status(200).send({ success: true, data: resultado });
  }

  async manejarWebhookPagos(solicitud: FastifyRequest, respuesta: FastifyReply) {
    solicitud.log?.info?.({ event: (solicitud.body as any)?.event }, 'Webhook de pago recibido');

    const datos = solicitud.body;
    const entrada = await transformAndValidate(WebhookPagosEntradaDto, datos);
    const resultado = await this.servicio.procesarPagoWebhook(entrada);

    return respuesta.status(200).send({
      success: true,
      message: 'Evento de pago procesado correctamente',
      data: resultado,
    });
  }

  async manejarCronExpiracion(solicitud: FastifyRequest, respuesta: FastifyReply) {
    solicitud.log?.info?.('Disparo manual de Cron de Expiraciones de contratos');

    const resultado = await this.servicio.ejecutarProcesoExpiracion();

    return respuesta.status(200).send({
      success: true,
      message: 'Cron de expiración de contratos ejecutado correctamente',
      data: resultado,
    });
  }
}
