import { useCallback, useMemo } from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import AdminDashboard from "./pages/admin/DashboardPage";
import ContratosPage from "./pages/admin/ContratosPage";
import CiclosDeCobroPage from "./pages/admin/CiclosDeCobroPage";
import ClientesPage from "./pages/admin/ClientesPage";
import ConfiguracionPage from "./pages/admin/ConfiguracionPage";
import Contracts from "./pages/client/ContractsPage";
import ClientDashboard from "./pages/client/DashboardPage";
import History from "./pages/client/HistoryPage";
import Plans from "./pages/client/PlansPage";
import Tickets from "./pages/client/TicketsPage";
import { useAuth } from "./auth/useAuth";
import { resolveRole } from "./auth/roles";

type PageProps = {
  navItems: { label: string; iconClass: string; onClick?: () => void }[];
  activeNavLabel: string;
  userId: string | null;
};

const adminPathToLabel: Record<string, string> = {
  "/admin": "Inicio",
  "/admin/contratos": "Contratos",
  "/admin/ciclos-de-cobro": "Ciclos de Cobro",
  "/admin/clientes": "Clientes",
  "/admin/configuracion": "Configuración",
};

const clientPathToLabel: Record<string, string> = {
  "/client": "Inicio",
  "/client/contratos": "Mis Contratos",
  "/client/historial": "Historial",
  "/client/planes": "Planes",
  "/client/tickets": "Tickets",
};

function AdminLayout({ onLogout }: { onLogout: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const activeNavLabel = adminPathToLabel[location.pathname] || "Inicio";

  const navItems = useMemo(
    () => [
      {
        label: "Inicio",
        iconClass: "fa-solid fa-house",
        onClick: () => navigate("/admin"),
      },
      {
        label: "Contratos",
        iconClass: "fa-solid fa-file-contract",
        onClick: () => navigate("/admin/contratos"),
      },
      {
        label: "Ciclos de Cobro",
        iconClass: "fa-solid fa-rotate",
        onClick: () => navigate("/admin/ciclos-de-cobro"),
      },
      {
        label: "Clientes",
        iconClass: "fa-solid fa-users",
        onClick: () => navigate("/admin/clientes"),
      },
      {
        label: "Configuración",
        iconClass: "fa-solid fa-gear",
        onClick: () => navigate("/admin/configuracion"),
      },
      {
        label: "Cerrar sesión",
        iconClass: "fa-solid fa-right-from-bracket",
        onClick: onLogout,
      },
    ],
    [navigate, onLogout],
  );

  return (
    <Routes>
      <Route
        index
        element={
          <AdminDashboard navItems={navItems} activeNavLabel={activeNavLabel} />
        }
      />
      <Route
        path="contratos"
        element={
          <ContratosPage navItems={navItems} activeNavLabel={activeNavLabel} />
        }
      />
      <Route
        path="ciclos-de-cobro"
        element={
          <CiclosDeCobroPage
            navItems={navItems}
            activeNavLabel={activeNavLabel}
          />
        }
      />
      <Route
        path="clientes"
        element={
          <ClientesPage navItems={navItems} activeNavLabel={activeNavLabel} />
        }
      />
      <Route
        path="configuracion"
        element={
          <ConfiguracionPage
            navItems={navItems}
            activeNavLabel={activeNavLabel}
          />
        }
      />
    </Routes>
  );
}

function ClientLayout({
  userId,
  onLogout,
}: {
  userId: string;
  onLogout: () => void;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const activeNavLabel = clientPathToLabel[location.pathname] || "Inicio";

  const navItems = useMemo(
    () => [
      {
        label: "Inicio",
        iconClass: "fa-solid fa-house",
        onClick: () => navigate("/client"),
      },
      {
        label: "Mis Contratos",
        iconClass: "fa-solid fa-file-invoice-dollar",
        onClick: () => navigate("/client/contratos"),
      },
      {
        label: "Historial",
        iconClass: "fa-solid fa-clock-rotate-left",
        onClick: () => navigate("/client/historial"),
      },
      {
        label: "Planes",
        iconClass: "fa-solid fa-box-open",
        onClick: () => navigate("/client/planes"),
      },
      {
        label: "Tickets",
        iconClass: "fa-solid fa-ticket",
        onClick: () => navigate("/client/tickets"),
      },
      {
        label: "Cerrar sesión",
        iconClass: "fa-solid fa-right-from-bracket",
        onClick: onLogout,
      },
    ],
    [navigate, onLogout],
  );

  const pageProps: PageProps = { navItems, activeNavLabel, userId };

  return (
    <Routes>
      <Route index element={<ClientDashboard {...pageProps} />} />
      <Route path="contratos" element={<Contracts {...pageProps} />} />
      <Route path="historial" element={<History {...pageProps} />} />
      <Route path="planes" element={<Plans {...pageProps} />} />
      <Route path="tickets" element={<Tickets {...pageProps} />} />
    </Routes>
  );
}

function AccesoDenegado({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="min-h-screen bg-[#D9D9D9] font-sans text-[#353535] flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
          <i className="fa-solid fa-ban text-2xl" />
        </div>
        <h1 className="text-2xl font-black text-[#284B63]">
          Acceso no autorizado
        </h1>
        <p className="mt-2 text-sm font-semibold text-gray-500">
          Tu usuario no tiene un rol asignado para esta aplicación. Contacta al
          administrador del sistema.
        </p>
        <button
          type="button"
          onClick={onLogout}
          className="mt-6 w-full rounded-xl bg-[#284B63] px-4 py-3 text-sm font-black text-white transition hover:bg-[#3C6E71]"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const keycloak = useAuth();
  const role = resolveRole(keycloak);
  const userId = keycloak.tokenParsed?.sub ?? null;

  const handleLogout = useCallback(() => {
    keycloak.logout({ redirectUri: window.location.origin });
  }, [keycloak]);

  if (!role) {
    return (
      <Routes>
        <Route path="*" element={<AccesoDenegado onLogout={handleLogout} />} />
      </Routes>
    );
  }

  if (role === "admin") {
    return (
      <Routes>
        <Route path="/" element={<Navigate to="/admin" replace />} />
        <Route
          path="/admin/*"
          element={<AdminLayout onLogout={handleLogout} />}
        />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/client" replace />} />
      <Route
        path="/client/*"
        element={<ClientLayout userId={userId ?? ""} onLogout={handleLogout} />}
      />
      <Route path="*" element={<Navigate to="/client" replace />} />
    </Routes>
  );
}
