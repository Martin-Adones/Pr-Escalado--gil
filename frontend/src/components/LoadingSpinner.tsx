export default function LoadingSpinner({ text = 'Cargando...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-9 h-9 border-4 border-gray-200 border-t-[#284B63] rounded-full animate-spin" />
      <span className="text-sm font-semibold text-gray-500 tracking-wide">{text}</span>
    </div>
  )
}
