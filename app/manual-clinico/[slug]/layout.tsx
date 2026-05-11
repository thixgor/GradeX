import type { Metadata } from 'next'
import { getDb } from '@/lib/mongodb'

const MANUAIS_DESCRIPTION =
  'Explore os Manuais Clínicos da DomineAqui: um repositório estruturado de patologias pensado para estudo de alta fixação cognitiva, com fisiopatologia, diagnóstico, tratamento e farmacologia em um só lugar.'

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const fallback: Metadata = {
    title: 'Manual Clínico — DomineAqui',
    description: MANUAIS_DESCRIPTION,
    openGraph: {
      title: 'Manual Clínico — DomineAqui',
      description: MANUAIS_DESCRIPTION,
    },
  }

  try {
    if (!params?.slug) return fallback

    const db = await getDb()
    const patologia = await db
      .collection('patologias')
      .findOne({ slug: params.slug }, { projection: { nome: 1 } })

    if (!patologia?.nome) return fallback

    const title = `${patologia.nome} — Manual Clínico — DomineAqui`
    return {
      title,
      description: MANUAIS_DESCRIPTION,
      openGraph: {
        title,
        description: MANUAIS_DESCRIPTION,
      },
    }
  } catch {
    return fallback
  }
}

export default function ManualClinicoSlugLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
