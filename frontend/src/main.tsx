import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import "./index.css";
import { AuthProvider } from "./auth/AuthProvider.tsx";
import keycloak from "./auth/keycloak.ts";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider keycloak={keycloak}>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
