import { useEffect, useMemo, useState } from 'react'
import PortalTemplate from '../../portal/PortalTemplate'
import { getCurrentBillingCycle, formatDateLabel } from '../../utils/billingCycle'
import { listarContratos } from '../../services/contratos.service'
import { listarPlanes } from '../../services/planes.service'
import type { FilaContrato, FilaPlan } from '../../services/interfaces'

type ClientContractsPageProps = {
  navItems: { label: string; iconClass: string; onClick?: () => void }[]
  activeNavLabel: string
  userId: string | null
}

function getStatusBadgeClasses(status: string) {
  if (status === 'ACTIVE') return 'bg-[#3C6E71]/10 text-[#3C6E71]'
  if (status === 'SUSPENDED') return 'bg-amber-100 text-amber-800'
  return 'bg-gray-100 text-gray-600'
}

function getStatusLabel(status: string) {
  const map: Record<string, string> = {
    ACTIVE: 'Activo',
    DRAFT: 'Borrador',
    SUSPENDED: 'Suspendido',
    TERMINATED: 'Finalizado',
    CANCELLED: 'Cancelado',
  }
  return map[status] || status
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

function formatCurrencyLabel(value: string) {
  return value.trim() === '' ? '-' : value
}

export default function Contracts({ navItems, activeNavLabel, userId }: ClientContractsPageProps) {
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
        // API no disponible
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [userId])

  const cycle = useMemo(() => getCurrentBillingCycle(), [])

  const activeContract = useMemo(() => {
    if (!contrato || !plan) return null
    return {
      id: contrato.id_contracts,
      planName: plan.name,
      status: getStatusLabel(contrato.status),
      rawStatus: contrato.status,
      recurringAmount: `$${Number(plan.amount).toLocaleString('es-CL')}`,
      startDateLabel: formatDateLabel(new Date(contrato.start_date.replace(/-/g, '/'))),
      renewalDateLabel: formatDateLabel(new Date(contrato.end_date.replace(/-/g, '/'))),
      cycleStartISO: contrato.start_date,
      renewalISO: contrato.end_date,
      paymentState: 'ok' as const,
      benefits: [
        `Ciclo de facturación: ${plan.billing_cycle}`,
        `Contrato #${contrato.id_contracts}`,
        `Inicio: ${formatDateLabel(new Date(contrato.start_date.replace(/-/g, '/')))}`,
        `Término: ${formatDateLabel(new Date(contrato.end_date.replace(/-/g, '/')))}`,
      ],
      keyClauses: [
        'Renovación automática',
        'Cancelación con 15 días de anticipación',
        'Disponibilidad garantizada 99.5%',
      ],
    }
  }, [contrato, plan])

  const plansNavItem = useMemo(() => navItems.find((i) => i.label === 'Planes'), [navItems])
  const ticketsNavItem = useMemo(() => navItems.find((i) => i.label === 'Tickets'), [navItems])
  const historyNavItem = useMemo(() => navItems.find((i) => i.label === 'Historial'), [navItems])

  const cycleMetrics = useMemo(() => {
    if (!activeContract) return null
    const start = new Date(activeContract.cycleStartISO.replace(/-/g, '/'))
    const renewal = new Date(activeContract.renewalISO.replace(/-/g, '/'))
    const now = new Date()
    const totalMs = renewal.getTime() - start.getTime()
    const elapsedMs = now.getTime() - start.getTime()
    const remainingMs = renewal.getTime() - now.getTime()
    const totalDays = Math.max(1, Math.ceil(totalMs / (1000 * 60 * 60 * 24)))
    const elapsedDays = clamp(Math.floor(elapsedMs / (1000 * 60 * 60 * 24)), 0, totalDays)
    const remainingDays = clamp(Math.ceil(remainingMs / (1000 * 60 * 60 * 24)), 0, totalDays)
    const progressPct = clamp((elapsedDays / totalDays) * 100, 0, 100)
    return { totalDays, elapsedDays, remainingDays, progressPct }
  }, [activeContract])

  const alertVariant = useMemo(() => {
    if (!activeContract) return 'normal'
    if (activeContract.paymentState === 'pending') return 'warning'
    if (activeContract.paymentState === 'grace') return 'danger'
    return 'normal'
  }, [activeContract])

  return (
    <PortalTemplate
      sidebarTitle="Cliente"
      sidebarSubtitle="Contratos"
      contentZoom={0.75}
      navItems={navItems}
      activeNavLabel={activeNavLabel}
      userInitial={userId?.[0] || 'C'}
      userName={`Usuario #${userId || '—'}`}
      userRole="Premium Member"
      headerTitle="Mis Contratos"
      headerSubtitle="Revisa tus contratos activos e históricos."
      headerRightLabel="Próximo Cobro"
      headerRightValue={cycle.renewalDateLabel}
    >
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-64 bg-gray-200 rounded" />
            <div className="h-4 w-48 bg-gray-200 rounded" />
            <div className="h-2 w-full bg-gray-200 rounded" />
            <div className="grid grid-cols-3 gap-4">
              <div className="h-24 bg-gray-200 rounded" />
              <div className="h-24 bg-gray-200 rounded" />
              <div className="h-24 bg-gray-200 rounded" />
            </div>
          </div>
        ) : activeContract && cycleMetrics ? (
          <div
            className={
              alertVariant === 'danger'
                ? 'rounded-xl border border-red-200 bg-red-50 p-5'
                : alertVariant === 'warning'
                  ? 'rounded-xl border border-amber-200 bg-amber-50 p-5'
                  : 'rounded-xl border border-gray-200 bg-white p-5'
            }
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Plan activo</p>
                <div className="flex items-center gap-3 mt-1">
                  <h3 className="text-lg font-black text-[#353535]">{activeContract.planName}</h3>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${getStatusBadgeClasses(activeContract.rawStatus)}`}
                  >
                    {activeContract.status}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={plansNavItem?.onClick}
                  className="px-3 py-2 rounded-lg text-xs font-bold bg-[#284B63] text-white hover:opacity-95 transition"
                >
                  Cambiar plan
                </button>
                <button
                  type="button"
                  onClick={historyNavItem?.onClick}
                  className="px-3 py-2 rounded-lg text-xs font-bold border border-gray-200 text-gray-700 hover:bg-gray-50 transition"
                >
                  Configurar pagos
                </button>
              </div>
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between text-xs font-bold text-gray-600">
                <span>Ciclo actual</span>
                <span>{cycleMetrics.remainingDays} días para renovar</span>
              </div>
              <div className="mt-2 h-2 w-full bg-[#D9D9D9] rounded-full overflow-hidden">
                <div
                  className={
                    alertVariant === 'danger'
                      ? 'h-full bg-red-500 rounded-full'
                      : alertVariant === 'warning'
                        ? 'h-full bg-amber-500 rounded-full'
                        : 'h-full bg-[#3C6E71] rounded-full'
                  }
                  style={{ width: `${cycleMetrics.progressPct}%` }}
                />
              </div>
              <div className="mt-2 text-[10px] font-semibold text-gray-500">
                Día {cycleMetrics.elapsedDays} de {cycleMetrics.totalDays}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Total a pagar</p>
                <p className="text-2xl font-black text-[#284B63] mt-1">{formatCurrencyLabel(activeContract.recurringAmount)}</p>
                <p className="text-[10px] text-gray-500 mt-1">Próxima renovación: {activeContract.renewalDateLabel}</p>
              </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Desglose</p>
                <div className="mt-2 space-y-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 font-semibold">Suscripción</span>
                    <span className="text-gray-900 font-bold">{formatCurrencyLabel(activeContract.recurringAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 font-semibold">Impuestos</span>
                    <span className="text-gray-900 font-bold">Incl.</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Detalles del contrato</p>
                <ul className="mt-2 space-y-1 text-sm text-gray-700">
                  {activeContract.benefits.slice(0, 4).map((b) => (
                    <li key={b} className="flex gap-2">
                      <i className="fa-solid fa-circle-check text-[#3C6E71] mt-0.5" />
                      <span className="font-semibold">{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No hay contratos activos en este momento.
          </div>
        )}
      </div>
    </PortalTemplate>
  )
}
