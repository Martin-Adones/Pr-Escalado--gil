type PlanChangeModalProps = {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  currentPlanName: string
  newPlanName: string
  newPlanPrice: string
  billingPeriod: 'monthly' | 'yearly'
  isUpgrade: boolean
}

export default function PlanChangeModal({
  isOpen,
  onClose,
  onConfirm,
  currentPlanName,
  newPlanName,
  newPlanPrice,
  billingPeriod,
  isUpgrade,
}: PlanChangeModalProps) {
  if (!isOpen) return null

  const periodLabel = billingPeriod === 'monthly' ? 'mensual' : 'anual'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-6">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#284B63]/10">
            <i className="fa-solid fa-arrow-right-arrow-left text-xl text-[#284B63]" />
          </div>
          <h3 className="text-center text-xl font-bold text-[#353535]">Confirmar cambio de plan</h3>
          <p className="mt-2 text-center text-sm text-gray-600">
            Estás a punto de cambiar tu suscripción de <span className="font-semibold">{currentPlanName}</span> a{' '}
            <span className="font-semibold">{newPlanName}</span>
          </p>
        </div>

        <div className="mb-6 rounded-xl bg-gray-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500">Nuevo plan</p>
              <p className="text-lg font-bold text-[#353535]">{newPlanName}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-gray-500">Precio {periodLabel}</p>
              <p className="text-lg font-bold text-[#284B63]">{newPlanPrice}</p>
            </div>
          </div>
        </div>

        <div className="mb-6 space-y-3">
          {isUpgrade ? (
            <div className="flex items-start gap-3 rounded-lg bg-green-50 p-3">
              <i className="fa-solid fa-circle-check mt-0.5 text-green-600" />
              <div>
                <p className="text-sm font-semibold text-green-800">Upgrade con prorrateo</p>
                <p className="mt-1 text-xs text-green-700">
                  El cambio se aplicará en tu próximo ciclo de facturación. Solo pagarás la diferencia proporcional
                  por los días restantes del mes actual.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 rounded-lg bg-blue-50 p-3">
              <i className="fa-solid fa-info-circle mt-0.5 text-blue-600" />
              <div>
                <p className="text-sm font-semibold text-blue-800">Cambio inmediato</p>
                <p className="mt-1 text-xs text-blue-700">
                  El cambio se aplicará de inmediato. Se generará un cargo por el nuevo plan y se acreditará el
                  saldo proporcional de tu plan actual.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-[#284B63] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#3C6E71]"
          >
            Confirmar cambio
          </button>
        </div>
      </div>
    </div>
  )
}
