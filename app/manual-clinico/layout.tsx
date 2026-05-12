import type { Metadata } from 'next'
import { requireSidebarSectionAccess } from '@/lib/sidebar-section-access'

export const metadata: Metadata = {
  title: 'Manual Clínico — DomineAqui',
  description: 'Repositório estruturado de patologias para estudo de alta fixação cognitiva. Pesquise por nome, CID-10, área de saúde ou sistema fisiológico.',
  openGraph: {
    title: 'Manual Clínico — DomineAqui',
    description: 'Repositório estruturado de patologias para estudo de alta fixação cognitiva.',
  }
}

export default async function ManualClinicoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireSidebarSectionAccess('manualClinico')

  return children
}
