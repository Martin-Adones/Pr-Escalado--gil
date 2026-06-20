import { useEffect, useState } from 'react'
import PortalTemplate from '../../portal/PortalTemplate'
import { listarContratos } from '../../services/contratos.service'
import { listarPlanes } from '../../services/planes.service'
import type { FilaContratoListado, FilaPlan } from '../../services/interfaces'

type AdminContractsPageProps = {
  navItems: { label: string; iconClass: string; onClick?: () => void }[]
  activeNavLabel: string
}

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  ACTIVE:     { label: 'Activo',      className: 'bg-green-100 text-green-800' },
  SUSPENDED:  { label: 'Suspendido',  className: 'bg-yellow-100 text-yellow-800' },
  TERMINATED: { label: 'Terminado',   className: 'bg-red-100 text-red-800' },
  CANCELLED:  { label: 'Cancelado',   className: 'bg-gray-100 text-gray-600' },
  DRAFT:      { label: 'Borrador',    className: 'bg-blue-100 text-blue-800' },
}

function formatFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function ContratosPage({ navItems, activeNavLabel }: AdminContractsPageProps) {
  const [contratos, setContratos] = useState<FilaContratoListado[]>([])
  const [planes, setPlanes] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [paginaActual, setPaginaActual] = useState(1)
  const PAGE_SIZE = 10

  useEffect(() => {
    Promise.all([
      listarContratos({ page_size: 200, page_number: 1 }),
      listarPlanes({ page_size: 100, page_number: 1 }),
    ])
      .then(([contratosData, planesData]: [FilaContratoListado[], FilaPlan[]]) => {
        setContratos(contratosData)
        const mapaPlanes: Record<string, string> = {}
        planesData.forEach((p) => { mapaPlanes[p.id_plans] = p.name })
        setPlanes(mapaPlanes)
      })
      .catch(() => setError('No se pudieron cargar los contratos.'))
      .finally(() => setLoading(false))
  }, [])

  const hoy = new Date()
  const en30dias = new Date(hoy)
  en30dias.setDate(hoy.getDate() + 30)

  const activos    = contratos.filter((c) => c.status === 'ACTIVE').length
  const porVencer  = contratos.filter((c) => {
    const fin = new Date(c.end_date)
    return c.status === 'ACTIVE' && fin >= hoy && fin <= en30dias
  }).length

  const contratosFiltrados = contratos.filter((c) => {
    const q = busqueda.toLowerCase()
    return (
      c.id_contracts.toString().includes(q) ||
      c.id_users.toString().includes(q) ||
      (planes[c.id_plans] ?? '').toLowerCase().includes(q) ||
      c.status.toLowerCase().includes(q)
    )
  })

  const totalPaginas = Math.ceil(contratosFiltrados.length / PAGE_SIZE)
  const contratosPagina = contratosFiltrados.slice(
    (paginaActual - 1) * PAGE_SIZE,
    paginaActual * PAGE_SIZE
  )

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
      headerTitle="Gestión de Contratos"
      headerSubtitle="Administración de contratos y planes."
      headerRightLabel="Perfil"
      headerRightValue="Admin"
    >
      <div className="flex">
        <main className="flex-grow">
          {/* Tarjetas de resumen */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            <div className="bg-white p-4 rounded-xl shadow-md">
              <p className="text-xs text-gray-500 uppercase font-bold mb-1">Total Contratos</p>
              <p className="text-2xl font-bold text-[#284B63]">{loading ? '—' : contratos.length}</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
              <p className="text-xs text-gray-500 uppercase font-bold mb-1 tracking-tight">Activos</p>
              <p className="text-2xl font-bold text-[#353535]">{loading ? '—' : activos}</p>
              <p className="text-[11px] text-gray-400 mt-1">
                {!loading && contratos.length > 0 ? `${((activos / contratos.length) * 100).toFixed(1)}% del total` : ''}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
              <p className="text-xs text-gray-500 uppercase font-bold mb-1 tracking-tight">Por vencer</p>
              <p className="text-2xl font-bold text-orange-500">{loading ? '—' : porVencer}</p>
              <p className="text-[11px] text-gray-400 mt-1">Próximos 30 días</p>
            </div>
          </div>

          {/* Tabla de contratos */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="relative w-64">
                <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
                <input
                  type="text"
                  placeholder="Buscar por ID, plan o estado..."
                  value={busqueda}
                  onChange={(e) => { setBusqueda(e.target.value); setPaginaActual(1) }}
                  className="w-full text-sm border border-gray-200 rounded-lg pl-8 pr-4 py-2 focus:outline-none focus:ring-1 focus:ring-[#284B63] focus:border-[#284B63] bg-gray-50"
                />
              </div>
            </div>

            <div className="p-5">
              {error ? (
                <div className="py-8 text-center text-red-500 font-semibold">{error}</div>
              ) : loading ? (
                <div className="py-8 text-center text-gray-400">Cargando contratos...</div>
              ) : contratosFiltrados.length === 0 ? (
                <div className="py-8 text-center text-gray-400">No se encontraron contratos.</div>
              ) : (
                <>
                  <table className="w-full table-fixed text-left">
                    <thead className="bg-gray-50 text-xs text-gray-600 uppercase border-b border-gray-200">
                      <tr>
                        <th className="px-3 py-2 w-[10%]">ID</th>
                        <th className="px-3 py-2 w-[12%]">Cliente</th>
                        <th className="px-3 py-2 w-[22%]">Plan</th>
                        <th className="px-3 py-2 w-[18%]">Estado</th>
                        <th className="px-3 py-2 w-[19%]">Inicio</th>
                        <th className="px-3 py-2 w-[19%]">Vencimiento</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                      {contratosPagina.map((c) => {
                        const status = STATUS_LABEL[c.status] ?? { label: c.status, className: 'bg-gray-100 text-gray-600' }
                        return (
                          <tr key={c.id_contracts} className="hover:bg-gray-50 transition">
                            <td className="px-3 py-2 font-mono font-semibold text-[#353535]">#{c.id_contracts}</td>
                            <td className="px-3 py-2 font-mono text-[#353535]">#{c.id_users}</td>
                            <td className="px-3 py-2 text-[#353535] truncate">{planes[c.id_plans] ?? `#${c.id_plans}`}</td>
                            <td className="px-3 py-2">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${status.className}`}>
                                {status.label}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-gray-500">{formatFecha(c.start_date)}</td>
                            <td className="px-3 py-2 text-gray-500">{formatFecha(c.end_date)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>

                  {totalPaginas > 1 && (
                    <div className="pt-4 border-t border-gray-100 flex justify-between items-center text-sm text-gray-500">
                      <span>
                        Mostrando {(paginaActual - 1) * PAGE_SIZE + 1}–{Math.min(paginaActual * PAGE_SIZE, contratosFiltrados.length)} de {contratosFiltrados.length}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
                          disabled={paginaActual === 1}
                          className="px-3 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
                        >
                          Anterior
                        </button>
                        <button
                          onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
                          disabled={paginaActual === totalPaginas}
                          className="px-3 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
                        >
                          Siguiente
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </PortalTemplate>
  )
}
