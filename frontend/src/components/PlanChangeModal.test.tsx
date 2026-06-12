import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import PlanChangeModal from './PlanChangeModal'

describe('PlanChangeModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    currentPlanName: 'Básico',
    newPlanName: 'Premium',
    newPlanPrice: '$89.990',
    billingPeriod: 'monthly' as const,
    isUpgrade: true,
  }

  it('should render nothing when isOpen is false', () => {
    const { container } = render(<PlanChangeModal {...defaultProps} isOpen={false} />)
    expect(container.innerHTML).toBe('')
  })

  it('should render the modal when isOpen is true', () => {
    render(<PlanChangeModal {...defaultProps} />)
    expect(screen.getByText('Confirmar cambio de plan')).toBeInTheDocument()
  })

  it('should display current and new plan names', () => {
    render(<PlanChangeModal {...defaultProps} />)
    expect(screen.getByText(/Básico/)).toBeInTheDocument()
    expect(screen.getAllByText('Premium')).toHaveLength(2)
  })

  it('should display the new plan price', () => {
    render(<PlanChangeModal {...defaultProps} />)
    expect(screen.getByText('$89.990')).toBeInTheDocument()
  })

  it('should show "mensual" label for monthly billing', () => {
    render(<PlanChangeModal {...defaultProps} />)
    expect(screen.getByText(/mensual/)).toBeInTheDocument()
  })

  it('should show "anual" label for yearly billing', () => {
    render(<PlanChangeModal {...defaultProps} billingPeriod="yearly" />)
    expect(screen.getByText(/anual/)).toBeInTheDocument()
  })

  it('should show upgrade message when isUpgrade is true', () => {
    render(<PlanChangeModal {...defaultProps} />)
    expect(screen.getByText(/Upgrade con prorrateo/)).toBeInTheDocument()
  })

  it('should show downgrade message when isUpgrade is false', () => {
    render(<PlanChangeModal {...defaultProps} isUpgrade={false} />)
    expect(screen.getByText(/Cambio inmediato/)).toBeInTheDocument()
  })

  it('should call onClose when Cancel is clicked', () => {
    const onClose = vi.fn()
    render(<PlanChangeModal {...defaultProps} onClose={onClose} />)
    fireEvent.click(screen.getByText('Cancelar'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('should call onConfirm when Confirm is clicked', () => {
    const onConfirm = vi.fn()
    render(<PlanChangeModal {...defaultProps} onConfirm={onConfirm} />)
    fireEvent.click(screen.getByText('Confirmar cambio'))
    expect(onConfirm).toHaveBeenCalledOnce()
  })
})
