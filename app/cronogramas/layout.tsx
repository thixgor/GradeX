import { requireSidebarSectionAccess } from '@/lib/sidebar-section-access'

export default async function CronogramasLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireSidebarSectionAccess('cronogramas')

  return children
}
