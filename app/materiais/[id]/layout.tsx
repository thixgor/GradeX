import type { Metadata } from 'next'
import { ObjectId } from 'mongodb'
import { getDb } from '@/lib/mongodb'
import {
  DEFAULT_OG_IMAGE,
  absoluteUrl,
  privateNoIndexRobots,
  sanitizeSeoText,
} from '@/lib/seo'

const MATERIAIS_DESCRIPTION =
  'Acesse materiais de estudo da DomineAqui com conteúdos organizados, PDFs, vídeos e recursos para acelerar sua rotina de aprendizado.'

export async function generateMetadata(
  { params }: { params: { id: string } }
): Promise<Metadata> {
  const fallback: Metadata = {
    title: 'Material de estudo',
    description: MATERIAIS_DESCRIPTION,
    robots: privateNoIndexRobots,
    alternates: {
      canonical: params?.id ? `/materiais/${params.id}` : '/materiais',
    },
    openGraph: {
      title: 'Material de estudo | DomineAqui',
      description: MATERIAIS_DESCRIPTION,
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Material de estudo | DomineAqui',
      description: MATERIAIS_DESCRIPTION,
      images: [DEFAULT_OG_IMAGE],
    },
  }

  try {
    if (!params?.id || !ObjectId.isValid(params.id)) return fallback

    const db = await getDb()
    const material = await db
      .collection('materials')
      .findOne(
        { _id: new ObjectId(params.id) },
        { projection: { title: 1, description: 1, coverImage: 1, isHidden: 1, updatedAt: 1, createdAt: 1 } }
      )

    if (!material?.title) return fallback

    const safeTitle = sanitizeSeoText(material.title, 'Material de estudo', 70)
    const safeDescription = sanitizeSeoText(material.description, MATERIAIS_DESCRIPTION, 155)
    const title = `${safeTitle || 'Material de estudo'}`
    const image = material.coverImage ? absoluteUrl(material.coverImage) : DEFAULT_OG_IMAGE

    return {
      title,
      description: safeDescription || MATERIAIS_DESCRIPTION,
      robots: privateNoIndexRobots,
      alternates: {
        canonical: `/materiais/${params.id}`,
      },
      openGraph: {
        title: `${title} | DomineAqui`,
        description: safeDescription || MATERIAIS_DESCRIPTION,
        url: `/materiais/${params.id}`,
        siteName: 'DomineAqui',
        type: 'article',
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
        description: safeDescription || MATERIAIS_DESCRIPTION,
        images: [image],
      },
    }
  } catch {
    return fallback
  }
}

export default function MaterialLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
