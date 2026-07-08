import { useState } from 'react'
import PortalTemplate from '../../portal/PortalTemplate'
import { crearPago } from '../../services/pagos.service'

type AdminCiclosDeCobroPageProps = {
  navItems: { label: string; iconClass: string; onClick?: () => void }[]
  logoutItem?: { label: string; iconClass: string; onClick?: () => void }
  activeNavLabel: string
}

export default function CiclosDeCobroPage({ navItems, logoutItem, activeNavLabel }: AdminCiclosDeCobroPageProps) {
  const [isCobroManualOpen, setIsCobroManualOpen] = useState(false)
  const [idUsers, setIdUsers] = useState('')
  const [amount, setAmount] = useState('')
  const [isProcesandoCobro, setIsProcesandoCobro] = useState(false)
  const [cobroError, setCobroError] = useState<string | null>(null)
  const conceptoCobroManual = 'Cobro manual de ciclo de facturación'

  const handleCobroManual = () => {
    setCobroError(null)
    setIsCobroManualOpen(true)
  }

  const handleCerrarCobroManual = () => {
    if (isProcesandoCobro) return
    setIsCobroManualOpen(false)
  }

  const handleEnviarCobroManual = async () => {
    setCobroError(null)

    const amountNumber = Number(amount)
    if (!idUsers.trim() || !Number.isFinite(amountNumber) || amountNumber < 1) {
      setCobroError('Completa usuario y monto antes de ejecutar el cobro.')
      return
    }

    try {
      setIsProcesandoCobro(true)
      const response = await crearPago({
        id_users: idUsers.trim(),
        amount: amountNumber,
        concept: conceptoCobroManual,
      })

      window.alert(`Cobro ejecutado. Estado: ${response.pago.status}. ID pago: ${response.pago.id_payments}`)
      setIsCobroManualOpen(false)
      setIdUsers('')
      setAmount('')
    } catch (error: any) {
      setCobroError(error?.message || 'No se pudo ejecutar el cobro manual.')
    } finally {
      setIsProcesandoCobro(false)
    }
  }

  return (
    <PortalTemplate
      sidebarTitle="Admin"
      sidebarSubtitle="Panel administrativo"
      contentZoom={0.75}
      navItems={navItems}
      logoutItem={logoutItem}
      activeNavLabel={activeNavLabel}
      userInitial="A"
      userName="Administrador"
      userRole="Admin"
      headerTitle="Ciclos de Cobro"
      headerSubtitle="Monitoreo y gestión de ciclos automáticos."
      headerRightLabel="Perfil"
      headerRightValue="Admin"
    >
      <div className="flex">
        <main className="flex-grow">
          {/* Tarjetas de resumen */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
            <div className="bg-white p-4 rounded-xl shadow-md">
              <p className="text-xs text-gray-500 uppercase font-bold mb-1">Ciclos Hoy</p>
              <p className="text-2xl font-bold text-[#284B63]">-</p>
              <p className="text-[11px] text-gray-400 mt-1">Programados para hoy</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
              <p className="text-xs text-gray-500 uppercase font-bold mb-1 tracking-tight">Exitosos</p>
              <p className="text-2xl font-bold text-[#353535]">-</p>
              <p className="text-[11px] text-gray-400 mt-1">Tasa de éxito</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
              <p className="text-xs text-gray-500 uppercase font-bold mb-1 tracking-tight">Fallidos</p>
              <p className="text-2xl font-bold text-red-600">-</p>
              <p className="text-[11px] text-gray-400 mt-1">Reintentos pendientes</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
              <p className="text-xs text-gray-500 uppercase font-bold mb-1 tracking-tight">En Proceso</p>
              <p className="text-2xl font-bold text-[#353535]">-</p>
              <p className="text-[11px] text-gray-400 mt-1">En proceso ahora</p>
            </div>
          </div>

          {/* Tabla de ciclos */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-[#353535]">Monitoreo de Ciclos Automáticos</h3>
            </div>
            <div className="p-5">
              <table className="w-full table-fixed text-left">
                <thead className="bg-gray-50 text-xs text-gray-600 uppercase border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-2 w-[25%]">Cliente</th>
                    <th className="px-3 py-2 w-[18%]">ID Contrato</th>
                    <th className="px-3 py-2 w-[20%]">Próxima Ejecución</th>
                    <th className="px-3 py-2 w-[10%]">Intentos</th>
                    <th className="px-3 py-2 w-[22%] text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  <tr className="hover:bg-gray-50 transition">
                    <td className="px-3 py-2 font-semibold truncate text-gray-400">-</td>
                    <td className="px-3 py-2 font-mono text-gray-400">-</td>
                    <td className="px-3 py-2 text-gray-400">-</td>
                    <td className="px-3 py-2 text-gray-400">-</td>
                    <td className="px-3 py-2">
                      <div className="flex justify-center">
                        <button
                          type="button"
                          onClick={handleCobroManual}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#284B63] text-white text-xs font-semibold hover:bg-[#284B63]/90 shadow-sm"
                          title="Cobro manual"
                        >
                          <i className="fa-solid fa-credit-card text-[10px]"></i>
                          Cobro manual
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {isCobroManualOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div>
                <h4 className="text-base font-bold text-[#353535]">Cobro manual</h4>
                <p className="text-xs text-gray-500">Ejecuta un cobro real usando el endpoint de pagos.</p>
              </div>
              <button
                type="button"
                onClick={handleCerrarCobroManual}
                disabled={isProcesandoCobro}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-40"
                aria-label="Cerrar modal de cobro manual"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">ID del cliente</label>
                <input
                  value={idUsers}
                  onChange={(e) => setIdUsers(e.target.value)}
                  placeholder="UUID del usuario"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#284B63] focus:outline-none focus:ring-1 focus:ring-[#284B63]"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">Monto</label>
                  <input
                    type="number"
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Ej. 9990"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#284B63] focus:outline-none focus:ring-1 focus:ring-[#284B63]"
                  />
                </div>
              </div>

              {cobroError && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{cobroError}</div>}
            </div>

            <div className="flex justify-end gap-2 border-t border-gray-100 bg-gray-50/60 px-5 py-4">
              <button
                type="button"
                onClick={handleCerrarCobroManual}
                disabled={isProcesandoCobro}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-40"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleEnviarCobroManual}
                disabled={isProcesandoCobro}
                className="rounded-lg bg-[#284B63] px-4 py-2 text-sm font-semibold text-white hover:bg-[#284B63]/90 disabled:opacity-60"
              >
                {isProcesandoCobro ? 'Procesando...' : 'Ejecutar cobro'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PortalTemplate>
  )
}
