import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listarUsuarios } from '../services/usuarios.service'
import type { FilaUsuario } from '../services/interfaces'

export type UserRole = 'client' | 'admin'

type RoleSelectionPageProps = {
  onSelectRole: (role: UserRole) => void
  onSelectUserId: (userId: string) => void
}

export default function RoleSelectionPage({ onSelectRole, onSelectUserId }: RoleSelectionPageProps) {
  const navigate = useNavigate()
  const [step, setStep] = useState<'role' | 'user'>('role')
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  const [userId, setUserId] = useState('1')
  const [users, setUsers] = useState<FilaUsuario[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)

  const handleSelectRole = (role: UserRole) => {
    setSelectedRole(role)
    if (role === 'admin') {
      onSelectRole('admin')
      navigate('/admin', { replace: true })
      return
    }
    setStep('user')
    fetchUsers()
  }

  const fetchUsers = async () => {
    setLoadingUsers(true)
    try {
      const data = await listarUsuarios({ type: 'client', isActive: true, page_size: 50 })
      setUsers(data)
    } catch {
      setUsers([])
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleStart = (directUserId?: string) => {
    if (selectedRole === 'admin') return
    const id = String(directUserId ?? userId ?? '').trim()
    if (!id) return
    onSelectUserId(id)
    onSelectRole('client')
    navigate('/client', { replace: true })
  }

  if (step === 'user') {
    return (
      <div className="min-h-screen bg-[#D9D9D9] font-sans text-[#353535] flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#3C6E71]/10 text-[#3C6E71]">
              <i className="fa-solid fa-user text-2xl" />
            </div>
            <h1 className="text-3xl font-black text-[#284B63]">Selecciona tu usuario</h1>
            <p className="mt-2 text-sm font-semibold text-gray-500">
              Elige el ID de usuario con el que quieres acceder
            </p>
          </div>

          {loadingUsers ? (
            <div className="flex justify-center py-8">
              <i className="fa-solid fa-spinner fa-spin text-2xl text-[#3C6E71]" />
            </div>
          ) : users.length > 0 ? (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {users.map((u) => (
                <button
                  key={u.id_users}
                  type="button"
                  onClick={() => { setUserId(u.id_users); handleStart(u.id_users) }}
                  className={`w-full text-left p-4 rounded-xl border transition ${
                    userId === u.id_users
                      ? 'border-[#3C6E71] bg-[#3C6E71]/5 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-[#3C6E71] hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#3C6E71]/10 flex items-center justify-center font-black text-[#3C6E71]">
                      {u.id_users}
                    </div>
                    <div>
                      <p className="font-bold text-[#353535]">Usuario #{u.id_users}</p>
                      <p className="text-xs text-gray-400">{u.isActive ? 'Activo' : 'Inactivo'}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <p className="text-sm text-gray-500 mb-4">
                No se pudieron cargar los usuarios. Ingresa tu ID manualmente:
              </p>
              <input
                type="number"
                min="1"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Ej: 1"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-[#3C6E71] mb-4"
              />
              <button
                type="button"
                onClick={() => handleStart()}
                disabled={!userId.trim()}
                className="w-full rounded-xl bg-[#284B63] px-4 py-3 text-sm font-black text-white transition hover:bg-[#3C6E71] disabled:opacity-50"
              >
                Ingresar
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setStep('role')}
            className="mt-4 w-full text-center text-sm font-bold text-gray-500 hover:text-[#284B63] transition"
          >
            ← Volver a selección de perfil
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#D9D9D9] font-sans text-[#353535] flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-10">
          <h1 className="mt-3 text-4xl font-black text-[#284B63]">¿Cómo quieres ingresar?</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            type="button"
            onClick={() => handleSelectRole('client')}
            className="group rounded-2xl bg-white p-8 text-left shadow-sm border border-gray-200 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-[#3C6E71]"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#3C6E71]/10 text-[#3C6E71] flex items-center justify-center mb-6 group-hover:bg-[#3C6E71] group-hover:text-white transition">
              <i className="fa-solid fa-user text-2xl" />
            </div>
            <h2 className="text-2xl font-black text-[#353535]">Cliente</h2>
            <p className="mt-3 text-sm font-semibold text-gray-500 leading-6">
              Accede al dashboard de cliente, contratos, planes, historial y tickets.
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleSelectRole('admin')}
            className="group rounded-2xl bg-white p-8 text-left shadow-sm border border-gray-200 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-[#284B63]"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#284B63]/10 text-[#284B63] flex items-center justify-center mb-6 group-hover:bg-[#284B63] group-hover:text-white transition">
              <i className="fa-solid fa-user-shield text-2xl" />
            </div>
            <h2 className="text-2xl font-black text-[#353535]">Admin</h2>
            <p className="mt-3 text-sm font-semibold text-gray-500 leading-6">
              Accede al entorno administrativo del sistema.
            </p>
          </button>
        </div>
      </div>
    </div>
  )
}
