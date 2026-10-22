import type { Metadata } from 'next'
import { Suspense } from 'react'
import { notFound } from 'next/navigation'

import { AppShell } from '@/components/app-shell'
import { EsperaDaHistologia } from '@/components/histologia/portao'
import { CapituloWebPath } from '@/components/histopatologia/capitulo-webpath'
import { capituloWebPathExiste } from '@/lib/histopatologia/paginas-existentes'
import { rotaDoCapituloWebPathUtah } from '@/lib/histopatologia/rotas'
import { absoluteUrl } from '@/lib/seo'

/**
 * Um capítulo do WebPath/Utah no atlas — casco estático, gerado na primeira
 * visita a cada capítulo. As referências, já filtradas e paginadas, chegam de
 * `/api/manual-clinico/histologia/histopatologia/atlas/webpath-utah/<capítulo>`,
 * depois do portão; `?q=`, `?modalidade=`, `?pagina=` e `?ref=` são lidos no
 * navegador (daí o `Suspense`). Capítulo inexistente continua em 404.
 */

interface Props {
  params: Promise<{ capitulo: string }>
}

export function generateStaticParams() {
  return []
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { capitulo } = await props.params
  return { alternates: { canonical: absoluteUrl(rotaDoCapituloWebPathUtah(capitulo)) } }
}

export default async function CascoDoCapituloWebPath(props: Props) {
  const { capitulo } = await props.params
  if (!capituloWebPathExiste(capitulo)) notFound()

  return (
    <AppShell allowGuest showHeader={false} guestNotice={false}>
      <Suspense fallback={<EsperaDaHistologia />}>
        <CapituloWebPath capitulo={capitulo} />
      </Suspense>
    </AppShell>
  )
}
