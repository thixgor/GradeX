import type { Metadata } from 'next'
import { requireSidebarSectionAccess } from '@/lib/sidebar-section-access'
import { privateNoIndexRobots } from '@/lib/seo'

export const metadata: Metadata = {
  robots: privateNoIndexRobots,
}

export default async function AulasLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireSidebarSectionAccess('aulas')

  return children
}
