import PortalTemplate from '../../portal/PortalTemplate'
import { useMemo } from 'react'
import { getCurrentBillingCycle } from '../../utils/billingCycle'

type ClientContractsPageProps = {
  navItems: { label: string; iconClass: string; onClick?: () => void }[]
  activeNavLabel: string
}

type ContractStatus = 'Activo' | 'Por vencer' | 'Finalizado'

type Contract = {
  id: string
  planName: string
  status: ContractStatus
  recurringAmount: string
  startDateLabel: string
  renewalDateLabel: string
  cycleStartISO: string
  renewalISO: string
  paymentState?: 'ok' | 'pending' | 'grace'
  benefits: string[]
  keyClauses: string[]
}

function getStatusBadgeClasses(status: ContractStatus) {
  if (status === 'Activo') return 'bg-[#3C6E71]/10 text-[#3C6E71]'
  if (status === 'Por vencer') return 'bg-amber-100 text-amber-800'
  return 'bg-gray-100 text-gray-600'
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

function formatCurrencyLabel(value: string) {
  return value.trim() === '' ? '-' : value
}

export default function Contracts({ navItems, activeNavLabel }: ClientContractsPageProps) {
  const cycle = useMemo(() => getCurrentBillingCycle(), [])

  const activeContract: Contract = useMemo(
    () => ({
      id: 'ctr_active',
      planName: 'Plan Enterprise Plus',
      status: 'Activo',
      recurringAmount: '$45.990',
      startDateLabel: cycle.lastPaymentDateLabel,
      renewalDateLabel: cycle.renewalDateLabel,
      cycleStartISO: cycle.cycleStart.toISOString(),
      renewalISO: cycle.renewalDate.toISOString(),
      paymentState: 'ok',
      benefits: ['Soporte prioritario', 'Facturación mensual', 'Panel de métricas', 'Usuarios ilimitados'],
      keyClauses: ['Renovación automática', 'Cancelación con 15 días de anticipación', 'Disponibilidad garantizada 99.5%'],
    }),
    [cycle],
  )

  const plansNavItem = useMemo(() => navItems.find((i) => i.label === 'Planes'), [navItems])
  const ticketsNavItem = useMemo(() => navItems.find((i) => i.label === 'Tickets'), [navItems])

  const cycleMetrics = useMemo(() => {
    if (!activeContract) return null

    const start = new Date(activeContract.cycleStartISO)
    const renewal = new Date(activeContract.renewalISO)
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
      userInitial="C"
      userName="Cliente"
      userRole="Premium Member"
      headerTitle="Mis Contratos"
      headerSubtitle="Revisa tus contratos activos e históricos."
      headerRightLabel="Próximo Cobro"
      headerRightValue={cycle.renewalDateLabel}
    >
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        {activeContract && cycleMetrics ? (
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
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${getStatusBadgeClasses(
                      activeContract.status,
                    )}`}
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
                  onClick={ticketsNavItem?.onClick}
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
                <p className="text-[10px] font-bold text-gray-400 uppercase">Beneficios clave</p>
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
        ) : null}
      </div>
    </PortalTemplate>
  )
}
