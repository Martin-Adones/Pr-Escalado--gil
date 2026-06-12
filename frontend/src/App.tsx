import { useEffect, useState, useCallback, useMemo } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import AdminDashboard from './pages/admin/DashboardPage'
import ContratosPage from './pages/admin/ContratosPage'
import CiclosDeCobroPage from './pages/admin/CiclosDeCobroPage'
import ClientesPage from './pages/admin/ClientesPage'
import ConfiguracionPage from './pages/admin/ConfiguracionPage'
import Contracts from './pages/client/ContractsPage'
import ClientDashboard from './pages/client/DashboardPage'
import History from './pages/client/HistoryPage'
import Plans from './pages/client/PlansPage'
import Tickets from './pages/client/TicketsPage'
import RoleSelectionPage, { type UserRole } from './portal/RoleSelectionPage'

type PageProps = {
  navItems: { label: string; iconClass: string; onClick?: () => void }[]
  activeNavLabel: string
  userId: string | null
}

const adminPathToLabel: Record<string, string> = {
  '/admin': 'Inicio',
  '/admin/contratos': 'Contratos',
  '/admin/ciclos-de-cobro': 'Ciclos de Cobro',
  '/admin/clientes': 'Clientes',
  '/admin/configuracion': 'Configuración',
}

const clientPathToLabel: Record<string, string> = {
  '/client': 'Inicio',
  '/client/contratos': 'Mis Contratos',
  '/client/historial': 'Historial',
  '/client/planes': 'Planes',
  '/client/tickets': 'Tickets',
}

function AdminLayout({ onLogout }: { onLogout: () => void }) {
  const navigate = useNavigate()
  const location = useLocation()
  const activeNavLabel = adminPathToLabel[location.pathname] || 'Inicio'

  const handleLogout = useCallback(() => {
    onLogout()
    navigate('/')
  }, [navigate, onLogout])

  const navItems = useMemo(
    () => [
      { label: 'Inicio', iconClass: 'fa-solid fa-house', onClick: () => navigate('/admin') },
      { label: 'Contratos', iconClass: 'fa-solid fa-file-contract', onClick: () => navigate('/admin/contratos') },
      { label: 'Ciclos de Cobro', iconClass: 'fa-solid fa-rotate', onClick: () => navigate('/admin/ciclos-de-cobro') },
      { label: 'Clientes', iconClass: 'fa-solid fa-users', onClick: () => navigate('/admin/clientes') },
      { label: 'Configuración', iconClass: 'fa-solid fa-gear', onClick: () => navigate('/admin/configuracion') },
      { label: 'Cambiar perfil', iconClass: 'fa-solid fa-right-left', onClick: handleLogout },
    ],
    [navigate, handleLogout],
  )

  return (
    <Routes>
      <Route index element={<AdminDashboard navItems={navItems} activeNavLabel={activeNavLabel} />} />
      <Route path="contratos" element={<ContratosPage navItems={navItems} activeNavLabel={activeNavLabel} />} />
      <Route path="ciclos-de-cobro" element={<CiclosDeCobroPage navItems={navItems} activeNavLabel={activeNavLabel} />} />
      <Route path="clientes" element={<ClientesPage navItems={navItems} activeNavLabel={activeNavLabel} />} />
      <Route path="configuracion" element={<ConfiguracionPage navItems={navItems} activeNavLabel={activeNavLabel} />} />
    </Routes>
  )
}

function ClientLayout({ userId, onLogout }: { userId: string; onLogout: () => void }) {
  const navigate = useNavigate()
  const location = useLocation()
  const activeNavLabel = clientPathToLabel[location.pathname] || 'Inicio'

  const handleLogout = useCallback(() => {
    onLogout()
    navigate('/')
  }, [navigate, onLogout])

  const navItems = useMemo(
    () => [
      { label: 'Inicio', iconClass: 'fa-solid fa-house', onClick: () => navigate('/client') },
      { label: 'Mis Contratos', iconClass: 'fa-solid fa-file-invoice-dollar', onClick: () => navigate('/client/contratos') },
      { label: 'Historial', iconClass: 'fa-solid fa-clock-rotate-left', onClick: () => navigate('/client/historial') },
      { label: 'Planes', iconClass: 'fa-solid fa-box-open', onClick: () => navigate('/client/planes') },
      { label: 'Tickets', iconClass: 'fa-solid fa-ticket', onClick: () => navigate('/client/tickets') },
      { label: 'Cambiar perfil', iconClass: 'fa-solid fa-right-left', onClick: handleLogout },
    ],
    [navigate, handleLogout],
  )

  const pageProps: PageProps = { navItems, activeNavLabel, userId }

  return (
    <Routes>
      <Route index element={<ClientDashboard {...pageProps} />} />
      <Route path="contratos" element={<Contracts {...pageProps} />} />
      <Route path="historial" element={<History {...pageProps} />} />
      <Route path="planes" element={<Plans {...pageProps} />} />
      <Route path="tickets" element={<Tickets {...pageProps} />} />
    </Routes>
  )
}

export default function App() {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(() => {
    const saved = localStorage.getItem('selectedRole')
    return saved ? (saved as UserRole) : null
  })
  const [selectedUserId, setSelectedUserId] = useState<string | null>(() => {
    const saved = localStorage.getItem('selectedUserId')
    return saved || '1'
  })

  useEffect(() => {
    if (selectedRole) {
      localStorage.setItem('selectedRole', selectedRole)
    } else {
      localStorage.removeItem('selectedRole')
    }
  }, [selectedRole])

  useEffect(() => {
    if (selectedUserId) {
      localStorage.setItem('selectedUserId', selectedUserId)
    } else {
      localStorage.removeItem('selectedUserId')
    }
  }, [selectedUserId])

  useEffect(() => {
    if (selectedRole) {
      const payload = { id_users: selectedUserId, type: selectedRole }
      const token = btoa(JSON.stringify(payload))
      localStorage.setItem('sessionToken', token)
    } else {
      localStorage.removeItem('sessionToken')
    }
  }, [selectedRole, selectedUserId])

  const handleSelectRole = useCallback((role: UserRole) => {
    setSelectedRole(role)
    if (role === 'admin') {
      setSelectedUserId(null)
    }
  }, [])

  const handleSelectUserId = useCallback((userId: string) => {
    setSelectedUserId(userId)
  }, [])

  const handleLogout = useCallback(() => {
    setSelectedRole(null)
    setSelectedUserId(null)
  }, [])

  if (!selectedRole) {
    return (
      <Routes>
        <Route path="*" element={
          <RoleSelectionPage
            onSelectRole={handleSelectRole}
            onSelectUserId={handleSelectUserId}
          />
        } />
      </Routes>
    )
  }

  if (selectedRole === 'admin') {
    return (
      <Routes>
        <Route path="/" element={<Navigate to="/admin" replace />} />
        <Route path="/admin/*" element={<AdminLayout onLogout={handleLogout} />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    )
  }

  if (!selectedUserId) {
    return (
      <Routes>
        <Route path="*" element={
          <RoleSelectionPage
            onSelectRole={handleSelectRole}
            onSelectUserId={handleSelectUserId}
          />
        } />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/client" replace />} />
      <Route path="/client/*" element={<ClientLayout userId={selectedUserId} onLogout={handleLogout} />} />
      <Route path="*" element={<Navigate to="/client" replace />} />
    </Routes>
  )
}
