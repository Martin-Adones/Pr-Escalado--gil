import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import RoleSelectionPage from './RoleSelectionPage'

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter initialEntries={['/']}>{ui}</MemoryRouter>)
}

const mockListarUsuarios = vi.fn()

vi.mock('../services/usuarios.service', () => ({
  listarUsuarios: (...args: unknown[]) => mockListarUsuarios(...args),
}))

describe('RoleSelectionPage', () => {
  const defaultProps = {
    onSelectRole: vi.fn(),
    onSelectUserId: vi.fn(),
  }

  beforeEach(() => {
    mockListarUsuarios.mockReset()
    localStorage.clear()
  })

  it('should render both role selection buttons', () => {
    renderWithRouter(<RoleSelectionPage {...defaultProps} />)
    expect(screen.getByText('Cliente')).toBeInTheDocument()
    expect(screen.getByText('Admin')).toBeInTheDocument()
  })

  it('should call onSelectRole with "admin" when Admin is clicked', () => {
    const onSelectRole = vi.fn()
    renderWithRouter(<RoleSelectionPage {...defaultProps} onSelectRole={onSelectRole} />)
    fireEvent.click(screen.getByText('Admin'))
    expect(onSelectRole).toHaveBeenCalledWith('admin')
  })

  it('should navigate to user selection step when Cliente is clicked', () => {
    renderWithRouter(<RoleSelectionPage {...defaultProps} />)
    fireEvent.click(screen.getByText('Cliente'))
    expect(screen.getByText('Selecciona tu usuario')).toBeInTheDocument()
  })

  it('should show loading spinner while fetching users', () => {
    mockListarUsuarios.mockReturnValue(new Promise(() => {}))
    renderWithRouter(<RoleSelectionPage {...defaultProps} />)
    fireEvent.click(screen.getByText('Cliente'))
    expect(screen.getByText('Selecciona tu usuario')).toBeInTheDocument()
  })

  it('should display user list when users are fetched', async () => {
    mockListarUsuarios.mockResolvedValue([
      { id_users: '1', type: 'client', isActive: true },
      { id_users: '2', type: 'client', isActive: true },
    ])

    renderWithRouter(<RoleSelectionPage {...defaultProps} />)
    fireEvent.click(screen.getByText('Cliente'))

    await waitFor(() => {
      expect(screen.getByText('Usuario #1')).toBeInTheDocument()
    })
    expect(screen.getByText('Usuario #2')).toBeInTheDocument()
  })

  it('should call onSelectUserId and onSelectRole when a user is selected', async () => {
    mockListarUsuarios.mockResolvedValue([
      { id_users: '5', type: 'client', isActive: true },
    ])

    const onSelectUserId = vi.fn()
    const onSelectRole = vi.fn()
    renderWithRouter(<RoleSelectionPage {...defaultProps} onSelectUserId={onSelectUserId} onSelectRole={onSelectRole} />)
    fireEvent.click(screen.getByText('Cliente'))

    await waitFor(() => {
      expect(screen.getByText('Usuario #5')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Usuario #5'))
    expect(onSelectUserId).toHaveBeenCalledWith('5')
    expect(onSelectRole).toHaveBeenCalledWith('client')
  })

  it('should show manual input when fetch fails', async () => {
    mockListarUsuarios.mockRejectedValue(new Error('Network error'))

    renderWithRouter(<RoleSelectionPage {...defaultProps} />)
    fireEvent.click(screen.getByText('Cliente'))

    await waitFor(() => {
      expect(screen.getByText(/ingresa tu ID manualmente/i)).toBeInTheDocument()
    })
  })

  it('should allow manual user ID entry and submission', async () => {
    mockListarUsuarios.mockResolvedValue([])
    const onSelectUserId = vi.fn()
    const onSelectRole = vi.fn()

    renderWithRouter(<RoleSelectionPage {...defaultProps} onSelectUserId={onSelectUserId} onSelectRole={onSelectRole} />)
    fireEvent.click(screen.getByText('Cliente'))

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/ej: 1/i)).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText(/ej: 1/i) as HTMLInputElement
    await userEvent.clear(input)
    await userEvent.type(input, '99')

    fireEvent.click(screen.getByText('Ingresar'))
    expect(onSelectRole).toHaveBeenCalledWith('client')
    expect(onSelectUserId).toHaveBeenCalledWith('99')
  })

  it('should go back to role selection when "Volver" is clicked', () => {
    renderWithRouter(<RoleSelectionPage {...defaultProps} />)
    fireEvent.click(screen.getByText('Cliente'))
    expect(screen.getByText('Selecciona tu usuario')).toBeInTheDocument()

    fireEvent.click(screen.getByText(/volver a selección/i))
    expect(screen.getByText('¿Cómo quieres ingresar?')).toBeInTheDocument()
  })
})
