import PortalTemplate from '../../portal/PortalTemplate'
import { getCurrentBillingCycle } from '../../utils/billingCycle'

type ClientPageProps = {
  navItems: { label: string; iconClass: string; onClick?: () => void }[]
  activeNavLabel: string
}

export default function Dashboard({ navItems, activeNavLabel }: ClientPageProps) {
  const cycle = getCurrentBillingCycle()

  return (
    <PortalTemplate
      sidebarTitle="Cliente"
      sidebarSubtitle="Dashboard general"
      contentZoom={0.75}
      navItems={navItems}
      activeNavLabel={activeNavLabel}
      userInitial="C"
      userName="Cliente"
      userRole="Premium Member"
      headerTitle="Dashboard de Cliente"
      headerSubtitle="Gestiona tus contratos y ciclos de pago de forma centralizada."
      headerRightLabel="Próximo Cobro"
      headerRightValue={cycle.renewalDateLabel}
    >
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 bg-white rounded-xl p-8 shadow-sm border border-gray-200">
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-[#3C6E71]/10 rounded-2xl">
                <i className="fa-solid fa-gem text-2xl text-[#3C6E71]" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Plan Enterprise Plus</h3>
                <p className="text-sm text-gray-400 font-medium">Contrato #</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-[#3C6E71] text-white text-[10px] font-black rounded-full uppercase tracking-tighter">
              Activo
            </span>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-3">
                <span className="font-bold text-gray-500 uppercase text-[10px]">
                  Uso del ciclo actual
                </span>
                <span className="font-bold text-[#284B63]">
                  {cycle.elapsedDays} / {cycle.totalDays} días
                </span>
              </div>
              <div className="h-2 w-full bg-[#D9D9D9] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#3C6E71] rounded-full shadow-[0_0_10px_rgba(60,110,113,0.3)]"
                  style={{ width: `${cycle.progressPct}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-10 pt-4 border-t border-gray-100">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Tarifa Mensual</p>
                <p className="text-2xl font-black text-[#353535]">$45.990</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Integración Pagos</p>
                <p className="text-sm font-semibold flex items-center gap-2 text-[#284B63]">
                  <i className="fa-solid fa-shield-check text-[#3C6E71]" /> Visa **** 4242
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h4 className="font-bold text-sm mb-4 border-b border-gray-50 pb-2">Acciones</h4>
            <div className="grid grid-cols-1 gap-2">
              <button className="w-full text-left px-4 py-3 rounded-lg border border-gray-100 hover:border-[#3C6E71] hover:bg-[#3C6E71]/5 transition text-sm flex items-center gap-3">
                <i className="fa-solid fa-file-pdf text-[#3C6E71]" /> Factura de {cycle.lastPaymentDateLabel}
              </button>
              <button className="w-full text-left px-4 py-3 rounded-lg border border-gray-100 hover:border-[#3C6E71] hover:bg-[#3C6E71]/5 transition text-sm flex items-center gap-3">
                <i className="fa-solid fa-pen-nib text-[#3C6E71]" /> Ver Contrato
              </button>
            </div>
          </div>

          <div className="bg-[#284B63] p-6 rounded-xl text-white shadow-lg relative overflow-hidden group">
            <i className="fa-solid fa-bolt absolute -right-4 -bottom-4 text-8xl opacity-10 group-hover:rotate-12 transition-transform" />
            <h4 className="font-bold text-lg mb-2 leading-tight">¿Necesitas más potencia?</h4>
            <p className="text-xs text-white/70 mb-4">
              Escala tu plan ahora y obtén un 10% de descuento por volumen.
            </p>
            <button className="bg-white text-[#284B63] px-4 py-2 rounded-lg text-xs font-bold hover:scale-105 transition">
              Ver Upgrades
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-50 bg-gray-50/50">
          <h3 className="font-bold text-sm">Últimas Transacciones</h3>
        </div>
        <table className="w-full text-left border-collapse">
          <thead className="text-[10px] text-gray-400 uppercase bg-white">
            <tr>
              <th className="px-6 py-4 font-bold">Fecha</th>
              <th className="px-6 py-4 font-bold">Concepto</th>
              <th className="px-6 py-4 font-bold text-right">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 text-sm">
            <tr className="hover:bg-gray-50/50 transition">
              <td className="px-6 py-4 text-gray-500">{cycle.lastPaymentDateLabel}</td>
              <td className="px-6 py-4 font-semibold text-[#353535]">
                Suscripción Mensual - Enterprise
              </td>
              <td className="px-6 py-4 text-right">
                <span className="px-2 py-0.5 bg-[#3C6E71]/10 text-[#3C6E71] text-[9px] font-black rounded-sm uppercase">
                  Completado
                </span>
              </td>
            </tr>
            <tr className="hover:bg-gray-50/50 transition">
              <td className="px-6 py-4 text-gray-500">{cycle.previousPaymentDateLabel}</td>
              <td className="px-6 py-4 font-semibold text-[#353535]">
                Suscripción Mensual - Enterprise
              </td>
              <td className="px-6 py-4 text-right">
                <span className="px-2 py-0.5 bg-[#3C6E71]/10 text-[#3C6E71] text-[9px] font-black rounded-sm uppercase">
                  Completado
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </PortalTemplate>
  )
}
