import type { Metadata } from 'next'
import { getDb } from '@/lib/mongodb'
import {
  DEFAULT_OG_IMAGE,
  absoluteUrl,
  hasSensitiveSeoTerm,
  privateNoIndexRobots,
  publicIndexingRobots,
  sanitizeSeoText,
} from '@/lib/seo'

const LEAD_FALLBACK_DESCRIPTION =
  'Acesse materiais gratuitos e conteúdos educacionais da DomineAqui para melhorar sua rotina de estudos.'

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const fallback: Metadata = {
    title: 'Material gratuito',
    description: LEAD_FALLBACK_DESCRIPTION,
    robots: privateNoIndexRobots,
  }

  try {
    if (!params?.slug) return fallback

    const db = await getDb()
    const campaign = await db
      .collection('lead_campaigns')
      .findOne(
        { slug: params.slug, isActive: true },
        { projection: { name: 1, description: 1, imageUrl: 1, slug: 1 } }
      )

    if (!campaign) return fallback

    const searchableText = `${campaign.slug || ''} ${campaign.name || ''} ${campaign.description || ''}`
    const shouldIndex = !hasSensitiveSeoTerm(searchableText)
    const title = sanitizeSeoText(campaign.name, 'Material gratuito', 70) || 'Material gratuito'
    const description =
      sanitizeSeoText(campaign.description, LEAD_FALLBACK_DESCRIPTION, 155) ||
      LEAD_FALLBACK_DESCRIPTION
    const image = campaign.imageUrl ? absoluteUrl(campaign.imageUrl) : DEFAULT_OG_IMAGE

    return {
      title,
      description,
      robots: shouldIndex ? publicIndexingRobots : privateNoIndexRobots,
      alternates: {
        canonical: `/lead/${params.slug}`,
      },
      openGraph: {
        title: `${title} | DomineAqui`,
        description,
        url: `/lead/${params.slug}`,
        siteName: 'DomineAqui',
        type: 'website',
        images: [
          {
            url: image,
            width: 1200,
            height: 630,
            alt: title,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${title} | DomineAqui`,
        description,
        images: [image],
      },
    }
  } catch {
    return fallback
  }
}

export default function LeadLayout({ children }: { children: React.ReactNode }) {
  return children
}
