import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { preload } from 'react-dom'

import { AppShell } from '@/components/app-shell'
import { ComparacaoComNormal } from '@/components/histopatologia/pagina-de-comparacao'
import { comparacaoComNormalExiste } from '@/lib/histopatologia/paginas-existentes'
import { rotaDosDadosDaHistopatologia } from '@/lib/histopatologia/paginas-tipos'
import { rotaDeComparacao } from '@/lib/histopatologia/rotas'
import { absoluteUrl } from '@/lib/seo'

/**
 * Comparador normal × patológico — casco estático, gerado na primeira visita a
 * cada par. O par só existe se a doença o declara (`histologiaNormalDeReferencia`):
 * par não afirmado pela edição continua em 404, decidido aqui. O conteúdo chega
 * de `/api/manual-clinico/histologia/histopatologia/comparar/…`, depois do portão.
 */

interface Props {
  params: Promise<{ slugs: string[] }>
}

export function generateStaticParams() {
  return []
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { slugs } = await props.params
  const [slugDaDoenca, ...caminhoNormal] = slugs
  return { alternates: { canonical: absoluteUrl(rotaDeComparacao(slugDaDoenca, caminhoNormal)) } }
}

export default async function CascoDaComparacaoComNormal(props: Props) {
  const { slugs } = await props.params
  if (!(await comparacaoComNormalExiste(slugs))) notFound()

  preload(rotaDosDadosDaHistopatologia(['comparar', ...slugs]), { as: 'fetch', crossOrigin: 'anonymous' })

  return (
    <AppShell allowGuest showHeader={false} guestNotice={false}>
      <ComparacaoComNormal slugs={slugs} />
    </AppShell>
  )
}
