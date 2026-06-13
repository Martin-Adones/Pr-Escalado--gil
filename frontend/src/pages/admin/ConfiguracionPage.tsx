import PortalTemplate from '../../portal/PortalTemplate'

type AdminConfiguracionPageProps = {
  navItems: { label: string; iconClass: string; onClick?: () => void }[]
  activeNavLabel: string
}

export default function ConfiguracionPage({ navItems, activeNavLabel }: AdminConfiguracionPageProps) {
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
      headerTitle="Configuración"
      headerSubtitle="Configuración del sistema y preferencias."
      headerRightLabel="Perfil"
      headerRightValue="Admin"
    >
      <div className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            {/* Configuración de Seguridad */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h3 className="font-bold text-[#353535]">Seguridad</h3>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cambiar Contraseña</label>
                  <div className="space-y-3">
                    <input 
                      type="password" 
                      placeholder="Contraseña actual"
                      className="w-full text-sm border border-gray-300 rounded-lg px-4 py-2 bg-white text-gray-900 focus:outline-[#3C6E71] focus:ring-1 focus:ring-[#3C6E71]" 
                    />
                    <input 
                      type="password" 
                      placeholder="Nueva contraseña"
                      className="w-full text-sm border border-gray-300 rounded-lg px-4 py-2 bg-white text-gray-900 focus:outline-[#3C6E71] focus:ring-1 focus:ring-[#3C6E71]" 
                    />
                    <input 
                      type="password" 
                      placeholder="Confirmar nueva contraseña"
                      className="w-full text-sm border border-gray-300 rounded-lg px-4 py-2 bg-white text-gray-900 focus:outline-[#3C6E71] focus:ring-1 focus:ring-[#3C6E71]" 
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Información del Sistema */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h3 className="font-bold text-[#353535]">Información del Sistema</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Versión</p>
                  <p className="font-medium">v2.1.0</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Última actualización</p>
                  <p className="font-medium">15 Abr, 2026</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Licencia</p>
                  <p className="font-medium">Enterprise</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Base de datos</p>
                  <p className="font-medium">PostgreSQL 14.2</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Botones de Guardar */}
        <div className="flex justify-end gap-4 mt-8">
          <button className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
            Cancelar
          </button>
          <button className="px-6 py-2 bg-[#284B63] hover:bg-[#284B63]/90 text-white rounded-lg text-sm font-medium shadow-lg shadow-[#284B63]/30 transition">
            Guardar Cambios
          </button>
        </div>
      </div>
    </PortalTemplate>
  )
}
