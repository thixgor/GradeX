import { requireSidebarSectionAccess } from '@/lib/sidebar-section-access'

export default async function AulasLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireSidebarSectionAccess('aulas')

  return children
}
