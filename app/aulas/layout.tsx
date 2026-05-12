import type { Metadata } from 'next'
import { requireSidebarSectionAccess } from '@/lib/sidebar-section-access'
import { DEFAULT_OG_IMAGE, absoluteUrl, privateNoIndexRobots } from '@/lib/seo'

const AULAS_DESCRIPTION =
  'Aulas ao vivo e gravadas da DomineAqui — assista conteúdos premium e gratuitos, organizados por módulos, tópicos e setores.'

export const metadata: Metadata = {
  title: 'Aulas',
  description: AULAS_DESCRIPTION,
  alternates: { canonical: '/aulas' },
  robots: privateNoIndexRobots,
  openGraph: {
    title: 'Aulas | DomineAqui',
    description: AULAS_DESCRIPTION,
    url: '/aulas',
    siteName: 'DomineAqui',
    type: 'website',
    locale: 'pt_BR',
    images: [
      {
        url: absoluteUrl(DEFAULT_OG_IMAGE),
        width: 1200,
        height: 630,
        alt: 'DomineAqui - Aulas',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Aulas | DomineAqui',
    description: AULAS_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
}

export default async function AulasLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireSidebarSectionAccess('aulas')

  return children
}
