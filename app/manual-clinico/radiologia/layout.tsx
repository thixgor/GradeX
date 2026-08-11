import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Manual de Radiologia - Tomografia e Raio-X | Manual Clínico',
  description:
    'Atlas radiológico interativo em português: tomografia computadorizada por cortes e radiografias com demarcações anatômicas, roteiros de leitura e explicações aprofundadas.',
  openGraph: {
    title: 'Manual de Radiologia - DomineAqui',
    description: 'Tomografia computadorizada e Raio-X em um atlas clínico interativo e aprofundado.',
  },
}

export default function RadiologiaLayout({ children }: { children: React.ReactNode }) {
  return children
}
