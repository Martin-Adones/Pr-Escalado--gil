import { useEffect, useState } from 'react'
import PortalTemplate from '../../portal/PortalTemplate'
import {
  obtenerTarjetasUsuario,
  eliminarTarjeta,
  type FilaUserCard
} from '../../services/pagos.service'
import { apiPost } from '../../services/api'

type ClientPaymentMethodsPageProps = {
  navItems: { label: string; iconClass: string; onClick?: () => void }[]
  logoutItem?: { label: string; iconClass: string; onClick?: () => void }
  activeNavLabel: string
  userId: string | null
}

export default function PaymentMethods({ navItems, logoutItem, activeNavLabel, userId }: ClientPaymentMethodsPageProps) {
  const [loading, setLoading] = useState(true)
  const [cards, setCards] = useState<FilaUserCard[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Form states
  const [holderName, setHolderName] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [expMonth, setExpMonth] = useState('')
  const [expYear, setExpYear] = useState('')
  const [cvc, setCvc] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)

  const [reloadTrigger, setReloadTrigger] = useState(0)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!userId) return
      try {
        setLoading(true)
        const data = await obtenerTarjetasUsuario(userId)
        if (cancelled) return
        setCards(data || [])
      } catch (err) {
        console.error('Error al cargar métodos de pago:', err)
        setErrorMessage('No se pudieron cargar los métodos de pago.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [userId, reloadTrigger])

  const handleDelete = async (token: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este método de pago?')) return
    try {
      setErrorMessage(null)
      setSuccessMessage(null)
      await eliminarTarjeta(token)
      setSuccessMessage('Método de pago eliminado con éxito.')
      setReloadTrigger(prev => prev + 1)
    } catch (err) {
      console.error('Error al eliminar tarjeta:', err)
      const msg = err instanceof Error ? err.message : 'Error al eliminar el método de pago.'
      setErrorMessage(msg)
    }
  }

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return
    if (!holderName || !cardNumber || !expMonth || !expYear || !cvc) {
      setErrorMessage('Por favor, completa todos los campos de la tarjeta.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      await apiPost('/pagos/tarjeta', {
        id_users: userId,
        titular: holderName,
        tarjeta: {
          numero: cardNumber.replace(/\s+/g, ''),
          exp_mes: expMonth.padStart(2, '0'),
          exp_ano: expYear,
          cvc: cvc
        }
      })

      setSuccessMessage('¡Tarjeta guardada con éxito!')
      setHolderName('')
      setCardNumber('')
      setExpMonth('')
      setExpYear('')
      setCvc('')
      setShowAddForm(false)
      setReloadTrigger(prev => prev + 1)
    } catch (err) {
      console.error('Error al registrar tarjeta:', err)
      const msg = err instanceof Error ? err.message : 'Error al guardar la tarjeta en la pasarela.'
      setErrorMessage(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getCardIcon = (brand: string) => {
    const b = brand.toLowerCase()
    if (b.includes('visa')) return 'fa-brands fa-cc-visa text-blue-600 text-3xl'
    if (b.includes('mastercard')) return 'fa-brands fa-cc-mastercard text-red-500 text-3xl'
    if (b.includes('amex') || b.includes('american')) return 'fa-brands fa-cc-amex text-blue-400 text-3xl'
    return 'fa-solid fa-credit-card text-gray-400 text-3xl'
  }

  // Format card number as 4 digit blocks
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '')
    const matches = val.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ''
    const parts = []

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }

    if (parts.length > 0) {
      setCardNumber(parts.join(' '))
    } else {
      setCardNumber(val)
    }
  }

  return (
    <PortalTemplate
      sidebarTitle="Cliente"
      sidebarSubtitle="Métodos de Pago"
      contentZoom={0.75}
      navItems={navItems}
      logoutItem={logoutItem}
      activeNavLabel={activeNavLabel}
      userInitial={userId?.[0] || 'C'}
      userName={`Usuario #${userId || '—'}`}
      userRole="Premium Member"
      headerTitle="Métodos de Pago"
      headerSubtitle="Administra tus tarjetas guardadas y configuraciones de pago."
      headerRightLabel="Estado Pasarela"
      headerRightValue="UCNPAY Habilitado"
    >
      <div className="space-y-6">
        {errorMessage && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex items-start gap-3 text-red-800 text-sm font-semibold shadow-sm">
            <i className="fa-solid fa-circle-exclamation mt-0.5" />
            <div>{errorMessage}</div>
          </div>
        )}

        {successMessage && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-start gap-3 text-emerald-800 text-sm font-semibold shadow-sm">
            <i className="fa-solid fa-circle-check mt-0.5" />
            <div>{successMessage}</div>
          </div>
        )}

        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-800">Tus tarjetas vinculadas</h3>
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 rounded-xl bg-[#284B63] hover:bg-[#3C6E71] text-white px-4 py-2.5 text-sm font-black transition-all shadow-sm"
          >
            <i className={`fa-solid ${showAddForm ? 'fa-xmark' : 'fa-plus'}`} />
            {showAddForm ? 'Cancelar' : 'Agregar Tarjeta'}
          </button>
        </div>

        {showAddForm && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm max-w-xl animate-fadeIn">
            <h4 className="text-md font-bold text-gray-800 mb-4">Ingresa los datos de tu tarjeta</h4>
            <form onSubmit={handleAddCard} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-gray-500 mb-1">Nombre del Titular</label>
                <input
                  type="text"
                  placeholder="Ej. Juan Pérez"
                  value={holderName}
                  onChange={(e) => setHolderName(e.target.value)}
                  required
                  className="w-full rounded-xl border border-gray-200 p-3 text-sm font-semibold outline-none focus:border-[#284B63]"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-gray-500 mb-1">Número de Tarjeta</label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={19}
                    placeholder="1111 2222 3333 4444"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    required
                    className="w-full rounded-xl border border-gray-200 p-3 pl-11 text-sm font-semibold outline-none focus:border-[#284B63]"
                  />
                  <i className="fa-solid fa-credit-card absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase text-gray-500 mb-1">Mes Expiración (MM)</label>
                  <input
                    type="text"
                    maxLength={2}
                    placeholder="MM"
                    value={expMonth}
                    onChange={(e) => setExpMonth(e.target.value.replace(/\D/g, ''))}
                    required
                    className="w-full rounded-xl border border-gray-200 p-3 text-sm font-semibold text-center outline-none focus:border-[#284B63]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-gray-500 mb-1">Año Expiración (AAAA)</label>
                  <input
                    type="text"
                    maxLength={4}
                    placeholder="AAAA"
                    value={expYear}
                    onChange={(e) => setExpYear(e.target.value.replace(/\D/g, ''))}
                    required
                    className="w-full rounded-xl border border-gray-200 p-3 text-sm font-semibold text-center outline-none focus:border-[#284B63]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-gray-500 mb-1">CVC</label>
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="•••"
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value.replace(/\D/g, ''))}
                    required
                    className="w-full rounded-xl border border-gray-200 p-3 text-sm font-semibold text-center outline-none focus:border-[#284B63]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white p-3 text-sm font-black transition disabled:bg-gray-300"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <i className="fa-solid fa-circle-notch fa-spin" /> Guardando en UCNPAY...
                  </span>
                ) : (
                  'Vincular Tarjeta de Forma Segura'
                )}
              </button>
            </form>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-gray-200 bg-white p-6 h-28" />
            ))}
          </div>
        ) : cards.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center max-w-lg mx-auto">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
              <i className="fa-solid fa-credit-card text-xl" />
            </div>
            <h4 className="text-md font-bold text-gray-700">No hay métodos de pago guardados</h4>
            <p className="mt-1 text-sm text-gray-500 font-semibold">
              Vincula tu tarjeta para habilitar el cobro recurrente automático y cambios inmediatos de plan.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {cards.map((card) => (
              <div
                key={card.id_user_cards}
                className="relative rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex items-center justify-between hover:border-[#284B63]/50 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-50 border border-gray-100">
                    <i className={getCardIcon(card.card_brand)} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-800 text-md">
                        {card.card_brand.toUpperCase()} •••• {card.card_last4}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 font-semibold mt-0.5">
                      Titular: {card.holder_name}
                    </p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">
                      Tokenizado en UCNPAY
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(card.payment_method_token)}
                  className="rounded-xl border border-gray-200 hover:border-red-200 hover:bg-red-50 text-gray-400 hover:text-red-500 p-2.5 transition shadow-sm"
                  title="Eliminar método de pago"
                >
                  <i className="fa-solid fa-trash-can" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </PortalTemplate>
  )
}
