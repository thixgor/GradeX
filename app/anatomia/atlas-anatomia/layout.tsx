import type { Metadata } from 'next'
import { publicIndexingRobots } from '@/lib/seo'
import { ATLAS_SYSTEMS, ATLAS_TOTALS } from '@/lib/atlas-anatomia/catalogo'

const titulo = 'Atlas de Anatomia — pranchas interativas | Domine Anatomia'
const descricao = `Explore ${ATLAS_TOTALS.pieces} pranchas anatômicas reais do acervo da UFJF em ${ATLAS_SYSTEMS.length} sistemas, com ${ATLAS_TOTALS.markers.toLocaleString('pt-BR')} estruturas marcadas: localização, função, vascularização, inervação e correlação clínica de cada uma.`

export const metadata: Metadata = {
  title: titulo,
  description: descricao,
  robots: publicIndexingRobots,
  openGraph: { title: titulo, description: descricao },
}

export default function AtlasAnatomiaLayout({ children }: { children: React.ReactNode }) {
  return children
}
