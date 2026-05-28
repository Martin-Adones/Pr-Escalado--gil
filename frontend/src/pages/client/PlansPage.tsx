import { useState } from 'react'
import PortalTemplate from '../../portal/PortalTemplate'
import PlanChangeModal from '../../components/PlanChangeModal'

type ClientPlansPageProps = {
  navItems: { label: string; iconClass: string; onClick?: () => void }[]
  activeNavLabel: string
}

type BillingPeriod = 'monthly' | 'yearly'

type Plan = {
  name: string
  level: string
  monthlyPrice: string
  yearlyPrice: string
  yearlyOriginalPrice: string
  description: string
  features: string[]
  isRecommended?: boolean
  isCurrent?: boolean
  actionLabel: string
}

const plans: Plan[] = [
  {
    name: 'Básico',
    level: 'Entrada',
    monthlyPrice: '$19.990',
    yearlyPrice: '$203.900',
    yearlyOriginalPrice: '$239.880',
    description: 'Ideal para comenzar con las herramientas esenciales.',
    features: ['1 contrato activo', 'Soporte estándar', 'Facturación mensual', 'Reportes básicos'],
    actionLabel: 'Contratar básico',
  },
  {
    name: 'Profesional',
    level: 'Recomendado',
    monthlyPrice: '$32.990',
    yearlyPrice: '$336.500',
    yearlyOriginalPrice: '$395.880',
    description: 'Equilibrio perfecto para equipos que buscan escalar.',
    features: ['5 contratos activos', 'Soporte prioritario', 'Métricas avanzadas', 'Automatización de pagos'],
    isRecommended: true,
    actionLabel: 'Actualizar ahora',
  },
  {
    name: 'Enterprise Plus',
    level: 'Empresarial',
    monthlyPrice: '$45.990',
    yearlyPrice: '$469.100',
    yearlyOriginalPrice: '$551.880',
    description: 'Máximo rendimiento para operaciones críticas y equipos grandes.',
    features: ['Contratos ilimitados', 'Disponibilidad garantizada 99.5%', 'Usuarios ilimitados', 'Panel de métricas completo'],
    isCurrent: true,
    actionLabel: 'Plan actual',
  },
]

export default function Plans({ navItems, activeNavLabel }: ClientPlansPageProps) {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly')
  const [isLoadingPlans] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)

  const currentPlan = plans.find((p) => p.isCurrent)

  const handlePlanSelect = (plan: Plan) => {
    if (plan.isCurrent) return
    setSelectedPlan(plan)
    setIsModalOpen(true)
  }

  const handleConfirmChange = () => {
    console.log('Confirmar cambio de plan:', selectedPlan)
    setIsModalOpen(false)
    setSelectedPlan(null)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedPlan(null)
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
      activeNavLabel={activeNavLabel}
      userInitial="C"
      userName="Cliente"
      userRole="Premium Member"
      headerTitle="Planes"
      headerSubtitle="Compara, elige y actualiza tu suscripción según tus necesidades."
      headerRightLabel="Ahorro anual"
      headerRightValue="15%"
    >
      <div className="space-y-8">
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-[#D9D9D9] shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-gray-100 bg-gray-50/60 p-6 lg:flex-row lg:items-center">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wide text-gray-400">Comparación de precios</p>
              <h3 className="mt-1 text-lg font-black text-[#353535]">
                Tabla de planes en modalidad {billingPeriod === 'monthly' ? 'mensual' : 'anual'}
              </h3>
            </div>
            <div className="flex rounded-full bg-[#D9D9D9] p-1">
              <button
                type="button"
                onClick={() => setBillingPeriod('monthly')}
                className={
                  billingPeriod === 'monthly'
                    ? 'rounded-full bg-[#284B63] px-6 py-2 text-sm font-black text-white shadow-sm transition'
                    : 'rounded-full px-6 py-2 text-sm font-black text-[#284B63] transition hover:text-[#3C6E71]'
                }
              >
                Mensual
              </button>
              <button
                type="button"
                onClick={() => setBillingPeriod('yearly')}
                className={
                  billingPeriod === 'yearly'
                    ? 'rounded-full bg-[#284B63] px-6 py-2 text-sm font-black text-white shadow-sm transition'
                    : 'rounded-full px-6 py-2 text-sm font-black text-[#284B63] transition hover:text-[#3C6E71]'
                }
              >
                Anual
              </button>
            </div>
          </div>

          {isLoadingPlans ? (
            <div className="grid grid-cols-1 gap-4 p-6 lg:grid-cols-3">
              {[0, 1, 2].map((item) => (
                <div key={item} className="rounded-xl border border-gray-100 p-5">
                  <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                  <div className="mt-5 h-8 w-36 animate-pulse rounded bg-gray-200" />
                  <div className="mt-6 space-y-3">
                    <div className="h-3 w-full animate-pulse rounded bg-gray-100" />
                    <div className="h-3 w-10/12 animate-pulse rounded bg-gray-100" />
                    <div className="h-3 w-8/12 animate-pulse rounded bg-gray-100" />
                  </div>
                  <div className="mt-6 h-10 w-full animate-pulse rounded-lg bg-gray-200" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 p-6 lg:grid-cols-3">
              {plans.map((plan) => {
                const price = billingPeriod === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice
                const period = billingPeriod === 'monthly' ? '/mes' : '/año'

                return (
                  <article
                    key={plan.name}
                    className={
                      plan.isRecommended
                        ? 'relative flex min-h-full flex-col rounded-2xl border-2 border-[#3C6E71] bg-white p-6 shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-2xl'
                        : 'relative flex min-h-full flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#3C6E71]/50 hover:shadow-xl'
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
                      <h4 className="text-2xl font-black text-[#353535]">{plan.name}</h4>
                      <p className="mt-2 min-h-12 text-sm font-medium leading-6 text-gray-500">{plan.description}</p>
                    </div>

                    <div className="mt-6 border-y border-gray-100 py-5">
                      <div className="flex items-end gap-2">
                        <span className="text-4xl font-black tracking-tight text-[#284B63]">{price}</span>
                        <span className="pb-1 text-sm font-bold text-gray-400">{period}</span>
                        {billingPeriod === 'yearly' ? (
                          <span className="pb-1 text-sm font-black text-gray-400 line-through">{plan.yearlyOriginalPrice}</span>
                        ) : null}
                      </div>
                    </div>

                    <ul className="mt-6 flex-grow space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3 text-sm font-semibold text-gray-600">
                          <i className="fa-solid fa-circle-check mt-0.5 text-[#3C6E71]" />
                          <span>{feature}</span>
                        </li>
                      ))}
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
        </section>
      </div>

      {selectedPlan && currentPlan && (
        <PlanChangeModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onConfirm={handleConfirmChange}
          currentPlanName={currentPlan.name}
          newPlanName={selectedPlan.name}
          newPlanPrice={billingPeriod === 'monthly' ? selectedPlan.monthlyPrice : selectedPlan.yearlyPrice}
          billingPeriod={billingPeriod}
          isUpgrade={isUpgrade}
        />
      )}
    </PortalTemplate>
  )
}
