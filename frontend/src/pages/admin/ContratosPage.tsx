import PortalTemplate from '../../portal/PortalTemplate'

type AdminContractsPageProps = {
  navItems: { label: string; iconClass: string; onClick?: () => void }[]
  activeNavLabel: string
}

export default function ContratosPage({ navItems, activeNavLabel }: AdminContractsPageProps) {
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
      <div className="p-8">
        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-[#353535]">Todos los Contratos</h3>
            <button className="bg-[#284B63] hover:bg-[#284B63]/90 text-white px-4 py-2 rounded text-sm font-bold shadow-lg shadow-[#284B63]/30">
              Nuevo Contrato
            </button>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-600 font-semibold mb-1">Contratos Activos</p>
                <p className="text-2xl font-bold text-blue-700">1,240</p>
                <p className="text-xs text-blue-500 mt-1">24 pendientes de firma</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-sm text-green-600 font-semibold mb-1">Renovados este mes</p>
                <p className="text-2xl font-bold text-green-700">89</p>
                <p className="text-xs text-green-500 mt-1">Tasa: 82.4%</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <p className="text-sm text-orange-600 font-semibold mb-1">Por vencer</p>
                <p className="text-2xl font-bold text-orange-700">15</p>
                <p className="text-xs text-orange-500 mt-1">Próximos 30 días</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-xs text-gray-600 uppercase border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">ID Contrato</th>
                    <th className="px-4 py-3">Plan</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3">Vencimiento</th>
                    <th className="px-4 py-3">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  <tr className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-semibold">Inmobiliaria Los Andes SpA</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">CT-2026-9901</td>
                    <td className="px-4 py-3">Premium</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Activo
                      </span>
                    </td>
                    <td className="px-4 py-3">15 Jun, 2026</td>
                    <td className="px-4 py-3 flex gap-2">
                      <button className="text-blue-600 hover:text-blue-800 p-1.5 bg-blue-50 rounded">
                        <i className="fa-solid fa-eye text-xs"></i>
                      </button>
                      <button className="text-gray-600 hover:text-gray-800 p-1.5 bg-gray-50 rounded">
                        <i className="fa-solid fa-edit text-xs"></i>
                      </button>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-semibold">TechSolutions International</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">CT-2026-8854</td>
                    <td className="px-4 py-3">Standard</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Pendiente Firma
                      </span>
                    </td>
                    <td className="px-4 py-3">20 May, 2026</td>
                    <td className="px-4 py-3 flex gap-2">
                      <button className="text-blue-600 hover:text-blue-800 p-1.5 bg-blue-50 rounded">
                        <i className="fa-solid fa-eye text-xs"></i>
                      </button>
                      <button className="text-gray-600 hover:text-gray-800 p-1.5 bg-gray-50 rounded">
                        <i className="fa-solid fa-edit text-xs"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </PortalTemplate>
  )
}
