import type { Metadata } from 'next'
import { CANONICAL_ORIGIN } from '@/lib/seo'

export const metadata: Metadata = {
  title: '10 questões comentadas grátis, sem cadastro',
  description:
    'Teste agora: 10 questões comentadas do banco e uma patologia do Manual Clínico, sem login. Responda, veja o gabarito na hora e leia o comentário.',
  alternates: { canonical: `${CANONICAL_ORIGIN}/amostra` },
  openGraph: {
    title: '10 questões comentadas grátis, sem cadastro',
    description:
      'Responda 10 questões comentadas e veja uma patologia do Manual Clínico. Sem login, direto no navegador.',
    url: `${CANONICAL_ORIGIN}/amostra`,
  },
}

export default function AmostraLayout({ children }: { children: React.ReactNode }) {
  return children
}
