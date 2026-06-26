import type { Metadata } from 'next'
import { DEFAULT_OG_IMAGE, absoluteUrl, publicIndexingRobots } from '@/lib/seo'

const DESCRIPTION =
  'Mapas mentais premium da DomineAqui — crie, colabore e compartilhe mapas mentais com a comunidade. Editor profissional, exportação e controle de acesso.'

export const metadata: Metadata = {
  title: 'Mapas Mentais',
  description: DESCRIPTION,
  alternates: { canonical: '/mapa-mental' },
  robots: publicIndexingRobots,
  openGraph: {
    title: 'Mapas Mentais | DomineAqui',
    description: DESCRIPTION,
    url: '/mapa-mental',
    siteName: 'DomineAqui',
    type: 'website',
    locale: 'pt_BR',
    images: [{ url: absoluteUrl(DEFAULT_OG_IMAGE), width: 1200, height: 630, alt: 'DomineAqui - Mapas Mentais' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mapas Mentais | DomineAqui',
    description: DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
}

export default function MindMapLayout({ children }: { children: React.ReactNode }) {
  return children
}
