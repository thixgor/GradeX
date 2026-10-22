import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { preload } from 'react-dom'

import { AppShell } from '@/components/app-shell'
import { LaminaPatologicaDoZoom } from '@/components/histopatologia-zoom/paginas/lamina'
import { laminaPatologicaDoZoom } from '@/lib/histopatologia-zoom/paginas'
import { rotaDosDadosDaPatologiaComZoom } from '@/lib/histopatologia-zoom/paginas-tipos'
import { rotaDaLaminaPatologica } from '@/lib/histopatologia-zoom/rotas'
import { absoluteUrl } from '@/lib/seo'

/**
 * Uma lâmina da Histopatologia com Zoom — casco estático, gerado na primeira
 * visita a cada lâmina. A lâmina, os achados e a ficha chegam de
 * `/api/manual-clinico/histologia/histopatologia/zoom/<doença>/<lâmina>`, depois
 * do portão. Lâmina inexistente continua em 404, e doença errada na URL
 * continua levando ao endereço canônico — os dois decididos aqui.
 */

type Parametros = { params: Promise<{ doenca: string; lamina: string }> }

export function generateStaticParams() {
  return []
}

export async function generateMetadata(props: Parametros): Promise<Metadata> {
  const { doenca, lamina } = await props.params
  // Título e descrição são os do módulo: os da lâmina são conteúdo.
  return { alternates: { canonical: absoluteUrl(rotaDaLaminaPatologica(doenca, lamina)) } }
}

export default async function CascoDaLaminaPatologica(props: Parametros) {
  const params = await props.params
  const lamina = laminaPatologicaDoZoom(params.lamina)
  if (!lamina) notFound()
  if (lamina.doenca !== params.doenca) redirect(rotaDaLaminaPatologica(lamina.doenca, lamina.slug))

  preload(rotaDosDadosDaPatologiaComZoom([lamina.doenca, lamina.slug]), { as: 'fetch', crossOrigin: 'anonymous' })

  return (
    <AppShell allowGuest showHeader={false} guestNotice={false}>
      <LaminaPatologicaDoZoom doenca={lamina.doenca} lamina={lamina.slug} />
    </AppShell>
  )
}
