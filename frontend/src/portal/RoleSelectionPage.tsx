export type UserRole = 'client' | 'admin'

type RoleSelectionPageProps = {
  onSelectRole: (role: UserRole) => void
}

export default function RoleSelectionPage({ onSelectRole }: RoleSelectionPageProps) {
  return (
    <div className="min-h-screen bg-[#D9D9D9] font-sans text-[#353535] flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-10">
          <h1 className="mt-3 text-4xl font-black text-[#284B63]">¿Cómo quieres ingresar?</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            type="button"
            onClick={() => onSelectRole('client')}
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
            onClick={() => onSelectRole('admin')}
            className="group rounded-2xl bg-white p-8 text-left shadow-sm border border-gray-200 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-[#284B63]"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#284B63]/10 text-[#284B63] flex items-center justify-center mb-6 group-hover:bg-[#284B63] group-hover:text-white transition">
              <i className="fa-solid fa-user-shield text-2xl" />
            </div>
            <h2 className="text-2xl font-black text-[#353535]">Admin</h2>
            <p className="mt-3 text-sm font-semibold text-gray-500 leading-6">
              Accede al entorno administrativo del sistema cuando sus vistas estén disponibles.
            </p>
          </button>
        </div>
      </div>
    </div>
  )
}
