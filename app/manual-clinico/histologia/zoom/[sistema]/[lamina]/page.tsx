import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { preload } from 'react-dom'

import { AppShell } from '@/components/app-shell'
import { LaminaDoZoom } from '@/components/histologia-zoom/paginas/lamina'
import { laminaDoZoom } from '@/lib/histologia-zoom/paginas'
import { rotaDosDadosDoZoom } from '@/lib/histologia-zoom/paginas-tipos'
import { rotaDaLaminaZoom } from '@/lib/histologia-zoom/rotas'
import { histopatologiaHabilitada } from '@/lib/histopatologia/direitos'
import { absoluteUrl } from '@/lib/seo'

/**
 * Uma lâmina da Histologia com Zoom — casco estático, gerado na primeira visita
 * a cada lâmina e servido do CDN daí em diante.
 *
 * A página lia a sessão e saía da função a cada visita (~230 KB de HTML). O
 * casco não carrega nada da lâmina: título, ficha, marcações e pirâmide chegam
 * de `/api/manual-clinico/histologia/zoom/<sistema>/<lâmina>`, depois do portão.
 * Lâmina inexistente continua em 404, e sistema errado na URL (link antigo,
 * digitação) continua levando ao endereço canônico — os dois decididos aqui.
 */

type Parametros = { params: Promise<{ sistema: string; lamina: string }> }

export function generateStaticParams() {
  return []
}

export async function generateMetadata(props: Parametros): Promise<Metadata> {
  const { sistema, lamina } = await props.params
  // Título e descrição são os do módulo: os da lâmina são conteúdo.
  return { alternates: { canonical: absoluteUrl(rotaDaLaminaZoom(sistema, lamina)) } }
}

export default async function CascoDaLaminaDoZoom(props: Parametros) {
  const params = await props.params
  const lamina = laminaDoZoom(params.lamina)
  if (!lamina) notFound()
  if (lamina.sistema !== params.sistema) redirect(rotaDaLaminaZoom(lamina.sistema, lamina.slug))

  preload(rotaDosDadosDoZoom([lamina.sistema, lamina.slug]), { as: 'fetch', crossOrigin: 'anonymous' })

  return (
    <AppShell allowGuest showHeader={false} guestNotice={false}>
      <LaminaDoZoom sistema={lamina.sistema} lamina={lamina.slug} comPatologia={histopatologiaHabilitada()} />
    </AppShell>
  )
}
