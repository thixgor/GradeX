import type { Metadata } from 'next'
import { publicIndexingRobots } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Anatomia 3D — Atlas interativo | Manual Clínico',
  description: 'Atlas 3D interativo com dezenas de modelos anatômicos rotacionáveis em 360°, organizados por sistema — coração e circulação coronária, cardiopatias congênitas, pulmões e vias aéreas, coluna torácica, costelas, escápula, clavícula, neuroanatomia e mais. Cada modelo com explicação anatômica aprofundada. Fonte: Universidade de Dundee.',
  robots: publicIndexingRobots,
  openGraph: {
    title: 'Anatomia 3D — Atlas interativo | Manual Clínico',
    description: 'Explore dezenas de modelos anatômicos 3D em 360°, com explicação clínica aprofundada em cada peça. Recurso educacional gratuito. Fonte: Universidade de Dundee.',
  },
}

export default function Anatomia3DLayout({ children }: { children: React.ReactNode }) {
  return children
}
