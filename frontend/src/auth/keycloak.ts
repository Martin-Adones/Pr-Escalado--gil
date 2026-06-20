import Keycloak from "keycloak-js";

const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL,
  realm: import.meta.env.VITE_KEYCLOAK_REALM ?? "sistema-centralizado",
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID ?? "p10",
});

export default keycloak;
