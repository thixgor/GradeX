import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CATEGORIA_POR_ID, IDS_CATEGORIAS, ehCategoria } from '@/lib/ferramentas-clinicas/categorias'
import { publicIndexingRobots } from '@/lib/seo'

export function generateStaticParams() {
  return IDS_CATEGORIAS.map((categoria) => ({ categoria }))
}

export async function generateMetadata(props: { params: Promise<{ categoria: string }> }): Promise<Metadata> {
  const params = await props.params
  if (!ehCategoria(params.categoria)) return { title: 'Ferramentas Clínicas | Manual Clínico' }
  const c = CATEGORIA_POR_ID[params.categoria]
  return {
    title: `${c.nome} — Ferramentas Clínicas | Manual Clínico`,
    description: `${c.total} calculadoras e escores interativos de ${c.nome.toLowerCase()}. ${c.descricao}`,
    robots: publicIndexingRobots,
    openGraph: {
      title: `${c.nome} — Ferramentas Clínicas`,
      description: c.descricao,
    },
  }
}

export default async function CategoriaLayout(
  props: { children: React.ReactNode; params: Promise<{ categoria: string }> }
) {
  const params = await props.params

  const { children } = props

  if (!ehCategoria(params.categoria)) notFound()
  return children
}
