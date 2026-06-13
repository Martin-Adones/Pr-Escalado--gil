export interface FilaPlan {
  id_plans: string
  name: string
  billing_cycle: string
  amount: string
  isActive: boolean
}

export interface FilaPlanListado extends FilaPlan {
  total_count: string
}

export interface FilaContrato {
  id_contracts: string
  id_users: string
  id_plans: string
  status: string
  start_date: string
  end_date: string
  updated_at: string
}

export interface FilaContratoListado extends FilaContrato {
  total_count: string
}

export interface FilaUsuario {
  id_users: string
  type: string
  isActive: boolean
}

export interface FilaUsuarioListado extends FilaUsuario {
  total_count: string
}

export interface FilaProducto {
  id_products: string
  name: string
  description: string | null
  type: string
  quantity: number | null
  price: string
  isActive: boolean
}

export interface FilaProductoListado extends FilaProducto {
  total_count: string
}

export interface FilaAuditLog {
  id_audit_logs: string
  id_contracts: string | null
  action: string
  assigned_to: string | null
  created_at: string
}
