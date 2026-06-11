import { apiGet, apiPost } from './api'
import type { FilaPlan, FilaPlanListado } from './interfaces'

export interface ListarPlanesParams {
  id_plans?: string
  name?: string
  billing_cycle?: string
  isActive?: boolean
  page_size?: number
  page_number?: number
}

export async function listarPlanes(params?: ListarPlanesParams): Promise<FilaPlanListado[]> {
  return apiGet<FilaPlanListado[]>('/planes/listar', params as Record<string, string | number | boolean | undefined | null>)
}

export async function crearPlan(data: {
  name: string
  billing_cycle: string
  amount: number
  isActive?: boolean
}): Promise<FilaPlan[]> {
  return apiPost<FilaPlan[]>('/planes/crear', data)
}

export async function actualizarPlan(data: {
  id_plans: string
  name?: string
  billing_cycle?: string
  amount?: number
}): Promise<FilaPlan[]> {
  return apiPost<FilaPlan[]>('/planes/actualizar', data)
}

export async function desactivarPlan(id_plans: string): Promise<FilaPlan[]> {
  return apiPost<FilaPlan[]>('/planes/desactivar', { id_plans })
}
