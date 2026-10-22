import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { preload } from 'react-dom'

import { AppShell } from '@/components/app-shell'
import { CapituloDaDoenca } from '@/components/histopatologia/capitulo'
import { rotaDosDadosDoCapitulo } from '@/lib/histopatologia/capitulo-tipos'
import { listarSlugsDeDoenca } from '@/lib/histopatologia/repositorio'
import { rotaDaDoenca } from '@/lib/histopatologia/rotas'
import { absoluteUrl } from '@/lib/seo'

/**
 * Página canônica de doença — casco estático.
 *
 * ## Sem `generateStaticParams` para o catálogo inteiro
 *
 * O plano é explícito (§5.4): não incluir todas as doenças em
 * `generateStaticParams`. A lista cresce por acréscimo de arquivo editorial, e
 * uma rota que hoje é barata e amanhã tem trezentas entradas produz um build que
 * ninguém percebe estar degradando. O casco é gerado na primeira visita a cada
 * doença e servido do CDN daí em diante.
 *
 * ## O capítulo não está aqui
 *
 * A página lia a sessão (portão de assinatura) e por isso saía da função a cada
 * visita, com ~340 KB de HTML. O casco não carrega nada da doença — nem o nome:
 * o capítulo chega de `/api/manual-clinico/histologia/histopatologia/doencas/<slug>`,
 * depois do portão (ver `components/histopatologia/capitulo.tsx`). Doença
 * inexistente continua em 404, decidido aqui.
 */

interface Props {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return []
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { slug } = await props.params
  return { alternates: { canonical: absoluteUrl(rotaDaDoenca(slug)) } }
}

export default async function CascoDoCapitulo(props: Props) {
  const { slug } = await props.params
  if (!listarSlugsDeDoenca().includes(slug)) notFound()

  preload(rotaDosDadosDoCapitulo(slug), { as: 'fetch', crossOrigin: 'anonymous' })

  return (
    <AppShell allowGuest showHeader={false} guestNotice={false}>
      <CapituloDaDoenca slug={slug} />
    </AppShell>
  )
}
