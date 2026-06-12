import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NuevoContratoModal from './NuevoContratoModal'

describe('NuevoContratoModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSave: vi.fn(),
  }

  it('should render nothing when isOpen is false', () => {
    const { container } = render(<NuevoContratoModal {...defaultProps} isOpen={false} />)
    expect(container.innerHTML).toBe('')
  })

  it('should render the form when isOpen is true', () => {
    render(<NuevoContratoModal {...defaultProps} />)
    expect(screen.getByText('Nuevo Plan/Contrato')).toBeInTheDocument()
    expect(screen.getByText('Crear Contrato')).toBeInTheDocument()
  })

  it('should call onClose when Cancel is clicked', () => {
    const onClose = vi.fn()
    render(<NuevoContratoModal {...defaultProps} onClose={onClose} />)
    fireEvent.click(screen.getByText('Cancelar'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('should call onClose when the close icon button is clicked', () => {
    const onClose = vi.fn()
    render(<NuevoContratoModal {...defaultProps} onClose={onClose} />)
    const closeButtons = screen.getAllByRole('button')
    const closeIconBtn = closeButtons.find(b => b.querySelector('.fa-times'))
    expect(closeIconBtn).toBeDefined()
    fireEvent.click(closeIconBtn!)
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('should call onSave with form data on submit', async () => {
    const onSave = vi.fn()
    const onClose = vi.fn()
    const { container } = render(<NuevoContratoModal {...defaultProps} onSave={onSave} onClose={onClose} />)

    const selects = container.querySelectorAll('select')
    await userEvent.selectOptions(selects[0], 'cliente1')
    await userEvent.selectOptions(selects[1], 'basic')
    await userEvent.selectOptions(selects[2], 'mensual')

    const inputs = container.querySelectorAll('input')
    await userEvent.type(inputs[0], '29990')
    await userEvent.type(inputs[1], '2026-06-01')
    await userEvent.type(inputs[2], '12')

    fireEvent.click(screen.getByText('Crear Contrato'))

    expect(onSave).toHaveBeenCalledOnce()
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('should show character count for notas textarea', async () => {
    render(<NuevoContratoModal {...defaultProps} />)
    const textarea = screen.getByPlaceholderText(/información adicional/i)
    await userEvent.type(textarea, 'Nota de prueba')
    expect(screen.getByText((content) => content.includes('14') && content.includes('250'))).toBeInTheDocument()
  })
})
