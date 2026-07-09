import { useEffect, useState, useCallback } from 'react'
import PortalTemplate from '../../portal/PortalTemplate'
import PlanChangeModal from '../../components/PlanChangeModal'
import { listarPlanes } from '../../services/planes.service'
import { listarContratos, crearContrato, cambiarPlanContrato } from '../../services/contratos.service'
import { crearPago, obtenerPagoPorId } from '../../services/pagos.service'
import { obtenerUsuarioActual } from '../../services/usuarios.service'
import LoadingSpinner from '../../components/LoadingSpinner'

type ClientPlansPageProps = {
  navItems: { label: string; iconClass: string; onClick?: () => void }[]
  logoutItem?: { label: string; iconClass: string; onClick?: () => void }
  activeNavLabel: string
  userId: string | null
}

type BillingPeriod = 'monthly' | 'yearly'

type Producto = {
  id_products: string
  name: string
  description: string | null
  type: string
  quantity: string | null
}

type Plan = {
  id: string
  name: string
  level: string
  monthlyPrice: string
  monthlyDiscountedPrice: string
  yearlySavings: string
  rawMonthlyAmount: number
  productos: Producto[]
  isRecommended?: boolean
  isCurrent?: boolean
  actionLabel: string
  billingCycle: string
}

function formatPrice(amount: string): string {
  const num = Number(amount)
  return `$${num.toLocaleString('es-CL')}`
}

function getYearlyPrice(monthlyAmount: number): number {
  return monthlyAmount * 12
}

