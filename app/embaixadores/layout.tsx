import type { Metadata } from 'next'
import { PortaoDeSecao } from '@/components/portao-de-secao'
import { DEFAULT_OG_IMAGE, absoluteUrl, publicIndexingRobots } from '@/lib/seo'

const DESCRICAO =
  'Programa de Embaixadores DomineAqui: promova a plataforma na sua faculdade e receba o Plus+ completo, um cupom só seu para a turma e, no programa remunerado, comissão por venda.'

export const metadata: Metadata = {
  title: 'Embaixadores',
  description: DESCRICAO,
  alternates: { canonical: '/embaixadores' },
  robots: publicIndexingRobots,
  openGraph: {
    title: 'Programa de Embaixadores | DomineAqui',
    description: DESCRICAO,
    url: '/embaixadores',
    siteName: 'DomineAqui',
    type: 'website',
    locale: 'pt_BR',
    images: [{ url: absoluteUrl(DEFAULT_OG_IMAGE), width: 1200, height: 630, alt: 'Programa de Embaixadores DomineAqui' }],
  },
}

// Casco estático: quem é embaixador e o que o painel mostra vem da API, no
// cliente. O portão só fecha a aba se o admin a desligar no menu.
export default function EmbaixadoresLayout({ children }: { children: React.ReactNode }) {
  return <PortaoDeSecao secao="embaixadores">{children}</PortaoDeSecao>
}
