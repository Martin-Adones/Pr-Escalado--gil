import type Keycloak from "keycloak-js";

export type UserRole = "admin" | "client";

export function resolveRole(keycloak: Keycloak): UserRole | null {
  // Temporarily bypassed for previewing UI without Keycloak redirect
  console.log("Keycloak bypassed", !!keycloak);
  return "client";
}
