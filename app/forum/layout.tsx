import { requireSidebarSectionAccess } from '@/lib/sidebar-section-access'

export default async function ForumLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireSidebarSectionAccess('forum')

  return children
}
