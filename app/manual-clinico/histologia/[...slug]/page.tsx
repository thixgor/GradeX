import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { preload } from 'react-dom'

import { AppShell } from '@/components/app-shell'
import { PaginaDoCurriculo } from '@/components/histologia/pagina-do-curriculo'
import { rotaDosDadosDoCurriculo } from '@/lib/histologia/curriculo-tipos'
import { obterPagina } from '@/lib/histologia/repositorio'
import { rotaDaPagina } from '@/lib/histologia/seo'
import { absoluteUrl } from '@/lib/seo'

/**
 * Rota única para as 1.524 páginas do currículo — casco estático.
 *
 * A página lia a sessão (o portão de assinatura) e por isso era renderizada a
 * cada visita: ~80–110 KB de HTML sem compressão saindo da função. Agora:
 *
 * - **o casco** é gerado na primeira visita a cada endereço e servido do CDN
 *   daí em diante (`generateStaticParams` vazio: pré-gerar 1.524 páginas no
 *   build custaria minutos a cada deploy). Ele não carrega nada do acervo — nem
 *   título, nem descrição, nem imagem;
 * - **o conteúdo** vem de `/api/manual-clinico/histologia/curriculo/…`, que
 *   passa pelo portão (`lib/histologia/acesso.ts`) e responde 404 a quem não
 *   assina — o casco então leva à home, onde está a vitrine;
 * - **o visitante sem sessão** nem recebe o casco: o middleware o manda para a
 *   home na borda.
 *
 * Rota inexistente continua em 404, decidido aqui no servidor.
 * `?estrutura=` (a camada a acender, vinda da busca) é lida no navegador.
 */

export function generateStaticParams() {
  return []
}

interface Props {
  params: Promise<{ slug: string[] }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { slug } = await props.params
  // Título e descrição são os do módulo (o layout): os da lâmina são conteúdo.
  return { alternates: { canonical: absoluteUrl(rotaDaPagina(slug)) } }
}

export default async function CascoDaPaginaDoCurriculo(props: Props) {
  const { slug } = await props.params
  if (!(await obterPagina(slug))) notFound()

  // O conteúdo começa a ser buscado junto com o HTML, e não só depois de o
  // JavaScript hidratar o casco.
  preload(rotaDosDadosDoCurriculo(slug), { as: 'fetch', crossOrigin: 'anonymous' })

  return (
    <AppShell allowGuest showHeader={false} guestNotice={false}>
      <PaginaDoCurriculo caminho={slug} />
    </AppShell>
  )
}
