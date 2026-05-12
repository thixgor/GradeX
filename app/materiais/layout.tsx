import { requireSidebarSectionAccess } from '@/lib/sidebar-section-access'

export default async function MateriaisLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireSidebarSectionAccess('materiais')

  return children
}
