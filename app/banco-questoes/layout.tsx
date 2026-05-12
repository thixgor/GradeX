import { requireSidebarSectionAccess } from '@/lib/sidebar-section-access'

export default async function BancoQuestoesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireSidebarSectionAccess('bancoQuestoes')

  return children
}
