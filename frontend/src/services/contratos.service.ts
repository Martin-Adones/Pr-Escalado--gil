import { apiGet, apiPost } from './api'
import type { FilaContrato, FilaContratoListado } from './interfaces'
import type { FilaAuditLog } from './interfaces'

export interface ListarContratosParams {
  id_contracts?: string
  id_users?: string
  id_plans?: string
  status?: string
  page_size?: number
  page_number?: number
}

export async function listarContratos(params?: ListarContratosParams): Promise<FilaContratoListado[]> {
  return apiGet<FilaContratoListado[]>('/contratos/listar', params as Record<string, string | number | boolean | undefined | null>)
}

export async function crearContrato(data: {
  id_users: string
  id_plans: string
  status: string
  start_date?: string
  end_date?: string
}): Promise<FilaContrato[]> {
  return apiPost<FilaContrato[]>('/contratos/crear', data)
}

export async function actualizarContrato(data: {
  id_contracts: string
  id_users?: string
  id_plans?: string
  status?: string
  start_date?: string
  end_date?: string
}): Promise<FilaContrato[]> {
  return apiPost<FilaContrato[]>('/contratos/actualizar', data)
}

export async function finalizarContrato(id_contracts: string): Promise<FilaContrato[]> {
  return apiPost<FilaContrato[]>('/contratos/finalizar', { id_contracts })
}

// Cambio de plan: wrapper para actualizar el plan de un contrato.
export async function cambiarPlanContrato(id_contracts: string, idNuevoPlan: string): Promise<FilaContrato[]> {
  return apiPost<FilaContrato[]>('/contratos/actualizar', { id_contracts, id_plans: idNuevoPlan })
}

// Helper para construir un registro de auditoría local si quieres simular la respuesta
export function crearAuditCambioPlanLocal(id_audit_logs: string, id_contracts: string, nuevoPlanId: string): FilaAuditLog {
  return {
    id_audit_logs,
    id_contracts,
    action: 'CAMBIO_PLAN',
    assignet_to: nuevoPlanId,
    created_at: new Date().toISOString(),
  }
}
