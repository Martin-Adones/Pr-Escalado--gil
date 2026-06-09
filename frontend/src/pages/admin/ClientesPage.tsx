import PortalTemplate from '../../portal/PortalTemplate'

type AdminClientesPageProps = {
  navItems: { label: string; iconClass: string; onClick?: () => void }[]
  activeNavLabel: string
}

export default function ClientesPage({ navItems, activeNavLabel }: AdminClientesPageProps) {
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
      headerTitle="Gestión de Clientes"
      headerSubtitle="Administración de clientes y cuentas."
      headerRightLabel="Perfil"
      headerRightValue="Admin"
    >
      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-[#3C6E71]">
            <p className="text-xs text-gray-500 uppercase font-bold mb-1 tracking-tight">Total Clientes</p>
            <p className="text-2xl font-bold text-[#3C6E71]">2,847</p>
            <p className="text-[11px] text-[#3C6E71] mt-1 font-bold">
              <i className="fa-solid fa-caret-up"></i> 12% vs mes anterior
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <p className="text-xs text-gray-500 uppercase font-bold mb-1 tracking-tight">Activos</p>
            <p className="text-2xl font-bold text-[#353535]">2,156</p>
            <p className="text-[11px] text-gray-400 mt-1">75.7% del total</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <p className="text-xs text-gray-500 uppercase font-bold mb-1 tracking-tight">Nuevos este mes</p>
            <p className="text-2xl font-bold text-green-600">184</p>
            <p className="text-[11px] text-gray-400 mt-1">6.5% de crecimiento</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <p className="text-xs text-gray-500 uppercase font-bold mb-1 tracking-tight">Inactivos</p>
            <p className="text-2xl font-bold text-red-600">691</p>
            <p className="text-[11px] text-gray-400 mt-1">24.3% del total</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-[#353535]">Todos los Clientes</h3>
            <div className="flex gap-4">
              <input 
                type="text" 
                placeholder="Buscar cliente..." 
                className="text-sm border border-[#D9D9D9] rounded-lg px-4 py-2 w-64 focus:outline-[#3C6E71] focus:ring-1 focus:ring-[#3C6E71]" 
              />
              <button className="bg-[#284B63] hover:bg-[#284B63]/90 text-white px-4 py-2 rounded text-sm font-bold shadow-lg shadow-[#284B63]/30">
                Nuevo Cliente
              </button>
            </div>
          </div>
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs text-gray-600 uppercase border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Teléfono</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4">Contratos</th>
                <th className="px-6 py-4">Registro</th>
                <th className="px-6 py-4">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-[#353535]">
              <tr className="hover:bg-[#D9D9D9]/20 transition">
                <td className="px-6 py-4 font-semibold">Inmobiliaria Los Andes SpA</td>
                <td className="px-6 py-4 text-gray-600">contact@losandes.cl</td>
                <td className="px-6 py-4 text-gray-600">+56 2 2345 6789</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Activo
                  </span>
                </td>
                <td className="px-6 py-4 font-mono text-xs">3</td>
                <td className="px-6 py-4 text-gray-600">15 Ene, 2024</td>
                <td className="px-6 py-4 flex gap-2">
                  <button className="text-blue-600 hover:text-blue-800 p-1.5 bg-blue-50 rounded">
                    <i className="fa-solid fa-eye text-xs"></i>
                  </button>
                  <button className="text-gray-600 hover:text-gray-800 p-1.5 bg-gray-50 rounded">
                    <i className="fa-solid fa-edit text-xs"></i>
                  </button>
                  <button className="text-red-600 hover:text-red-800 p-1.5 bg-red-50 rounded">
                    <i className="fa-solid fa-trash text-xs"></i>
                  </button>
                </td>
              </tr>
              <tr className="hover:bg-[#D9D9D9]/20 transition">
                <td className="px-6 py-4 font-semibold">TechSolutions International</td>
                <td className="px-6 py-4 text-gray-600">info@techsolutions.com</td>
                <td className="px-6 py-4 text-gray-600">+56 9 8765 4321</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Activo
                  </span>
                </td>
                <td className="px-6 py-4 font-mono text-xs">1</td>
                <td className="px-6 py-4 text-gray-600">28 Feb, 2024</td>
                <td className="px-6 py-4 flex gap-2">
                  <button className="text-blue-600 hover:text-blue-800 p-1.5 bg-blue-50 rounded">
                    <i className="fa-solid fa-eye text-xs"></i>
                  </button>
                  <button className="text-gray-600 hover:text-gray-800 p-1.5 bg-gray-50 rounded">
                    <i className="fa-solid fa-edit text-xs"></i>
                  </button>
                  <button className="text-red-600 hover:text-red-800 p-1.5 bg-red-50 rounded">
                    <i className="fa-solid fa-trash text-xs"></i>
                  </button>
                </td>
              </tr>
              <tr className="hover:bg-[#D9D9D9]/20 transition">
                <td className="px-6 py-4 font-semibold">Global Services Ltd</td>
                <td className="px-6 py-4 text-gray-600">admin@globalservices.cl</td>
                <td className="px-6 py-4 text-gray-600">+56 2 3456 7890</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Inactivo
                  </span>
                </td>
                <td className="px-6 py-4 font-mono text-xs">2</td>
                <td className="px-6 py-4 text-gray-600">10 Mar, 2024</td>
                <td className="px-6 py-4 flex gap-2">
                  <button className="text-blue-600 hover:text-blue-800 p-1.5 bg-blue-50 rounded">
                    <i className="fa-solid fa-eye text-xs"></i>
                  </button>
                  <button className="text-gray-600 hover:text-gray-800 p-1.5 bg-gray-50 rounded">
                    <i className="fa-solid fa-edit text-xs"></i>
                  </button>
                  <button className="text-red-600 hover:text-red-800 p-1.5 bg-red-50 rounded">
                    <i className="fa-solid fa-trash text-xs"></i>
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
