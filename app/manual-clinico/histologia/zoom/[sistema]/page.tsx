import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { preload } from 'react-dom'

import { AppShell } from '@/components/app-shell'
import { SistemaDoZoom } from '@/components/histologia-zoom/paginas/sistema'
import { rotaDosDadosDoZoom } from '@/lib/histologia-zoom/paginas-tipos'
import { rotaDoSistema } from '@/lib/histologia-zoom/rotas'
import { sistemaPorId } from '@/lib/histologia-zoom/sistemas'
import { histopatologiaHabilitada } from '@/lib/histopatologia/direitos'
import { absoluteUrl } from '@/lib/seo'

/**
 * Um sistema da Histologia com Zoom — casco estático, gerado na primeira visita
 * a cada sistema. O conteúdo chega de `/api/manual-clinico/histologia/zoom/<sistema>`,
 * depois do portão; sistema inexistente continua em 404, decidido aqui.
 */

type Parametros = { params: Promise<{ sistema: string }> }

export function generateStaticParams() {
  return []
}

export async function generateMetadata(props: Parametros): Promise<Metadata> {
  const { sistema } = await props.params
  return { alternates: { canonical: absoluteUrl(rotaDoSistema(sistema)) } }
}

export default async function CascoDoSistemaDoZoom(props: Parametros) {
  const { sistema } = await props.params
  if (!sistemaPorId(sistema)) notFound()

  preload(rotaDosDadosDoZoom([sistema]), { as: 'fetch', crossOrigin: 'anonymous' })

  return (
    <AppShell allowGuest showHeader={false} guestNotice={false}>
      <SistemaDoZoom sistema={sistema} comPatologia={histopatologiaHabilitada()} />
    </AppShell>
  )
}
