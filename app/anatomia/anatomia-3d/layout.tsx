import type { Metadata } from 'next'
import { publicIndexingRobots } from '@/lib/seo'
import { CATEGORIAS, FONTE, TOTAL_MODELOS } from '@/lib/anatomia-3d/modelos'

const titulo = 'Anatomia 3D — modelos interativos em 360° | Domine Anatomia'
const descricao = `${TOTAL_MODELOS} modelos anatômicos rotacionáveis em 360°, distribuídos em ${CATEGORIAS.length} categorias e acompanhados de explicação anatômica aprofundada. Fonte: ${FONTE}.`

export const metadata: Metadata = {
  title: titulo,
  description: descricao,
  robots: publicIndexingRobots,
  openGraph: { title: titulo, description: descricao },
}

export default function Anatomia3DLayout({ children }: { children: React.ReactNode }) {
  return children
}
