import PortalTemplate from '../../portal/PortalTemplate'

type ClientTicketsPageProps = {
  navItems: { label: string; iconClass: string; onClick?: () => void }[]
  activeNavLabel: string
  userId: string | null
}

export default function Tickets({ navItems, activeNavLabel, userId }: ClientTicketsPageProps) {
  return (
    <PortalTemplate
      sidebarTitle="Cliente"
      sidebarSubtitle="Tickets"
      contentZoom={0.75}
      navItems={navItems}
      activeNavLabel={activeNavLabel}
      userInitial={userId?.[0] || 'C'}
      userName={`Usuario #${userId || '—'}`}
      userRole="Premium Member"
      headerTitle="Tickets"
      headerSubtitle="Gestiona tus tickets de soporte."
      headerRightLabel=""
      headerRightValue=""
    >
      <div>
        
      </div>
    </PortalTemplate>
  )
}
