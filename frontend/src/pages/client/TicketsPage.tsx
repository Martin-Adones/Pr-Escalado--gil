import { useCallback, useEffect, useState, useMemo } from 'react'
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

const TICKETS_PER_PAGE = 5

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
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)

  const [isNewModalOpen, setIsNewModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)

  const [selectedTicket, setSelectedTicket] = useState<(FilaTicketListado & { planName: string; priority: 'Alta' | 'Media' | 'Baja' }) | null>(null)

  const loadData = useCallback(async () => {
    if (!userId) return
    try {
      const [ticketsData, contractsData, planesData] = await Promise.all([
        listarTickets({ id_users: userId, page_size: 100 }),
        listarContratos({ id_users: userId, page_size: 100 }),
        listarPlanes({ page_size: 100 }),
      ])
      setError(null)
      setTickets(ticketsData)
      setContracts(contractsData)
      setPlanes(planesData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al conectar con el servidor')
    } finally {
      setLoading(false)
    }
  }, [userId])

  const handleRefresh = useCallback(() => {
    setLoading(true)
    setError(null)
    loadData()
  }, [loadData])

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    Promise.all([
      listarTickets({ id_users: userId, page_size: 100 }),
      listarContratos({ id_users: userId, page_size: 100 }),
      listarPlanes({ page_size: 100 }),
    ])
      .then(([ticketsData, contractsData, planesData]) => {
        if (cancelled) return
        setError(null)
        setTickets(ticketsData)
        setContracts(contractsData)
        setPlanes(planesData)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Error al conectar con el servidor')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
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

  const sortedAndPagedTickets = useMemo(() => {
    const sorted = [...filteredTickets].sort((a, b) => {
      const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      return sortOrder === 'desc' ? -diff : diff
    })
    const totalPages = Math.max(1, Math.ceil(sorted.length / TICKETS_PER_PAGE))
    const safePage = Math.min(currentPage, totalPages)
    const paged = sorted.slice((safePage - 1) * TICKETS_PER_PAGE, safePage * TICKETS_PER_PAGE)
    return { sorted, paged, totalPages, safePage }
  }, [filteredTickets, sortOrder, currentPage])

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
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al crear tu ticket')
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
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al actualizar el ticket')
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
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Tickets Creados</p>
            <p className="text-2xl font-black text-[#3C6E71] mt-1">{loading ? '—' : totalCount}</p>
            <p className="text-[10px] text-gray-400 mt-1">Historial de solicitudes</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Pendientes</p>
            <p className="text-2xl font-black text-orange-500 mt-1">{loading ? '—' : pendingCount}</p>
            <p className="text-[10px] text-gray-400 mt-1">Siendo revisados por el equipo</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Resueltos</p>
            <p className="text-2xl font-black text-[#3C6E71] mt-1">{loading ? '—' : resolvedCount}</p>
            <p className="text-[10px] text-gray-400 mt-1">Casos cerrados con éxito</p>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h3 className="text-sm font-black text-[#353535]">Tus Solicitudes</h3>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#3C6E71]"
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
                className="text-xs border border-gray-200 rounded-lg px-3 py-2 w-44 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#3C6E71]"
              />
              <button
                onClick={() => setSortOrder(o => o === 'desc' ? 'asc' : 'desc')}
                title={sortOrder === 'desc' ? 'Ver más antiguos primero' : 'Ver más recientes primero'}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
              >
                <i className={`fa-solid fa-arrow-${sortOrder === 'desc' ? 'down' : 'up'} text-[10px]`}></i>
                {sortOrder === 'desc' ? 'Recientes' : 'Antiguos'}
              </button>
              <button
                onClick={() => setIsNewModalOpen(true)}
                className="px-3 py-2 rounded-lg text-xs font-bold bg-[#284B63] text-white hover:opacity-90 transition"
              >
                Crear Solicitud
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border-b border-red-100 px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-red-600">
                <i className="fa-solid fa-circle-exclamation"></i>
                <span className="font-semibold">{error}</span>
              </div>
              <button
                onClick={handleRefresh}
                className="text-xs bg-red-100 text-red-700 hover:bg-red-200 font-bold px-3 py-1.5 rounded-lg transition"
              >
                Reintentar
              </button>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wide">ID</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wide">Contrato</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wide">Descripción</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wide text-center">Prioridad</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wide text-center">Estado</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wide">Creado</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wide text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-[#353535]">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center">
                      <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                        <i className="fa-solid fa-spinner animate-spin text-[#3C6E71]"></i>
                        <span>Cargando solicitudes...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-400">
                      No hay tickets que coincidan con la búsqueda.
                    </td>
                  </tr>
                ) : (
                  sortedAndPagedTickets.paged.map(ticket => (
                    <tr key={ticket.id_support} className="hover:bg-gray-50 transition">
                      <td className="px-5 py-3 font-mono text-xs text-gray-500 font-bold">#TK-{ticket.id_support}</td>
                      <td className="px-5 py-3 font-mono text-xs text-gray-500">CT-{ticket.id_contracts}</td>
                      <td className="px-5 py-3 max-w-xs truncate text-sm">{ticket.description}</td>
                      <td className="px-5 py-3 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getPriorityBadgeClasses(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getStatusBadgeClasses(ticket.status)}`}>
                          {getStatusLabel(ticket.status)}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-400">{formatDate(ticket.created_at)}</td>
                      <td className="px-5 py-3">
                        <div className="flex justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenView(ticket)}
                            title="Ver detalles"
                            className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-[#284B63]/10 hover:text-[#284B63] transition-colors"
                          >
                            <i className="fa-solid fa-eye text-xs"></i>
                          </button>
                          {ticket.status === 'open' && (
                            <button
                              onClick={() => handleOpenEdit(ticket)}
                              title="Editar descripción"
                              className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-[#3C6E71]/10 hover:text-[#3C6E71] transition-colors"
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

          {sortedAndPagedTickets.totalPages > 1 && (
            <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
              <p className="text-[10px] font-semibold text-gray-400">
                {((sortedAndPagedTickets.safePage - 1) * TICKETS_PER_PAGE) + 1}–{Math.min(sortedAndPagedTickets.safePage * TICKETS_PER_PAGE, sortedAndPagedTickets.sorted.length)} de {sortedAndPagedTickets.sorted.length} tickets
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={sortedAndPagedTickets.safePage === 1}
                  className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-30 transition"
                >
                  <i className="fa-solid fa-chevron-left text-xs"></i>
                </button>
                {Array.from({ length: sortedAndPagedTickets.totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition ${
                      page === sortedAndPagedTickets.safePage
                        ? 'bg-[#284B63] text-white'
                        : 'text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(p => Math.min(sortedAndPagedTickets.totalPages, p + 1))}
                  disabled={sortedAndPagedTickets.safePage === sortedAndPagedTickets.totalPages}
                  className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-30 transition"
                >
                  <i className="fa-solid fa-chevron-right text-xs"></i>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {isNewModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-sm font-black text-[#353535]">Nueva Solicitud de Soporte</h2>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <i className="fa-solid fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleCreateTicket} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                  Contrato <span className="text-red-500">*</span>
                </label>
                <select
                  name="id_contracts"
                  required
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#3C6E71]"
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
                    Necesitas un contrato activo para abrir un ticket.
                  </p>
                )}
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                  Descripción del problema <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  required
                  rows={4}
                  placeholder="Describe el inconveniente con el mayor detalle posible..."
                  className="w-full resize-none text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#3C6E71]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={contracts.filter(c => c.status === 'ACTIVE').length === 0}
                  className="px-4 py-2 bg-[#284B63] hover:opacity-90 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition"
                >
                  Enviar Solicitud
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && selectedTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-sm font-black text-[#353535]">Editar #TK-{selectedTicket.id_support}</h2>
              <button
                onClick={() => { setIsEditModalOpen(false); setSelectedTicket(null) }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <i className="fa-solid fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleUpdateTicket} className="p-6 space-y-4">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Contrato asociado</p>
                <p className="text-sm font-mono text-gray-700 mt-1">CT-{selectedTicket.id_contracts} · {selectedTicket.planName}</p>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                  Descripción <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  required
                  rows={4}
                  defaultValue={selectedTicket.description}
                  className="w-full resize-none text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#3C6E71]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => { setIsEditModalOpen(false); setSelectedTicket(null) }}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#284B63] hover:opacity-90 text-white rounded-lg text-xs font-bold transition"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isViewModalOpen && selectedTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-sm font-black text-[#353535]">Solicitud #TK-{selectedTicket.id_support}</h2>
              <button
                onClick={() => { setIsViewModalOpen(false); setSelectedTicket(null) }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <i className="fa-solid fa-times"></i>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Estado</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold mt-1.5 ${getStatusBadgeClasses(selectedTicket.status)}`}>
                    {getStatusLabel(selectedTicket.status)}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Prioridad</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold mt-1.5 ${getPriorityBadgeClasses(selectedTicket.priority)}`}>
                    {selectedTicket.priority}
                  </span>
                </div>
              </div>
              <dl className="space-y-3">
                <div>
                  <dt className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Contrato / Plan</dt>
                  <dd className="text-sm font-semibold text-gray-800 mt-0.5">CT-{selectedTicket.id_contracts} · Plan {selectedTicket.planName}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Creado el</dt>
                  <dd className="text-sm text-gray-700 mt-0.5">{formatDate(selectedTicket.created_at)}</dd>
                </div>
                {selectedTicket.updated_at && selectedTicket.updated_at !== selectedTicket.created_at && (
                  <div>
                    <dt className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Última actualización</dt>
                    <dd className="text-sm text-gray-700 mt-0.5">{formatDate(selectedTicket.updated_at)}</dd>
                  </div>
                )}
              </dl>
              <div className="rounded-lg bg-gray-50 border border-gray-100 p-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Descripción del problema</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{selectedTicket.description}</p>
              </div>
              <div className="flex justify-end pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => { setIsViewModalOpen(false); setSelectedTicket(null) }}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50 transition"
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
