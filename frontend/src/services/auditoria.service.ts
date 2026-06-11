import { apiGet } from './api'
import type { FilaAuditLog } from './interfaces'

export interface ListarAuditoriaParams {
  id_contracts?: string
  action?: string
}

export async function listarAuditoria(params?: ListarAuditoriaParams): Promise<FilaAuditLog[]> {
  return apiGet<FilaAuditLog[]>('/auditoria/listar', params as Record<string, string | number | boolean | undefined | null>)
}
