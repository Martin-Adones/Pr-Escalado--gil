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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Configuración General */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden mb-6">
              <div className="p-6 border-b border-gray-100">
                <h3 className="font-bold text-[#353535]">Configuración General</h3>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de la Empresa</label>
                  <input 
                    type="text" 
                    defaultValue="Mi Empresa SpA"
                    className="w-full text-sm border border-gray-300 rounded-lg px-4 py-2 bg-white text-gray-900 focus:outline-[#3C6E71] focus:ring-1 focus:ring-[#3C6E71]" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email de Contacto</label>
                  <input 
                    type="email" 
                    defaultValue="admin@miempresa.cl"
                    className="w-full text-sm border border-gray-300 rounded-lg px-4 py-2 bg-white text-gray-900 focus:outline-[#3C6E71] focus:ring-1 focus:ring-[#3C6E71]" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono de Contacto</label>
                  <input 
                    type="tel" 
                    defaultValue="+56 2 2345 6789"
                    className="w-full text-sm border border-gray-300 rounded-lg px-4 py-2 bg-white text-gray-900 focus:outline-[#3C6E71] focus:ring-1 focus:ring-[#3C6E71]" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Moneda por Defecto</label>
                  <select className="w-full text-sm border border-gray-300 rounded-lg px-4 py-2 bg-white text-gray-900 focus:outline-[#3C6E71] focus:ring-1 focus:ring-[#3C6E71]">
                    <option>CLP - Peso Chileno</option>
                    <option>USD - Dólar Americano</option>
                    <option>EUR - Euro</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Configuración de Notificaciones */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden mb-6">
              <div className="p-6 border-b border-gray-100">
                <h3 className="font-bold text-[#353535]">Notificaciones</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Email de notificaciones</p>
                    <p className="text-sm text-gray-500">Recibir alertas por email</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3C6E71]"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Notificaciones de pago</p>
                    <p className="text-sm text-gray-500">Alertas sobre pagos fallidos</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3C6E71]"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Reportes semanales</p>
                    <p className="text-sm text-gray-500">Resumen semanal de actividad</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3C6E71]"></div>
                  </label>
                </div>
              </div>
            </div>

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
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Autenticación de dos factores</p>
                    <p className="text-sm text-gray-500">Añadir capa extra de seguridad</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3C6E71]"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Panel Derecho */}
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

            {/* Acciones Rápidas */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h3 className="font-bold text-[#353535]">Acciones Rápidas</h3>
              </div>
              <div className="p-6 space-y-3">
                <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition text-sm font-medium text-gray-700">
                  <i className="fa-solid fa-download mr-2"></i> Exportar datos
                </button>
                <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition text-sm font-medium text-gray-700">
                  <i className="fa-solid fa-upload mr-2"></i> Importar datos
                </button>
                <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition text-sm font-medium text-gray-700">
                  <i className="fa-solid fa-backup mr-2"></i> Crear backup
                </button>
                <button className="w-full text-left px-4 py-3 bg-red-50 hover:bg-red-100 rounded-lg transition text-sm font-medium text-red-600">
                  <i className="fa-solid fa-trash mr-2"></i> Limpiar caché
                </button>
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
