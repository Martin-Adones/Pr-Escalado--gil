import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PortalTemplate from '../../portal/PortalTemplate'
import { getCurrentBillingCycle, formatDateLabel, clamp } from '../../utils/billingCycle'
import { listarContratos, finalizarContrato } from '../../services/contratos.service'
import { listarPlanes } from '../../services/planes.service'
import LoadingSpinner from '../../components/LoadingSpinner'
import type { FilaContrato, FilaPlan } from '../../services/interfaces'

type ClientContractsPageProps = {
  navItems: { label: string; iconClass: string; onClick?: () => void }[]
  logoutItem?: { label: string; iconClass: string; onClick?: () => void }
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

function formatCurrencyLabel(value: string) {
  return value.trim() === '' ? '-' : value
}

function detectPeriodMonths(billingCycle: string): number {
  const lc = billingCycle.toLowerCase();
  if (lc.includes('year') || lc.includes('anual') || lc.includes('año'))
    return 12
  if (lc.includes('quarter') || lc.includes('trimest')) return 3
  if (lc.includes('semi') || lc.includes('semest') || lc.includes('bianual'))
    return 6
  return 1
}

function periodSingularLabel(billingCycle: string): string {
  const lc = billingCycle.toLowerCase();
  if (lc.includes('year') || lc.includes('anual') || lc.includes('año'))
    return 'Año'
  if (lc.includes('quarter') || lc.includes('trimest')) return 'Trimestre'
  if (lc.includes('semi') || lc.includes('semest') || lc.includes('bianual'))
    return 'Semestre'
  return 'Mes'
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })
}

