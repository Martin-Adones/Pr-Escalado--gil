import type { FilaUsuario } from "../services/interfaces";

/**
 * Usuario de la app (id_users numérico de PostgreSQL), resuelto una vez
 * desde /api/usuarios/me después del login. Vive fuera de React, igual
 * que el singleton de keycloak — se lee de forma síncrona una vez resuelto.
 */
let appUser: FilaUsuario | null = null;

export function setAppUser(usuario: FilaUsuario | null) {
  appUser = usuario;
}

export function getAppUser(): FilaUsuario | null {
  return appUser;
}
