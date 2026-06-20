import PortalTemplate from '../../portal/PortalTemplate'

type AdminCiclosDeCobroPageProps = {
  navItems: { label: string; iconClass: string; onClick?: () => void }[]
  activeNavLabel: string
}

export default function CiclosDeCobroPage({ navItems, activeNavLabel }: AdminCiclosDeCobroPageProps) {
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
      headerTitle="Ciclos de Cobro"
      headerSubtitle="Monitoreo y gestión de ciclos automáticos."
      headerRightLabel="Perfil"
      headerRightValue="Admin"
    >
      <div className="flex">
        <main className="flex-grow">
          {/* Tarjetas de resumen */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
            <div className="bg-white p-4 rounded-xl shadow-md">
              <p className="text-xs text-gray-500 uppercase font-bold mb-1">Ciclos Hoy</p>
              <p className="text-2xl font-bold text-[#284B63]">-</p>
              <p className="text-[11px] text-gray-400 mt-1">Programados para hoy</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
              <p className="text-xs text-gray-500 uppercase font-bold mb-1 tracking-tight">Exitosos</p>
              <p className="text-2xl font-bold text-[#353535]">-</p>
              <p className="text-[11px] text-gray-400 mt-1">Tasa de éxito</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
              <p className="text-xs text-gray-500 uppercase font-bold mb-1 tracking-tight">Fallidos</p>
              <p className="text-2xl font-bold text-red-600">-</p>
              <p className="text-[11px] text-gray-400 mt-1">Reintentos pendientes</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
              <p className="text-xs text-gray-500 uppercase font-bold mb-1 tracking-tight">En Proceso</p>
              <p className="text-2xl font-bold text-[#353535]">-</p>
              <p className="text-[11px] text-gray-400 mt-1">En proceso ahora</p>
            </div>
          </div>

          {/* Tabla de ciclos */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-[#353535]">Monitoreo de Ciclos Automáticos</h3>
            </div>
            <div className="p-5">
              <table className="w-full table-fixed text-left">
                <thead className="bg-gray-50 text-xs text-gray-600 uppercase border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-2 w-[25%]">Cliente</th>
                    <th className="px-3 py-2 w-[18%]">ID Contrato</th>
                    <th className="px-3 py-2 w-[20%]">Próxima Ejecución</th>
                    <th className="px-3 py-2 w-[15%]">Estado</th>
                    <th className="px-3 py-2 w-[10%]">Intentos</th>
                    <th className="px-3 py-2 w-[12%] text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  <tr className="hover:bg-gray-50 transition">
                    <td className="px-3 py-2 font-semibold truncate text-gray-400">-</td>
                    <td className="px-3 py-2 font-mono text-gray-400">-</td>
                    <td className="px-3 py-2 text-gray-400">-</td>
                    <td className="px-3 py-2 text-gray-400">-</td>
                    <td className="px-3 py-2 text-gray-400">-</td>
                    <td className="px-3 py-2">
                      <div className="flex justify-center gap-2">
                        <button className="text-gray-400 p-1.5 bg-gray-100 rounded cursor-not-allowed" disabled>
                          <i className="fa-solid fa-eye text-xs"></i>
                        </button>
                        <button className="text-gray-400 p-1.5 bg-gray-100 rounded cursor-not-allowed" disabled>
                          <i className="fa-solid fa-edit text-xs"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </PortalTemplate>
  )
}
