import { useEffect, useState } from 'react'
import PortalTemplate from '../../portal/PortalTemplate'
import TransactionsTable, { type Transaction } from '../../components/TransactionsTable'
import { listarContratos } from '../../services/contratos.service'
import { listarAuditoria } from '../../services/auditoria.service'
import { planesCacheService } from '../../services/planes-cache.service'

type ClientHistoryPageProps = {
  navItems: { label: string; iconClass: string; onClick?: () => void }[]
  activeNavLabel: string
  userId: string | null
}

export default function History({ navItems, activeNavLabel, userId }: ClientHistoryPageProps) {
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<Transaction[]>([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const contratos = await listarContratos({ id_users: userId || '-1' })
        if (cancelled) return

        if (contratos.length === 0) {
          setTransactions([])
          return
        }

        const userContractIds = contratos.map((c) => c.id_contracts)
        const logsPromises = userContractIds.map((contractId) =>
          listarAuditoria({ id_contracts: contractId, page_size: 100 })
        )
        const logsResponses = await Promise.all(logsPromises)
        if (cancelled) return

        const logs = logsResponses.flat()
        const contractById = new Map(contratos.map((contrato) => [contrato.id_contracts, contrato]))
        const planIds = Array.from(new Set(contratos.map((c) => c.id_plans)))

        const planesById = await planesCacheService.obtenerPlanes(planIds)
        if (cancelled) return

        const userContractIdsSet = new Set(contratos.map((c) => c.id_contracts))
        const filteredLogs = logs.filter(
          (log) => log.id_contracts && userContractIdsSet.has(log.id_contracts)
        )

        const mapped: Transaction[] = filteredLogs.map((log) => {
          let concepto = `Acción en contrato #${log.id_contracts}: ${log.action}`
          let monto = 0

          const contrato = log.id_contracts ? contractById.get(log.id_contracts) : undefined
          const plan = contrato ? planesById.get(contrato.id_plans) : undefined
          const planName = plan ? plan.name : contrato?.id_plans ?? 'Plan desconocido'
          const planAmount = plan ? plan.amount : 0
          const actorInfo = log.assigned_to ? ` por ${log.assigned_to}` : ''
          const priceLabel = planAmount > 0 ? ` por ${new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(planAmount)}` : ''

          if (log.action === 'CREAR_CONTRATO') {
            concepto = `Nuevo plan adquirido en contrato #${log.id_contracts} → ${planName}${priceLabel}${actorInfo}`
            monto = planAmount
          } else if (log.action === 'CAMBIO_CONTRATO' || log.action === 'CAMBIO_PLAN' || log.action === 'ACTUALIZAR_PLAN') {
            concepto = `Cambio de plan en contrato #${log.id_contracts} → ${planName}${priceLabel}${actorInfo}`
            monto = planAmount
          } else if (log.action === 'ACTUALIZAR_CONTRATO') {
            concepto = `Actualización de contrato #${log.id_contracts}${actorInfo}`
          } else if (log.action === 'SUSPENDER_CONTRATO') {
            concepto = `Suspensión de contrato #${log.id_contracts}${actorInfo}`
          } else if (log.action === 'FINALIZAR_CONTRATO') {
            concepto = `Finalización de contrato #${log.id_contracts}${actorInfo}`
          }

          const parsedDate = log.created_at ? new Date(log.created_at) : new Date()
          const fecha = isNaN(parsedDate.getTime()) ? new Date() : parsedDate

          return {
            id: log.id_audit_logs,
            fecha,
            concepto,
            monto,
            moneda: 'CLP',
            estado: 'completado',
          }
        })

        setTransactions(mapped)
      } catch (error) {
        console.error('Error al cargar historial:', error)
        setTransactions([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()

    const onAuditChanged = () => { if (!cancelled) load() }
    window.addEventListener('auditoria:changed', onAuditChanged)

    return () => {
      cancelled = true
      window.removeEventListener('auditoria:changed', onAuditChanged)
    }
  }, [userId])

  return (
    <PortalTemplate
      sidebarTitle="Cliente"
      sidebarSubtitle="Historial"
      contentZoom={0.75}
      navItems={navItems}
      activeNavLabel={activeNavLabel}
      userInitial={userId?.[0] || 'C'}
      userName={`Usuario #${userId || '—'}`}
      userRole="Premium Member"
      headerTitle="Historial"
      headerSubtitle="Revisa tu historial de actividades."
      headerRightLabel="Análisis"
      headerRightValue="12 meses"
    >
      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-64 bg-gray-200 rounded" />
          <div className="h-4 w-48 bg-gray-200 rounded" />
          <div className="h-28 bg-gray-200 rounded animate-pulse" />
        </div>
      ) : (
        <div className="space-y-6">
          <TransactionsTable transactions={transactions} />
        </div>
      )}
    </PortalTemplate>
  )
}
