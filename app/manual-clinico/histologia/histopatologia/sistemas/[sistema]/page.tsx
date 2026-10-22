import type { Metadata } from 'next'
import { Suspense } from 'react'
import { notFound } from 'next/navigation'

import { AppShell } from '@/components/app-shell'
import { EsperaDaHistologia } from '@/components/histologia/portao'
import { SistemaDaPatologia } from '@/components/histopatologia/sistema'
import { sistemaDaPatologiaExiste } from '@/lib/histopatologia/paginas-existentes'
import { rotaDoSistema } from '@/lib/histopatologia/rotas'
import { absoluteUrl } from '@/lib/seo'

/**
 * Um sistema da Histopatologia — casco estático, gerado na primeira visita a
 * cada sistema. Capítulos e inventário (paginado, filtrável por capítulo do
 * atlas) chegam de `/api/manual-clinico/histologia/histopatologia/sistemas/<id>`,
 * depois do portão; `?pagina=` e `?capitulo=` são lidos no navegador (daí o
 * `Suspense`). Sistema inexistente continua em 404, decidido aqui.
 */

interface Props {
  params: Promise<{ sistema: string }>
}

export function generateStaticParams() {
  return []
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { sistema } = await props.params
  return { alternates: { canonical: absoluteUrl(rotaDoSistema(sistema)) } }
}

export default async function CascoDoSistemaDaPatologia(props: Props) {
  const { sistema } = await props.params
  if (!sistemaDaPatologiaExiste(sistema)) notFound()

  return (
    <AppShell allowGuest showHeader={false} guestNotice={false}>
      <Suspense fallback={<EsperaDaHistologia />}>
        <SistemaDaPatologia sistema={sistema} />
      </Suspense>
    </AppShell>
  )
}
