import type { Metadata } from 'next'
import { getDb } from '@/lib/mongodb'
import { DEFAULT_OG_IMAGE, joinSeoParts, publicIndexingRobots, sanitizeSeoText } from '@/lib/seo'

const MANUAIS_DESCRIPTION =
  'Manual Clínico da DomineAqui: fisiopatologia, diagnóstico, tratamento e farmacologia organizados para fixação cognitiva.'

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const fallback: Metadata = {
    title: 'Manual Clínico',
    description: MANUAIS_DESCRIPTION,
    robots: publicIndexingRobots,
    alternates: {
      canonical: params?.slug ? `/manual-clinico/${params.slug}` : '/manual-clinico',
    },
  }

  try {
    if (!params?.slug) return fallback

    const db = await getDb()
    const patologia = await db
      .collection('patologias')
      .findOne(
        { slug: params.slug },
        { projection: { nome: 1, sinonimos: 1, sistema: 1, cid10: 1, areas: 1, resumo: 1, descricao: 1 } }
      )

    if (!patologia?.nome) return fallback

    const nome = sanitizeSeoText(patologia.nome, 'Manual Clínico', 80)
    const cidsRaw: string[] = Array.isArray(patologia.cid10)
      ? patologia.cid10.filter(Boolean).map(String)
      : patologia.cid10
        ? [String(patologia.cid10)]
        : []
    const cidsLabel = cidsRaw.length > 0
      ? `CID-10: ${cidsRaw.slice(0, 3).join(', ')}${cidsRaw.length > 3 ? '…' : ''}`
      : ''

    const sistema = patologia.sistema ? `Sistema ${String(patologia.sistema)}` : ''
    const areas = Array.isArray(patologia.areas) && patologia.areas.length > 0
      ? patologia.areas.slice(0, 3).join(', ')
      : ''
    const sinonimos = Array.isArray(patologia.sinonimos) && patologia.sinonimos.length > 0
      ? `Também conhecido como: ${patologia.sinonimos.slice(0, 2).join(', ')}`
      : ''

    const resumo = sanitizeSeoText(patologia.resumo || patologia.descricao, '', 100)

    const title = cidsLabel ? `${nome} (${cidsRaw[0]})` : nome
    const description = joinSeoParts([
      resumo,
      cidsLabel,
      sistema,
      areas,
      sinonimos,
    ]).slice(0, 220) || MANUAIS_DESCRIPTION

    return {
      title,
      description,
      robots: publicIndexingRobots,
      alternates: { canonical: `/manual-clinico/${params.slug}` },
      openGraph: {
        title: `${title} — Manual Clínico | DomineAqui`,
        description,
        url: `/manual-clinico/${params.slug}`,
        siteName: 'DomineAqui',
        locale: 'pt_BR',
        type: 'article',
        images: [
          {
            url: DEFAULT_OG_IMAGE,
            width: 1200,
            height: 630,
            alt: `${nome} — Manual Clínico DomineAqui`,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${title} — Manual Clínico | DomineAqui`,
        description,
        images: [DEFAULT_OG_IMAGE],
      },
      keywords: [
        nome,
        ...cidsRaw,
        ...(Array.isArray(patologia.sinonimos) ? patologia.sinonimos.slice(0, 3) : []),
        'manual clínico',
        'CID-10',
      ].filter(Boolean) as string[],
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
