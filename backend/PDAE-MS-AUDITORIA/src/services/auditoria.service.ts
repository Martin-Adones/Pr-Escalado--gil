import { AuditoriaRepository } from '../repositories/auditoria.repository';
import {
  ListarLogsAuditoriaConsultaDto,
  FilaLogAuditoriaListado,
} from '../models/auditoria.dtos';

export class AuditoriaService {
  private repositorio: AuditoriaRepository;

  constructor() {
    this.repositorio = new AuditoriaRepository();
  }

  async listarLogsAuditoria(dto: ListarLogsAuditoriaConsultaDto): Promise<FilaLogAuditoriaListado[]> {
    return await this.repositorio.ejecutarListarLogsAuditoria(dto);
  }
}
