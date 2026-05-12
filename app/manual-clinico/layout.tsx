import type { Metadata } from 'next'
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

export default function ManualClinicoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
