import { requireSidebarSectionAccess } from '@/lib/sidebar-section-access'

export default async function FlashcardsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireSidebarSectionAccess('flashcards')

  return children
}
