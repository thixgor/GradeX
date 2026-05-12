import type { Metadata } from 'next'
import { DEFAULT_OG_IMAGE, absoluteUrl, privateNoIndexRobots } from '@/lib/seo'

const FLASHCARDS_DESCRIPTION =
  'Flashcards inteligentes da DomineAqui — estude com repetição espaçada, decks da comunidade e criação manual ou por IA.'

export const metadata: Metadata = {
  title: 'Flashcards',
  description: FLASHCARDS_DESCRIPTION,
  alternates: { canonical: '/flashcards' },
  robots: privateNoIndexRobots,
  openGraph: {
    title: 'Flashcards | DomineAqui',
    description: FLASHCARDS_DESCRIPTION,
    url: '/flashcards',
    siteName: 'DomineAqui',
    type: 'website',
    locale: 'pt_BR',
    images: [
      {
        url: absoluteUrl(DEFAULT_OG_IMAGE),
        width: 1200,
        height: 630,
        alt: 'DomineAqui - Flashcards',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Flashcards | DomineAqui',
    description: FLASHCARDS_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
}

export default function FlashcardsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
