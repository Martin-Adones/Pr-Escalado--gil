import { useEffect, useState, useCallback, Fragment } from 'react'
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
                : 'Actualizar plan',
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

  const allProducts: Producto[] = (() => {
    const seen = new Set<string>()
    const result: Producto[] = []
    for (const plan of plans) {
      for (const prod of plan.productos) {
        if (!seen.has(prod.id_products)) {
          seen.add(prod.id_products)
          result.push(prod)
        }
      }
    }
    return result.sort((a, b) => {
      const aFirst = plans.findIndex(p => p.productos.some(pp => pp.id_products === a.id_products))
      const bFirst = plans.findIndex(p => p.productos.some(pp => pp.id_products === b.id_products))
      if (aFirst !== bFirst) return aFirst - bFirst
      return Number(a.id_products) - Number(b.id_products)
    })
  })()

  const productTypeLabels: Record<string, string> = {
    service: 'Servicios',
    feature: 'Funcionalidades',
    storage: 'Almacenamiento',
  }

  const groupedProducts = allProducts.reduce<Record<string, Producto[]>>((acc, prod) => {
    const type = prod.type || 'other'
    if (!acc[type]) acc[type] = []
    acc[type].push(prod)
    return acc
  }, {})

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
        ) : plans.length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-sm font-semibold">No hay planes disponibles</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
              {plans.map((plan) => {
                const price = billingPeriod === 'monthly' ? plan.monthlyPrice : plan.monthlyDiscountedPrice

                return (
                  <div
                    key={plan.id}
                    className={`relative flex flex-col rounded-2xl bg-white p-5 transition-all duration-200 ${
                      plan.isCurrent
                        ? 'border border-gray-200 shadow-sm'
                        : plan.isRecommended && !plan.isCurrent
                          ? 'border-2 border-[#3C6E71] shadow-lg'
                          : 'border border-gray-200 shadow-sm hover:border-[#3C6E71]/50 hover:shadow-md'
                    }`}
                  >
                    {plan.isRecommended && !plan.isCurrent && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-[#3C6E71] px-3 py-0.5 text-[8px] font-black uppercase tracking-wide text-white shadow-sm whitespace-nowrap">
                        Más popular
                      </span>
                    )}

                    <div className="mb-3">
                      {plan.isCurrent ? (
                        <span className="inline-block rounded-full bg-[#284B63]/10 px-2.5 py-0.5 text-[8px] font-black uppercase tracking-wide text-[#284B63] mb-2">
                          Tu Plan Actual
                        </span>
                      ) : (
                        <span className="inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-[8px] font-black uppercase tracking-wide text-gray-500 mb-2">
                          {plan.level}
                        </span>
                      )}
                      <h4 className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                        Atención Domiciliaria
                      </h4>
                      <p className="text-lg font-black text-[#353535] mt-0.5 leading-tight">
                        {plan.name.slice(plan.name.lastIndexOf(' ') + 1)}
                      </p>
                    </div>

                    <div className="border-t border-gray-100 pt-3 mb-4">
                      <span className="text-2xl font-black text-[#284B63]">{price}</span>
                      <span className="text-xs font-bold text-gray-400 ml-0.5">/mes</span>
                      {billingPeriod === 'yearly' && (
                        <div className="mt-1 rounded-md bg-emerald-100 px-2 py-0.5 text-[8px] font-black text-emerald-700 inline-block">
                          Ahorras {plan.yearlySavings}/año
                        </div>
                      )}
                    </div>

                    <div className="flex-grow" />

                    <button
                      type="button"
                      disabled={plan.isCurrent}
                      onClick={() => handlePlanSelect(plan)}
                      className={`w-full rounded-xl py-2.5 text-xs font-black transition ${
                        plan.isCurrent
                          ? 'bg-gray-100 text-gray-400 cursor-default'
                          : plan.isRecommended
                            ? 'bg-[#3C6E71] text-white hover:bg-[#284B63] hover:shadow-md'
                            : 'border-2 border-[#284B63] text-[#284B63] hover:bg-[#284B63] hover:text-white hover:shadow-md'
                      }`}
                    >
                      {plan.actionLabel}
                    </button>
                  </div>
                )
              })}
            </div>

            {allProducts.length > 0 && (
              <div className="overflow-x-auto rounded-2xl bg-white shadow-sm border border-gray-200">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr>
                      <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 min-w-[160px]">
                        Productos incluidos
                      </th>
                      {plans.map((plan) => (
                        <th key={plan.id} className={`px-4 py-3 text-center text-[10px] font-black text-[#353535] ${plan.isCurrent ? 'bg-[#284B63]/5' : ''}`}>
                          {plan.name.slice(plan.name.lastIndexOf(' ') + 1)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(['service', 'feature', 'storage'] as const).map((typeKey) => {
                      const products = groupedProducts[typeKey]
                      if (!products || products.length === 0) return null
                      const label = productTypeLabels[typeKey]
                      return (
                        <Fragment key={typeKey}>
                          <tr className="bg-gray-50">
                            <td className="px-5 py-2 text-[9px] font-black uppercase tracking-widest text-gray-400" colSpan={plans.length + 1}>
                              {label}
                            </td>
                          </tr>
                          {products.map((prod) => (
                            <tr key={prod.id_products} className="border-b border-gray-50 hover:bg-[#284B63]/[0.02] transition-colors">
                              <td className="px-5 py-3.5 text-sm font-semibold text-gray-700">
                                <span>{prod.name}</span>
                                {prod.description && (
                                  <p className="text-xs font-normal text-gray-400 mt-0.5 leading-snug">{prod.description}</p>
                                )}
                              </td>
                              {plans.map((plan) => {
                                const hasProduct = plan.productos.some(p => p.id_products === prod.id_products)
                                return (
                                  <td key={plan.id} className={`px-4 py-3.5 text-center ${plan.isCurrent ? 'bg-[#284B63]/5' : ''}`}>
                                    {hasProduct ? (
                                      <i className="fa-solid fa-check text-[#3C6E71] text-sm" />
                                    ) : (
                                      <span className="text-gray-300 font-bold">−</span>
                                    )}
                                  </td>
                                )
                              })}
                            </tr>
                          ))}
                        </Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
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
          isNewContract={!currentPlan}
          isUpgrade={!!currentPlan && (isUpgrade ?? false)}
          isProcessing={isProcessingPayment}
          errorMessage={paymentError}
        />
      )}
    </PortalTemplate>
  )
}
