import { useEffect, useState, useMemo } from 'react'
import PortalTemplate from '../../portal/PortalTemplate'
import { listarTickets, crearTicket, actualizarTicket } from '../../services/tickets.service'
import { listarContratos } from '../../services/contratos.service'
import { listarPlanes } from '../../services/planes.service'
import type { FilaTicketListado, FilaContratoListado, FilaPlanListado } from '../../services/interfaces'

type ClientTicketsPageProps = {
  navItems: { label: string; iconClass: string; onClick?: () => void }[]
  activeNavLabel: string
  userId: string | null
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

export default function ClientTicketsPage({ navItems, activeNavLabel, userId }: ClientTicketsPageProps) {
  const [tickets, setTickets] = useState<FilaTicketListado[]>([])
  const [contracts, setContracts] = useState<FilaContratoListado[]>([])
  const [planes, setPlanes] = useState<FilaPlanListado[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [filterStatus, setFilterStatus] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')

  const [isNewModalOpen, setIsNewModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)

  const [selectedTicket, setSelectedTicket] = useState<(FilaTicketListado & { planName: string; priority: 'Alta' | 'Media' | 'Baja' }) | null>(null)

  const loadData = async () => {
    if (!userId) return
    setLoading(true)
    setError(null)
    try {
      const ticketsData = await listarTickets({ id_users: userId, page_size: 100 })
      const contractsData = await listarContratos({ id_users: userId, page_size: 100 })
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
  }, [userId])

  useEffect(() => {
    if (isNewModalOpen || isEditModalOpen || isViewModalOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
  }, [isNewModalOpen, isEditModalOpen, isViewModalOpen])

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
      const priority = PLAN_PRIORITY[planName] || 'Media'

      return {
        ...ticket,
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
        t.id_contracts.toString().includes(searchQuery)
        : true
      return matchesStatus && matchesSearch
    })
  }, [resolvedTickets, filterStatus, searchQuery])

  // Stats specific to the user
  const totalCount = tickets.length
  const pendingCount = tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length
  const resolvedCount = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length

  const handleCreateTicket = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const id_contracts = formData.get('id_contracts') as string
    const description = formData.get('description') as string

    if (!id_contracts || !description) return

    try {
      await crearTicket({ id_contracts, description, status: 'open' })
      setIsNewModalOpen(false)
      loadData()
    } catch (err: any) {
      alert(err.message || 'Error al crear tu ticket')
    }
  }

  const handleUpdateTicket = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedTicket) return
    const formData = new FormData(e.currentTarget)
    const description = formData.get('description') as string

    try {
      await actualizarTicket({
        id_support: selectedTicket.id_support,
        description
      })
      setIsEditModalOpen(false)
      setSelectedTicket(null)
      loadData()
    } catch (err: any) {
      alert(err.message || 'Error al actualizar el ticket')
    }
  }

  const handleOpenEdit = (ticket: typeof resolvedTickets[number]) => {
    setSelectedTicket(ticket)
    setIsEditModalOpen(true)
  }

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
      sidebarTitle="Cliente"
      sidebarSubtitle="Tickets"
      contentZoom={0.75}
      navItems={navItems}
      activeNavLabel={activeNavLabel}
      userInitial={userId?.[0] || 'C'}
      userName={`Usuario #${userId || '—'}`}
      userRole="Miembro de Soporte"
      headerTitle="Mis Tickets de Soporte"
      headerSubtitle="Crea y gestiona tus solicitudes de soporte técnico."
      headerRightLabel="Tickets Totales"
      headerRightValue={loading ? '...' : String(totalCount)}
    >
      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-[#3C6E71]">
            <p className="text-xs text-gray-500 uppercase font-bold mb-1 tracking-tight">Tickets Creados</p>
            <p className="text-2xl font-bold text-[#3C6E71]">{loading ? '...' : totalCount}</p>
            <p className="text-[11px] text-[#3C6E71] mt-1 font-bold">Historial de solicitudes</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <p className="text-xs text-gray-500 uppercase font-bold mb-1 tracking-tight">En curso / Pendientes</p>
            <p className="text-2xl font-bold text-orange-600">{loading ? '...' : pendingCount}</p>
            <p className="text-[11px] text-gray-400 mt-1">Siendo revisados por el equipo</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <p className="text-xs text-gray-500 uppercase font-bold mb-1 tracking-tight">Resueltos / Cerrados</p>
            <p className="text-2xl font-bold text-green-600">{loading ? '...' : resolvedCount}</p>
            <p className="text-[11px] text-gray-400 mt-1">Casos cerrados con éxito</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h3 className="font-bold text-[#353535]">Tus Solicitudes</h3>
            <div className="flex flex-wrap gap-4 w-full md:w-auto">
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-4 py-2 bg-white text-gray-900 focus:outline-[#3C6E71] focus:ring-1 focus:ring-[#3C6E71]"
              >
                <option value="">Todos los estados</option>
                <option value="open">Abierto</option>
                <option value="in_progress">En Proceso</option>
                <option value="resolved">Resuelto</option>
                <option value="closed">Cerrado</option>
              </select>
              <input
                type="text"
                placeholder="Buscar ticket..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-4 py-2 w-64 bg-white text-gray-900 focus:outline-[#3C6E71] focus:ring-1 focus:ring-[#3C6E71]"
              />
              <button
                onClick={() => setIsNewModalOpen(true)}
                className="bg-[#284B63] hover:bg-[#284B63]/90 text-white px-4 py-2 rounded text-sm font-bold shadow-lg shadow-[#284B63]/30 transition"
              >
                Crear Solicitud
              </button>
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
                  <th className="px-6 py-4">ID Ticket</th>
                  <th className="px-6 py-4">Contrato</th>
                  <th className="px-6 py-4">Descripción del problema</th>
                  <th className="px-6 py-4 text-center">Prioridad Plan</th>
                  <th className="px-6 py-4 text-center">Estado</th>
                  <th className="px-6 py-4">Creado el</th>
                  <th className="px-6 py-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-[#353535]">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex items-center justify-center gap-3">
                        <i className="fa-solid fa-spinner animate-spin text-lg text-[#3C6E71]"></i>
                        <span>Cargando tus solicitudes...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      No tienes tickets registrados que coincidan con la búsqueda.
                    </td>
                  </tr>
                ) : (
                  filteredTickets.map(ticket => (
                    <tr key={ticket.id_support} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-mono text-xs text-gray-600 font-bold">#TK-{ticket.id_support}</td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-600">CT-{ticket.id_contracts}</td>
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
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleOpenView(ticket)}
                            title="Ver detalles"
                            className="text-blue-600 hover:text-blue-800 p-1.5 bg-blue-50 rounded transition-colors"
                          >
                            <i className="fa-solid fa-eye text-xs"></i>
                          </button>
                          {ticket.status === 'open' && (
                            <button
                              onClick={() => handleOpenEdit(ticket)}
                              title="Editar descripción"
                              className="text-green-600 hover:text-green-800 p-1.5 bg-green-50 rounded transition-colors"
                            >
                              <i className="fa-solid fa-edit text-xs"></i>
                            </button>
                          )}
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

      {isNewModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 transition-opacity">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-bold text-[#353535]">Nueva Solicitud de Soporte</h2>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <i className="fa-solid fa-times text-xl"></i>
              </button>
            </div>
            <form onSubmit={handleCreateTicket} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selecciona tu contrato <span className="text-red-500">*</span>
                </label>
                <select
                  name="id_contracts"
                  required
                  className="w-full text-sm border border-gray-300 rounded-lg px-4 py-2 bg-white text-gray-900 focus:outline-[#3C6E71] focus:ring-1 focus:ring-[#3C6E71]"
                >
                  <option value="">Selecciona un contrato activo...</option>
                  {contracts.filter(c => c.status === 'ACTIVE').map(c => {
                    const plan = planLookup[c.id_plans]
                    return (
                      <option key={c.id_contracts} value={c.id_contracts}>
                        CT-{c.id_contracts} — Plan {plan?.name || 'Contrato Activo'}
                      </option>
                    )
                  })}
                </select>
                {contracts.filter(c => c.status === 'ACTIVE').length === 0 && (
                  <p className="text-xs text-red-500 mt-1.5 font-semibold">
                    <i className="fa-solid fa-circle-exclamation mr-1"></i>
                    Debes tener al menos un contrato activo para crear un ticket de soporte.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cuéntanos el inconveniente <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  required
                  rows={4}
                  placeholder="Escribe detalladamente tu problema..."
                  className="w-full resize-none text-sm border border-gray-300 rounded-lg px-4 py-2 bg-white text-gray-900 focus:outline-[#3C6E71] focus:ring-1 focus:ring-[#3C6E71]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={contracts.filter(c => c.status === 'ACTIVE').length === 0}
                  className="px-4 py-2 bg-[#284B63] hover:bg-[#284B63]/90 disabled:opacity-50 text-white rounded-lg text-sm font-bold shadow-lg shadow-[#284B63]/30 transition"
                >
                  Enviar Solicitud
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 transition-opacity">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-bold text-[#353535]">Editar Solicitud #TK-{selectedTicket.id_support}</h2>
              <button
                onClick={() => { setIsEditModalOpen(false); setSelectedTicket(null); }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <i className="fa-solid fa-times text-xl"></i>
              </button>
            </div>
            <form onSubmit={handleUpdateTicket} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Contrato asociado</label>
                <p className="text-sm font-mono text-gray-700 mt-1">CT-{selectedTicket.id_contracts} ({selectedTicket.planName})</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción del Problema <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  required
                  rows={4}
                  defaultValue={selectedTicket.description}
                  className="w-full resize-none text-sm border border-gray-300 rounded-lg px-4 py-2 bg-white text-gray-900 focus:outline-[#3C6E71] focus:ring-1 focus:ring-[#3C6E71]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => { setIsEditModalOpen(false); setSelectedTicket(null); }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#284B63] hover:bg-[#284B63]/90 text-white rounded-lg text-sm font-bold shadow-lg shadow-[#284B63]/30 transition"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isViewModalOpen && selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 transition-opacity">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-bold text-[#353535]">Solicitud de Soporte #TK-{selectedTicket.id_support}</h2>
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
                  <span className="block text-xs text-gray-400 font-bold uppercase">Prioridad</span>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold mt-1 ${getPriorityBadgeClasses(selectedTicket.priority)}`}>
                    {selectedTicket.priority}
                  </span>
                </div>
              </div>

              <div>
                <span className="block text-xs text-gray-400 font-bold uppercase">Contrato / Plan</span>
                <span className="text-sm text-gray-800 font-semibold">CT-{selectedTicket.id_contracts} — Plan {selectedTicket.planName}</span>
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
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed font-semibold">
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
