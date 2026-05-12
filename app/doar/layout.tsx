import type { Metadata } from 'next'
import { DEFAULT_OG_IMAGE, publicIndexingRobots } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Doar — Apoie a DomineAqui',
  description: 'Contribua para manter a DomineAqui gratuita e acessível. Sua doação ajuda estudantes de medicina e saúde a terem acesso a materiais de estudo de qualidade.',
  alternates: { canonical: '/doar' },
  robots: publicIndexingRobots,
  openGraph: {
    title: 'Doar — Apoie a DomineAqui',
    description: 'Contribua para manter a DomineAqui gratuita e acessível para estudantes de medicina.',
    url: '/doar',
    siteName: 'DomineAqui',
    locale: 'pt_BR',
    type: 'website',
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: 'DomineAqui — Apoie a educação',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Doar — Apoie a DomineAqui',
    description: 'Contribua para manter a DomineAqui gratuita e acessível.',
    images: [DEFAULT_OG_IMAGE],
  },
}

export default function DoarLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
