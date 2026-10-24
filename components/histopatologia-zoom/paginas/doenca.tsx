'use client'

import Link from 'next/link'
import { ArrowRight, BookOpen, Columns2 } from 'lucide-react'

import { NavegacaoDoModulo } from '@/components/histologia/navegacao'
import { useTituloDaAba } from '@/components/histologia/pagina'
import { PortaoDaHistologia } from '@/components/histologia/portao'
import { FichaDaDoenca } from '@/components/histopatologia-zoom/ficha-da-doenca'
import { MiniaturaIndisponivel } from '@/components/histopatologia-zoom/miniatura-indisponivel'
import { ConexoesDoManual } from '@/components/manual-clinico/integracao/conexoes-do-manual'
import { rotaDaLaminaZoom } from '@/lib/histologia-zoom/rotas'
import { BASE as BASE_PATOLOGIA } from '@/lib/histopatologia/rotas'
import { rotaDosDadosDaPatologiaComZoom, type DadosDaDoencaComZoom } from '@/lib/histopatologia-zoom/paginas-tipos'
import { BASE_PATOZOOM, rotaDaComparacao, rotaDaLaminaPatologica } from '@/lib/histopatologia-zoom/rotas'

/**
 * Uma doença da Histopatologia com Zoom: as lâminas e a ficha. O casco é
 * estático; o conteúdo vem da rota de dados, depois do portão.
 */
export function DoencaComZoom({ doenca }: { doenca: string }) {
  return (
    <PortaoDaHistologia<DadosDaDoencaComZoom> url={rotaDosDadosDaPatologiaComZoom([doenca])}>
      {(dados) => <Conteudo dados={dados} />}
    </PortaoDaHistologia>
  )
}

function Conteudo({ dados }: { dados: DadosDaDoencaComZoom }) {
  const { doenca, laminas, normal } = dados
  useTituloDaAba(`${doenca.nome} — Histopatologia com Zoom`)

  return (
    <div className="surface-page min-h-screen">
      <NavegacaoDoModulo histopatologiaHabilitada visto={dados.visto} />
      <div className="container mx-auto max-w-6xl px-4 py-6">
        <nav aria-label="Trilha" className="mb-2 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
          <Link href={BASE_PATOLOGIA} className="rounded px-1 py-1 hover:text-foreground">
            Histopatologia
          </Link>
          <span aria-hidden>›</span>
          <Link href={BASE_PATOZOOM} className="rounded px-1 py-1 hover:text-foreground">
            Lâminas com zoom
          </Link>
        </nav>
        <header className="mb-6">
          <p className="editorial-mark mb-1 text-rose-700 dark:text-rose-300">{dados.orgao ?? 'Doença'}</p>
          <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">{doenca.nome}</h1>
          {doenca.sinonimos.length > 0 && (
            <p className="mt-1 text-sm text-muted-foreground">Também: {doenca.sinonimos.join(', ')}</p>
          )}
          {/* A mesma doença tem capítulo escrito: um link, não uma página concorrente. */}
          {dados.capitulo && (
            <Link
              href={dados.capitulo}
              className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-[#E8763A]/50 bg-[#E8763A]/10 px-4 text-sm font-bold transition-colors hover:bg-[#E8763A]/20"
            >
              <BookOpen className="h-4 w-4 text-[#E8763A]" aria-hidden />
              Ler o capítulo aprofundado
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          )}
        </header>

        <section aria-labelledby="laminas" className="mb-10">
          <h2 id="laminas" className="mb-3 font-heading text-xl font-semibold tracking-tight">
            {laminas.length === 1 ? 'Lâmina' : `Lâminas (${laminas.length})`}
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {laminas.map((l) => (
              <li key={l.slug} className="overflow-hidden rounded-xl border border-border bg-card">
                <Link href={rotaDaLaminaPatologica(doenca.id, l.slug)} className="group block">
                  <span className="relative block aspect-[4/3] overflow-hidden bg-white">
                    {l.disponivel ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={l.miniatura}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <MiniaturaIndisponivel />
                    )}
                    {l.suplementar && (
                      <span className="absolute left-2 top-2 rounded-full bg-black/65 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                        Suplementar
                      </span>
                    )}
                  </span>
                  <span className="block p-3">
                    <span className="flex items-center gap-1 font-semibold group-hover:text-rose-700 dark:group-hover:text-rose-300">
                      {l.nome}
                      <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {l.caso} · {l.achadosPresentes} achados presentes
                    </span>
                    <span className="mt-0.5 block text-[11px] text-muted-foreground">
                      {l.acervo}
                      {!l.disponivel && ' · servidor fora do ar no momento'}
                    </span>
                  </span>
                </Link>
                {normal && (
                  <Link
                    href={rotaDaComparacao(doenca.id, l.slug)}
                    className="flex min-h-[40px] items-center gap-2 border-t border-border px-3 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Columns2 className="h-3.5 w-3.5" aria-hidden /> Comparar com o normal
                  </Link>
                )}
              </li>
            ))}
          </ul>
          {normal && (
            <p className="mt-3 text-sm text-muted-foreground">
              Histologia normal de referência:{' '}
              <Link href={rotaDaLaminaZoom(normal.sistema, normal.slug)} className="font-semibold underline underline-offset-2">
                {normal.titulo}
                {normal.subtitulo ? ` — ${normal.subtitulo}` : ''} ({normal.coloracao})
              </Link>
            </p>
          )}
        </section>

        <article aria-label={`Ficha de ${doenca.nome}`}>
          <FichaDaDoenca doenca={doenca} nomesDosAchados={dados.nomesDosAchados} />
        </article>

        <ConexoesDoManual refOrigem={`patozoom:${doenca.id}`} titulo={doenca.nome} className="px-0 pb-0" />

        <footer className="mt-10 space-y-1.5 border-t border-border pt-4 text-[11px] leading-relaxed text-muted-foreground">
          {dados.creditos.map((c) => (
            <div key={c.rodape} className="space-y-1.5">
              <p>{c.rodape}</p>
              <p>{c.referencia}</p>
            </div>
          ))}
        </footer>
      </div>
    </div>
  )
}
