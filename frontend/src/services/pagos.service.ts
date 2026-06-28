import { apiGet, apiPost, apiDelete } from './api'

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

export interface FilaUserCard {
  id_user_cards: string
  id_users: string
  payment_method_token: string
  card_brand: string
  card_last4: string
  holder_name: string
  created_at: string
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

export async function obtenerTarjetasUsuario(id_users: string): Promise<FilaUserCard[]> {
  return apiGet<FilaUserCard[]>(`/pagos/tarjeta/${id_users}`)
}

export async function eliminarTarjeta(token: string): Promise<void> {
  return apiDelete<void>(`/pagos/tarjeta/${token}`)
}

