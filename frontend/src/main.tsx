import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import "./index.css";
import { AuthProvider } from "./auth/AuthProvider.tsx";
import keycloak from "./auth/keycloak.ts";
import { setAppUser } from "./auth/appUser.ts";
import { sincronizarUsuario } from "./services/usuarios.service.ts";

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

    // Upsert post-login: crea el usuario si es la primera vez o lo retorna si ya existe
    sincronizarUsuario()
      .then((usuario) => setAppUser(usuario))
      .catch((err) => {
        // Si falla (ej. backend caído), loguea pero no bloquea el render
        console.error("No se pudo sincronizar el usuario de la app:", err);
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
