import PortalTemplate from '../../portal/PortalTemplate'

type AdminTicketsPageProps = {
  navItems: { label: string; iconClass: string; onClick?: () => void }[]
  activeNavLabel: string
}

export default function TicketsPage({ navItems, activeNavLabel }: AdminTicketsPageProps) {
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
      headerSubtitle="Soporte y gestión de tickets de clientes."
      headerRightLabel="Perfil"
      headerRightValue="Admin"
    >
      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-blue-500">
            <p className="text-xs text-gray-500 uppercase font-bold mb-1 tracking-tight">Tickets Totales</p>
            <p className="text-2xl font-bold text-blue-600">342</p>
            <p className="text-[11px] text-blue-500 mt-1 font-bold">
              <i className="fa-solid fa-caret-up"></i> 15% vs mes anterior
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <p className="text-xs text-gray-500 uppercase font-bold mb-1 tracking-tight">Pendientes</p>
            <p className="text-2xl font-bold text-orange-600">28</p>
            <p className="text-[11px] text-gray-400 mt-1">Esperando respuesta</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <p className="text-xs text-gray-500 uppercase font-bold mb-1 tracking-tight">En Proceso</p>
            <p className="text-2xl font-bold text-[#353535]">15</p>
            <p className="text-[11px] text-gray-400 mt-1">Siendo atendidos</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <p className="text-xs text-gray-500 uppercase font-bold mb-1 tracking-tight">Resueltos Hoy</p>
            <p className="text-2xl font-bold text-green-600">12</p>
            <p className="text-[11px] text-gray-400 mt-1">Cerrados exitosamente</p>
          </div>
        </div>

        {/* Métricas de CRM */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-purple-800">CRM - Tickets por Prioridad</h4>
              <i className="fa-solid fa-chart-pie text-purple-600"></i>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-purple-700">Alta</span>
                <span className="font-bold text-purple-900">8</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-purple-700">Media</span>
                <span className="font-bold text-purple-900">15</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-purple-700">Baja</span>
                <span className="font-bold text-purple-900">5</span>
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
                <span className="text-sm text-blue-700">Promedio</span>
                <span className="font-bold text-blue-900">2.5 hrs</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-blue-700">Métrica actual</span>
                <span className="font-bold text-green-600">1.8 hrs</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-blue-700">Meta</span>
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

        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-[#353535]">Todos los Tickets</h3>
            <div className="flex gap-4">
              <select className="text-sm border border-gray-300 rounded-lg px-4 py-2 bg-white text-gray-900 focus:outline-[#3C6E71] focus:ring-1 focus:ring-[#3C6E71]">
                <option value="">Todos los estados</option>
                <option value="pending">Pendientes</option>
                <option value="in-progress">En Proceso</option>
                <option value="resolved">Resueltos</option>
              </select>
              <input 
                type="text" 
                placeholder="Buscar ticket..." 
                className="text-sm border border-gray-300 rounded-lg px-4 py-2 w-64 bg-white text-gray-900 focus:outline-[#3C6E71] focus:ring-1 focus:ring-[#3C6E71]" 
              />
              <button className="bg-[#284B63] hover:bg-[#284B63]/90 text-white px-4 py-2 rounded text-sm font-bold shadow-lg shadow-[#284B63]/30">
                Nuevo Ticket
              </button>
            </div>
          </div>
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs text-gray-600 uppercase border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Asunto</th>
                <th className="px-6 py-4">Prioridad</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4">Fecha</th>
                <th className="px-6 py-4">Agente</th>
                <th className="px-6 py-4">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-[#353535]">
              <tr className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 font-mono text-xs text-gray-600">#TK-2026-042</td>
                <td className="px-6 py-4 font-semibold">Inmobiliaria Los Andes SpA</td>
                <td className="px-6 py-4">Problema con facturación</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Alta
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    Pendiente
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-600">15 Abr, 2026 14:30</td>
                <td className="px-6 py-4 text-gray-600">Sin asignar</td>
                <td className="px-6 py-4 flex gap-2">
                  <button className="text-blue-600 hover:text-blue-800 p-1.5 bg-blue-50 rounded">
                    <i className="fa-solid fa-eye text-xs"></i>
                  </button>
                  <button className="text-green-600 hover:text-green-800 p-1.5 bg-green-50 rounded">
                    <i className="fa-solid fa-edit text-xs"></i>
                  </button>
                </td>
              </tr>
              <tr className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 font-mono text-xs text-gray-600">#TK-2026-041</td>
                <td className="px-6 py-4 font-semibold">TechSolutions International</td>
                <td className="px-6 py-4">Consulta sobre planes</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Media
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    En Proceso
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-600">15 Abr, 2026 13:15</td>
                <td className="px-6 py-4 text-gray-600">Juan Pérez</td>
                <td className="px-6 py-4 flex gap-2">
                  <button className="text-blue-600 hover:text-blue-800 p-1.5 bg-blue-50 rounded">
                    <i className="fa-solid fa-eye text-xs"></i>
                  </button>
                  <button className="text-green-600 hover:text-green-800 p-1.5 bg-green-50 rounded">
                    <i className="fa-solid fa-edit text-xs"></i>
                  </button>
                </td>
              </tr>
              <tr className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 font-mono text-xs text-gray-600">#TK-2026-040</td>
                <td className="px-6 py-4 font-semibold">Global Services Ltd</td>
                <td className="px-6 py-4">Solicitud de cancelación</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Baja
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Resuelto
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-600">15 Abr, 2026 10:45</td>
                <td className="px-6 py-4 text-gray-600">María González</td>
                <td className="px-6 py-4 flex gap-2">
                  <button className="text-blue-600 hover:text-blue-800 p-1.5 bg-blue-50 rounded">
                    <i className="fa-solid fa-eye text-xs"></i>
                  </button>
                  <button className="text-gray-400 hover:text-gray-600 p-1.5 bg-gray-50 rounded">
                    <i className="fa-solid fa-check text-xs"></i>
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
