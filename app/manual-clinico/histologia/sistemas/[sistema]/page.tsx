import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { preload } from 'react-dom'

import { AppShell } from '@/components/app-shell'
import { SistemaUnificado } from '@/components/histologia/catalogo/sistemas'
import { BASE_DOS_SISTEMAS } from '@/lib/histologia/catalogo'
import { sistemaUnificadoExiste } from '@/lib/histologia/paginas-do-catalogo'
import { rotaDosDadosDoCatalogo } from '@/lib/histologia/paginas-do-catalogo-tipos'
import { absoluteUrl } from '@/lib/seo'

/**
 * Um sistema, normal e patológico numa página — casco estático, gerado na
 * primeira visita a cada sistema. As fileiras chegam de
 * `/api/manual-clinico/histologia/catalogo/sistemas/<sistema>`, depois do
 * portão; sistema inexistente (ou sem nada a mostrar) continua em 404,
 * decidido aqui.
 */

type Parametros = { params: Promise<{ sistema: string }> }

export function generateStaticParams() {
  return []
}

export async function generateMetadata(props: Parametros): Promise<Metadata> {
  const { sistema } = await props.params
  return { alternates: { canonical: absoluteUrl(`${BASE_DOS_SISTEMAS}/${sistema}`) } }
}

export default async function CascoDoSistemaUnificado(props: Parametros) {
  const { sistema } = await props.params
  if (!sistemaUnificadoExiste(sistema)) notFound()

  preload(rotaDosDadosDoCatalogo(['sistemas', sistema]), { as: 'fetch', crossOrigin: 'anonymous' })

  return (
    <AppShell allowGuest showHeader={false} guestNotice={false}>
      <SistemaUnificado sistema={sistema} />
    </AppShell>
  )
}
