import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import NuevoContratoModal from './NuevoContratoModal'

vi.mock('../services/contratos.service', () => ({
  crearContrato: vi.fn().mockResolvedValue([{ id_contracts: '99', id_users: '1', id_plans: '2', status: 'ACTIVE' }]),
}))

vi.mock('../services/usuarios.service', () => ({
  listarUsuarios: vi.fn().mockResolvedValue([
    { id_users: '1', type: 'cliente', isActive: true, total_count: '1' },
    { id_users: '2', type: 'cliente', isActive: true, total_count: '1' },
  ]),
}))

vi.mock('../services/planes.service', () => ({
  listarPlanes: vi.fn().mockResolvedValue([
    { id_plans: '1', name: 'Básico', billing_cycle: 'monthly', amount: '29990', isActive: true, total_count: '1' },
    { id_plans: '2', name: 'Premium', billing_cycle: 'yearly', amount: '89990', isActive: true, total_count: '1' },
  ]),
}))

describe('NuevoContratoModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSave: vi.fn(),
  }

  beforeEach(() => { vi.clearAllMocks() })

  it('should render nothing when isOpen is false', () => {
    const { container } = render(<NuevoContratoModal {...defaultProps} isOpen={false} />)
    expect(container.innerHTML).toBe('')
  })

  it('should render the form when isOpen is true', async () => {
    render(<NuevoContratoModal {...defaultProps} />)
    await waitFor(() => expect(screen.getByText('Nuevo Contrato')).toBeInTheDocument())
    expect(screen.getByText('Crear Contrato')).toBeInTheDocument()
  })

  it('should call onClose when Cancel is clicked', async () => {
    const onClose = vi.fn()
    render(<NuevoContratoModal {...defaultProps} onClose={onClose} />)
    await waitFor(() => expect(screen.getByText('Cancelar')).toBeInTheDocument())
    fireEvent.click(screen.getByText('Cancelar'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('should show loading state initially', () => {
    render(<NuevoContratoModal {...defaultProps} />)
    expect(screen.getByText('Cargando datos...')).toBeInTheDocument()
  })
})
