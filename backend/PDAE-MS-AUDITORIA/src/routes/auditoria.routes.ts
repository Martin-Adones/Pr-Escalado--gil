import { FastifyInstance } from 'fastify';
import { AuditoriaController } from '../controllers/auditoria.controller';
import { esquemaGetListarLogsAuditoria } from '../utils/api-doc/auditoria-route-schemas';

export default async function rutasAuditoria(fastify: FastifyInstance) {
  const controlador = new AuditoriaController();

  fastify.get(
    '/auditoria/listar',
    { schema: esquemaGetListarLogsAuditoria },
    controlador.manejarListarLogsAuditoria.bind(controlador),
  );
}
