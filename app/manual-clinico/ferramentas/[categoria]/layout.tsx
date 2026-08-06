import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CATEGORIA_POR_ID, IDS_CATEGORIAS, ehCategoria } from '@/lib/ferramentas-clinicas/categorias'
import { publicIndexingRobots } from '@/lib/seo'

export function generateStaticParams() {
  return IDS_CATEGORIAS.map((categoria) => ({ categoria }))
}

export function generateMetadata({ params }: { params: { categoria: string } }): Metadata {
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

export default function CategoriaLayout({ children, params }: { children: React.ReactNode; params: { categoria: string } }) {
  if (!ehCategoria(params.categoria)) notFound()
  return children
}
