import { apiGet, apiPost } from './api'

export interface FilaPago {
  id_payments: string
  id_users: string
  id_billing_cycles: string | null
  amount: string
  concept: string
  status: string
  external_tx_id: string | null
  created_at: string
  updated_at: string
}

export interface CrearPagoResponse {
  pago: FilaPago
  redirectUrl?: string
}

export async function crearPago(data: {
  id_users: string
  amount: number
  concept: string
}): Promise<CrearPagoResponse> {
  return apiPost<CrearPagoResponse>('/pagos/crear', data)
}

export async function obtenerPagoPorId(id_payments: string): Promise<FilaPago> {
  return apiGet<FilaPago>(`/pagos/${id_payments}`)
}
