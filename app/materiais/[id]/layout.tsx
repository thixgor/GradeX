import type { Metadata } from 'next'
import { ObjectId } from 'mongodb'
import { getDb } from '@/lib/mongodb'

const MATERIAIS_DESCRIPTION =
  'Acesse os materiais exclusivos da DomineAqui: conteúdos cuidadosamente produzidos por especialistas, com PDFs, videoaulas e resumos de alto impacto para acelerar sua aprovação e potencializar seus estudos.'

export async function generateMetadata(
  { params }: { params: { id: string } }
): Promise<Metadata> {
  const fallback: Metadata = {
    title: 'Materiais — DomineAqui',
    description: MATERIAIS_DESCRIPTION,
    openGraph: {
      title: 'Materiais — DomineAqui',
      description: MATERIAIS_DESCRIPTION,
    },
  }

  try {
    if (!params?.id || !ObjectId.isValid(params.id)) return fallback

    const db = await getDb()
    const material = await db
      .collection('materials')
      .findOne(
        { _id: new ObjectId(params.id) },
        { projection: { title: 1 } }
      )

    if (!material?.title) return fallback

    const title = `${material.title} — DomineAqui`
    return {
      title,
      description: MATERIAIS_DESCRIPTION,
      openGraph: {
        title,
        description: MATERIAIS_DESCRIPTION,
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
