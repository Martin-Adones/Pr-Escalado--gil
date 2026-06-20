import { createContext, useContext } from "react";
import type Keycloak from "keycloak-js";

export const AuthContext = createContext<Keycloak | null>(null);

export function useAuth(): Keycloak {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
