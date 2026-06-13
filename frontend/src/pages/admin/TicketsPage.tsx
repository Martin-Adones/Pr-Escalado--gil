import { useEffect, useState, useMemo } from 'react'
import PortalTemplate from '../../portal/PortalTemplate'
import { listarTickets } from '../../services/tickets.service'
import { listarContratos } from '../../services/contratos.service'
import { listarPlanes } from '../../services/planes.service'
import type { FilaTicketListado, FilaContratoListado, FilaPlanListado } from '../../services/interfaces'

type AdminTicketsPageProps = {
  navItems: { label: string; iconClass: string; onClick?: () => void }[]
  activeNavLabel: string
}

const CLIENT_NAMES: Record<string, string> = {
  '1': 'Inmobiliaria Los Andes SpA',
  '2': 'TechSolutions International',
  '3': 'Global Services Ltd',
  '4': 'Constructora del Norte',
  '5': 'Agrícola del Valle Ltda',
  '6': 'Transportes Rápido SpA',
  '7': 'Servicios Globales S.A.',
  '8': 'Importadora del Sur',
  '9': 'Comercializadora Andes',
  '10': 'Constructora Maule',
}

function getClientName(userId: string | undefined): string {
  if (!userId) return 'Cliente Desconocido'
  return CLIENT_NAMES[userId] || `Usuario #${userId}`
}

const PLAN_PRIORITY: Record<string, 'Alta' | 'Media' | 'Baja'> = {
  'Básico': 'Baja',
  'Profesional': 'Media',
  'Enterprise': 'Alta',
  'Pyme': 'Media',
  'Corporativo': 'Alta',
}

function getStatusBadgeClasses(status: string) {
  switch (status) {
    case 'open':
      return 'bg-orange-100 text-orange-800 border border-orange-200'
    case 'in_progress':
      return 'bg-blue-100 text-blue-800 border border-blue-200'
    case 'resolved':
      return 'bg-green-100 text-green-800 border border-green-200'
    case 'closed':
      return 'bg-gray-100 text-gray-600 border border-gray-200'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'open':
      return 'Abierto'
    case 'in_progress':
      return 'En Proceso'
    case 'resolved':
      return 'Resuelto'
    case 'closed':
      return 'Cerrado'
    default:
      return status
  }
}

