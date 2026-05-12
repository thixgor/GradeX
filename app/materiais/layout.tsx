import type { Metadata } from 'next'
import { DEFAULT_OG_IMAGE, absoluteUrl, privateNoIndexRobots } from '@/lib/seo'

const MATERIAIS_DESCRIPTION =
  'Biblioteca de materiais de estudo da DomineAqui com PDFs, vídeos, links e pacotes organizados por pastas.'

export const metadata: Metadata = {
  title: 'Materiais',
  description: MATERIAIS_DESCRIPTION,
  alternates: {
    canonical: '/materiais',
  },
  robots: privateNoIndexRobots,
  openGraph: {
    title: 'Materiais | DomineAqui',
    description: MATERIAIS_DESCRIPTION,
    url: '/materiais',
    siteName: 'DomineAqui',
    type: 'website',
    images: [
      {
        url: absoluteUrl(DEFAULT_OG_IMAGE),
        width: 1200,
        height: 630,
        alt: 'DomineAqui - Materiais de estudo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Materiais | DomineAqui',
    description: MATERIAIS_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
}

export default function MateriaisLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
