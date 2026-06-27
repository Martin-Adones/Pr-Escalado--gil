import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import "./index.css";
import { AuthProvider } from "./auth/AuthProvider.tsx";
import keycloak from "./auth/keycloak.ts";
import { setAppUser } from "./auth/appUser.ts";
import { obtenerUsuarioActual } from "./services/usuarios.service.ts";

keycloak
  .init({ onLoad: "login-required", pkceMethod: "S256", checkLoginIframe: false })
  .then(async (authenticated) => {
    if (!authenticated) return;

    try {
      await keycloak.updateToken(-1);
    } catch {
      keycloak.login();
      return;
    }

    obtenerUsuarioActual()
      .then((usuario) => setAppUser(usuario))
      .catch((err) => {
        // Autenticado en Keycloak pero sin fila vinculada en Users (sin
        // keycloak_id asignado todavía). No bloqueamos el render por esto;
        // las páginas que necesiten appUserId van a recibir '' por ahora.
        console.error("No se pudo resolver el usuario de la app:", err);
      })
      .finally(() => {
        createRoot(document.getElementById("root")!).render(
          <StrictMode>
            <BrowserRouter>
              <AuthProvider keycloak={keycloak}>
                <App />
              </AuthProvider>
            </BrowserRouter>
          </StrictMode>,
        );
      });
  });
