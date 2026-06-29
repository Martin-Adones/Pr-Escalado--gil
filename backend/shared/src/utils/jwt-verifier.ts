import { createRemoteJWKSet, jwtVerify, decodeJwt, type JWTPayload } from "jose";

/**
 * Verificación de JWTs emitidos por Keycloak (realm sistema-centralizado).
 * Usa JWKS remoto (las llaves públicas de firma del realm) — no requiere
 * guardar ningún secreto en el microservicio, Keycloak las expone públicamente.
 *
 * Variables de entorno requeridas:
 *   KEYCLOAK_URL   ej. https://underarm-those-stardust.ngrok-free.dev
 *   KEYCLOAK_REALM ej. sistema-centralizado
 */

export interface KeycloakTokenPayload extends JWTPayload {
  sub: string;
  preferred_username?: string;
  email?: string;
  resource_access?: Record<string, { roles: string[] }>;
}

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJwks() {
  if (!jwks) {
    const keycloakUrl = process.env.KEYCLOAK_URL;
    const realm = process.env.KEYCLOAK_REALM;
    if (!keycloakUrl || !realm) {
      throw new Error(
        "KEYCLOAK_URL y KEYCLOAK_REALM son obligatorias para verificar JWTs",
      );
    }
    const jwksUrl = new URL(
      `${keycloakUrl}/realms/${realm}/protocol/openid-connect/certs`,
    );
    jwks = createRemoteJWKSet(jwksUrl);
  }
  return jwks;
}

/**
 * Verifica la firma y expiración de un JWT de Keycloak.
 * Lanza si el token es inválido, está expirado, o la firma no corresponde.
 */
export async function verificarTokenKeycloak(
  token: string,
): Promise<KeycloakTokenPayload> {
  const keycloakUrl = process.env.KEYCLOAK_URL;
  const realm = process.env.KEYCLOAK_REALM;
  const { payload } = await jwtVerify(token, getJwks(), {
    issuer: `${keycloakUrl}/realms/${realm}`,
  });
  return payload as KeycloakTokenPayload;
}

/**
 * Decodifica un JWT de Keycloak SIN verificar la firma.
 * Útil cuando el JWKS remoto no es alcanzable (ngrok, URL cambiante) y
 * el token ya proviene de un cliente autenticado.
 * SOLO usar en endpoints que no requieran garantía criptográfica adicional.
 * Lanza si el token está malformado o expirado.
 */
export function extraerSubDeJwt(token: string): string {
  let payload: Record<string, unknown>;
  try {
    payload = decodeJwt(token) as Record<string, unknown>;
  } catch {
    throw new Error("JWT malformado");
  }
  const sub = payload.sub as string | undefined;
  if (!sub) throw new Error("JWT sin campo sub");

  // Verificar expiración manualmente
  const exp = payload.exp as number | undefined;
  if (exp && Date.now() / 1000 > exp) {
    throw new Error("JWT expirado");
  }
  return sub;
}

/** Extrae el JWT del header Authorization: Bearer <token>. */
export function extraerBearerToken(
  authorizationHeader: string | undefined,
): string | null {
  if (!authorizationHeader) return null;
  const [scheme, token] = authorizationHeader.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  return token;
}
