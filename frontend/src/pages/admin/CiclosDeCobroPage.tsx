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
      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-[#284B63]">
            <p className="text-xs text-gray-500 uppercase font-bold mb-1 tracking-tight">Ciclos Hoy</p>
            <p className="text-2xl font-bold text-[#284B63]">-</p>
            <p className="text-[11px] text-gray-400 mt-1">Programados para hoy</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <p className="text-xs text-gray-500 uppercase font-bold mb-1 tracking-tight">Exitosos</p>
            <p className="text-2xl font-bold text-green-600">-</p>
            <p className="text-[11px] text-gray-400 mt-1">84.4% tasa de éxito</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <p className="text-xs text-gray-500 uppercase font-bold mb-1 tracking-tight">Fallidos</p>
            <p className="text-2xl font-bold text-red-600">-</p>
            <p className="text-[11px] text-gray-400 mt-1">Reintentos pendientes</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <p className="text-xs text-gray-500 uppercase font-bold mb-1 tracking-tight">Procesamiento</p>
            <p className="text-2xl font-bold text-[#353535]">-</p>
            <p className="text-[11px] text-gray-400 mt-1">En proceso ahora</p>
          </div>
        </div>

        {/* Métricas de Usuarios */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 p-6 rounded-xl border border-indigo-200">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-indigo-800">Usuarios Activos</h4>
              <i className="fa-solid fa-users text-indigo-600"></i>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-indigo-700">Total</span>
                <span className="font-bold text-indigo-900">-</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-indigo-700">Con ciclos activos</span>
                <span className="font-bold text-green-600">-</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-indigo-700">Nuevos este mes</span>
                <span className="font-bold text-indigo-900">-</span>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-amber-50 to-amber-100 p-6 rounded-xl border border-amber-200">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-amber-800">Actividad de Usuarios</h4>
              <i className="fa-solid fa-chart-line text-amber-600"></i>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-amber-700">Login hoy</span>
                <span className="font-bold text-amber-900">-</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-amber-700">Usuarios online</span>
                <span className="font-bold text-green-600">-</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-amber-700">Promedio sesión</span>
                <span className="font-bold text-amber-900">-</span>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-teal-50 to-teal-100 p-6 rounded-xl border border-teal-200">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-teal-800">Métricas de Cobro</h4>
              <i className="fa-solid fa-credit-card text-teal-600"></i>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-teal-700">Usuarios con pago fallido</span>
                <span className="font-bold text-red-600">-</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-teal-700">Métodos de pago activos</span>
                <span className="font-bold text-teal-900">-</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-teal-700">Tasa de conversión</span>
                <span className="font-bold text-green-600">-</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-[#353535]">Monitoreo de Ciclos Automáticos</h3>
            <div className="flex gap-4">
              <input 
                type="text" 
                placeholder="Buscar cliente o contrato..." 
                className="text-sm border border-[#D9D9D9] rounded-lg px-4 py-2 w-64 focus:outline-[#3C6E71] focus:ring-1 focus:ring-[#3C6E71]" 
              />
              <button className="bg-[#284B63] hover:bg-[#284B63]/90 text-white px-4 py-2 rounded text-sm font-bold shadow-lg shadow-[#284B63]/30">
                Forzar Todos
              </button>
            </div>
          </div>
          <table className="w-full text-left">
            <thead className="bg-[#353535] text-xs text-white uppercase">
              <tr>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">ID Contrato</th>
                <th className="px-6 py-4">Próxima Ejecución</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4">Intentos</th>
                <th className="px-6 py-4">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-[#353535]">
              <tr className="hover:bg-[#D9D9D9]/20 transition">
                <td className="px-6 py-4 font-semibold text-gray-400">-</td>
                <td className="px-6 py-4 font-mono text-xs text-gray-400">-</td>
                <td className="px-6 py-4 text-gray-400">-</td>
                <td className="px-6 py-4 text-gray-400">-</td>
                <td className="px-6 py-4 text-gray-400">-</td>
                <td className="px-6 py-4 flex gap-2">
                  <button className="text-gray-400 p-1.5 bg-gray-100 rounded cursor-not-allowed" disabled>
                    <i className="fa-solid fa-eye"></i>
                  </button>
                  <button className="text-gray-400 p-1.5 bg-gray-100 rounded cursor-not-allowed" disabled>
                    <i className="fa-solid fa-pen-to-square"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </PortalTemplate>
  )
}
