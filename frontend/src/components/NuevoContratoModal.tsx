import { useEffect, useState } from 'react'

type NuevoContratoModalProps = {
  isOpen: boolean
  onClose: () => void
  onSave: (contrato: any) => void
}

export default function NuevoContratoModal({ isOpen, onClose, onSave }: NuevoContratoModalProps) {
  const [notas, setNotas] = useState('')
  const [shakeCounter, setShakeCounter] = useState(false)
  const notasLimit = 250
  const notasExceeded = notas.length > notasLimit

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (notasExceeded) {
      setShakeCounter(true)
      setTimeout(() => setShakeCounter(false), 350)
      return
    }

    const formData = new FormData(e.target as HTMLFormElement)
    const contrato = {
      cliente: formData.get('cliente'),
      plan: formData.get('plan'),
      monto: formData.get('monto'),
      frecuencia: formData.get('frecuencia'),
      fechaInicio: formData.get('fechaInicio'),
      duracion: formData.get('duracion'),
      notas
    }
    onSave(contrato)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-4 max-h-[96vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-[#353535]">Nuevo Plan/Contrato</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <i className="fa-solid fa-times text-xl"></i>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cliente */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cliente <span className="text-red-500">*</span>
              </label>
              <select 
                name="cliente" 
                required
                className="w-full text-sm border border-gray-300 rounded-lg px-4 py-2 bg-white text-gray-900 focus:outline-[#3C6E71] focus:ring-1 focus:ring-[#3C6E71]"
              >
                <option value="">Seleccionar cliente...</option>
                <option value="cliente1">Inmobiliaria Los Andes SpA</option>
                <option value="cliente2">TechSolutions International</option>
                <option value="cliente3">Global Services Ltd</option>
                <option value="cliente4">Constructora del Norte</option>
              </select>
            </div>

            {/* Plan */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plan <span className="text-red-500">*</span>
              </label>
              <select 
                name="plan" 
                required
                className="w-full text-sm border border-gray-300 rounded-lg px-4 py-2 bg-white text-gray-900 focus:outline-[#3C6E71] focus:ring-1 focus:ring-[#3C6E71]"
              >
                <option value="">Seleccionar plan...</option>
                <option value="basic">Básico - $29.990/mes</option>
                <option value="standard">Standard - $49.990/mes</option>
                <option value="premium">Premium - $89.990/mes</option>
                <option value="enterprise">Enterprise - $149.990/mes</option>
              </select>
            </div>

            {/* Monto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monto Mensual <span className="text-red-500">*</span>
              </label>
              <input 
                type="number" 
                name="monto" 
                required
                step="0.01"
                min="0"
                placeholder="0.00"
                className="w-full text-sm border border-gray-300 rounded-lg px-4 py-2 bg-white text-gray-900 focus:outline-[#3C6E71] focus:ring-1 focus:ring-[#3C6E71]"
              />
            </div>

            {/* Frecuencia de Cobro */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Frecuencia de Cobro <span className="text-red-500">*</span>
              </label>
              <select 
                name="frecuencia" 
                required
                className="w-full text-sm border border-gray-300 rounded-lg px-4 py-2 bg-white text-gray-900 focus:outline-[#3C6E71] focus:ring-1 focus:ring-[#3C6E71]"
              >
                <option value="">Seleccionar frecuencia...</option>
                <option value="mensual">Mensual</option>
                <option value="trimestral">Trimestral</option>
                <option value="semestral">Semestral</option>
                <option value="anual">Anual</option>
              </select>
            </div>

            {/* Fecha de Inicio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Inicio <span className="text-red-500">*</span>
              </label>
              <input 
                type="date" 
                name="fechaInicio" 
                required
                className="w-full text-sm border border-gray-300 rounded-lg px-4 py-2 bg-white text-gray-900 focus:outline-[#3C6E71] focus:ring-1 focus:ring-[#3C6E71]"
              />
            </div>

            {/* Duración */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duración (meses) <span className="text-red-500">*</span>
              </label>
              <input 
                type="number" 
                name="duracion" 
                required
                min="1"
                max="60"
                placeholder="12"
                className="w-full text-sm border border-gray-300 rounded-lg px-4 py-2 bg-white text-gray-900 focus:outline-[#3C6E71] focus:ring-1 focus:ring-[#3C6E71]"
              />
            </div>
          </div>

          {/* Información Adicional */}
          <div className="space-y-4">
            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label className="block text-sm font-medium text-gray-700">
                  Notas Adicionales
                </label>
                <span
                  className={`text-xs font-bold transition-colors ${
                    notasExceeded ? 'text-red-500' : 'text-gray-400'
                  } ${shakeCounter ? 'character-counter-shake' : ''}`}
                >
                  {notas.length}/{notasLimit}
                </span>
              </div>
              <textarea 
                name="notas"
                rows={3}
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Información adicional sobre el contrato..."
                className={`w-full resize-none text-sm border rounded-lg px-4 py-2 bg-white text-gray-900 focus:outline-[#3C6E71] focus:ring-1 focus:ring-[#3C6E71] ${
                  notasExceeded ? 'border-red-400' : 'border-gray-300'
                }`}
              />
            </div>
          </div>

          {/* Acciones */}
          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
            <button 
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="px-6 py-2 bg-[#284B63] hover:bg-[#284B63]/90 text-white rounded-lg text-sm font-medium shadow-lg shadow-[#284B63]/30 transition"
            >
              Crear Contrato
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
