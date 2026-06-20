import type { ReactNode } from "react";
import type Keycloak from "keycloak-js";
import { AuthContext } from "./useAuth";

export function AuthProvider({
  keycloak,
  children,
}: {
  keycloak: Keycloak;
  children: ReactNode;
}) {
  return (
    <AuthContext.Provider value={keycloak}>{children}</AuthContext.Provider>
  );
}
