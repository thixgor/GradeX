import type { Metadata } from 'next'
import { publicIndexingRobots } from '@/lib/seo'
import { ATLAS_TOTALS } from '@/lib/atlas-anatomia/catalogo'

const titulo = 'Quiz de identificação anatômica | Atlas de Anatomia'
const descricao = `Treine identificação de estruturas em pranchas reais do acervo da UFJF: o marcador aparece sem rótulo e você diz qual é. Cada resposta vem comentada, com o raciocínio de identificação e o porquê de cada alternativa. ${ATLAS_TOTALS.markers.toLocaleString('pt-BR')} estruturas sorteáveis.`

export const metadata: Metadata = {
  title: titulo,
  description: descricao,
  robots: publicIndexingRobots,
  openGraph: { title: titulo, description: descricao },
}

export default function QuizAtlasLayout({ children }: { children: React.ReactNode }) {
  return children
}
