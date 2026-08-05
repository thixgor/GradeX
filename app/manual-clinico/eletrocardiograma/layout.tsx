import type { Metadata } from 'next'
import { publicIndexingRobots } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Manual do Eletrocardiograma — Manual Clínico | DomineAqui',
  description: 'Trilha de ensino interativa de ECG — do sistema de condução ao laudo — somada ao simulador: 12 derivações geradas matematicamente em tempo real, papel milimetrado real, medidas automáticas, régua, modo monitor, banco de traçados com critérios diagnósticos e exercícios. Privativo para assinantes e Plus+.',
  robots: publicIndexingRobots,
  openGraph: {
    title: 'Manual do Eletrocardiograma — trilha de ensino e simulador interativo',
    description: 'Aprenda ECG construindo o traçado onda por onda, com laboratórios interativos de condução, refratariedade, derivações, bloqueios e eletrólitos — e um simulador de 12 derivações gerado em tempo real.',
  },
}

export default function EcgLayout({ children }: { children: React.ReactNode }) {
  return children
}
