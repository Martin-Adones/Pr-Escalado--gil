import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
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
    document.body.style.overflow = showAddForm ? 'hidden' : 'unset'
    return () => { document.body.style.overflow = 'unset' }
  }, [showAddForm])

  useEffect(() => {
    let cancelled = false
    const abortController = new AbortController()

    async function load() {
      if (!userId) return
      try {
        setErrorMessage(null)
        setLoading(true)

        const timeoutId = setTimeout(() => abortController.abort(), 25000)

        const data = await obtenerTarjetasUsuario(userId, abortController.signal)
        clearTimeout(timeoutId)

        if (cancelled) return
        setCards(data || [])
      } catch (err) {
        if (cancelled) return
        if (err instanceof DOMException && err.name === 'AbortError') {
          setErrorMessage('La pasarela de pago no respondió a tiempo. Intenta nuevamente.')
        } else {
          console.error('Error al cargar métodos de pago:', err)
          setErrorMessage('No se pudieron cargar los métodos de pago.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
      abortController.abort()
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
            <i aria-hidden="true" className="fa-solid fa-circle-exclamation mt-0.5" />
            <div>{errorMessage}</div>
          </div>
        )}

        {successMessage && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-start gap-3 text-emerald-800 text-sm font-semibold shadow-sm">
            <i aria-hidden="true" className="fa-solid fa-circle-check mt-0.5" />
            <div>{successMessage}</div>
          </div>
        )}

        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-[#353535]">Tus tarjetas vinculadas</h3>
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 rounded-xl bg-[#284B63] hover:bg-[#3C6E71] text-white px-4 py-2.5 text-sm font-black transition-all shadow-sm"
          >
            <i aria-hidden="true" className="fa-solid fa-plus" />
            Agregar Tarjeta
          </button>
        </div>

        {showAddForm && createPortal(
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden" style={{ transform: 'scale(0.75)', transformOrigin: 'center' }}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="text-sm font-black text-[#353535]">Nueva tarjeta</h2>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <i aria-hidden="true" className="fa-solid fa-times" />
                </button>
              </div>
              <form onSubmit={handleAddCard} className="p-6 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                    Nombre del Titular <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Juan Pérez"
                    value={holderName}
                    onChange={(e) => setHolderName(e.target.value)}
                    required
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#3C6E71]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                    Número de Tarjeta <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      maxLength={19}
                      placeholder="1111 2222 3333 4444"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      required
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 pl-9 bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#3C6E71]"
                    />
                    <i aria-hidden="true" className="fa-solid fa-credit-card absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                      Mes <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={2}
                      placeholder="MM"
                      value={expMonth}
                      onChange={(e) => setExpMonth(e.target.value.replace(/\D/g, ''))}
                      required
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-800 text-center focus:outline-none focus:ring-1 focus:ring-[#3C6E71]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                      Año <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      placeholder="AAAA"
                      value={expYear}
                      onChange={(e) => setExpYear(e.target.value.replace(/\D/g, ''))}
                      required
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-800 text-center focus:outline-none focus:ring-1 focus:ring-[#3C6E71]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                      CVC <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      placeholder="••••"
                      value={cvc}
                      onChange={(e) => setCvc(e.target.value.replace(/\D/g, ''))}
                      required
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-800 text-center focus:outline-none focus:ring-1 focus:ring-[#3C6E71]"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-[#284B63] hover:opacity-90 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <i aria-hidden="true" className="fa-solid fa-circle-notch fa-spin" /> Guardando...
                      </span>
                    ) : (
                      'Vincular Tarjeta'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        , document.body)}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-gray-200 bg-white p-6 h-32" />
            ))}
          </div>
        ) : cards.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center max-w-lg mx-auto shadow-sm">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#284B63]/5 text-[#284B63]">
              <i aria-hidden="true" className="fa-solid fa-credit-card text-2xl" />
            </div>
            <h4 className="text-lg font-bold text-[#353535]">Sin métodos de pago</h4>
            <p className="mt-2 text-sm text-gray-500 font-medium leading-relaxed max-w-sm mx-auto">
              Vincula una tarjeta para habilitar el cobro recurrente automático y poder cambiar de plan sin interrupciones.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {cards.map((card) => (
              <div
                key={card.id_user_cards}
                className="relative rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex items-center justify-between hover:shadow-md hover:border-[#284B63]/30 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#284B63]/5 border border-[#284B63]/10">
                    <i aria-hidden="true" className={getCardIcon(card.card_brand)} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#353535] text-md">
                        {card.card_brand.toUpperCase()} •••• {card.card_last4}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 font-medium mt-0.5">
                      Titular: {card.holder_name}
                    </p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1.5">
                      <i aria-hidden="true" className="fa-solid fa-lock text-[10px] mr-1" /> Tokenizado
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(card.payment_method_token)}
                  className="rounded-xl border border-gray-200 hover:border-red-200 hover:bg-red-50 text-gray-400 hover:text-red-500 p-2.5 transition shadow-sm opacity-0 group-hover:opacity-100 focus:opacity-100"
                  title="Eliminar método de pago"
                >
                  <i aria-hidden="true" className="fa-solid fa-trash-can" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </PortalTemplate>
  )
}
