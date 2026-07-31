import type { Metadata } from 'next'
import { ObjectId } from 'mongodb'
import { getDb } from '@/lib/mongodb'
import {
  DEFAULT_OG_IMAGE,
  privateNoIndexRobots,
  sanitizeSeoText,
} from '@/lib/seo'

const FORM_DESCRIPTION =
  'Responda este formulário da DomineAqui. Leva menos de um minuto.'

export async function generateMetadata(
  { params }: { params: { id: string } }
): Promise<Metadata> {
  const fallback: Metadata = {
    title: 'Formulário',
    description: FORM_DESCRIPTION,
    robots: privateNoIndexRobots,
    alternates: {
      canonical: params?.id ? `/forms/${params.id}` : undefined,
    },
    openGraph: {
      title: 'Formulário | DomineAqui',
      description: FORM_DESCRIPTION,
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Formulário | DomineAqui',
      description: FORM_DESCRIPTION,
      images: [DEFAULT_OG_IMAGE],
    },
  }

  try {
    if (!params?.id || !ObjectId.isValid(params.id)) return fallback

    const db = await getDb()
    const form = await db.collection('forms').findOne(
      { _id: new ObjectId(params.id) },
      { projection: { title: 1, description: 1 } }
    )

    if (!form?.title) return fallback

    const safeTitle = sanitizeSeoText(form.title, 'Formulário', 70)
    const safeDescription = sanitizeSeoText(form.description, FORM_DESCRIPTION, 160)
    const title = safeTitle || 'Formulário'

    return {
      title,
      description: safeDescription,
      robots: privateNoIndexRobots,
      alternates: {
        canonical: `/forms/${params.id}`,
      },
      openGraph: {
        title: `${title} | DomineAqui`,
        description: safeDescription,
        url: `/forms/${params.id}`,
        siteName: 'DomineAqui',
        type: 'website',
        locale: 'pt_BR',
        images: [DEFAULT_OG_IMAGE],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${title} | DomineAqui`,
        description: safeDescription,
        images: [DEFAULT_OG_IMAGE],
      },
    }
  } catch {
    return fallback
  }
}

export default function FormLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
