import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PortalTemplate from '../../portal/PortalTemplate'
import { getCurrentBillingCycle, formatDateLabel } from '../../utils/billingCycle'
import { listarContratos } from '../../services/contratos.service'
import { listarPlanes } from '../../services/planes.service'
import { listarTickets } from '../../services/tickets.service'
import { listarAuditoria } from '../../services/auditoria.service'
import { planesCacheService } from '../../services/planes-cache.service'
import type { FilaContrato, FilaPlan, FilaTicketListado } from '../../services/interfaces'

type ClientPageProps = {
  navItems: { label: string; iconClass: string; onClick?: () => void }[]
  activeNavLabel: string
  userId: string | null
}

interface DashboardTransaction {
  id: string
  fecha: Date
  concepto: string
  monto: number
  estado: string
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

function getUsageMetrics(startDate: string, endDate: string) {
  const start = new Date(startDate.replace(/-/g, '/'))
  const end = new Date(endDate.replace(/-/g, '/'))
  const now = new Date()
  const totalMs = end.getTime() - start.getTime()
  const elapsedMs = now.getTime() - start.getTime()
  const totalDays = Math.max(1, Math.ceil(totalMs / (1000 * 60 * 60 * 24)))
  const elapsedDays = clamp(Math.floor(elapsedMs / (1000 * 60 * 60 * 24)), 0, totalDays)
  const remainingDays = clamp(Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)), 0, totalDays)
  const progressPct = clamp((elapsedDays / totalDays) * 100, 0, 100)
  return { totalDays, elapsedDays, remainingDays, progressPct }
}

