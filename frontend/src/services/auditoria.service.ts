import { apiGet } from './api'
import type { FilaAuditLog } from './interfaces'

export interface ListarAuditoriaParams {
  id_audit_logs?: string
  id_contracts?: string
  action?: string
  assigned_to?: string
  created_at_from?: string
  created_at_to?: string
  page_size?: number
  page_number?: number
}

export async function listarAuditoria(params?: ListarAuditoriaParams): Promise<FilaAuditLog[]> {
  return apiGet<FilaAuditLog[]>('/auditoria/listar', params as Record<string, string | number | boolean | undefined | null>)
}
