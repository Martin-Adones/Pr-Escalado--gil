import { useEffect, useState, useCallback } from 'react'
import PortalTemplate from '../../portal/PortalTemplate'
import { listarContratos } from '../../services/contratos.service'
import { listarUsuarios } from '../../services/usuarios.service'
import { listarPlanes } from '../../services/planes.service'
import type { FilaContratoListado, FilaPlan, FilaUsuarioListado } from '../../services/interfaces'

type AdminDashboardPageProps = {
  navItems: { label: string; iconClass: string; onClick?: () => void }[]
  logoutItem?: { label: string; iconClass: string; onClick?: () => void }
  activeNavLabel: string
}

export default function Dashboard({ navItems, logoutItem, activeNavLabel }: AdminDashboardPageProps) {
  const [contratos, setContratos] = useState<FilaContratoListado[]>([])
  const [usuarios, setUsuarios] = useState<FilaUsuarioListado[]>([])
  const [planes, setPlanes] = useState<FilaPlan[]>([])
  const [loading, setLoading] = useState(true)

  const cargarDatos = useCallback(async () => {
    setLoading(true)
    try {
      const [c, u, p] = await Promise.all([
        listarContratos({ page_size: 200 }),
        listarUsuarios({ page_size: 200 }),
        listarPlanes({ page_size: 200 }),
      ])
      setContratos(c)
      setUsuarios(u)
      setPlanes(p)
    } catch {
      // silent fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargarDatos() }, [cargarDatos])

  const mapaPlanes = Object.fromEntries(planes.map((p) => [p.id_plans, p.name]))
  const mapaUsuarios = Object.fromEntries(usuarios.map((u) => [u.id_users, u.type]))

  const activos = contratos.filter((c) => c.status === 'ACTIVE').length
  const nuevosEsteMes = contratos.filter((c) => {
    const inicio = new Date(c.start_date)
    const ahora = new Date()
    return inicio.getMonth() === ahora.getMonth() && inicio.getFullYear() === ahora.getFullYear()
  }).length
  const hoy = new Date()
  const en30dias = new Date(hoy); en30dias.setDate(hoy.getDate() + 30)
  const porVencer = contratos.filter((c) => {
    const fin = new Date(c.end_date)
    return c.status === 'ACTIVE' && fin >= hoy && fin <= en30dias
  }).length

  return (
    <PortalTemplate
      sidebarTitle="Administrador"
      sidebarSubtitle="Panel administrativo"
      contentZoom={0.75}
      navItems={navItems}
      logoutItem={logoutItem}
      activeNavLabel={activeNavLabel}
      userInitial="A"
      userName="Administrador"
      userRole="Admin"
      headerTitle="Dashboard Admin"
      headerSubtitle="Entorno administrativo del sistema."
      headerRightLabel="Perfil"
      headerRightValue="Admin"
    >
      <div className="flex">
        <main className="flex-grow">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
            <div className="bg-white p-4 rounded-xl shadow-md">
              <p className="text-xs text-gray-500 uppercase font-bold mb-1">Renovación</p>
              <p className="text-2xl font-bold text-[#284B63]">{loading ? '—' : `${contratos.length}`}</p>
              <p className="text-[11px] text-[#284B63] mt-1 font-bold text-gray-400">Total contratos</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
              <p className="text-xs text-gray-500 uppercase font-bold mb-1 tracking-tight">MRR Total</p>
              <p className="text-2xl font-bold text-[#353535]">-</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
              <p className="text-xs text-gray-500 uppercase font-bold mb-1 tracking-tight">Fallos de Cobro</p>
              <p className="text-2xl font-bold text-red-600">-</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
              <p className="text-xs text-gray-500 uppercase font-bold mb-1 tracking-tight">Contratos Activos</p>
              <p className="text-2xl font-bold text-[#353535]">{loading ? '—' : activos}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-bold text-[#353535]">Gestión de Contratos</h3>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-600 font-semibold mb-1">Contratos Activos</p>
                  <p className="text-2xl font-bold text-blue-700">{loading ? '—' : activos}</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                  <p className="text-sm text-green-600 font-semibold mb-1">Nuevos este mes</p>
                  <p className="text-2xl font-bold text-green-700">{loading ? '—' : nuevosEsteMes}</p>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                  <p className="text-sm text-orange-600 font-semibold mb-1">Por vencer</p>
                  <p className="text-2xl font-bold text-orange-700">{loading ? '—' : porVencer}</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full table-fixed text-left">
                  <thead className="bg-gray-50 text-xs text-gray-600 uppercase border-b border-gray-200">
                    <tr>
                      <th className="px-3 py-2 w-[10%]">ID</th>
                      <th className="px-3 py-2 w-[20%]">Cliente</th>
                      <th className="px-3 py-2 w-[18%]">Plan</th>
                      <th className="px-3 py-2 w-[14%]">Estado</th>
                      <th className="px-3 py-2 w-[18%]">Vencimiento</th>
                      <th className="px-3 py-2 w-[20%] text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {loading ? (
                      <tr><td colSpan={6} className="px-3 py-8 text-center text-gray-400">Cargando...</td></tr>
                    ) : contratos.length === 0 ? (
                      <tr><td colSpan={6} className="px-3 py-8 text-center text-gray-400">No hay contratos registrados.</td></tr>
                    ) : contratos.slice(0, 10).map((c) => (
                      <tr key={c.id_contracts} className="hover:bg-gray-50 transition">
                        <td className="px-3 py-2 font-mono font-semibold text-[#353535]">#{c.id_contracts}</td>
                        <td className="px-3 py-2 truncate text-[#353535]">{mapaUsuarios[c.id_users] ?? `#${c.id_users}`}</td>
                        <td className="px-3 py-2 truncate text-[#353535]">{mapaPlanes[c.id_plans] ?? `#${c.id_plans}`}</td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            c.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                            c.status === 'SUSPENDED' ? 'bg-yellow-100 text-yellow-800' :
                            c.status === 'TERMINATED' ? 'bg-red-100 text-red-800' :
                            c.status === 'CANCELLED' ? 'bg-gray-100 text-gray-600' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {c.status === 'ACTIVE' ? 'Activo' :
                             c.status === 'SUSPENDED' ? 'Suspendido' :
                             c.status === 'TERMINATED' ? 'Terminado' :
                             c.status === 'CANCELLED' ? 'Cancelado' : 'Borrador'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-gray-500">{new Date(c.end_date).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                        <td className="px-3 py-2">
                          <div className="flex justify-center gap-2">
                            <button className="text-gray-400 p-1.5 bg-gray-100 rounded cursor-not-allowed" disabled title="Ver detalle">
                              <i className="fa-solid fa-eye text-xs"></i>
                            </button>
                            <button className="text-gray-400 p-1.5 bg-gray-100 rounded cursor-not-allowed" disabled title="Editar">
                              <i className="fa-solid fa-edit text-xs"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </PortalTemplate>
  )
}
