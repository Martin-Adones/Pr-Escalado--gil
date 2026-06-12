import { FastifyRequest, FastifyReply } from 'fastify';
import { ContratosService } from '../services/contratos.service';
import { transformAndValidate } from '../utils/validator';
import {
  CrearContratoEntradaDto,
  FinalizarContratoEntradaDto,
  ListarContratosConsultaDto,
  ActualizarContratoEntradaDto,
  WebhookPagosEntradaDto,
} from '../models/contratos.dtos';

/**
 * Capa HTTP: valida DTOs, aplica reglas de control de acceso e IDOR, y delega en {@link ContratosService}.
 */
export class ContratosController {
  private servicio: ContratosService;

  constructor() {
    this.servicio = new ContratosService();
  }

  /**
   * Helper para verificar si un contrato le pertenece al usuario especificado.
   */
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
    solicitud.log?.debug?.({ procedimiento: 'sp_crear_contrato' }, 'ejecutando procedimiento');

    try {
      const datos = (solicitud.method === 'GET' ? solicitud.query : solicitud.body) as any;

      // Prevención de IDOR: si el rol es cliente, forzar que el id_users sea el suyo propio
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

      return respuesta.status(200).send({
        success: true,
        data: resultado,
      });
    } catch (error: any) {
      console.error('ERROR EN crearContrato CONTROLLER:', error);
      if (error.message?.startsWith('Error de Validación:')) {
        return respuesta.status(400).send({
          success: false,
          message: error.message,
        });
      }

      solicitud.log?.error?.(
        { error: error.message, procedimiento: 'sp_crear_contrato' },
        'Error en ejecución de procedimiento'
      );
      return respuesta.status(500).send({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  }

  async manejarFinalizarContrato(solicitud: FastifyRequest, respuesta: FastifyReply) {
    solicitud.log?.debug?.({ procedimiento: 'sp_finalizar_contrato' }, 'ejecutando procedimiento');

    try {
      const datos = (solicitud.method === 'GET' ? solicitud.query : solicitud.body) as any;
      const entrada = await transformAndValidate(FinalizarContratoEntradaDto, datos);

      // Prevención de IDOR: si el rol es cliente, verificar pertenencia del contrato
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

      return respuesta.status(200).send({
        success: true,
        data: resultado,
      });
    } catch (error: any) {
      console.error('ERROR EN finalizarContrato CONTROLLER:', error);
      if (error.message?.startsWith('Error de Validación:')) {
        return respuesta.status(400).send({
          success: false,
          message: error.message,
        });
      }

      solicitud.log?.error?.(
        { error: error.message, procedimiento: 'sp_finalizar_contrato' },
        'Error en ejecución de procedimiento'
      );
      return respuesta.status(500).send({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  }

  async manejarListarContratos(solicitud: FastifyRequest, respuesta: FastifyReply) {
    solicitud.log?.debug?.({ procedimiento: 'sp_listar_contratos' }, 'ejecutando procedimiento');

    try {
      const datos = (solicitud.method === 'GET' ? solicitud.query : solicitud.body) as any;

      // Prevención de IDOR: si el rol es cliente, forzar que solo liste sus propios contratos
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

      return respuesta.status(200).send({
        success: true,
        data: resultado,
      });
    } catch (error: any) {
      console.error('ERROR EN listarContratos CONTROLLER:', error);
      if (error.message?.startsWith('Error de Validación:')) {
        return respuesta.status(400).send({
          success: false,
          message: error.message,
        });
      }

      solicitud.log?.error?.(
        { error: error.message, procedimiento: 'sp_listar_contratos' },
        'Error en ejecución de procedimiento'
      );
      return respuesta.status(500).send({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  }

  async manejarActualizarContrato(solicitud: FastifyRequest, respuesta: FastifyReply) {
    solicitud.log?.debug?.({ procedimiento: 'sp_actualizar_contrato' }, 'ejecutando procedimiento');

    try {
      const datos = (solicitud.method === 'GET' ? solicitud.query : solicitud.body) as any;
      const entrada = await transformAndValidate(ActualizarContratoEntradaDto, datos);

      // Prevención de IDOR: si el rol es cliente, verificar pertenencia del contrato
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
        // Evitar que el cliente intente cambiar el propietario del contrato
        if (entrada.id_users && String(entrada.id_users) !== String(userId)) {
          return respuesta.status(403).send({ success: false, message: 'No puedes transferir la propiedad del contrato' });
        }
      }

      const resultado = await this.servicio.actualizarContrato(entrada);

      return respuesta.status(200).send({
        success: true,
        data: resultado,
      });
    } catch (error: any) {
      console.error('ERROR EN actualizarContrato CONTROLLER:', error);
      if (error.message?.startsWith('Error de Validación:')) {
        return respuesta.status(400).send({
          success: false,
          message: error.message,
        });
      }

      solicitud.log?.error?.(
        { error: error.message, procedimiento: 'sp_actualizar_contrato' },
        'Error en ejecución de procedimiento'
      );
      return respuesta.status(500).send({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  }

  /**
   * Endpoint de Webhook de Pagos
   */
  async manejarWebhookPagos(solicitud: FastifyRequest, respuesta: FastifyReply) {
    solicitud.log?.info?.({ event: (solicitud.body as any)?.event }, 'Webhook de pago recibido');

    try {
      const datos = solicitud.body;
      const entrada = await transformAndValidate(WebhookPagosEntradaDto, datos);
      const resultado = await this.servicio.procesarPagoWebhook(entrada);

      return respuesta.status(200).send({
        success: true,
        message: 'Evento de pago procesado correctamente',
        data: resultado,
      });
    } catch (error: any) {
      console.error('ERROR EN webhookPagos CONTROLLER:', error);
      if (error.message?.startsWith('Error de Validación:')) {
        return respuesta.status(400).send({
          success: false,
          message: error.message,
        });
      }

      solicitud.log?.error?.({ error: error.message }, 'Error al procesar webhook de pago');
      return respuesta.status(500).send({
        success: false,
        message: 'Error interno al procesar el pago',
      });
    }
  }

  /**
   * Endpoint para disparar el Cron Job de Expiraciones manualmente
   */
  async manejarCronExpiracion(solicitud: FastifyRequest, respuesta: FastifyReply) {
    solicitud.log?.info?.('Disparo manual de Cron de Expiraciones de contratos');

    try {
      const resultado = await this.servicio.ejecutarProcesoExpiracion();

      return respuesta.status(200).send({
        success: true,
        message: 'Cron de expiración de contratos ejecutado correctamente',
        data: resultado,
      });
    } catch (error: any) {
      console.error('ERROR EN cronExpiracion CONTROLLER:', error);
      solicitud.log?.error?.({ error: error.message }, 'Error en ejecución de cron de expiración');
      return respuesta.status(500).send({
        success: false,
        message: 'Error interno al ejecutar el cron de expiración',
      });
    }
  }
}
