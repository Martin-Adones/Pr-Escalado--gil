import { type ReactElement, useEffect, useMemo, useState } from 'react'
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
}

const clientPages: Record<string, (props: PageProps) => ReactElement> = {
  Inicio: ClientDashboard,
  'Mis Contratos': Contracts,
  Historial: History,
  Planes: Plans,
  Tickets: Tickets,
}

const adminPages: Record<string, (props: PageProps) => ReactElement> = {
  Inicio: AdminDashboard,
  Contratos: ContratosPage,
  'Ciclos de Cobro': CiclosDeCobroPage,
  Clientes: ClientesPage,
  Configuración: ConfiguracionPage,
}

export default function App() {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(() => {
    const saved = localStorage.getItem('selectedRole')
    return saved ? (saved as UserRole) : null
  })
  const [activeClientNavLabel, setActiveClientNavLabel] = useState(() => {
    const saved = localStorage.getItem('activeClientNavLabel')
    return saved || 'Inicio'
  })
  const [activeAdminNavLabel, setActiveAdminNavLabel] = useState(() => {
    const saved = localStorage.getItem('activeAdminNavLabel')
    return saved || 'Inicio'
  })

  // Guardar estado en localStorage cuando cambie
  useEffect(() => {
    if (selectedRole) {
      localStorage.setItem('selectedRole', selectedRole)
    } else {
      localStorage.removeItem('selectedRole')
    }
  }, [selectedRole])

  useEffect(() => {
    localStorage.setItem('activeClientNavLabel', activeClientNavLabel)
  }, [activeClientNavLabel])

  useEffect(() => {
    localStorage.setItem('activeAdminNavLabel', activeAdminNavLabel)
  }, [activeAdminNavLabel])

  const clientNavItems = useMemo(
    () => [
      { label: 'Inicio', iconClass: 'fa-solid fa-house', onClick: () => setActiveClientNavLabel('Inicio') },
      {
        label: 'Mis Contratos',
        iconClass: 'fa-solid fa-file-invoice-dollar',
        onClick: () => setActiveClientNavLabel('Mis Contratos'),
      },
      {
        label: 'Historial',
        iconClass: 'fa-solid fa-clock-rotate-left',
        onClick: () => setActiveClientNavLabel('Historial'),
      },
      { label: 'Planes', iconClass: 'fa-solid fa-box-open', onClick: () => setActiveClientNavLabel('Planes') },
      { label: 'Tickets', iconClass: 'fa-solid fa-ticket', onClick: () => setActiveClientNavLabel('Tickets') },
      { label: 'Cambiar perfil', iconClass: 'fa-solid fa-right-left', onClick: () => setSelectedRole(null) },
    ],
    [],
  )

  const adminNavItems = useMemo(
    () => [
      { label: 'Inicio', iconClass: 'fa-solid fa-house', onClick: () => setActiveAdminNavLabel('Inicio') },
      { label: 'Contratos', iconClass: 'fa-solid fa-file-contract', onClick: () => setActiveAdminNavLabel('Contratos') },
      { label: 'Ciclos de Cobro', iconClass: 'fa-solid fa-rotate', onClick: () => setActiveAdminNavLabel('Ciclos de Cobro') },
      { label: 'Clientes', iconClass: 'fa-solid fa-users', onClick: () => setActiveAdminNavLabel('Clientes') },
      { label: 'Configuración', iconClass: 'fa-solid fa-gear', onClick: () => setActiveAdminNavLabel('Configuración') },
      { label: 'Cambiar perfil', iconClass: 'fa-solid fa-right-left', onClick: () => setSelectedRole(null) },
    ],
    [],
  )

  if (!selectedRole) {
    return <RoleSelectionPage onSelectRole={setSelectedRole} />
  }

  if (selectedRole === 'admin') {
    const ActiveAdminPage = adminPages[activeAdminNavLabel] ?? AdminDashboard
    return <ActiveAdminPage navItems={adminNavItems} activeNavLabel={activeAdminNavLabel} />
  }

  const ActiveClientPage = clientPages[activeClientNavLabel] ?? ClientDashboard

  return <ActiveClientPage navItems={clientNavItems} activeNavLabel={activeClientNavLabel} />
}
