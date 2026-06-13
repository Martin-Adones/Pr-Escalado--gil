import { FastifyRequest, FastifyReply } from 'fastify';
import { AuditoriaService } from '../services/auditoria.service';
import { transformAndValidate } from 'shared';
import { ListarLogsAuditoriaConsultaDto } from '../models/auditoria.dtos';

export class AuditoriaController {
  private servicio: AuditoriaService;

  constructor() {
    this.servicio = new AuditoriaService();
  }

  async manejarListarLogsAuditoria(solicitud: FastifyRequest, respuesta: FastifyReply) {
    solicitud.log?.debug?.({ procedimiento: 'sp_listar_logs_auditoria' }, 'ejecutando procedimiento');

    try {
      const datos = solicitud.method === 'GET' ? solicitud.query : solicitud.body;
      const entrada = await transformAndValidate(ListarLogsAuditoriaConsultaDto, datos);
      const resultado = await this.servicio.listarLogsAuditoria(entrada);

      return respuesta.status(200).send({
        success: true,
        data: resultado,
      });
    } catch (error: any) {
      if (error.message.startsWith('Error de Validación:')) {
        return respuesta.status(400).send({
          success: false,
          message: error.message,
        });
      }

      solicitud.log?.error?.(
        { error: error.message, procedimiento: 'sp_listar_logs_auditoria' },
        'Error en ejecución de procedimiento',
      );
      return respuesta.status(500).send({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  }
}
