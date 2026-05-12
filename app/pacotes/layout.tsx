import type { Metadata } from 'next'
import { DEFAULT_OG_IMAGE, absoluteUrl, privateNoIndexRobots } from '@/lib/seo'

const PACOTES_DESCRIPTION =
  'Pacotes de materiais de estudo da DomineAqui — combine PDFs, vídeos e flashcards com desconto.'

export const metadata: Metadata = {
  title: 'Pacotes',
  description: PACOTES_DESCRIPTION,
  alternates: {
    canonical: '/pacotes',
  },
  robots: privateNoIndexRobots,
  openGraph: {
    title: 'Pacotes | DomineAqui',
    description: PACOTES_DESCRIPTION,
    url: '/pacotes',
    siteName: 'DomineAqui',
    type: 'website',
    images: [
      {
        url: absoluteUrl(DEFAULT_OG_IMAGE),
        width: 1200,
        height: 630,
        alt: 'DomineAqui - Pacotes de materiais',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pacotes | DomineAqui',
    description: PACOTES_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
}

export default function PacotesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
