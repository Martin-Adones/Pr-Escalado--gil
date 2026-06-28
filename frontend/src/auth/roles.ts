import type Keycloak from "keycloak-js";

export type UserRole = "admin" | "client";

const CLIENT_ID = (import.meta.env.VITE_KEYCLOAK_CLIENT_ID ?? "p10") as string;

export function resolveRole(keycloak: Keycloak): UserRole | null {
  const clientRoles = keycloak.resourceAccess?.[CLIENT_ID]?.roles ?? [];
  console.log("authenticated:", keycloak.authenticated);
  console.log("CLIENT_ID:", CLIENT_ID);
  console.log(
    "resourceAccess:",
    JSON.stringify(keycloak.resourceAccess, null, 2),
  );
  console.log("preferred_username:", keycloak.tokenParsed?.preferred_username);
  if (clientRoles.includes("p10-admin")) return "admin";
  if (clientRoles.includes("p10-client")) return "client";
  return null;
}
