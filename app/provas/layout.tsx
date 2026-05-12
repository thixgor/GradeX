import { requireSidebarSectionAccess } from '@/lib/sidebar-section-access'

export default async function ProvasLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireSidebarSectionAccess('provas')

  return children
}
