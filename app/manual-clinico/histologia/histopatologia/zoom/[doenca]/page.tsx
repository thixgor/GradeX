import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { preload } from 'react-dom'

import { AppShell } from '@/components/app-shell'
import { DoencaComZoom } from '@/components/histopatologia-zoom/paginas/doenca'
import { doencaComZoomExiste } from '@/lib/histopatologia-zoom/paginas'
import { rotaDosDadosDaPatologiaComZoom } from '@/lib/histopatologia-zoom/paginas-tipos'
import { rotaDaDoencaZoom } from '@/lib/histopatologia-zoom/rotas'
import { absoluteUrl } from '@/lib/seo'

/**
 * Uma doença da Histopatologia com Zoom — casco estático, gerado na primeira
 * visita a cada doença. A ficha e as lâminas chegam de
 * `/api/manual-clinico/histologia/histopatologia/zoom/<doença>`, depois do
 * portão; doença inexistente (ou sem lâmina) continua em 404, decidido aqui.
 */

type Parametros = { params: Promise<{ doenca: string }> }

export function generateStaticParams() {
  return []
}

export async function generateMetadata(props: Parametros): Promise<Metadata> {
  const { doenca } = await props.params
  // Título e descrição são os do módulo: os da doença são conteúdo.
  return { alternates: { canonical: absoluteUrl(rotaDaDoencaZoom(doenca)) } }
}

export default async function CascoDaDoencaComZoom(props: Parametros) {
  const { doenca } = await props.params
  if (!doencaComZoomExiste(doenca)) notFound()

  preload(rotaDosDadosDaPatologiaComZoom([doenca]), { as: 'fetch', crossOrigin: 'anonymous' })

  return (
    <AppShell allowGuest showHeader={false} guestNotice={false}>
      <DoencaComZoom doenca={doenca} />
    </AppShell>
  )
}
