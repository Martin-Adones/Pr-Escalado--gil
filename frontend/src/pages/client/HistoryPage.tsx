import PortalTemplate from '../../portal/PortalTemplate'
import TransactionsTable, { type Transaction } from '../../components/TransactionsTable'

type ClientHistoryPageProps = {
  navItems: { label: string; iconClass: string; onClick?: () => void }[]
  activeNavLabel: string
}

export default function History({ navItems, activeNavLabel }: ClientHistoryPageProps) {
  // Transacciones temporales. Falta conexión con Backend-DB
  // Datos en forma de mocks, sujetos a cambios
  const transactions: Transaction[] = [
    {
      id: '1',
      fecha: new Date(2026, 4, 25),
      concepto: 'Renovación mensual - Plan Enterprise',
      monto: 149990,
      moneda: 'CLP',
      estado: 'completado',
    },
    {
      id: '2',
      fecha: new Date(2026, 4, 20),
      concepto: 'Cargo por servicio adicional',
      monto: 29990,
      moneda: 'CLP',
      estado: 'completado',
    },
    {
      id: '3',
      fecha: new Date(2026, 4, 15),
      concepto: 'Suscripción mensual - Plan Enterprise',
      monto: 149990,
      moneda: 'CLP',
      estado: 'completado',
    },
    {
      id: '4',
      fecha: new Date(2026, 4, 10),
      concepto: 'Intento de pago - Tarjeta rechazada',
      monto: 149990,
      moneda: 'CLP',
      estado: 'fallido',
      codigoError: 'CARD_DECLINED',
      mensajeError: 'Tu tarjeta ha expirado. Por favor actualiza tu información de pago.',
    },
    {
      id: '5',
      fecha: new Date(2026, 4, 5),
      concepto: 'Suscripción mensual - Plan Enterprise',
      monto: 149990,
      moneda: 'CLP',
      estado: 'completado',
    },
    {
      id: '6',
      fecha: new Date(2026, 3, 25),
      concepto: 'Renovación mensual - Plan Enterprise',
      monto: 149990,
      moneda: 'CLP',
      estado: 'completado',
    },
    {
      id: '7',
      fecha: new Date(2026, 3, 20),
      concepto: 'Cargo por servicio adicional',
      monto: 29990,
      moneda: 'CLP',
      estado: 'fallido',
      codigoError: 'INSUFFICIENT_FUNDS',
      mensajeError: 'Fondos insuficientes en tu cuenta. Por favor verifica tu saldo disponible.',
    },
    {
      id: '8',
      fecha: new Date(2026, 3, 15),
      concepto: 'Suscripción mensual - Plan Enterprise',
      monto: 149990,
      moneda: 'CLP',
      estado: 'completado',
    },
    {
      id: '9',
      fecha: new Date(2026, 3, 10),
      concepto: 'Reembolso - Servicio no utilizado',
      monto: -29990,
      moneda: 'CLP',
      estado: 'completado',
    },
    {
      id: '10',
      fecha: new Date(2026, 3, 5),
      concepto: 'Suscripción mensual - Plan Enterprise',
      monto: 149990,
      moneda: 'CLP',
      estado: 'completado',
    },
    {
      id: '11',
      fecha: new Date(2026, 2, 25),
      concepto: 'Renovación mensual - Plan Enterprise',
      monto: 149990,
      moneda: 'CLP',
      estado: 'completado',
    },
    {
      id: '12',
      fecha: new Date(2026, 2, 20),
      concepto: 'Cargo por servicio adicional',
      monto: 29990,
      moneda: 'CLP',
      estado: 'procesando',
    },
  ]

  return (
    <PortalTemplate
      sidebarTitle="Cliente"
      sidebarSubtitle="Historial"
      contentZoom={0.75}
      navItems={navItems}
      activeNavLabel={activeNavLabel}
      userInitial="C"
      userName="Cliente"
      userRole="Premium Member"
      headerTitle="Historial"
      headerSubtitle="Revisa tu historial de actividades."
      headerRightLabel="Análisis"
      headerRightValue="12 meses"
    >
      <div className="space-y-6">
        <TransactionsTable transactions={transactions} />
      </div>
    </PortalTemplate>
  )
}
