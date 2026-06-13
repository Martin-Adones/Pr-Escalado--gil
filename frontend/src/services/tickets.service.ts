import { apiGet, apiPost } from './api'
import type { FilaTicket, FilaTicketListado } from './interfaces'

export interface ListarTicketsParams {
  id_support?: string
  id_contracts?: string
  id_users?: string
  status?: string
  page_size?: number
  page_number?: number
}

export async function listarTickets(params?: ListarTicketsParams): Promise<FilaTicketListado[]> {
  return apiGet<FilaTicketListado[]>('/soporte/listar', params as Record<string, string | number | boolean | undefined | null>)
}

export async function crearTicket(data: {
  id_contracts: string
  description: string
  status?: string
}): Promise<FilaTicket[]> {
  return apiPost<FilaTicket[]>('/soporte/crear', data)
}

export async function actualizarTicket(data: {
  id_support: string
  id_contracts?: string
  description?: string
  status?: string
}): Promise<FilaTicket[]> {
  return apiPost<FilaTicket[]>('/soporte/actualizar', data)
}
