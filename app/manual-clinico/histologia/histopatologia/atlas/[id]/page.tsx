import type { Metadata } from 'next'
import { Suspense } from 'react'
import { notFound } from 'next/navigation'

import { AppShell } from '@/components/app-shell'
import { EsperaDaHistologia } from '@/components/histologia/portao'
import { EntradaDoAtlas } from '@/components/histopatologia/atlas'
import { entradaDoAtlasExiste } from '@/lib/histopatologia/paginas-existentes'
import { rotaDaEntradaCatalogada } from '@/lib/histopatologia/rotas'
import { absoluteUrl } from '@/lib/seo'

/**
 * Página de inventário de uma entrada catalogada — casco estático, gerado na
 * primeira visita a cada entrada (são 2.917: nada disso vai para o build).
 *
 * A entrada e a página pedida do inventário chegam de
 * `/api/manual-clinico/histologia/histopatologia/atlas/<entrada>`, depois do
 * portão; é a rota que lê o fragmento comprimido do acervo. `?pagina=` e os
 * filtros são lidos no navegador — por isso o `Suspense`: o casco é o mesmo
 * para qualquer valor deles. Entrada inexistente continua em 404, decidido aqui.
 */

interface Props {
  params: Promise<{ id: string }>
}

export function generateStaticParams() {
  return []
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { id } = await props.params
  return {
    alternates: { canonical: absoluteUrl(rotaDaEntradaCatalogada(decodificar(id))) },
    // Inventário nunca é indexável: são 2.917 páginas sem conteúdo editorial.
    robots: { index: false, follow: true },
  }
}

export default async function CascoDaEntradaDoAtlas(props: Props) {
  const { id } = await props.params
  if (!(await entradaDoAtlasExiste(decodificar(id)))) notFound()

  return (
    <AppShell allowGuest showHeader={false} guestNotice={false}>
      <Suspense fallback={<EsperaDaHistologia />}>
        <EntradaDoAtlas id={decodificar(id)} />
      </Suspense>
    </AppShell>
  )
}

function decodificar(valor: string): string {
  try {
    return decodeURIComponent(valor)
  } catch {
    return valor
  }
}
