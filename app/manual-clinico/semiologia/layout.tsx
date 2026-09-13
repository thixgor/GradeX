import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Manual de Semiologia - Exame físico, beira-leito e POCUS | Manual Clínico',
  description:
    'Atlas de semiologia em português: sinais do exame físico com mecanismo e desempenho diagnóstico, otoscopia, fundo de olho, orofaringe e rinoscopia com cena normal e alterada, e as janelas do ultrassom à beira do leito.',
  openGraph: {
    title: 'Manual de Semiologia - DomineAqui',
    description: 'O exame físico, a imagem à beira do leito e o POCUS num atlas interativo.',
  },
}

export default function SemiologiaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
