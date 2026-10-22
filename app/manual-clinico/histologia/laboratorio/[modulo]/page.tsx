import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { preload } from 'react-dom'

import { AppShell } from '@/components/app-shell'
import { ModuloDoLaboratorio } from '@/components/histologia/pagina-do-laboratorio'
import { obterModulo } from '@/lib/histologia/laboratorio'
import { rotaDosDadosDoCatalogo } from '@/lib/histologia/paginas-do-catalogo-tipos'
import { BASE } from '@/lib/histologia/seo'
import { histopatologiaHabilitada } from '@/lib/histopatologia/direitos'
import { absoluteUrl } from '@/lib/seo'

/**
 * Um módulo do laboratório virtual — casco estático, gerado na primeira visita
 * a cada módulo. O conteúdo chega de
 * `/api/manual-clinico/histologia/catalogo/laboratorio/<módulo>`, depois do
 * portão; módulo inexistente continua em 404, decidido aqui.
 */

interface Props {
  params: Promise<{ modulo: string }>
}

export function generateStaticParams() {
  return []
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { modulo } = await props.params
  return { alternates: { canonical: absoluteUrl(`${BASE}/laboratorio/${modulo}`) } }
}

export default async function CascoDoModuloDoLaboratorio(props: Props) {
  const { modulo } = await props.params
  if (!obterModulo(modulo)) notFound()

  preload(rotaDosDadosDoCatalogo(['laboratorio', modulo]), { as: 'fetch', crossOrigin: 'anonymous' })

  return (
    <AppShell allowGuest showHeader={false} guestNotice={false}>
      <ModuloDoLaboratorio modulo={modulo} comPatologia={histopatologiaHabilitada()} />
    </AppShell>
  )
}
