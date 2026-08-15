import Link from 'next/link'
import type { Metadata } from 'next'

import { AreaDosExames, CabecalhoDaSecao } from '@/components/exames-laboratoriais/area'
import { AvisoDeContexto, Etiqueta } from '@/components/exames-laboratoriais/folha'
import { DOENCA_POR_ID, PADROES } from '@/lib/exames-laboratoriais'

export const metadata: Metadata = {
  title: 'Padrões laboratoriais clássicos | DomineAqui Lab',
  description:
    'Hepatocelular, colestático, hemólise, anemia microcítica, cetoacidose, SIADH, lesão renal aguda e outros padrões — cada um com o mecanismo que produz aquele conjunto e as armadilhas que o imitam.',
}

/**
 * Padrões laboratoriais.
 *
 * Um padrão não é uma lista de valores alterados: é um conjunto que se explica
 * por um mecanismo único. Reconhecê-lo é o que transforma sete números
 * alterados em uma hipótese — e é por isso que cada padrão aqui abre pelo
 * mecanismo, e não pelas causas.
 *
 * As armadilhas têm peso igual ao resto: quase todo padrão tem um sósia que
 * engana, e saber qual é ele vale tanto quanto saber o padrão.
 */
export default function PaginaDePadroes() {
  return (
    <AreaDosExames alvo="os padrões laboratoriais">
      <CabecalhoDaSecao
        titulo="Padrões laboratoriais"
        subtitulo="Conjuntos que se explicam por um mecanismo só. Reconhecer o padrão é o que transforma números alterados em hipótese."
      />

      <div className="container mx-auto max-w-4xl px-4 pb-16 pt-6">
        <nav className="flex flex-wrap gap-1.5" aria-label="Ir para um padrão">
          {PADROES.map((p) => (
            <a
              key={p.id}
              href={`#${p.id}`}
              className="rounded-full border border-border bg-muted/30 px-3 py-1.5 text-xs transition hover:border-primary/35"
            >
              {p.nome}
            </a>
          ))}
        </nav>

        <div className="mt-8 space-y-8">
          {PADROES.map((padrao) => (
            <article key={padrao.id} id={padrao.id} className="scroll-mt-24 rounded-2xl border border-border bg-card p-5 sm:p-6">
              <p className="lab-rubrica">Padrão</p>
              <h2 className="mt-1 font-heading text-xl font-semibold tracking-tight">{padrao.nome}</h2>
              <p className="mt-1 font-mono text-sm text-primary">{padrao.assinatura}</p>

              {/* Achados */}
              <div className="mt-4 space-y-2">
                {padrao.achados.map((a) => (
                  <div key={a.marcador} className="rounded-lg border border-border bg-muted/20 p-3">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                      <p className="text-sm font-semibold">
                        {a.id ? (
                          <Link
                            href={`/manual-clinico/exames-laboratoriais/marcador/${a.id}`}
                            prefetch={false}
                            className="hover:text-primary hover:underline"
                          >
                            {a.marcador}
                          </Link>
                        ) : (
                          a.marcador
                        )}
                      </p>
                      <span className={`font-mono text-sm font-bold ${corDaDirecao(a.direcao)}`}>{a.direcao}</span>
                    </div>
                    {a.porque && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{a.porque}</p>}
                  </div>
                ))}
              </div>

              {/* Mecanismo */}
              <div className="mt-4 rounded-lg border border-primary/25 bg-primary/[0.04] p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">O mecanismo</p>
                <p className="mt-1 text-sm leading-relaxed">{padrao.mecanismo}</p>
              </div>

              {/* Causas e próximos passos */}
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">O que costuma estar por trás</p>
                  <ul className="mt-2 space-y-1">
                    {padrao.causas.map((c) => (
                      <li key={c} className="text-sm leading-relaxed text-muted-foreground">
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
                {padrao.proximoPasso && padrao.proximoPasso.length > 0 && (
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">O passo seguinte</p>
                    <ul className="mt-2 space-y-1">
                      {padrao.proximoPasso.map((p) => (
                        <li key={p} className="text-sm leading-relaxed text-muted-foreground">
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Armadilhas */}
              {padrao.armadilhas && padrao.armadilhas.length > 0 && (
                <div className="mt-4 rounded-lg border-l-[3px] border-amber-500/70 bg-amber-500/[0.06] p-3.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                    O que imita este padrão e não é ele
                  </p>
                  <ul className="mt-1.5 space-y-1">
                    {padrao.armadilhas.map((a) => (
                      <li key={a} className="text-sm leading-relaxed">
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Doenças */}
              {padrao.doencas && padrao.doencas.length > 0 && (
                <div className="mt-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Doenças que o produzem</p>
                  <ul className="mt-1.5 flex flex-wrap gap-1.5">
                    {padrao.doencas.map((id) => {
                      const d = DOENCA_POR_ID.get(id)
                      if (!d) return null
                      return (
                        <li key={id}>
                          <Link
                            href={`/manual-clinico/exames-laboratoriais/doencas#${id}`}
                            prefetch={false}
                            className="inline-flex rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium transition hover:border-primary/40"
                          >
                            {d.nome}
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-1.5">
                {padrao.sistemas.map((s) => (
                  <Etiqueta key={s}>{s}</Etiqueta>
                ))}
              </div>
            </article>
          ))}
        </div>

        <AvisoDeContexto className="mt-8" />
      </div>
    </AreaDosExames>
  )
}

function corDaDirecao(direcao: string): string {
  if (direcao.includes('↑')) return 'text-amber-700 dark:text-amber-400'
  if (direcao.includes('↓')) return 'text-sky-700 dark:text-sky-400'
  return 'text-muted-foreground'
}
