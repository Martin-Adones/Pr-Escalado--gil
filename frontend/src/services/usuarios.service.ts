import { apiGet, apiPost } from "./api";
import type { FilaUsuario, FilaUsuarioListado } from "./interfaces";

export interface ListarUsuariosParams {
  id_users?: string;
  type?: string;
  isActive?: boolean;
  page_size?: number;
  page_number?: number;
}

export async function listarUsuarios(
  params?: ListarUsuariosParams,
): Promise<FilaUsuarioListado[]> {
  return apiGet<FilaUsuarioListado[]>(
    "/usuarios/listar",
    params as Record<string, string | number | boolean | undefined | null>,
  );
}

export async function crearUsuario(data: {
  type: string;
  isActive?: boolean;
}): Promise<FilaUsuario[]> {
  return apiPost<FilaUsuario[]>("/usuarios/crear", data);
}

export async function actualizarUsuario(data: {
  id_users: string;
  type: string;
  isActive?: boolean;
}): Promise<FilaUsuario[]> {
  return apiPost<FilaUsuario[]>("/usuarios/actualizar", data);
}

/** Resuelve el usuario de la app (id_users UUID) a partir del JWT de Keycloak. */
export async function obtenerUsuarioActual(): Promise<FilaUsuario> {
  return apiGet<FilaUsuario>("/usuarios/me");
}

/**
 * UPSERT post-login: llama a /usuarios/sincronizar con el JWT actual.
 * Si el usuario ya existe en nuestra BD lo retorna; si es nuevo lo crea con type='cliente'.
 * Siempre debe llamarse justo después de autenticarse en Keycloak.
 */
export async function sincronizarUsuario(opts?: {
  type?: string;
  isActive?: boolean;
}): Promise<FilaUsuario> {
  return apiPost<FilaUsuario>("/usuarios/sincronizar", opts ?? {});
}
