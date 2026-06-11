import { useEffect, useState } from 'react'
import PortalTemplate from '../../portal/PortalTemplate'
import { getCurrentBillingCycle, formatDateLabel } from '../../utils/billingCycle'
import { listarContratos } from '../../services/contratos.service'
import { listarPlanes } from '../../services/planes.service'
import type { FilaContrato, FilaPlan } from '../../services/interfaces'

type ClientPageProps = {
  navItems: { label: string; iconClass: string; onClick?: () => void }[]
  activeNavLabel: string
  userId: string | null
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

function getUsageMetrics(startDate: string, endDate: string) {
  const start = new Date(startDate.replace(/-/g, '/'))
  const end = new Date(endDate.replace(/-/g, '/'))
  const now = new Date()
  const totalMs = end.getTime() - start.getTime()
  const elapsedMs = now.getTime() - start.getTime()
  const totalDays = Math.max(1, Math.ceil(totalMs / (1000 * 60 * 60 * 24)))
  const elapsedDays = clamp(Math.floor(elapsedMs / (1000 * 60 * 60 * 24)), 0, totalDays)
  const remainingDays = clamp(Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)), 0, totalDays)
  const progressPct = clamp((elapsedDays / totalDays) * 100, 0, 100)
  return { totalDays, elapsedDays, remainingDays, progressPct }
}

export default function Dashboard({ navItems, activeNavLabel, userId }: ClientPageProps) {
  const [contrato, setContrato] = useState<FilaContrato | null>(null)
  const [plan, setPlan] = useState<FilaPlan | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const params: Record<string, string | number | undefined> = { status: 'ACTIVE', page_size: 1 }
        if (userId) params.id_users = userId
        const contratos = await listarContratos(params)
        if (cancelled) return
        if (contratos.length > 0) {
          const c = contratos[0]
          setContrato(c)
          const planes = await listarPlanes({ id_plans: c.id_plans })
          if (!cancelled && planes.length > 0) {
            setPlan(planes[0])
          }
        }
      } catch {
        // API no disponible — se queda sin datos
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [userId])

  const cycle = getCurrentBillingCycle()

  const metrics = contrato && plan
    ? getUsageMetrics(contrato.start_date, contrato.end_date)
    : null

  const planName = plan?.name || 'Plan no encontrado'
  const planPrice = plan?.amount
    ? `$${Number(plan.amount).toLocaleString('es-CL')}`
    : '$---'
  const contractNumber = contrato?.id_contracts || '---'
  const statusColor = contrato?.status === 'ACTIVE'
    ? 'bg-[#3C6E71]/10 text-[#3C6E71]'
    : 'bg-gray-100 text-gray-600'

  const statusLabel = contrato?.status === 'ACTIVE' ? 'Activo' : contrato?.status || '---'

  return (
    <PortalTemplate
      sidebarTitle="Cliente"
      sidebarSubtitle="Dashboard general"
      contentZoom={0.75}
      navItems={navItems}
      activeNavLabel={activeNavLabel}
      userInitial={userId?.[0] || 'C'}
      userName={`Usuario #${userId || '—'}`}
      userRole="Premium Member"
      headerTitle="Dashboard de Cliente"
      headerSubtitle="Gestiona tus contratos y ciclos de pago de forma centralizada."
      headerRightLabel="Próximo Cobro"
      headerRightValue={cycle.renewalDateLabel}
    >
      {loading ? (
        <div className="space-y-6 animate-pulse">
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
            <div className="h-6 w-48 bg-gray-200 rounded mb-4" />
            <div className="h-4 w-32 bg-gray-200 rounded mb-6" />
            <div className="h-2 w-full bg-gray-200 rounded mb-6" />
            <div className="grid grid-cols-2 gap-10">
              <div className="h-12 bg-gray-200 rounded" />
              <div className="h-12 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2 bg-white rounded-xl p-8 shadow-sm border border-gray-200">
              <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-[#3C6E71]/10 rounded-2xl">
                    <i className="fa-solid fa-gem text-2xl text-[#3C6E71]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{planName}</h3>
                    <p className="text-sm text-gray-400 font-medium">Contrato #{contractNumber}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 text-[10px] font-black rounded-full uppercase tracking-tighter ${statusColor}`}>
                  {statusLabel}
                </span>
              </div>

              {metrics && (
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-sm mb-3">
                      <span className="font-bold text-gray-500 uppercase text-[10px]">
                        Uso del ciclo actual
                      </span>
                      <span className="font-bold text-[#284B63]">
                        {metrics.elapsedDays} / {metrics.totalDays} días
                      </span>
                    </div>
                    <div className="h-2 w-full bg-[#D9D9D9] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#3C6E71] rounded-full shadow-[0_0_10px_rgba(60,110,113,0.3)]"
                        style={{ width: `${metrics.progressPct}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-10 pt-4 border-t border-gray-100">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Tarifa {plan?.billing_cycle === 'yearly' ? 'Anual' : 'Mensual'}</p>
                      <p className="text-2xl font-black text-[#353535]">{planPrice}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Vigencia</p>
                      <p className="text-sm font-semibold text-[#284B63]">
                        {formatDateLabel(new Date(contrato!.start_date.replace(/-/g, '/')))} — {formatDateLabel(new Date(contrato!.end_date.replace(/-/g, '/')))}
                      </p>
                    </div>
                  </div>
                </div>
              )}
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
                    Suscripción {plan?.billing_cycle === 'yearly' ? 'Anual' : 'Mensual'} - {planName}
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
                    Suscripción {plan?.billing_cycle === 'yearly' ? 'Anual' : 'Mensual'} - {planName}
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
        </>
      )}
    </PortalTemplate>
  )
}
