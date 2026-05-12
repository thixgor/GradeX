import type { Metadata } from 'next'
import { ObjectId } from 'mongodb'
import { getDb } from '@/lib/mongodb'
import {
  DEFAULT_OG_IMAGE,
  absoluteUrl,
  formatBRL,
  getActivePaymentMethodsLabel,
  joinSeoParts,
  privateNoIndexRobots,
  sanitizeSeoText,
} from '@/lib/seo'

const DECK_FALLBACK_DESCRIPTION =
  'Deck de flashcards da DomineAqui — estude com repetição espaçada e maximize sua fixação.'

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const fallback: Metadata = {
    title: 'Deck de Flashcards',
    description: DECK_FALLBACK_DESCRIPTION,
    robots: privateNoIndexRobots,
    alternates: {
      canonical: params?.slug ? `/flashcards/d/${params.slug}` : '/flashcards',
    },
    openGraph: {
      title: 'Deck de Flashcards | DomineAqui',
      description: DECK_FALLBACK_DESCRIPTION,
      siteName: 'DomineAqui',
      locale: 'pt_BR',
      type: 'article',
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Deck de Flashcards | DomineAqui',
      description: DECK_FALLBACK_DESCRIPTION,
      images: [DEFAULT_OG_IMAGE],
    },
  }

  try {
    if (!params?.slug) return fallback

    const db = await getDb()
    const query: any = ObjectId.isValid(params.slug)
      ? { $or: [{ slug: params.slug }, { _id: new ObjectId(params.slug) }] }
      : { slug: params.slug }

    const deck = await db
      .collection('flashcardManualDecks')
      .findOne(query, {
        projection: {
          title: 1, description: 1, coverImage: 1, slug: 1,
          pricing: 1, price: 1, cardCount: 1,
        },
      })

    if (!deck?.title) return fallback

    const safeTitle = sanitizeSeoText(deck.title, 'Deck de Flashcards', 70)
    const safeDescription = sanitizeSeoText(deck.description, DECK_FALLBACK_DESCRIPTION, 120)
    const title = safeTitle || 'Deck de Flashcards'
    const image = deck.coverImage ? absoluteUrl(deck.coverImage) : DEFAULT_OG_IMAGE

    const cardCount = Number(deck.cardCount || 0)
    const cardsLine = cardCount > 0 ? `${cardCount} ${cardCount === 1 ? 'card' : 'cards'}` : ''

    const isPaid = deck.pricing === 'paid' && Number(deck.price) > 0
    const priceLabel = isPaid ? formatBRL(deck.price) : 'Gratuito'
    const paymentMethods = isPaid ? await getActivePaymentMethodsLabel() : ''
    const paymentLine = isPaid && paymentMethods ? `Pague com ${paymentMethods}` : ''

    const description = joinSeoParts([
      safeDescription || DECK_FALLBACK_DESCRIPTION,
      cardsLine,
      priceLabel,
      paymentLine,
    ]).slice(0, 220)

    const canonicalSlug = deck.slug || params.slug
    const url = `/flashcards/d/${canonicalSlug}`

    return {
      title,
      description,
      robots: privateNoIndexRobots,
      alternates: { canonical: url },
      openGraph: {
        title: `${title} | DomineAqui`,
        description,
        url,
        siteName: 'DomineAqui',
        type: 'article',
        locale: 'pt_BR',
        images: [
          { url: image, width: 1200, height: 630, alt: title },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${title} | DomineAqui`,
        description,
        images: [image],
      },
      other: {
        ...(isPaid ? { 'product:price:amount': Number(deck.price).toFixed(2) } : {}),
        ...(isPaid ? { 'product:price:currency': 'BRL' } : {}),
      },
    }
  } catch {
    return fallback
  }
}

export default function FlashcardDeckLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
