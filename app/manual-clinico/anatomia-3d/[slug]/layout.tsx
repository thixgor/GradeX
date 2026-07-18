import type { Metadata } from 'next'
import { publicIndexingRobots } from '@/lib/seo'
import { MODELOS, getModeloBySlug, getCategoria, FONTE } from '@/lib/anatomia-3d/modelos'

export function generateStaticParams() {
  return MODELOS.map(m => ({ slug: m.slug }))
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const modelo = getModeloBySlug(params.slug)
  if (!modelo) {
    return {
      title: 'Modelo 3D — Anatomia 3D | Manual Clínico',
      robots: publicIndexingRobots,
    }
  }
  const categoria = getCategoria(modelo.categoriaId)
  const title = `${modelo.titulo} — Anatomia 3D | Manual Clínico`
  const description = `${modelo.resumo} Categoria: ${categoria.titulo}. Modelo 3D interativo com explicação anatômica aprofundada. Fonte: ${FONTE}.`
  return {
    title,
    description,
    robots: publicIndexingRobots,
    openGraph: { title, description },
  }
}

export default function ModeloLayout({ children }: { children: React.ReactNode }) {
  return children
}
