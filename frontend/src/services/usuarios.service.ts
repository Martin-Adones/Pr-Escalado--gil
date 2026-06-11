import { apiGet, apiPost } from './api'
import type { FilaUsuario, FilaUsuarioListado } from './interfaces'

export interface ListarUsuariosParams {
  id_users?: string
  type?: string
  isActive?: boolean
  page_size?: number
  page_number?: number
}

export async function listarUsuarios(params?: ListarUsuariosParams): Promise<FilaUsuarioListado[]> {
  return apiGet<FilaUsuarioListado[]>('/usuarios/listar', params as Record<string, string | number | boolean | undefined | null>)
}

export async function crearUsuario(data: {
  type: string
  isActive?: boolean
}): Promise<FilaUsuario[]> {
  return apiPost<FilaUsuario[]>('/usuarios/crear', data)
}

export async function actualizarUsuario(data: {
  id_users: string
  type: string
  isActive?: boolean
}): Promise<FilaUsuario[]> {
  return apiPost<FilaUsuario[]>('/usuarios/actualizar', data)
}
