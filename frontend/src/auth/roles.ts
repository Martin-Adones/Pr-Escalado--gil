import type Keycloak from "keycloak-js";

export type UserRole = "admin" | "client";

const CLIENT_ID = import.meta.env.VITE_KEYCLOAK_CLIENT_ID as string;

export function resolveRole(keycloak: Keycloak): UserRole | null {
  const clientRoles = keycloak.resourceAccess?.[CLIENT_ID]?.roles ?? [];
  if (clientRoles.includes("p10-admin")) return "admin";
  if (clientRoles.includes("p10-client")) return "client";
  return null;
}
