import PortalTemplate from '../../portal/PortalTemplate'
import NuevoContratoModal from '../../components/NuevoContratoModal'
import { useState } from 'react'

type AdminDashboardPageProps = {
  navItems: { label: string; iconClass: string; onClick?: () => void }[]
  activeNavLabel: string
}

export default function Dashboard({ navItems, activeNavLabel }: AdminDashboardPageProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleOpenModal = () => setIsModalOpen(true)
  const handleCloseModal = () => setIsModalOpen(false)
  const handleSaveContrato = (contrato: any) => {
    console.log('Guardando contrato:', contrato)
    setIsModalOpen(false)
  }

  return (
    <PortalTemplate
      sidebarTitle="Administrador"
      sidebarSubtitle="Panel administrativo"
      contentZoom={0.75}
      navItems={navItems}
      activeNavLabel={activeNavLabel}
      userInitial="A"
      userName="Administrador"
      userRole="Juan Castro Fobinachi"
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
              <p className="text-2xl font-bold text-[#284B63]">82.4%</p>
              <p className="text-[11px] text-[#284B63] mt-1 font-bold">
                <i className="fa-solid fa-caret-up"></i> 2.1% vs mes anterior
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
              <p className="text-xs text-gray-500 uppercase font-bold mb-1 tracking-tight">MRR Total</p>
              <p className="text-2xl font-bold text-[#353535]">$12.450</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
              <p className="text-xs text-gray-500 uppercase font-bold mb-1 tracking-tight">Fallos de Cobro</p>
              <p className="text-2xl font-bold text-red-600">1.8%</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
              <p className="text-xs text-gray-500 uppercase font-bold mb-1 tracking-tight">Contratos Activos</p>
              <p className="text-2xl font-bold text-[#353535]">1,240</p>
            </div>
          </div>

          {/* Módulo de Gestión de Contratos */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-[#353535]">Gestión de Contratos</h3>
              <button 
                onClick={handleOpenModal}
                className="inline-flex items-center justify-center bg-[#284B63] hover:bg-[#284B63]/90 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-[#284B63]/30"
              >
                <i className="fa-solid fa-plus mr-2"></i>Nuevo Plan/Contrato
              </button>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-600 font-semibold mb-1">Contratos Activos</p>
                  <p className="text-2xl font-bold text-blue-700">1,240</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                  <p className="text-sm text-green-600 font-semibold mb-1">Nuevos este mes</p>
                  <p className="text-2xl font-bold text-green-700">89</p>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                  <p className="text-sm text-orange-600 font-semibold mb-1">Por vencer</p>
                  <p className="text-2xl font-bold text-orange-700">15</p>
                </div>
              </div>

              <div>
                <table className="w-full table-fixed text-left">
                  <thead className="bg-gray-50 text-xs text-gray-600 uppercase border-b border-gray-200">
                    <tr>
                      <th className="px-3 py-2 w-[34%]">Cliente</th>
                      <th className="px-3 py-2 w-[15%]">Plan</th>
                      <th className="px-3 py-2 w-[18%]">Estado</th>
                      <th className="px-3 py-2 w-[18%]">Vencimiento</th>
                      <th className="px-3 py-2 w-[15%] text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    <tr className="hover:bg-gray-50 transition">
                      <td className="px-3 py-2 font-semibold truncate">Inmobiliaria Los Andes SpA</td>
                      <td className="px-3 py-2">Premium</td>
                      <td className="px-3 py-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Activo
                        </span>
                      </td>
                      <td className="px-3 py-2">15 Jun, 2026</td>
                      <td className="px-3 py-2">
                        <div className="flex justify-center gap-2">
                        <button className="text-blue-600 hover:text-blue-800 p-1.5 bg-blue-50 rounded">
                          <i className="fa-solid fa-eye text-xs"></i>
                        </button>
                        <button className="text-gray-600 hover:text-gray-800 p-1.5 bg-gray-50 rounded">
                          <i className="fa-solid fa-edit text-xs"></i>
                        </button>
                        </div>
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50 transition">
                      <td className="px-3 py-2 font-semibold truncate">TechSolutions International</td>
                      <td className="px-3 py-2">Standard</td>
                      <td className="px-3 py-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Pendiente Firma
                        </span>
                      </td>
                      <td className="px-3 py-2">20 May, 2026</td>
                      <td className="px-3 py-2">
                        <div className="flex justify-center gap-2">
                        <button className="text-blue-600 hover:text-blue-800 p-1.5 bg-blue-50 rounded">
                          <i className="fa-solid fa-eye text-xs"></i>
                        </button>
                        <button className="text-gray-600 hover:text-gray-800 p-1.5 bg-gray-50 rounded">
                          <i className="fa-solid fa-edit text-xs"></i>
                        </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div> 
        </main>
      </div>
      
      {/* Modal para Nuevo Contrato */}
      <NuevoContratoModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveContrato}
      />
    </PortalTemplate>
  )
}
