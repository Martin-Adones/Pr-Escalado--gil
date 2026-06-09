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
            <p className="text-2xl font-bold text-[#284B63]">45</p>
            <p className="text-[11px] text-gray-400 mt-1">Programados para hoy</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <p className="text-xs text-gray-500 uppercase font-bold mb-1 tracking-tight">Exitosos</p>
            <p className="text-2xl font-bold text-green-600">38</p>
            <p className="text-[11px] text-gray-400 mt-1">84.4% tasa de éxito</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <p className="text-xs text-gray-500 uppercase font-bold mb-1 tracking-tight">Fallidos</p>
            <p className="text-2xl font-bold text-red-600">7</p>
            <p className="text-[11px] text-gray-400 mt-1">Reintentos pendientes</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <p className="text-xs text-gray-500 uppercase font-bold mb-1 tracking-tight">Procesamiento</p>
            <p className="text-2xl font-bold text-[#353535]">2</p>
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
                <span className="font-bold text-indigo-900">2,156</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-indigo-700">Con ciclos activos</span>
                <span className="font-bold text-green-600">1,847</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-indigo-700">Nuevos este mes</span>
                <span className="font-bold text-indigo-900">184</span>
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
                <span className="font-bold text-amber-900">342</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-amber-700">Usuarios online</span>
                <span className="font-bold text-green-600">89</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-amber-700">Promedio sesión</span>
                <span className="font-bold text-amber-900">15 min</span>
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
                <span className="font-bold text-red-600">47</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-teal-700">Métodos de pago activos</span>
                <span className="font-bold text-teal-900">3</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-teal-700">Tasa de conversión</span>
                <span className="font-bold text-green-600">92.3%</span>
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
                <td className="px-6 py-4 font-semibold">Inmobiliaria Los Andes SpA</td>
                <td className="px-6 py-4 font-mono text-xs text-gray-600">CT-2026-9901</td>
                <td className="px-6 py-4">16 Abr, 2026 (Mañana)</td>
                <td className="px-6 py-4">
                  <span className="flex items-center gap-1.5 text-[#3C6E71] font-bold text-[10px] uppercase">
                    <i className="fa-solid fa-check-circle text-xs"></i> Listo para pago
                  </span>
                </td>
                <td className="px-6 py-4">0</td>
                <td className="px-6 py-4 flex gap-2">
                  <button className="text-[#284B63] hover:text-[#284B63]/80 p-1.5 bg-[#D9D9D9]/40 rounded">
                    <i className="fa-solid fa-eye"></i>
                  </button>
                  <button className="text-[#3C6E71] hover:text-[#3C6E71]/80 p-1.5 bg-[#D9D9D9]/40 rounded">
                    <i className="fa-solid fa-pen-to-square"></i>
                  </button>
                </td>
              </tr>
              <tr className="bg-red-50 hover:bg-red-100/50 transition">
                <td className="px-6 py-4 font-semibold">TechSolutions International</td>
                <td className="px-6 py-4 font-mono text-xs text-gray-600">CT-2026-8854</td>
                <td className="px-6 py-4">15 Abr, 2026 (Hoy)</td>
                <td className="px-6 py-4">
                  <span className="flex items-center gap-1.5 text-red-600 font-bold text-[10px] uppercase">
                    <i className="fa-solid fa-clock-rotate-left text-xs"></i> Reintento #2
                  </span>
                </td>
                <td className="px-6 py-4">2</td>
                <td className="px-6 py-4">
                  <button className="bg-[#284B63] text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-[#284B63]/90 shadow">
                    Forzar Cobro
                  </button>
                </td>
              </tr>
              <tr className="bg-yellow-50 hover:bg-yellow-100/50 transition">
                <td className="px-6 py-4 font-semibold">Global Services Ltd</td>
                <td className="px-6 py-4 font-mono text-xs text-gray-600">CT-2026-7723</td>
                <td className="px-6 py-4">15 Abr, 2026 (Hoy)</td>
                <td className="px-6 py-4">
                  <span className="flex items-center gap-1.5 text-yellow-600 font-bold text-[10px] uppercase">
                    <i className="fa-solid fa-spinner text-xs animate-spin"></i> Procesando
                  </span>
                </td>
                <td className="px-6 py-4">1</td>
                <td className="px-6 py-4">
                  <button className="text-gray-400 p-1.5 bg-gray-100 rounded cursor-not-allowed" disabled>
                    <i className="fa-solid fa-pause"></i>
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
