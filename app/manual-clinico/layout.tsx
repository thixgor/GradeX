import type { Metadata } from 'next'
import { requireSidebarSectionAccess } from '@/lib/sidebar-section-access'
import { privateNoIndexRobots } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Manual Clínico — DomineAqui',
  description: 'Repositório estruturado de patologias para estudo de alta fixação cognitiva. Pesquise por nome, CID-10, área de saúde ou sistema fisiológico.',
  robots: privateNoIndexRobots,
  openGraph: {
    title: 'Manual Clínico — DomineAqui',
    description: 'Repositório estruturado de patologias para estudo de alta fixação cognitiva.',
  },
}

export default async function ManualClinicoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireSidebarSectionAccess('manualClinico')

  return children
}
