import { BaseRepository } from './base-repository';
import {
  ListarLogsAuditoriaConsultaDto,
  FilaLogAuditoriaListado,
} from '../models/auditoria.dtos';

export class AuditoriaRepository extends BaseRepository {
  async ejecutarListarLogsAuditoria(dto: ListarLogsAuditoriaConsultaDto): Promise<FilaLogAuditoriaListado[]> {
    const params = [
      dto.id_audit_logs ?? null,
      dto.id_contracts ?? null,
      dto.action ?? null,
      dto.assigned_to ?? null,
      dto.created_at_from ?? null,
      dto.created_at_to ?? null,
      dto.page_size,
      dto.page_number,
    ];
    return await this.callProcedure<FilaLogAuditoriaListado>('sp_listar_logs_auditoria', params, undefined);
  }
}
