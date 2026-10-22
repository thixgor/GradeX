'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { NavegacaoDoModulo } from '@/components/histologia/navegacao'
import { useTituloDaAba } from '@/components/histologia/pagina'
import { PortaoDaHistologia } from '@/components/histologia/portao'
import { Comparador } from '@/components/histopatologia/comparador'
import { rotaDosDadosDaHistopatologia, type DadosDaComparacaoComNormal } from '@/lib/histopatologia/paginas-tipos'
import { BASE, rotaDaDoenca } from '@/lib/histopatologia/rotas'

/**
 * Comparador normal × patológico.
 *
 * A rota é `/comparar/<slug-da-doença>/<caminho-da-lâmina-normal>`, e o caminho
 * normal é validado contra o que a **própria doença declara** em
 * `histologiaNormalDeReferencia` — no casco (404) e na rota de dados. Sem a
 * checagem, a URL aceitaria qualquer caminho e o comparador montaria pares
 * arbitrários, com aparência de correspondência editorial.
 */
export function ComparacaoComNormal({ slugs }: { slugs: string[] }) {
  return (
    <PortaoDaHistologia<DadosDaComparacaoComNormal> url={rotaDosDadosDaHistopatologia(['comparar', ...slugs])}>
      {(dados) => <Conteudo dados={dados} />}
    </PortaoDaHistologia>
  )
}

function Conteudo({ dados }: { dados: DadosDaComparacaoComNormal }) {
  const { doenca, referencia } = dados
  useTituloDaAba(`${doenca.nome} × histologia normal`, ' — Histopatologia | Manual da Histologia')

  return (
    <div className="surface-page min-h-screen">
      <NavegacaoDoModulo histopatologiaHabilitada />
      <div className="container mx-auto max-w-6xl px-4 py-6">
        <Link
          href={rotaDaDoenca(doenca.slug)}
          className="-m-3 mb-3 inline-flex items-center gap-1.5 rounded-lg p-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> {doenca.nome}
        </Link>

        <header className="mb-6">
          <p className="editorial-mark mb-2">Comparar</p>
          <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            {referencia.titulo} × {doenca.nome}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            O normal vem primeiro, e não por convenção de layout: uma alteração só é alteração em relação a alguma coisa.
            Estabeleça a arquitetura saudável, depois procure o que mudou.
          </p>
        </header>

        <Comparador
          doenca={doenca}
          referencia={referencia}
          midias={dados.midias}
          linhasComparativas={dados.linhasComparativas}
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
  )
}
