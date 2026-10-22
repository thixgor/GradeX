import type { Metadata } from 'next'
import { Suspense } from 'react'
import { notFound } from 'next/navigation'

import { AppShell } from '@/components/app-shell'
import { EsperaDaHistologia } from '@/components/histologia/portao'
import { ComparacaoPatologica } from '@/components/histopatologia-zoom/paginas/comparacao'
import { comparacaoExiste } from '@/lib/histopatologia-zoom/paginas'
import { rotaDaComparacao } from '@/lib/histopatologia-zoom/rotas'
import { absoluteUrl } from '@/lib/seo'

/**
 * A lâmina da doença ao lado da normal — casco estático, gerado na primeira
 * visita a cada comparação. As duas lâminas chegam da rota de dados, depois do
 * portão. `?normal=` (qual lâmina normal fica à direita) é lido no navegador,
 * por isso o componente fica num `Suspense`: o casco é o mesmo para qualquer
 * valor dele.
 */

type Parametros = { params: Promise<{ doenca: string; lamina: string }> }

export function generateStaticParams() {
  return []
}

export async function generateMetadata(props: Parametros): Promise<Metadata> {
  const { doenca, lamina } = await props.params
  return { alternates: { canonical: absoluteUrl(rotaDaComparacao(doenca, lamina)) } }
}

export default async function CascoDaComparacaoPatologica(props: Parametros) {
  const { doenca, lamina } = await props.params
  if (!comparacaoExiste(doenca, lamina)) notFound()

  return (
    <AppShell allowGuest showHeader={false} guestNotice={false}>
      <Suspense fallback={<EsperaDaHistologia />}>
        <ComparacaoPatologica doenca={doenca} lamina={lamina} />
      </Suspense>
    </AppShell>
  )
}
