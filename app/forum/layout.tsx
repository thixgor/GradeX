import type { Metadata } from 'next'
import { requireSidebarSectionAccess } from '@/lib/sidebar-section-access'
import { privateNoIndexRobots } from '@/lib/seo'

export const metadata: Metadata = {
  robots: privateNoIndexRobots,
}

export default async function ForumLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireSidebarSectionAccess('forum')

  return children
}