export default function Contracts({
  navItems,
  logoutItem,
  activeNavLabel,
  userId,
}: ClientContractsPageProps) {
  const [contrato, setContrato] = useState<FilaContrato | null>(null);
  const [plan, setPlan] = useState<FilaPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        if (!userId) {
          setLoading(false)
          return
        }
        const params: Record<string, string | number | undefined> = { 
          status: 'ACTIVE', 
          page_size: 1, 
          id_users: userId
        }
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
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Error al cargar el contrato',
        );
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
      billingCycle: plan.billing_cycle,
      status: getStatusLabel(contrato.status),
      rawStatus: contrato.status,
      recurringAmount: `$${Number(plan.amount).toLocaleString('es-CL')}`,
      cycleStartISO: contrato.start_date,
      renewalISO: contrato.end_date,
      details: [
        { label: 'Contrato', value: `#${contrato.id_contracts}` },
        { label: 'Ciclo', value: plan.billing_cycle },
        {
          label: 'Inicio',
          value: formatDateLabel(
            new Date(contrato.start_date.replace(/-/g, '/')),
          ),
        },
        {
          label: 'Término',
          value: formatDateLabel(
            new Date(contrato.end_date.replace(/-/g, '/')),
          ),
        },
      ],
    };
  }, [contrato, plan])

  const plansNavItem = useMemo(
    () => navItems.find((i) => i.label === 'Planes'),
    [navItems],
  );

  const billingPeriod = useMemo(() => {
    if (!activeContract) return null

    const contractStart = new Date(
      activeContract.cycleStartISO.replace(/-/g, '/'),
    )
    const contractEnd = new Date(activeContract.renewalISO.replace(/-/g, '/'))
    const now = new Date()
    const DAY_MS = 1000 * 60 * 60 * 24

    const periodMonths = detectPeriodMonths(activeContract.billingCycle)
    const label = periodSingularLabel(activeContract.billingCycle)

    let totalPeriods = 0
    const cursor = new Date(contractStart)
    while (cursor < contractEnd && totalPeriods < 1200) {
      cursor.setMonth(cursor.getMonth() + periodMonths)
      totalPeriods++
    }
    totalPeriods = Math.max(1, totalPeriods)

    const monthsElapsed =
      (now.getFullYear() - contractStart.getFullYear()) * 12 +
      (now.getMonth() - contractStart.getMonth())
    const currentPeriodIndex = clamp(
      Math.floor(monthsElapsed / periodMonths),
      0,
      totalPeriods - 1,
    )

    const periodStart = new Date(contractStart)
    periodStart.setMonth(
      periodStart.getMonth() + currentPeriodIndex * periodMonths,
    )

    const periodEndRaw = new Date(periodStart)
    periodEndRaw.setMonth(periodEndRaw.getMonth() + periodMonths)

    const periodEnd = periodEndRaw > contractEnd ? contractEnd : periodEndRaw

    const periodTotalDays = Math.max(
      1,
      Math.ceil((periodEnd.getTime() - periodStart.getTime()) / DAY_MS),
    )
    const periodElapsedDays = clamp(
      Math.floor((now.getTime() - periodStart.getTime()) / DAY_MS),
      0,
      periodTotalDays,
    )
    const periodRemainingDays = clamp(
      periodTotalDays - periodElapsedDays,
      0,
      periodTotalDays,
    )
    const progressPct = clamp(
      (periodElapsedDays / periodTotalDays) * 100,
      0,
      100,
    )

    return {
      label,
      currentPeriod: currentPeriodIndex + 1,
      totalPeriods,
      periodStart,
      periodEnd,
      periodTotalDays,
      periodElapsedDays,
      periodRemainingDays,
      progressPct,
    }
  }, [activeContract])

  const handleCancelContract = async () => {
    if (!contrato) return
    setIsCancelling(true)
    setCancelError(null)
    try {
      await finalizarContrato(contrato.id_contracts)
      setContrato(null)
      setPlan(null)
      setShowCancelModal(false)
      try {
        window.dispatchEvent(new CustomEvent('auditoria:changed', { detail: { id_contracts: contrato.id_contracts } }))
      } catch (e) { /* noop */ }
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : 'Error al cancelar el contrato')
    } finally {
      setIsCancelling(false)
    }
  }

  const cardClass = 'rounded-xl border border-gray-200 bg-white p-6 shadow-sm'

  const progressBarClass = 'h-full bg-[#3C6E71] rounded-full transition-all duration-500'

  return (
    <PortalTemplate
      sidebarTitle="Cliente"
      sidebarSubtitle="Contratos"
      contentZoom={0.75}
      navItems={navItems}
      logoutItem={logoutItem}
      activeNavLabel={activeNavLabel}
      userInitial={userId?.[0] || 'C'}
      userName={`Usuario #${userId || '—'}`}
      userRole="Premium Member"
      headerTitle="Mis Contratos"
      headerSubtitle="Revisa tus contratos activos e históricos."
      headerRightLabel={contrato ? "Próximo Cobro" : ""}
      headerRightValue={contrato ? cycle.renewalDateLabel : ""}
    >
      {loading ? (
        <LoadingSpinner />
      ) : activeContract && billingPeriod ? (
        <div className={cardClass}>
          {/* ── Header ── */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                Plan activo
              </p>
              <div className="flex items-center gap-3 mt-1">
                <h3 className="text-lg font-black text-[#353535]">
                  {activeContract.planName}
                </h3>
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${getStatusBadgeClasses(activeContract.rawStatus)}`}
                >
                  {activeContract.status}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(true)}
                className="shrink-0 px-3 py-2 rounded-lg text-xs font-bold border border-red-300 text-red-600 hover:bg-red-50 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={plansNavItem?.onClick ?? (() => navigate('/client/planes'))}
                className="shrink-0 px-3 py-2 rounded-lg text-xs font-bold bg-[#284B63] text-white hover:opacity-90 transition"
              >
                Cambiar plan
              </button>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-500">
                Período de facturación
              </span>
              <span className="text-[11px] font-black text-[#284B63] bg-[#284B63]/10 px-2.5 py-0.5 rounded-full">
                {billingPeriod.label} {billingPeriod.currentPeriod} de{" "}
                {billingPeriod.totalPeriods}
              </span>
            </div>

            <div className="h-2 w-full bg-[#D9D9D9] rounded-full overflow-hidden">
              <div
                className={progressBarClass}
                style={{ width: `${billingPeriod.progressPct}%` }}
              />
            </div>

            <div className="mt-2 flex items-center justify-between text-[10px] font-semibold text-gray-400">
              <span>{formatShortDate(billingPeriod.periodStart)}</span>
              <span>
                Día {billingPeriod.periodElapsedDays} de{" "}
                {billingPeriod.periodTotalDays}
                {" · "}
                {billingPeriod.periodRemainingDays} días restantes
              </span>
              <span>{formatShortDate(billingPeriod.periodEnd)}</span>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                Total a pagar
              </p>
              <p className="text-2xl font-black text-[#284B63] mt-1">
                {formatCurrencyLabel(activeContract.recurringAmount)}
              </p>
              <p className="text-[10px] text-gray-400 mt-1">
                Próximo cobro: {formatShortDate(billingPeriod.periodEnd)}
              </p>
            </div>

            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                Detalles del contrato
              </p>
              <dl className="mt-2 space-y-1.5">
                {activeContract.details.map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between text-sm"
                  >
                    <dt className="text-gray-500 font-semibold">{label}</dt>
                    <dd className="text-gray-800 font-bold">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-10 text-center">
          <p className="text-sm font-bold text-red-600">
            No se pudo cargar el contrato
          </p>
          <p className="text-xs text-red-400 mt-1">{error}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white p-10 shadow-sm text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
            <i className="fa-solid fa-file-contract text-2xl text-gray-400" />
          </div>
          <p className="text-sm font-bold text-gray-500">No tienes ningún contrato activo</p>
          <p className="mt-1 text-xs text-gray-400">Selecciona un plan y comienza a usar nuestros servicios.</p>
          <button
            type="button"
            onClick={plansNavItem?.onClick ?? (() => navigate('/client/planes'))}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#284B63] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#3C6E71]"
          >
            <i className="fa-solid fa-arrow-right" />
            Ver planes disponibles
          </button>
        </div>
      )}

      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-6">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                {isCancelling ? (
                  <i className="fa-solid fa-circle-notch fa-spin text-xl text-red-600" />
                ) : (
                  <i className="fa-solid fa-ban text-xl text-red-600" />
                )}
              </div>
              <h3 className="text-center text-xl font-bold text-[#353535]">¿Cancelar suscripción?</h3>
              <p className="mt-2 text-center text-sm text-gray-600">
                Se finalizará tu contrato{' '}
                <span className="font-semibold">#{contrato?.id_contracts}</span>
                {plan && <> del plan <span className="font-semibold">{plan.name}</span></>}.
                Esta acción no se puede deshacer.
              </p>
            </div>

            {cancelError && (
              <div className="mb-6 flex items-start gap-3 rounded-lg bg-red-50 border border-red-200 p-3">
                <i className="fa-solid fa-circle-exclamation mt-0.5 text-red-600" />
                <div>
                  <p className="text-sm font-semibold text-red-800">Error</p>
                  <p className="mt-1 text-xs text-red-700">{cancelError}</p>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setShowCancelModal(false); setCancelError(null) }}
                disabled={isCancelling}
                className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={handleCancelContract}
                disabled={isCancelling}
                className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isCancelling ? (
                  <>
                    <i className="fa-solid fa-circle-notch fa-spin" />
                    Cancelando...
                  </>
                ) : (
                  'Sí, cancelar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </PortalTemplate>
  );
}
