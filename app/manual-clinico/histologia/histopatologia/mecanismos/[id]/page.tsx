import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { preload } from 'react-dom'

import { AppShell } from '@/components/app-shell'
import { Mecanismo } from '@/components/histopatologia/mecanismos'
import { mecanismoExiste } from '@/lib/histopatologia/paginas-existentes'
import { rotaDosDadosDaHistopatologia } from '@/lib/histopatologia/paginas-tipos'
import { rotaDoMecanismo } from '@/lib/histopatologia/rotas'
import { absoluteUrl } from '@/lib/seo'

/**
 * Um mecanismo patológico geral — casco estático, gerado na primeira visita a
 * cada mecanismo. O conteúdo chega de
 * `/api/manual-clinico/histologia/histopatologia/mecanismos/<id>`, depois do
 * portão; mecanismo inexistente continua em 404, decidido aqui.
 */

interface Props {
  params: Promise<{ id: string }>
}

export function generateStaticParams() {
  return []
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { id } = await props.params
  return { alternates: { canonical: absoluteUrl(rotaDoMecanismo(id)) } }
}

export default async function CascoDoMecanismo(props: Props) {
  const { id } = await props.params
  if (!mecanismoExiste(id)) notFound()

  preload(rotaDosDadosDaHistopatologia(['mecanismos', id]), { as: 'fetch', crossOrigin: 'anonymous' })

  return (
    <AppShell allowGuest showHeader={false} guestNotice={false}>
      <Mecanismo id={id} />
    </AppShell>
  )
}
