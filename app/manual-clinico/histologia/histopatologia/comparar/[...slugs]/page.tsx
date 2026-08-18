import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import { NavegacaoDoModulo } from '@/components/histologia/navegacao'
import { Comparador } from '@/components/histopatologia/comparador'
import { exigirAcessoAHistologia } from '@/lib/histologia/acesso'
import { histopatologiaHabilitada } from '@/lib/histopatologia/direitos'
import type { MidiaExibivel } from '@/lib/histopatologia/esquemas'
import { paraExibicao } from '@/lib/histopatologia/midia'
import { obterDoenca } from '@/lib/histopatologia/repositorio'
import { BASE, rotaDaDoenca, rotaDeComparacao } from '@/lib/histopatologia/rotas'
import { metadadosDoModulo } from '@/lib/histopatologia/seo'

/**
 * Comparador normal × patológico.
 *
 * A rota é `/comparar/<slug-da-doença>/<caminho-da-lâmina-normal>`, e o caminho
 * normal é validado contra o que a **própria doença declara** em
 * `histologiaNormalDeReferencia`. Isso não é formalidade: sem a checagem, a URL
 * aceitaria qualquer caminho e o comparador montaria pares arbitrários — uma
 * lâmina de rim ao lado de apendicite, com aparência de correspondência
 * editorial. O par precisa ter sido afirmado por alguém.
 */

export const dynamic = 'force-dynamic'

interface Props {
  params: { slugs: string[] }
}

function separar(slugs: string[]) {
  const [slugDaDoenca, ...caminhoNormal] = slugs
  return { slugDaDoenca, caminhoNormal }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slugDaDoenca, caminhoNormal } = separar(params.slugs)
  const fragmento = slugDaDoenca ? await obterDoenca(slugDaDoenca) : null
  if (!fragmento) return { title: 'Comparação não encontrada — Histopatologia' }

  return metadadosDoModulo({
    titulo: `${fragmento.doenca.nome} × histologia normal`,
    descricao:
      `Comparação lado a lado entre o tecido normal de referência e ${fragmento.doenca.nome}: ` +
      'o que foi perdido, o que foi acrescentado e o que foi reorganizado.',
    caminho: rotaDeComparacao(fragmento.doenca.slug, caminhoNormal),
    estadoDeRevisao: fragmento.doenca.revisao.estado,
  })
}

export default async function PaginaDeComparacao({ params }: Props) {
  await exigirAcessoAHistologia()

  const { slugDaDoenca, caminhoNormal } = separar(params.slugs)
  if (!slugDaDoenca || caminhoNormal.length === 0) notFound()

  const fragmento = await obterDoenca(slugDaDoenca)
  if (!fragmento) notFound()

  const chave = caminhoNormal.join('/')
  const referencia = fragmento.doenca.conteudo.histologiaNormalDeReferencia.find(
    (r) => r.caminhoNormal.join('/') === chave,
  )
  // Par não afirmado pela edição: 404 em vez de comparação inventada.
  if (!referencia) notFound()

  const midias: MidiaExibivel[] = fragmento.galeria
    .map((m) => paraExibicao(m))
    .filter((m): m is MidiaExibivel => m !== null)

  return (
    <AppShell allowGuest showHeader={false} guestNotice={false}>
      <div className="surface-page min-h-screen">
        <NavegacaoDoModulo histopatologiaHabilitada={histopatologiaHabilitada()} />
        <div className="container mx-auto max-w-6xl px-4 py-6">
          <Link
            href={rotaDaDoenca(fragmento.doenca.slug)}
            className="-m-3 mb-3 inline-flex items-center gap-1.5 rounded-lg p-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden /> {fragmento.doenca.nome}
          </Link>

          <header className="mb-6">
            <p className="editorial-mark mb-2">Comparar</p>
            <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
              {referencia.titulo} × {fragmento.doenca.nome}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              O normal vem primeiro, e não por convenção de layout: uma alteração só é alteração em
              relação a alguma coisa. Estabeleça a arquitetura saudável, depois procure o que mudou.
            </p>
          </header>

          <Comparador
            doenca={{ slug: fragmento.doenca.slug, nome: fragmento.doenca.nome }}
            referencia={referencia}
            midias={midias}
            linhasComparativas={fragmento.doenca.conteudo.normalVersusPatologico}
          />

          <nav className="mt-10 border-t border-border pt-6">
            <Link
              href={BASE}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-md border border-border bg-card px-3.5 text-sm font-bold transition-colors hover:border-teal-600/50"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Histopatologia
            </Link>
          </nav>
        </div>
      </div>
    </AppShell>
  )
}
