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
    const datos = solicitud.method === 'GET' ? solicitud.query : solicitud.body;
    const entrada = await transformAndValidate(ListarLogsAuditoriaConsultaDto, datos);
    const resultado = await this.servicio.listarLogsAuditoria(entrada);
    return respuesta.status(200).send({ success: true, data: resultado });
  }
}
