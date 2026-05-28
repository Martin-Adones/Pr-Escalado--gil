import { useState } from 'react'

export type TransactionStatus = 'completado' | 'pendiente' | 'fallido' | 'procesando'

export type Transaction = {
  id: string
  fecha: Date
  concepto: string
  monto: number
  moneda: string
  estado: TransactionStatus
  codigoError?: string
  mensajeError?: string
}

type TransactionsTableProps = {
  transactions: Transaction[]
}

const statusConfig: Record<TransactionStatus, { label: string; className: string }> = {
  completado: {
    label: 'Completado',
    className: 'bg-green-100 text-green-800 border-green-200',
  },
  pendiente: {
    label: 'Pendiente',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  fallido: {
    label: 'Fallido',
    className: 'bg-red-100 text-red-800 border-red-200',
  },
  procesando: {
    label: 'Procesando',
    className: 'bg-blue-100 text-blue-800 border-blue-200',
  },
}

function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: currency === 'CLP' ? 'CLP' : 'USD',
  }).format(amount)
}

const ITEMS_PER_PAGE = 10

export default function TransactionsTable({ transactions }: TransactionsTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [alertDismissed, setAlertDismissed] = useState(false)

  // Orden cronológico: más recientes primero
  const sortedTransactions = [...transactions].sort((a, b) => b.fecha.getTime() - a.fecha.getTime())

  // Detectar transacciones fallidas pendientes de resolución
  const failedTransactions = sortedTransactions.filter((t) => t.estado === 'fallido')
  const hasPendingFailures = failedTransactions.length > 0 && !alertDismissed

  const totalPages = Math.ceil(sortedTransactions.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentTransactions = sortedTransactions.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {hasPendingFailures && (
        <div className="bg-red-50 border-b border-red-100 px-5 py-4 flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <i className="fa-solid fa-triangle-exclamation text-red-600 text-lg" />
          </div>
          <div className="flex-grow">
            <p className="text-sm font-semibold text-red-800">
              Tienes {failedTransactions.length} pago{failedTransactions.length > 1 ? 's' : ''} fallido{failedTransactions.length > 1 ? 's' : ''} pendiente{failedTransactions.length > 1 ? 's' : ''} de resolución
            </p>
            <p className="text-xs text-red-600 mt-1">
              Revisa los detalles y reintentar el cobro para evitar interrupciones en tu servicio.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAlertDismissed(true)}
            className="flex-shrink-0 text-red-400 hover:text-red-600 transition-colors"
          >
            <i className="fa-solid fa-times" />
          </button>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-xs text-gray-600 uppercase border-b border-gray-200">
            <tr>
              <th className="px-5 py-3 font-semibold">Fecha</th>
              <th className="px-5 py-3 font-semibold">Concepto</th>
              <th className="px-5 py-3 font-semibold text-right">Monto</th>
              <th className="px-5 py-3 font-semibold text-center">Estado</th>
              <th className="px-5 py-3 font-semibold text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {currentTransactions.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-gray-500">
                  No hay transacciones registradas
                </td>
              </tr>
            ) : (
              currentTransactions.map((transaction) => {
                const config = statusConfig[transaction.estado]
                const isFailed = transaction.estado === 'fallido'
                return (
                  <tr key={transaction.id} className={`hover:bg-gray-50 transition ${isFailed ? 'bg-red-50/30' : ''}`}>
                    <td className="px-5 py-3 font-medium text-gray-700">{formatDate(transaction.fecha)}</td>
                    <td className="px-5 py-3 text-gray-600">{transaction.concepto}</td>
                    <td className="px-5 py-3 text-right font-bold text-[#353535]">
                      {formatCurrency(transaction.monto, transaction.moneda)}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <div className="relative group inline-block">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border cursor-help ${config.className}`}
                          title={isFailed ? transaction.mensajeError || 'Error desconocido' : ''}
                        >
                          {isFailed && <i className="fa-solid fa-triangle-exclamation mr-1.5" />}
                          {config.label}
                        </span>
                        {isFailed && transaction.mensajeError && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                            <p className="font-semibold mb-1">Detalle del error:</p>
                            <p>{transaction.mensajeError}</p>
                            {transaction.codigoError && (
                              <p className="mt-1 text-gray-400 text-[10px]">Código: {transaction.codigoError}</p>
                            )}
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1 w-2 h-2 bg-gray-900 rotate-45" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-center">
                      {isFailed ? (
                        <button
                          type="button"
                          onClick={() => console.log('Reintentar cobro:', transaction.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors"
                        >
                          <i className="fa-solid fa-rotate-right" />
                          Reintentar
                        </button>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-500">
            Mostrando {startIndex + 1} - {Math.min(endIndex, sortedTransactions.length)} de{' '}
            {sortedTransactions.length} transacciones
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-xs font-medium rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Anterior
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => handlePageChange(page)}
                className={`px-3 py-1.5 text-xs font-medium rounded border transition ${
                  currentPage === page
                    ? 'bg-[#284B63] text-white border-[#284B63]'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              type="button"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-xs font-medium rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
