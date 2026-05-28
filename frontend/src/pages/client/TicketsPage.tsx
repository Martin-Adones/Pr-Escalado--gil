import PortalTemplate from '../../portal/PortalTemplate'

type ClientTicketsPageProps = {
  navItems: { label: string; iconClass: string; onClick?: () => void }[]
  activeNavLabel: string
}

export default function Tickets({ navItems, activeNavLabel }: ClientTicketsPageProps) {
  return (
    <PortalTemplate
      sidebarTitle="Cliente"
      sidebarSubtitle="Tickets"
      contentZoom={0.75}
      navItems={navItems}
      activeNavLabel={activeNavLabel}
      userInitial="C"
      userName="Cliente"
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
