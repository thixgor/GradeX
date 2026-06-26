import type { Metadata } from 'next'
import { DEFAULT_OG_IMAGE, publicIndexingRobots } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Rifas — DomineAqui',
  description: 'Participe das rifas da DomineAqui. Escolha seus números, pague com segurança via Pix ou cartão e acompanhe o sorteio ao vivo.',
  alternates: { canonical: '/rifas' },
  robots: publicIndexingRobots,
  openGraph: {
    title: 'Rifas — DomineAqui',
    description: 'Participe das rifas da DomineAqui e concorra a prêmios incríveis.',
    url: '/rifas',
    siteName: 'DomineAqui',
    locale: 'pt_BR',
    type: 'website',
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: 'Rifas DomineAqui' }],
  },
}

export default function RifasLayout({ children }: { children: React.ReactNode }) {
  return children
}
