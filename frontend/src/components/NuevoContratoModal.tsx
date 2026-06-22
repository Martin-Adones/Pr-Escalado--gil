import { useEffect, useState } from 'react'
import { crearContrato } from '../services/contratos.service'
import { listarUsuarios } from '../services/usuarios.service'
import { listarPlanes } from '../services/planes.service'
import type { FilaUsuarioListado, FilaPlanListado } from '../services/interfaces'

type NuevoContratoModalProps = {
  isOpen: boolean
  onClose: () => void
  onSave: (contrato: any) => void
}

export default function NuevoContratoModal({ isOpen, onClose, onSave }: NuevoContratoModalProps) {
  const [usuarios, setUsuarios] = useState<FilaUsuarioListado[]>([])
  const [planes, setPlanes] = useState<FilaPlanListado[]>([])
  const [idUsers, setIdUsers] = useState('')
  const [idPlans, setIdPlans] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setLoading(true)
    setError(null)
    setIdUsers('')
    setIdPlans('')
    Promise.all([
      listarUsuarios({ type: 'client', page_size: 200 }),
      listarPlanes({ isActive: true, page_size: 200 }),
    ]).then(([u, p]) => {
      setUsuarios(u)
      setPlanes(p)
    }).catch((e) => {
      setError('Error al cargar datos: ' + (e instanceof Error ? e.message : 'desconocido'))
    }).finally(() => setLoading(false))
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!idUsers || !idPlans) return
    setSaving(true)
    setError(null)
    try {
      const [nuevo] = await crearContrato({ id_users: idUsers, id_plans: idPlans, status: 'ACTIVE' })
      onSave(nuevo)
      onClose()
    } catch (e) {
      setError('Error al crear contrato: ' + (e instanceof Error ? e.message : 'desconocido'))
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-[#353535]">Nuevo Contrato</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <i className="fa-solid fa-times text-xl"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {loading ? (
            <div className="text-center py-8 text-gray-400">Cargando datos...</div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cliente <span className="text-red-500">*</span>
                </label>
                <select
                  value={idUsers}
                  onChange={(e) => setIdUsers(e.target.value)}
                  required
                  className="w-full text-sm border border-gray-300 rounded-lg px-4 py-2 bg-white text-gray-900 focus:outline-[#3C6E71] focus:ring-1 focus:ring-[#3C6E71]"
                >
                  <option value="">Seleccionar cliente...</option>
                  {usuarios.map((u) => (
                    <option key={u.id_users} value={u.id_users}>
                      #{u.id_users} — {u.type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Plan <span className="text-red-500">*</span>
                </label>
                <select
                  value={idPlans}
                  onChange={(e) => setIdPlans(e.target.value)}
                  required
                  className="w-full text-sm border border-gray-300 rounded-lg px-4 py-2 bg-white text-gray-900 focus:outline-[#3C6E71] focus:ring-1 focus:ring-[#3C6E71]"
                >
                  <option value="">Seleccionar plan...</option>
                  {planes.map((p) => (
                    <option key={p.id_plans} value={p.id_plans}>
                      {p.name} — ${Number(p.amount).toLocaleString('es-CL')}/{p.billing_cycle === 'yearly' ? 'año' : 'mes'}
                    </option>
                  ))}
                </select>
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-[#284B63] hover:bg-[#284B63]/90 text-white rounded-lg text-sm font-medium shadow-lg shadow-[#284B63]/30 transition disabled:opacity-50"
                >
                  {saving ? 'Creando...' : 'Crear Contrato'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  )
}
