import { requireSidebarSectionAccess } from '@/lib/sidebar-section-access'

export default async function GamesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireSidebarSectionAccess('games')

  return children
}
