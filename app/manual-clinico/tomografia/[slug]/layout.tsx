import type { Metadata } from 'next'
import { publicIndexingRobots } from '@/lib/seo'
import { getSubsecao, getSecaoDaSubsecao, TODAS_SUBSECOES } from '@/lib/tomografia'

/**
 * Metadata por série. Como o conteúdo é estático e vive no bundle, dá para
 * gerar título e descrição a partir dele — cada série ganha uma página com
 * identidade própria para busca, em vez de vinte páginas com o mesmo título.
 */
export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const sub = getSubsecao(params.slug)
  if (!sub) {
    return { title: 'Série não encontrada — Manual de Tomografia', robots: { index: false, follow: false } }
  }
  const secao = getSecaoDaSubsecao(sub)
  const nomes = sub.estruturas.slice(0, 8).map((e) => e.nome).join(', ')
  const titulo = `${sub.titulo} na TC — ${secao?.titulo} | Manual de Tomografia`
  const descricao = `${sub.subtitulo}. ${sub.totalCortes} cortes interativos e ${sub.estruturas.length} estruturas comentadas: ${nomes}. Densidade em unidades Hounsfield, janela ideal, como identificar, importância clínica e alterações na TC.`

  return {
    title: titulo,
    description: descricao,
    robots: publicIndexingRobots,
    openGraph: { title: titulo, description: sub.subtitulo },
  }
}

export function generateStaticParams() {
  return TODAS_SUBSECOES.map((s) => ({ slug: s.id }))
}

export default function SerieLayout({ children }: { children: React.ReactNode }) {
  return children
}