function getPriorityBadgeClasses(priority: 'Alta' | 'Media' | 'Baja') {
  switch (priority) {
    case 'Alta':
      return 'bg-red-100 text-red-800 border border-red-200'
    case 'Media':
      return 'bg-yellow-100 text-yellow-800 border border-yellow-200'
    case 'Baja':
      return 'bg-green-100 text-green-800 border border-green-200'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export default function TicketsPage({ navItems, activeNavLabel }: AdminTicketsPageProps) {
  const [tickets, setTickets] = useState<FilaTicketListado[]>([])
  const [contracts, setContracts] = useState<FilaContratoListado[]>([])
  const [planes, setPlanes] = useState<FilaPlanListado[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Modals
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)

  // Selected ticket for modal details
  const [selectedTicket, setSelectedTicket] = useState<(FilaTicketListado & { clientName: string; planName: string; priority: 'Alta' | 'Media' | 'Baja' }) | null>(null)

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const ticketsData = await listarTickets({ page_size: 100 })
      const contractsData = await listarContratos({ page_size: 100 })
      const planesData = await listarPlanes({ page_size: 100 })

      setTickets(ticketsData)
      setContracts(contractsData)
      setPlanes(planesData)
    } catch (err: any) {
      setError(err.message || 'Error al conectar con el servidor')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isViewModalOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
  }, [isViewModalOpen])

  const contractLookup = useMemo(() => {
    const map: Record<string, FilaContratoListado> = {}
    contracts.forEach(c => {
      map[c.id_contracts] = c
    })
    return map
  }, [contracts])

  const planLookup = useMemo(() => {
    const map: Record<string, FilaPlanListado> = {}
    planes.forEach(p => {
      map[p.id_plans] = p
    })
    return map
  }, [planes])

  const resolvedTickets = useMemo(() => {
    return tickets.map(ticket => {
      const contract = contractLookup[ticket.id_contracts]
      const planId = contract?.id_plans
      const plan = planId ? planLookup[planId] : null
      const planName = plan?.name || 'Desconocido'
      const clientName = contract ? getClientName(contract.id_users) : 'Sin Cliente'
      const priority = PLAN_PRIORITY[planName] || 'Media'

      return {
        ...ticket,
        clientName,
        planName,
        priority
      }
    })
  }, [tickets, contractLookup, planLookup])

  const filteredTickets = useMemo(() => {
    return resolvedTickets.filter(t => {
      const matchesStatus = filterStatus ? t.status === filterStatus : true
      const matchesSearch = searchQuery
        ? t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.id_support.toString().includes(searchQuery) ||
          t.id_contracts.toString().includes(searchQuery) ||
          t.clientName.toLowerCase().includes(searchQuery.toLowerCase())
        : true
      return matchesStatus && matchesSearch
    })
  }, [resolvedTickets, filterStatus, searchQuery])

  // Stat calculations
  const totalCount = tickets.length
  const pendingCount = tickets.filter(t => t.status === 'open').length
  const inProgressCount = tickets.filter(t => t.status === 'in_progress').length
  const resolvedCount = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length

  const priorityCounts = useMemo(() => {
    const counts = { Alta: 0, Media: 0, Baja: 0 }
    resolvedTickets.forEach(t => {
      counts[t.priority] = (counts[t.priority] || 0) + 1
    })
    return counts
  }, [resolvedTickets])

  const handleOpenView = (ticket: typeof resolvedTickets[number]) => {
    setSelectedTicket(ticket)
    setIsViewModalOpen(true)
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('es-CL', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateString
    }
  }

  return (
    <PortalTemplate
      sidebarTitle="Admin"
      sidebarSubtitle="Panel administrativo"
      contentZoom={0.75}
      navItems={navItems}
      activeNavLabel={activeNavLabel}
      userInitial="A"
      userName="Administrador"
      userRole="Admin"
      headerTitle="Gestión de Tickets"
      headerSubtitle="Visualización y gestión de tickets de soporte."
      headerRightLabel="Perfil"
      headerRightValue="Admin"
    >
      <div className="p-8">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-blue-500">
            <p className="text-xs text-gray-500 uppercase font-bold mb-1 tracking-tight">Tickets Totales</p>
            <p className="text-2xl font-bold text-blue-600">{loading ? '...' : totalCount}</p>
            <p className="text-[11px] text-blue-500 mt-1 font-bold">
              <i className="fa-solid fa-ticket mr-1"></i> Registrados en sistema
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <p className="text-xs text-gray-500 uppercase font-bold mb-1 tracking-tight">Abiertos</p>
            <p className="text-2xl font-bold text-orange-600">{loading ? '...' : pendingCount}</p>
            <p className="text-[11px] text-gray-400 mt-1">Esperando respuesta</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <p className="text-xs text-gray-500 uppercase font-bold mb-1 tracking-tight">En Proceso</p>
            <p className="text-2xl font-bold text-[#353535]">{loading ? '...' : inProgressCount}</p>
            <p className="text-[11px] text-gray-400 mt-1">Siendo atendidos</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <p className="text-xs text-gray-500 uppercase font-bold mb-1 tracking-tight">Resueltos / Cerrados</p>
            <p className="text-2xl font-bold text-green-600">{loading ? '...' : resolvedCount}</p>
            <p className="text-[11px] text-gray-400 mt-1">Atendidos exitosamente</p>
          </div>
        </div>

        {/* CRM metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-purple-800">CRM - Tickets por Prioridad</h4>
              <i className="fa-solid fa-chart-pie text-purple-600"></i>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-purple-700">Alta (Enterprise/Corp)</span>
                <span className="font-bold text-purple-900">{loading ? '...' : priorityCounts.Alta}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-purple-700">Media (Profesional/Pyme)</span>
                <span className="font-bold text-purple-900">{loading ? '...' : priorityCounts.Media}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-purple-700">Baja (Básico)</span>
                <span className="font-bold text-purple-900">{loading ? '...' : priorityCounts.Baja}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-blue-800">Tiempo de Respuesta</h4>
              <i className="fa-solid fa-clock text-blue-600"></i>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-blue-700">Promedio histórico</span>
                <span className="font-bold text-blue-900">2.5 hrs</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-blue-700">Métrica actual</span>
                <span className="font-bold text-green-600">1.8 hrs</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-blue-700">Meta interna</span>
                <span className="font-bold text-blue-900">2.0 hrs</span>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-green-800">Satisfacción del Cliente</h4>
              <i className="fa-solid fa-smile text-green-600"></i>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-green-700">Excelente</span>
                <span className="font-bold text-green-900">68%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-green-700">Bueno</span>
                <span className="font-bold text-green-900">24%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-green-700">Regular</span>
                <span className="font-bold text-green-900">8%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main List and Table */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h3 className="font-bold text-[#353535]">Todos los Tickets</h3>
            <div className="flex flex-wrap gap-4 w-full md:w-auto">
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-4 py-2 bg-white text-gray-900 focus:outline-[#3C6E71] focus:ring-1 focus:ring-[#3C6E71]"
              >
                <option value="">Todos los estados</option>
                <option value="open">Abiertos / Pendientes</option>
                <option value="in_progress">En Proceso</option>
                <option value="resolved">Resueltos</option>
                <option value="closed">Cerrados</option>
              </select>
              <input 
                type="text" 
                placeholder="Buscar ticket..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-4 py-2 w-64 bg-white text-gray-900 focus:outline-[#3C6E71] focus:ring-1 focus:ring-[#3C6E71]" 
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <i className="fa-solid fa-circle-exclamation text-lg"></i>
                <span className="text-sm font-semibold">{error}</span>
              </div>
              <button 
                onClick={loadData}
                className="text-xs bg-red-100 text-red-800 hover:bg-red-200 font-bold px-3 py-1.5 rounded transition"
              >
                Reintentar
              </button>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-xs text-gray-600 uppercase border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4">ID Support</th>
                  <th className="px-6 py-4">Contrato</th>
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4">Descripción del problema</th>
                  <th className="px-6 py-4 text-center">Prioridad</th>
                  <th className="px-6 py-4 text-center">Estado</th>
                  <th className="px-6 py-4">Creado el</th>
                  <th className="px-6 py-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-[#353535]">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex items-center justify-center gap-3">
                        <i className="fa-solid fa-spinner animate-spin text-lg text-[#3C6E71]"></i>
                        <span>Cargando tickets de soporte...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      No se encontraron tickets de soporte que coincidan con la búsqueda.
                    </td>
                  </tr>
                ) : (
                  filteredTickets.map(ticket => (
                    <tr key={ticket.id_support} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-mono text-xs text-gray-600 font-bold">#TK-{ticket.id_support}</td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-600">CT-{ticket.id_contracts}</td>
                      <td className="px-6 py-4 font-semibold">{ticket.clientName}</td>
                      <td className="px-6 py-4 max-w-xs truncate">{ticket.description}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getPriorityBadgeClasses(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${getStatusBadgeClasses(ticket.status)}`}>
                          {getStatusLabel(ticket.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-600">{formatDate(ticket.created_at)}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button 
                            onClick={() => handleOpenView(ticket)}
                            title="Ver detalles"
                            className="text-blue-600 hover:text-blue-800 p-1.5 bg-blue-50 rounded transition-colors"
                          >
                            <i className="fa-solid fa-eye text-xs"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL: Ver Detalles del Ticket */}
      {isViewModalOpen && selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 transition-opacity">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-down">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-bold text-[#353535]">Ticket de Soporte #TK-{selectedTicket.id_support}</h2>
              <button 
                onClick={() => { setIsViewModalOpen(false); setSelectedTicket(null); }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <i className="fa-solid fa-times text-xl"></i>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-xs text-gray-400 font-bold uppercase">Estado</span>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold mt-1 ${getStatusBadgeClasses(selectedTicket.status)}`}>
                    {getStatusLabel(selectedTicket.status)}
                  </span>
                </div>
                <div>
                  <span className="block text-xs text-gray-400 font-bold uppercase">Prioridad Plan</span>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold mt-1 ${getPriorityBadgeClasses(selectedTicket.priority)}`}>
                    {selectedTicket.priority}
                  </span>
                </div>
              </div>

              <div>
                <span className="block text-xs text-gray-400 font-bold uppercase">Cliente</span>
                <span className="text-sm font-bold text-gray-900">{selectedTicket.clientName}</span>
              </div>

              <div>
                <span className="block text-xs text-gray-400 font-bold uppercase">Contrato / Plan</span>
                <span className="text-sm text-gray-800 font-medium">CT-{selectedTicket.id_contracts} — Plan {selectedTicket.planName}</span>
              </div>

              <div>
                <span className="block text-xs text-gray-400 font-bold uppercase">Creado el</span>
                <span className="text-sm text-gray-800">{formatDate(selectedTicket.created_at)}</span>
              </div>

              {selectedTicket.updated_at && selectedTicket.updated_at !== selectedTicket.created_at && (
                <div>
                  <span className="block text-xs text-gray-400 font-bold uppercase">Última actualización</span>
                  <span className="text-sm text-gray-800">{formatDate(selectedTicket.updated_at)}</span>
                </div>
              )}

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <span className="block text-xs text-gray-400 font-bold uppercase mb-2">Descripción del problema</span>
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed font-medium">
                  {selectedTicket.description}
                </p>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button 
                  type="button"
                  onClick={() => { setIsViewModalOpen(false); setSelectedTicket(null); }}
                  className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-bold transition"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PortalTemplate>
  )
}
