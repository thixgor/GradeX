import Link from 'next/link'
import type { Metadata } from 'next'

import { AreaDosExames, CabecalhoDaSecao } from '@/components/exames-laboratoriais/area'
import { AvisoDeContexto } from '@/components/exames-laboratoriais/folha'
import { GerarParaPraticar } from '@/components/exames-laboratoriais/laboratorio'
import { COMPARACAO_POR_ID, DOENCAS, PADRAO_POR_ID } from '@/lib/exames-laboratoriais'

export const metadata: Metadata = {
  title: 'Doenças e o padrão laboratorial esperado | DomineAqui Lab',
  description:
    'A navegação inversa: parta da doença e veja o padrão laboratorial esperado, achado por achado, com a explicação de por que cada marcador se move naquela direção.',
}

/**
 * Doenças → exames: a navegação inversa.
 *
 * A seção inteira é construída para ser percorrida nos dois sentidos. Quem
 * parte de um valor alterado chega à doença pelas fichas de marcador; quem
 * parte da doença chega ao padrão esperado por aqui.
 *
 * O detalhe que faz diferença: cada achado vem com o `porque`. Uma tabela que
 * diz "ferritina ↓ na anemia ferropriva" ensina a decorar; uma que diz
 * "ferritina ↓ porque ela reflete o estoque, que foi o primeiro a acabar"
 * ensina a deduzir o próximo caso sozinho.
 */
export default function PaginaDeDoencas() {
  return (
    <AreaDosExames alvo="a navegação por doenças">
      <CabecalhoDaSecao
        titulo="Doenças e o padrão esperado"
        subtitulo="Parta da doença e veja o que o laboratório mostra — com a razão de cada alteração, e não apenas a seta."
      />

      <div className="container mx-auto max-w-4xl px-4 pb-16 pt-6">
        <nav className="flex flex-wrap gap-1.5" aria-label="Ir para uma doença">
          {DOENCAS.map((d) => (
            <a
              key={d.id}
              href={`#${d.id}`}
              className="rounded-full border border-border bg-muted/30 px-3 py-1.5 text-xs transition hover:border-primary/35"
            >
              {d.nome}
            </a>
          ))}
        </nav>

        <div className="mt-8 space-y-10">
          {DOENCAS.map((doenca) => (
            <article key={doenca.id} id={doenca.id} className="scroll-mt-24">
              <p className="lab-rubrica">Doença</p>
              <h2 className="mt-1 font-heading text-xl font-semibold tracking-tight">{doenca.nome}</h2>

              <div className="mt-3 rounded-xl border border-primary/25 bg-primary/[0.04] p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Fisiopatologia, do ponto de vista do laboratório
                </p>
                <p className="mt-1 text-sm leading-relaxed">{doenca.fisiopatologia}</p>
              </div>

              {/* Padrão esperado */}
              <div className="mt-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Padrão laboratorial esperado</p>
                <ul className="mt-2 space-y-1.5">
                  {doenca.esperado.map((e) => (
                    <li key={e.marcador} className="rounded-lg border border-border bg-card p-3">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                        <span className="text-sm font-semibold">
                          {e.id ? (
                            <Link
                              href={`/manual-clinico/exames-laboratoriais/marcador/${e.id}`}
                              prefetch={false}
                              className="hover:text-primary hover:underline"
                            >
                              {e.marcador}
                            </Link>
                          ) : (
                            e.marcador
                          )}
                        </span>
                        <span className={`font-mono text-sm font-bold ${corDaDirecao(e.direcao)}`}>{e.direcao}</span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{e.porque}</p>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {doenca.confirmacao && doenca.confirmacao.length > 0 && (
                  <div className="rounded-xl border border-border bg-card p-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">O que confirma</p>
                    <ul className="mt-2 space-y-1">
                      {doenca.confirmacao.map((c) => (
                        <li key={c} className="text-sm leading-relaxed text-muted-foreground">
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {doenca.diferenciais && doenca.diferenciais.length > 0 && (
                  <div className="rounded-xl border border-border bg-card p-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Do que diferenciar</p>
                    <ul className="mt-2 space-y-1">
                      {doenca.diferenciais.map((d) => (
                        <li key={d} className="text-sm leading-relaxed text-muted-foreground">
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Atalhos */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {(doenca.padroes ?? []).map((id) => {
                  const p = PADRAO_POR_ID.get(id)
                  if (!p) return null
                  return (
                    <Link
                      key={id}
                      href={`/manual-clinico/exames-laboratoriais/padroes#${id}`}
                      prefetch={false}
                      className="inline-flex rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium transition hover:border-primary/40"
                    >
                      Padrão: {p.nome}
                    </Link>
                  )
                })}
                {(doenca.comparacoes ?? []).map((id) => {
                  const c = COMPARACAO_POR_ID.get(id)
                  if (!c) return null
                  return (
                    <Link
                      key={id}
                      href={`/manual-clinico/exames-laboratoriais/comparar#${id}`}
                      prefetch={false}
                      className="inline-flex rounded-full border border-primary/25 bg-primary/5 px-3 py-1 text-xs font-medium text-primary transition hover:border-primary/45"
                    >
                      Comparar: {c.titulo}
                    </Link>
                  )
                })}
              </div>

              {doenca.cenario && (
                <div className="mt-4">
                  <GerarParaPraticar cenarios={[doenca.cenario]} titulo={`Gerar um exame de ${doenca.nome.toLowerCase()}`} />
                </div>
              )}

              <div className="lab-regua mt-8" />
            </article>
          ))}
        </div>

        <AvisoDeContexto />
      </div>
    </AreaDosExames>
  )
}

function corDaDirecao(direcao: string): string {
  if (direcao.includes('↑')) return 'text-amber-700 dark:text-amber-400'
  if (direcao.includes('↓')) return 'text-sky-700 dark:text-sky-400'
  return 'text-muted-foreground'
}
