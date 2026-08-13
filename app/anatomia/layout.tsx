import type { Metadata } from 'next'
import { publicIndexingRobots } from '@/lib/seo'
import { ATLAS_TOTALS } from '@/lib/atlas-anatomia/catalogo'
import { TOTAL_MODELOS } from '@/lib/anatomia-3d/modelos'

const titulo = 'Domine Anatomia — atlas interativo e modelos 3D'
const descricao = `Estude anatomia em ${ATLAS_TOTALS.pieces} pranchas do Atlas da UFJF, com ${ATLAS_TOTALS.markers.toLocaleString('pt-BR')} estruturas marcadas e detalhadas (localização, função, vascularização, inervação e clínica), ou explore ${TOTAL_MODELOS} modelos anatômicos rotacionáveis em 360°.`

export const metadata: Metadata = {
  title: titulo,
  description: descricao,
  robots: publicIndexingRobots,
  openGraph: { title: titulo, description: descricao },
}

export default function AnatomiaLayout({ children }: { children: React.ReactNode }) {
  return children
}
