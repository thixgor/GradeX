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

const PACOTE_FALLBACK_DESCRIPTION =
  'Pacote de materiais da DomineAqui com desconto — PDFs, vídeos, flashcards e mais em um único bundle.'

export async function generateMetadata(
  { params }: { params: { id: string } }
): Promise<Metadata> {
  const fallback: Metadata = {
    title: 'Pacote de materiais',
    description: PACOTE_FALLBACK_DESCRIPTION,
    robots: privateNoIndexRobots,
    alternates: {
      canonical: params?.id ? `/pacotes/${params.id}` : '/pacotes',
    },
    openGraph: {
      title: 'Pacote de materiais | DomineAqui',
      description: PACOTE_FALLBACK_DESCRIPTION,
      siteName: 'DomineAqui',
      locale: 'pt_BR',
      type: 'website',
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Pacote de materiais | DomineAqui',
      description: PACOTE_FALLBACK_DESCRIPTION,
      images: [DEFAULT_OG_IMAGE],
    },
  }

  try {
    if (!params?.id || !ObjectId.isValid(params.id)) return fallback

    const db = await getDb()
    const pkg = await db
      .collection('material_packages')
      .findOne(
        { _id: new ObjectId(params.id) },
        { projection: { title: 1, description: 1, coverImage: 1, pricing: 1, price: 1, originalPrice: 1, materialIds: 1 } }
      )

    if (!pkg?.title) return fallback

    const safeTitle = sanitizeSeoText(pkg.title, 'Pacote de materiais', 70)
    const safeDescription = sanitizeSeoText(pkg.description, PACOTE_FALLBACK_DESCRIPTION, 120)
    const title = safeTitle || 'Pacote de materiais'
    const image = pkg.coverImage ? absoluteUrl(pkg.coverImage) : DEFAULT_OG_IMAGE

    const price = Number(pkg.price || 0)
    const originalPrice = Number(pkg.originalPrice || 0)
    const isPaid = pkg.pricing === 'paid' && price > 0
    const hasDiscount = isPaid && originalPrice > price

    const priceLabel = isPaid
      ? hasDiscount
        ? `De ${formatBRL(originalPrice)} por ${formatBRL(price)}`
        : formatBRL(price)
      : 'Gratuito'
    const paymentMethods = isPaid ? await getActivePaymentMethodsLabel() : ''
    const paymentLine = isPaid && paymentMethods ? `Pague com ${paymentMethods}` : ''
    const itemCount = Array.isArray(pkg.materialIds) ? pkg.materialIds.length : 0
    const itemsLine = itemCount > 0 ? `${itemCount} ${itemCount === 1 ? 'item' : 'itens'}` : ''

    const description = joinSeoParts([
      safeDescription || PACOTE_FALLBACK_DESCRIPTION,
      itemsLine,
      priceLabel,
      paymentLine,
    ]).slice(0, 220)

    return {
      title,
      description,
      robots: privateNoIndexRobots,
      alternates: { canonical: `/pacotes/${params.id}` },
      openGraph: {
        title: `${title} | DomineAqui`,
        description,
        url: `/pacotes/${params.id}`,
        siteName: 'DomineAqui',
        type: 'website',
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
        ...(isPaid ? { 'product:price:amount': price.toFixed(2) } : {}),
        ...(isPaid ? { 'product:price:currency': 'BRL' } : {}),
        ...(hasDiscount ? { 'product:original_price:amount': originalPrice.toFixed(2) } : {}),
        ...(hasDiscount ? { 'product:original_price:currency': 'BRL' } : {}),
      },
    }
  } catch {
    return fallback
  }
}

export default function PacoteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
