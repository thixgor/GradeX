import type { Metadata } from 'next'
import { publicIndexingRobots } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Anatomia 3D — Manual Clínico | DomineAqui',
  description: 'Modelos anatômicos 3D interativos e rotacionáveis, organizados por categoria: coração, sistema cardiovascular, pulmões, sistema linfático, cérebro, crânio e vias aéreas. Fonte: Universidade de Dundee.',
  robots: publicIndexingRobots,
  openGraph: {
    title: 'Anatomia 3D — Manual Clínico | DomineAqui',
    description: 'Explore modelos anatômicos 3D interativos em 360°, organizados por sistema. Recurso educacional gratuito. Fonte: Universidade de Dundee.',
  },
}

export default function Anatomia3DLayout({ children }: { children: React.ReactNode }) {
  return children
}
