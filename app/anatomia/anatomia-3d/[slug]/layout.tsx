import type { Metadata } from 'next'
import { publicIndexingRobots } from '@/lib/seo'
import { getModeloBySlug, getCategoria, FONTE } from '@/lib/anatomia-3d/modelos'

// Gerada na primeira visita e guardada até o próximo deploy, e não no build:
// ver "Páginas sob demanda" em next.config.js.
export function generateStaticParams() {
  return []
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
