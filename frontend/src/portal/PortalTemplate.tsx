import type { ReactNode } from 'react'

export type PortalNavItem = {
  label: string
  iconClass: string
  onClick?: () => void
}

export type PortalTemplateProps = {
  sidebarTitle: string
  sidebarSubtitle: string
  navItems: PortalNavItem[]
  activeNavLabel: string
  userInitial: string
  userName: string
  userRole: string
  headerTitle: string
  headerSubtitle: string
  headerRightLabel: string
  headerRightValue: string
  contentZoom?: number
  children: ReactNode
}

export default function PortalTemplate({
  sidebarTitle,
  sidebarSubtitle,
  navItems,
  activeNavLabel,
  userInitial,
  userName,
  userRole,
  headerTitle,
  headerSubtitle,
  headerRightLabel,
  headerRightValue,
  contentZoom = 1,
  children,
}: PortalTemplateProps) {
  return (
    <div
      className="font-sans antialiased bg-[#D9D9D9] text-[#353535] min-h-screen overflow-x-hidden"
      style={{
        zoom: contentZoom,
        minHeight: `${100 / contentZoom}vh`,
        minWidth: '100%',
      }}
    >
      <div className="flex min-h-screen">
        <aside className="w-64 text-white flex flex-col fixed h-full shadow-2xl bg-[#284B63]">
          <div className="p-8">
            <h1 className="text-xl mt-2 font-bold tracking-tight">{sidebarTitle}</h1>
            <p className="text-[10px] -mt-6 uppercase tracking-widest opacity-60">{sidebarSubtitle}</p>
          </div>

          <nav className="flex-grow px-4 space-y-2">
            {navItems.map((item) => {
              const isActive = item.label === activeNavLabel

              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={item.onClick}
                  className={
                    isActive
                      ? 'flex items-center gap-3 p-3 bg-white/10 rounded-lg font-medium transition w-full text-left'
                      : 'flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg text-white/70 hover:text-white transition w-full text-left'
                  }
                >
                  <i className={`${item.iconClass} text-sm`} /> {item.label}
                </button>
              )
            })}
          </nav>

          <div className="p-6 mt-auto border-t border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#3C6E71] flex items-center justify-center font-bold">
                {userInitial}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold truncate">{userName}</p>
                <p className="text-[10px] text-white/50 truncate">{userRole}</p>
              </div>
            </div>
          </div>
        </aside>

        <main className="ml-64 flex-grow py-9 px-6 lg:px-10 xl:px-12">
          <div className="w-full">
            <header className="flex justify-between items-end mb-8">
              <div>
                <h2 className="text-3xl font-bold text-[#353535]">{headerTitle}</h2>
                <p className="text-gray-500 mt-1">{headerSubtitle}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold uppercase text-gray-400">{headerRightLabel}</p>
                <p className="text-xl font-bold text-[#284B63]">{headerRightValue}</p>
              </div>
            </header>

            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