function getDiscountPct(): number {
  return 15
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function getLevel(_name: string, index: number, total: number): string {
  if (index === 0) return 'Entrada'
  if (index === total - 1) return 'Empresarial'
  return 'Recomendado'
}

export default function Plans({ navItems, logoutItem, activeNavLabel, userId }: ClientPlansPageProps) {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly')
  const [plans, setPlans] = useState<Plan[]>([])
  const [isLoadingPlans, setIsLoadingPlans] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [plansError, setPlansError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setPlansError(null)
      try {
        const [planesData, contratosData] = await Promise.all([
          listarPlanes({ isActive: true }),
          listarContratos({ status: 'ACTIVE', id_users: userId || '-1' }),
        ])  
        if (cancelled) return

        const activeContractPlanId = contratosData.length > 0 ? contratosData[0].id_plans : null

        const sortedPlanes = [...planesData].sort((a, b) => Number(a.amount) - Number(b.amount))
        const total = sortedPlanes.length

        const mapped: Plan[] = sortedPlanes.map((p, i) => {
          const monthlyAmount = Number(p.amount)
          const yearlyAmount = getYearlyPrice(monthlyAmount)

          const isCurrent = p.id_plans === activeContractPlanId
          const productos = (p.products || []).map(pr => ({
            id_products: pr.id_products,
            name: pr.name,
            description: pr.description,
            type: pr.type,
            quantity: pr.quantity,
          }))

          return {
            id: p.id_plans,
            name: p.name,
            level: getLevel(p.name, i, total),
            monthlyPrice: formatPrice(p.amount),
            monthlyDiscountedPrice: formatPrice(String(Math.round(monthlyAmount * (1 - getDiscountPct() / 100)))),
            yearlySavings: formatPrice(String(Math.round(yearlyAmount * getDiscountPct() / 100))),
            rawMonthlyAmount: monthlyAmount,
            productos,
            isRecommended: total > 2 && i === Math.floor(total / 2),
            isCurrent,
            actionLabel: isCurrent ? 'Plan actual'
              : activeContractPlanId === null
                ? 'Contratar ahora'
                : i < sortedPlanes.findIndex(sp => sp.id_plans === activeContractPlanId)
                  ? `Cambiar a ${p.name}`
                  : 'Actualizar ahora',
            billingCycle: p.billing_cycle,
          }
        })

        setPlans(mapped)
      } catch (err) {
        setPlans([])
        setPlansError(getErrorMessage(err))
      } finally {
        if (!cancelled) setIsLoadingPlans(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [userId, refreshKey])

  const currentPlan = plans.find((p) => p.isCurrent)

  const handlePlanSelect = (plan: Plan) => {
    if (plan.isCurrent) return
    setSelectedPlan(plan)
    setIsModalOpen(true)
  }

  const handleConfirmChange = async () => {
    if (!selectedPlan) return

    setIsProcessingPayment(true)
    setPaymentError(null)

    let resolvedUserId = userId
    if (!resolvedUserId) {
      try {
        const usuario = await obtenerUsuarioActual()
        resolvedUserId = usuario?.id_users || ''
      } catch {
        setPaymentError(
          'Error de autenticación: el backend no puede verificar tu identidad. ' +
          'Esto ocurre porque KEYCLOAK_URL apunta a un túnel ngrok que el servidor no puede alcanzar. ' +
          'Contacta al administrador para que configure una URL de Keycloak accesible desde el servidor.'
        )
        setIsProcessingPayment(false)
        return
      }
    }

    const rawAmount = billingPeriod === 'monthly' ? selectedPlan.rawMonthlyAmount : Math.round(selectedPlan.rawMonthlyAmount * 12 * (1 - getDiscountPct() / 100))
    const periodLabel = billingPeriod === 'monthly' ? 'mensual' : 'anual'
    const concept = `Cambio a ${selectedPlan.name} (${periodLabel})`

    try {
      const { pago, redirectUrl } = await crearPago({
        id_users: resolvedUserId,
        amount: rawAmount,
        concept,
      })

      if (redirectUrl) {
        const popup = window.open(redirectUrl, 'Pago', 'width=520,height=750,scrollbars=yes')
        if (!popup) {
          setPaymentError('Bloqueador de ventanas emergentes detectado. Permite popups e intenta de nuevo.')
          setIsProcessingPayment(false)
          return
        }

        const pagoId = pago.id_payments

        const approved = await new Promise<boolean>((resolve) => {
          let attempts = 0
          const maxAttempts = 200
          const poll = () => {
            if (attempts >= maxAttempts) { popup.close(); resolve(false); return }
            attempts++
            setTimeout(async () => {
              try {
                const actual = await obtenerPagoPorId(pagoId)
                if (actual.status === 'APROBADO') { popup.close(); resolve(true) }
                else if (actual.status === 'RECHAZADO') { popup.close(); resolve(false) }
                else if (popup.closed) { resolve(false) }
                else { poll() }
              } catch {
                popup.closed ? resolve(false) : poll()
              }
            }, 1500)
          }
          poll()
        })

        if (!approved) {
          setPaymentError('El pago fue rechazado o cancelado.')
          setIsProcessingPayment(false)
          return
        }
      } else if (pago.status !== 'APROBADO') {
        setPaymentError('El pago no pudo ser procesado.')
        setIsProcessingPayment(false)
        return
      }
    } catch (error: unknown) {
      setPaymentError('Error al procesar el pago: ' + getErrorMessage(error))
      setIsProcessingPayment(false)
      return
    }

    try {
      const contratosData = await listarContratos({ status: 'ACTIVE', id_users: resolvedUserId })
      const activeContractId = contratosData.length > 0 ? contratosData[0].id_contracts : null

      if (activeContractId) {
        await cambiarPlanContrato(activeContractId, selectedPlan.id)
        try {
          window.dispatchEvent(new CustomEvent('auditoria:changed', { detail: { id_contracts: activeContractId } }))
        } catch (e) { /* noop */ }
      } else {
        const nuevosContratos = await crearContrato({
          id_users: resolvedUserId,
          id_plans: selectedPlan.id,
          status: 'ACTIVE',
        })
        if (nuevosContratos.length === 0) {
          setPaymentError('Error al crear el contrato. Intenta de nuevo.')
          setIsProcessingPayment(false)
          return
        }
        const [nuevo] = nuevosContratos
        try {
          window.dispatchEvent(new CustomEvent('auditoria:changed', { detail: { id_contracts: nuevo.id_contracts } }))
        } catch (e) { /* noop */ }
      }

      setIsModalOpen(false)
      setSelectedPlan(null)
      setIsProcessingPayment(false)
      setPaymentError(null)
      setRefreshKey(k => k + 1)
    } catch (error: unknown) {
      setPaymentError('Error al actualizar el contrato: ' + getErrorMessage(error))
      setIsProcessingPayment(false)
    }
  }

  const handleCloseModal = () => {
    if (isProcessingPayment) return
    setIsModalOpen(false)
    setSelectedPlan(null)
    setPaymentError(null)
  }

  const isUpgrade = selectedPlan && currentPlan
    ? plans.indexOf(selectedPlan) > plans.indexOf(currentPlan)
    : false

  return (
    <PortalTemplate
      sidebarTitle="Cliente"
      sidebarSubtitle="Planes"
      contentZoom={0.75}
      navItems={navItems}
      logoutItem={logoutItem}
      activeNavLabel={activeNavLabel}
      userInitial={userId?.[0] || 'C'}
      userName={`Usuario #${userId || '—'}`}
      userRole="Premium Member"
      headerTitle="Planes"
      headerSubtitle="Compara, elige y actualiza tu suscripción según tus necesidades."
      headerRightLabel="Ahorro anual"
      headerRightValue={`${getDiscountPct()}%`}
    >
      <div className="space-y-6 overflow-x-hidden">
        <div className="flex items-center gap-3">
          <div className="relative inline-flex rounded-xl bg-gradient-to-b from-gray-100 to-gray-200 p-1 shadow-inner">
            <div
              className={
                'pointer-events-none absolute inset-y-1 z-0 w-[calc(50%-2px)] rounded-lg bg-white shadow-md transition-all duration-300 ease-out ' +
                (billingPeriod === 'monthly' ? 'left-1' : 'left-[calc(50%+1px)]')
              }
            />
            <button
              type="button"
              onClick={() => setBillingPeriod('monthly')}
              className={
                'relative z-10 rounded-lg px-5 py-2 text-sm font-black transition-all duration-200 ' +
                (billingPeriod === 'monthly'
                  ? 'text-[#284B63]'
                  : 'text-gray-500 hover:text-gray-700')
              }
            >
              <i aria-hidden="true" className="fa-solid fa-calendar-day mr-1.5 text-xs" />
              Mensual
            </button>
            <button
              type="button"
              onClick={() => setBillingPeriod('yearly')}
              className={
                'relative z-10 rounded-lg px-5 py-2 text-sm font-black transition-all duration-200 ' +
                (billingPeriod === 'yearly'
                  ? 'text-[#284B63]'
                  : 'text-gray-500 hover:text-gray-700')
              }
            >
              <i aria-hidden="true" className="fa-solid fa-calendar-check mr-1.5 text-xs" />
              Anual
            </button>
          </div>
        </div>

        {plansError && !isLoadingPlans && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-sm font-bold text-red-600">{plansError}</p>
            <button
              onClick={() => { setPlansError(null); setIsLoadingPlans(true); setRefreshKey(k => k + 1) }}
              className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-red-100 text-red-700 hover:bg-red-200 transition"
            >
              <i aria-hidden="true" className="fa-solid fa-rotate-right" />
              Reintentar
            </button>
          </div>
        )}

        {isLoadingPlans ? (
          <LoadingSpinner />
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {plans.map((plan) => {
              const price = billingPeriod === 'monthly' ? plan.monthlyPrice : plan.monthlyDiscountedPrice
              const period = billingPeriod === 'monthly' ? '/mes' : '/mes'

              return (
                <article
                  key={plan.id}
                  className={
                    plan.isRecommended
                      ? 'relative flex min-h-full flex-col rounded-2xl border-2 border-[#3C6E71] bg-white p-6 shadow-lg transition duration-300 hover:shadow-2xl hover:brightness-[1.02]'
                      : 'relative flex min-h-full flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition duration-300 hover:border-[#3C6E71]/50 hover:shadow-xl hover:brightness-[1.02]'
                  }
                >
                  {plan.isRecommended ? (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#3C6E71] px-4 py-1 text-[10px] font-black uppercase tracking-wide text-white shadow-sm">
                      Más popular
                    </span>
                  ) : null}

                  {plan.isCurrent ? (
                    <span className="mb-4 w-fit rounded-full bg-[#284B63]/10 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-[#284B63]">
                      Tu Plan Actual
                    </span>
                  ) : (
                    <span className="mb-4 w-fit rounded-full bg-gray-100 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-gray-500">
                      {plan.level}
                    </span>
                  )}

                  <div>
                    <h4 className="text-lg font-black text-gray-500 uppercase tracking-wide">Atención Domiciliaria</h4>
                    <p className="text-2xl font-black text-[#353535]">{plan.name.slice(plan.name.lastIndexOf(' ') + 1)}</p>
                    <p className="mt-1 text-xs font-semibold text-gray-400">Ciclo: {plan.billingCycle}</p>
                  </div>

                  <div className="mt-6 border-y border-gray-100 py-5">
                    <div className="flex items-end gap-2">
                      <span className="text-4xl font-black tracking-tight text-[#284B63]">{price}</span>
                      <span className="pb-1 text-sm font-bold text-gray-400">{period}</span>
                      {billingPeriod === 'yearly' ? (
                        <span className="ml-auto self-center rounded-md bg-emerald-100 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-emerald-700 shadow-sm">
                          Ahorras {plan.yearlySavings}/año
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <ul className="mt-6 flex-grow space-y-3">
                    {plan.productos.length > 0 ? (
                      plan.productos.map((prod) => (
                        <li key={prod.id_products} className="flex items-start gap-3 text-sm font-semibold text-gray-600">
                          <i aria-hidden="true" className="fa-solid fa-circle-check mt-0.5 text-[#3C6E71]" />
                          <div>
                            <span>{prod.name}</span>
                            {prod.description && (
                              <p className="text-xs font-normal text-gray-400 mt-0.5">{prod.description}</p>
                            )}
                          </div>
                        </li>
                      ))
                    ) : (
                      <li className="flex items-start gap-3 text-sm font-semibold text-gray-400">
                        <i aria-hidden="true" className="fa-solid fa-minus-circle mt-0.5 text-gray-300" />
                        <span>Sin productos asignados</span>
                      </li>
                    )}
                  </ul>

                  <button
                    type="button"
                    disabled={plan.isCurrent}
                    onClick={() => handlePlanSelect(plan)}
                    className={
                      plan.isCurrent
                        ? 'mt-8 w-full cursor-default rounded-xl bg-gray-100 px-4 py-3 text-sm font-black text-gray-400'
                        : plan.isRecommended
                          ? 'mt-8 w-full rounded-xl bg-[#3C6E71] px-4 py-3 text-sm font-black text-white transition hover:bg-[#284B63] hover:shadow-lg'
                          : 'mt-8 w-full rounded-xl border border-[#284B63] px-4 py-3 text-sm font-black text-[#284B63] transition hover:bg-[#284B63] hover:text-white hover:shadow-lg'
                    }
                  >
                    {plan.actionLabel}
                  </button>
                </article>
              )
              })}
            </div>
          )}
      </div>

      {selectedPlan && (
        <PlanChangeModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onConfirm={handleConfirmChange}
          currentPlanName={currentPlan?.name || 'Sin plan activo'}
          newPlanName={selectedPlan.name}
          newPlanPrice={billingPeriod === 'monthly' ? selectedPlan.monthlyPrice : selectedPlan.monthlyDiscountedPrice}
          billingPeriod={billingPeriod}
          isUpgrade={!!currentPlan && (isUpgrade ?? false)}
          isProcessing={isProcessingPayment}
          errorMessage={paymentError}
        />
      )}
    </PortalTemplate>
  )
}
