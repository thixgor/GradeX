import type { Metadata } from 'next'
import { publicIndexingRobots } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Manual do Eletrocardiograma — Manual Clínico | DomineAqui',
  description: 'Simulador interativo de ECG: 12 derivações geradas matematicamente em tempo real, papel milimetrado real, medidas automáticas, régua, modo monitor, banco de traçados com critérios diagnósticos e exercícios. Privativo para assinantes e Premium.',
  robots: publicIndexingRobots,
  openGraph: {
    title: 'Manual do Eletrocardiograma — Simulador interativo de ECG',
    description: 'Traçados de ECG gerados em tempo real com fidelidade hospitalar, medidas automáticas e critérios diagnósticos internacionais.',
  },
}

export default function EcgLayout({ children }: { children: React.ReactNode }) {
  return children
}
