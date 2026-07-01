import { useEffect, useState } from 'react'
import PortalTemplate from '../../portal/PortalTemplate'
import { listarUsuarios } from '../../services/usuarios.service'
import type { FilaUsuarioListado } from '../../services/interfaces'

type AdminClientesPageProps = {
  navItems: { label: string; iconClass: string; onClick?: () => void }[]
  logoutItem?: { label: string; iconClass: string; onClick?: () => void }
  activeNavLabel: string
}

export default function ClientesPage({ navItems, logoutItem, activeNavLabel }: AdminClientesPageProps) {
  const [usuarios, setUsuarios] = useState<FilaUsuarioListado[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [paginaActual, setPaginaActual] = useState(1)
  const PAGE_SIZE = 10

  useEffect(() => {
    setLoading(true)
    listarUsuarios({ type: 'client', page_size: 100, page_number: 1 })
      .then(setUsuarios)
      .catch(() => setError('No se pudieron cargar los clientes.'))
      .finally(() => setLoading(false))
  }, [])

  const clientesFiltrados = usuarios.filter((u) =>
    u.id_users.toString().includes(busqueda) ||
    (u.isActive ? 'activo' : 'inactivo').includes(busqueda.toLowerCase())
  )

  const totalPaginas = Math.ceil(clientesFiltrados.length / PAGE_SIZE)
  const clientesPagina = clientesFiltrados.slice(
    (paginaActual - 1) * PAGE_SIZE,
    paginaActual * PAGE_SIZE
  )

  const totalClientes = usuarios.length
  const activos = usuarios.filter((u) => u.isActive).length
  const inactivos = totalClientes - activos

  return (
    <PortalTemplate
      sidebarTitle="Admin"
      sidebarSubtitle="Panel administrativo"
      contentZoom={0.75}
      navItems={navItems}
      logoutItem={logoutItem}
      activeNavLabel={activeNavLabel}
      userInitial="A"
      userName="Administrador"
      userRole="Admin"
      headerTitle="Gestión de Clientes"
      headerSubtitle="Administración de clientes y cuentas."
      headerRightLabel="Perfil"
      headerRightValue="Admin"
    >
      <div className="flex">
        <main className="flex-grow">
          {/* Tarjetas de resumen */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            <div className="bg-white p-4 rounded-xl shadow-md">
              <p className="text-xs text-gray-500 uppercase font-bold mb-1">Total Clientes</p>
              <p className="text-2xl font-bold text-[#284B63]">{loading ? '—' : totalClientes}</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
              <p className="text-xs text-gray-500 uppercase font-bold mb-1 tracking-tight">Activos</p>
              <p className="text-2xl font-bold text-[#353535]">{loading ? '—' : activos}</p>
              <p className="text-[11px] text-gray-400 mt-1">
                {!loading && totalClientes > 0 ? `${((activos / totalClientes) * 100).toFixed(1)}% del total` : ''}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
              <p className="text-xs text-gray-500 uppercase font-bold mb-1 tracking-tight">Inactivos</p>
              <p className="text-2xl font-bold text-red-600">{loading ? '—' : inactivos}</p>
              <p className="text-[11px] text-gray-400 mt-1">
                {!loading && totalClientes > 0 ? `${((inactivos / totalClientes) * 100).toFixed(1)}% del total` : ''}
              </p>
            </div>
          </div>

          {/* Tabla de clientes */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="relative w-64">
                <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
                <input
                  type="text"
                  placeholder="Buscar por ID o estado..."
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
                <div className="py-8 text-center text-gray-400">Cargando clientes...</div>
              ) : clientesFiltrados.length === 0 ? (
                <div className="py-8 text-center text-gray-400">No se encontraron clientes.</div>
              ) : (
                <>
                  <table className="w-full table-fixed text-left">
                    <thead className="bg-gray-50 text-xs text-gray-600 uppercase border-b border-gray-200">
                      <tr>
                        <th className="px-3 py-2 w-[20%]">ID Cliente</th>
                        <th className="px-3 py-2 w-[30%]">Tipo</th>
                        <th className="px-3 py-2 w-[30%]">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                      {clientesPagina.map((u) => (
                        <tr key={u.id_users} className="hover:bg-gray-50 transition">
                          <td className="px-3 py-2 font-mono font-semibold text-[#353535]">#{u.id_users}</td>
                          <td className="px-3 py-2 capitalize text-[#353535]">{u.type}</td>
                          <td className="px-3 py-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              u.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {u.isActive ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {totalPaginas > 1 && (
                    <div className="pt-4 border-t border-gray-100 flex justify-between items-center text-sm text-gray-500">
                      <span>
                        Mostrando {(paginaActual - 1) * PAGE_SIZE + 1}–{Math.min(paginaActual * PAGE_SIZE, clientesFiltrados.length)} de {clientesFiltrados.length}
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
