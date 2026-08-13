import type { Metadata } from 'next'
import { publicIndexingRobots } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Domine Anatomia — Atlas e modelos 3D | Manual Clínico',
  description: 'Estude anatomia em 418 pranchas do Atlas da UFJF, com 2.382 marcadores aprofundados, ou explore modelos anatômicos 3D rotacionáveis em 360°.',
  robots: publicIndexingRobots,
  openGraph: {
    title: 'Domine Anatomia — Atlas e modelos 3D | Manual Clínico',
    description: 'Escolha entre o Atlas de Anatomia da UFJF com marcadores aprofundados e modelos anatômicos 3D em 360°.',
  },
}

export default function Anatomia3DLayout({ children }: { children: React.ReactNode }) {
  return children
}