function getTicketStatusBadgeClasses(status: string) {
  switch (status) {
    case 'open':
      return 'bg-orange-100 text-orange-800'
    case 'in_progress':
      return 'bg-blue-100 text-blue-800'
    case 'resolved':
      return 'bg-green-100 text-green-800'
    case 'closed':
      return 'bg-gray-100 text-gray-600'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function getTicketStatusLabel(status: string) {
  switch (status) {
    case 'open':
      return 'Abierto'
    case 'in_progress':
      return 'En Proceso'
    case 'resolved':
      return 'Resuelto'
    case 'closed':
      return 'Cerrado'
    default:
      return status
  }
}

export default function Dashboard({ navItems, activeNavLabel, userId }: ClientPageProps) {
  const navigate = useNavigate()
  const [contrato, setContrato] = useState<FilaContrato | null>(null)
  const [plan, setPlan] = useState<FilaPlan | null>(null)
  const [tickets, setTickets] = useState<FilaTicketListado[]>([])
  const [transactions, setTransactions] = useState<DashboardTransaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const params: Record<string, string | number | undefined> = { 
          status: 'ACTIVE', 
          page_size: 1, 
          id_users: userId || '-1' 
        }

        const contratos = await listarContratos(params)
        const allUserContratos = await listarContratos({ id_users: userId || '-1' })

        if (cancelled) return

        if (contratos.length > 0) {
          const c = contratos[0]
          setContrato(c)
          const planes = await listarPlanes({ id_plans: c.id_plans })
          if (!cancelled && planes.length > 0) {
            setPlan(planes[0])
          }
        }

        if (userId) {
          const ticketsData = await listarTickets({ id_users: userId, page_size: 3 })
          if (!cancelled) {
            setTickets(ticketsData)
          }
        }

        if (allUserContratos.length > 0) {
          const userContractIds = allUserContratos.map((c) => c.id_contracts)
          const logsPromises = userContractIds.map((contractId) =>
            listarAuditoria({ id_contracts: contractId, page_size: 5 })
          )
          const logsResponses = await Promise.all(logsPromises)
          if (cancelled) return

          const logs = logsResponses.flat()
          const planIds = Array.from(new Set(allUserContratos.map((c) => c.id_plans)))
          const planesById = await planesCacheService.obtenerPlanes(planIds)
          if (cancelled) return

          const mapped: DashboardTransaction[] = logs.map((log) => {
            let concepto = `Operación en contrato #${log.id_contracts}`
            let monto = 0

            const contr = allUserContratos.find(c => c.id_contracts === log.id_contracts)
            const planInfo = contr ? planesById.get(contr.id_plans) : undefined
            const planName = planInfo ? planInfo.name : 'Plan'
            const planAmount = planInfo ? planInfo.amount : 0

            if (log.action === 'CREAR_CONTRATO') {
              concepto = `Adquisición de Plan: ${planName}`
              monto = planAmount
            } else if (log.action === 'CAMBIO_CONTRATO' || log.action === 'CAMBIO_PLAN' || log.action === 'ACTUALIZAR_PLAN') {
              concepto = `Cambio de Plan a: ${planName}`
              monto = planAmount
            } else if (log.action === 'ACTUALIZAR_CONTRATO') {
              concepto = `Actualización de contrato #${log.id_contracts}`
            } else if (log.action === 'SUSPENDER_CONTRATO') {
              concepto = `Suspensión de suscripción`
            } else if (log.action === 'FINALIZAR_CONTRATO') {
              concepto = `Término de contrato #${log.id_contracts}`
            }

            const parsedDate = log.created_at ? new Date(log.created_at) : new Date()
            const fecha = isNaN(parsedDate.getTime()) ? new Date() : parsedDate

            return {
              id: log.id_audit_logs,
              fecha,
              concepto,
              monto,
              estado: 'Completado',
            }
          })

          const sorted = mapped.sort((a, b) => b.fecha.getTime() - a.fecha.getTime())
          if (!cancelled) {
            setTransactions(sorted.slice(0, 3))
          }
        }
      } catch (error) {
        console.error('Error al cargar datos del dashboard:', error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [userId])

  const cycle = getCurrentBillingCycle()

  const metrics = contrato && plan
    ? getUsageMetrics(contrato.start_date, contrato.end_date)
    : null

  const planName = plan?.name || 'Plan no encontrado'
  const planPrice = plan?.amount
    ? `$${Number(plan.amount).toLocaleString('es-CL')}`
    : '$---'
  const contractNumber = contrato?.id_contracts || '---'
  const statusColor = contrato?.status === 'ACTIVE'
    ? 'bg-[#3C6E71]/10 text-[#3C6E71]'
    : 'bg-gray-100 text-gray-600'

  const statusLabel = contrato?.status === 'ACTIVE' ? 'Activo' : contrato?.status || '---'

  const handleDownloadInvoice = () => {
    alert(`Generando y descargando PDF de factura correspondiente al cobro del ${cycle.lastPaymentDateLabel}...`)
  }

  const formatTxDate = (date: Date) => {
    try {
      return date.toLocaleDateString('es-CL', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    } catch {
      return String(date)
    }
  }

  return (
    <PortalTemplate
      sidebarTitle="Cliente"
      sidebarSubtitle="Dashboard general"
      contentZoom={0.75}
      navItems={navItems}
      activeNavLabel={activeNavLabel}
      userInitial={userId?.[0] || 'C'}
      userName={`Usuario #${userId || '—'}`}
      userRole="Miembro Premium"
      headerTitle="Dashboard de Cliente"
      headerSubtitle="Gestiona tus contratos y ciclos de pago de forma centralizada."
      headerRightLabel="Próximo Cobro"
      headerRightValue={cycle.renewalDateLabel}
    >
      {loading ? (
        <div className="space-y-6 animate-pulse">
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
            <div className="h-6 w-48 bg-gray-200 rounded mb-4" />
            <div className="h-4 w-32 bg-gray-200 rounded mb-6" />
            <div className="h-2 w-full bg-gray-200 rounded mb-6" />
            <div className="grid grid-cols-2 gap-10">
              <div className="h-12 bg-gray-200 rounded" />
              <div className="h-12 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 space-y-8">
            {contrato ? (
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 flex flex-col justify-between min-h-[320px]">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-[#3C6E71]/10 rounded-2xl">
                      <i className="fa-solid fa-gem text-2xl text-[#3C6E71]" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-[#353535]">{planName}</h3>
                      <p className="text-sm text-gray-400 font-medium">Contrato #{contractNumber}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 text-[10px] font-black rounded-full uppercase tracking-tighter ${statusColor}`}>
                    {statusLabel}
                  </span>
                </div>

                {metrics && (
                  <div className="space-y-6 flex-grow flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between text-sm mb-3">
                        <span className="font-bold text-gray-500 uppercase text-[10px]">
                          Uso del ciclo actual
                        </span>
                        <span className="font-bold text-[#284B63]">
                          {metrics.elapsedDays} / {metrics.totalDays} días
                        </span>
                      </div>
                      <div className="h-2 w-full bg-[#D9D9D9] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#3C6E71] rounded-full shadow-[0_0_10px_rgba(60,110,113,0.3)]"
                          style={{ width: `${metrics.progressPct}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-10 pt-4 border-t border-gray-100">
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Tarifa {plan?.billing_cycle === 'yearly' ? 'Anual' : 'Mensual'}</p>
                        <p className="text-2xl font-black text-[#353535]">{planPrice}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Vigencia</p>
                        <p className="text-sm font-semibold text-[#284B63]">
                          {formatDateLabel(new Date(contrato.start_date.replace(/-/g, '/')))} — {formatDateLabel(new Date(contrato.end_date.replace(/-/g, '/')))}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 flex flex-col justify-center items-center text-center min-h-[320px]">
                <div className="p-4 bg-gray-50 rounded-full mb-4">
                  <i className="fa-solid fa-file-invoice text-4xl text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-[#353535] mb-2">No tienes contratos activos</h3>
                <p className="text-sm text-gray-500 max-w-sm mb-6 leading-relaxed">
                  Adquiere una suscripción para acceder a todos los beneficios, soporte técnico prioritario y reportes avanzados.
                </p>
                <button
                  onClick={() => navigate('/client/planes')}
                  className="bg-[#284B63] hover:bg-[#284B63]/90 text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-[#284B63]/30 transition transform hover:scale-[1.02]"
                >
                  Explorar Planes Disponibles
                </button>
              </div>
            )}

            <div className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm">
              <div className="p-6 border-b border-gray-50 bg-gray-50/50">
                <h3 className="font-bold text-sm">Últimos Eventos y Transacciones</h3>
              </div>
              <table className="w-full text-left border-collapse">
                <thead className="text-[10px] text-gray-400 uppercase bg-white">
                  <tr>
                    <th className="px-6 py-4 font-bold">Fecha</th>
                    <th className="px-6 py-4 font-bold">Concepto</th>
                    <th className="px-6 py-4 font-bold text-right">Monto</th>
                    <th className="px-6 py-4 font-bold text-right">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-400 text-xs">
                        No hay transacciones registradas.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-gray-50/50 transition">
                        <td className="px-6 py-4 text-gray-500">{formatTxDate(tx.fecha)}</td>
                        <td className="px-6 py-4 font-semibold text-[#353535]">{tx.concepto}</td>
                        <td className="px-6 py-4 font-bold text-right text-gray-700">
                          {tx.monto > 0 ? new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(tx.monto) : '—'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 text-[9px] font-bold rounded uppercase">
                            {tx.estado}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-6">
            {/* Acciones Rápidas */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h4 className="font-bold text-sm mb-4 border-b border-gray-50 pb-2">Acciones</h4>
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={handleDownloadInvoice}
                  className="w-full text-left px-4 py-3 rounded-lg border border-gray-100 hover:border-[#3C6E71] hover:bg-[#3C6E71]/5 transition text-sm flex items-center gap-3 font-semibold text-[#353535]"
                >
                  <i className="fa-solid fa-file-pdf text-[#3C6E71]" /> Factura de {cycle.lastPaymentDateLabel}
                </button>
                <button
                  onClick={() => navigate('/client/contratos')}
                  className="w-full text-left px-4 py-3 rounded-lg border border-gray-100 hover:border-[#3C6E71] hover:bg-[#3C6E71]/5 transition text-sm flex items-center gap-3 font-semibold text-[#353535]"
                >
                  <i className="fa-solid fa-pen-nib text-[#3C6E71]" /> Ver Contratos
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex justify-between items-center mb-4 border-b border-gray-50 pb-2">
                <h4 className="font-bold text-sm">Soporte Técnico</h4>
                <button
                  onClick={() => navigate('/client/tickets')}
                  className="text-xs font-bold text-[#3C6E71] hover:underline"
                >
                  Ver todos
                </button>
              </div>
              {tickets.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-xs text-gray-500 mb-3">¿Tienes algún problema con tu servicio?</p>
                  <button
                    onClick={() => navigate('/client/tickets')}
                    className="bg-[#284B63] hover:bg-[#284B63]/90 text-white px-4 py-2 rounded-lg text-xs font-bold transition shadow-md shadow-[#284B63]/20"
                  >
                    Crear Solicitud
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {tickets.slice(0, 2).map(ticket => (
                    <div key={ticket.id_support} className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-xs">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-mono font-bold text-gray-600">#TK-{ticket.id_support}</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${getTicketStatusBadgeClasses(ticket.status)}`}>
                          {getTicketStatusLabel(ticket.status)}
                        </span>
                      </div>
                      <p className="text-gray-700 truncate font-semibold">{ticket.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-[#284B63] p-6 rounded-xl text-white shadow-lg relative overflow-hidden group">
              <i className="fa-solid fa-bolt absolute -right-4 -bottom-4 text-8xl opacity-10 group-hover:rotate-12 transition-transform" />
              <h4 className="font-bold text-lg mb-2 leading-tight">¿Necesitas más potencia?</h4>
              <p className="text-xs text-white/70 mb-4">
                Escala tu plan ahora y obtén un 10% de descuento por volumen.
              </p>
              <button
                onClick={() => navigate('/client/planes')}
                className="bg-white text-[#284B63] px-4 py-2 rounded-lg text-xs font-bold hover:scale-105 transition"
              >
                Ver Planes
              </button>
            </div>
          </div>
        </div>
      )}
    </PortalTemplate>
  )
}
