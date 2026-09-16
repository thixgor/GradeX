'use client'

import { useState } from 'react'
import { Enfase } from './enfase'
import Link from 'next/link'
import { ChevronRight, Key, Lightbulb, Rows3, Sparkles } from 'lucide-react'
import type { Comparador } from '@/lib/semiologia/esquemas'
import { ROTAS } from '@/lib/semiologia/rotas'
import { Ilustracao } from './ilustracoes/registro'

/**
 * A matriz de diferenciação.
 *
 * ## Duas leituras da mesma tabela
 *
 * Em tela larga, matriz: eixos nas linhas, causas nas colunas, e o olho varre
 * na horizontal comparando a mesma pergunta entre as causas — que é o gesto de
 * raciocínio que se quer treinar.
 *
 * No celular, matriz de cinco colunas é ilegível, e encolher a fonte até caber
 * seria fingir que resolveu. Ali a tabela vira **uma causa por vez**, com o
 * seletor em cima: o aluno perde a comparação simultânea e ganha conteúdo
 * legível, o que é a troca certa numa tela de 380 px.
 *
 * ## A célula decisiva
 *
 * `decisiva` marca o achado que, sozinho, muda a aposta. A interface o destaca
 * e a coluna repete esse achado como "chave". É a informação que sobrevive à
 * tabela — ninguém memoriza trinta e cinco células, mas cinco chaves cabem na
 * cabeça e resolvem a maioria dos casos.
 */
export function VisorDeComparador({ comparador }: { comparador: Comparador }) {
  const [colunaAtiva, setColunaAtiva] = useState(comparador.colunas[0]?.id ?? '')
  const coluna = comparador.colunas.find((c) => c.id === colunaAtiva) ?? comparador.colunas[0]

  return (
    <article className="space-y-8">
      <header>
        <Link
          href={ROTAS.comparadores}
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronRight className="h-3 w-3 rotate-180" />
          Comparadores
        </Link>
        <h1 className="mt-3 text-2xl font-bold sm:text-3xl">{comparador.titulo}</h1>
        <p className="mt-2 text-base italic text-muted-foreground">“{comparador.pergunta}”</p>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground"><Enfase texto={comparador.introducao} /></p>
      </header>

      {/* As chaves: o que cada causa tem de exclusivo. */}
      <section className="rounded-xl border border-sky-500/40 bg-sky-500/5 p-4 sm:p-5">
        <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-sky-700 dark:text-sky-400">
          <Key className="h-3.5 w-3.5" />
          O achado que decide cada uma
        </h2>
        <ul className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {comparador.colunas.map((c) => (
            <li key={c.id} className="flex gap-2.5">
              <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-600 dark:text-sky-400" />
              <p className="text-sm leading-relaxed">
                <strong className="font-semibold">{c.titulo}:</strong>{' '}
                <span className="text-muted-foreground">{c.chave}</span>
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* Figuras das causas, lado a lado. */}
      {comparador.colunas.some((c) => c.ilustracao) && (
        <div className={`grid gap-3 grid-cols-2 lg:grid-cols-${Math.min(5, comparador.colunas.length)}`}>
          {comparador.colunas.map((c) =>
            c.ilustracao ? (
              <figure key={c.id} className="space-y-1.5">
                <Ilustracao
                  id={c.ilustracao.id}
                  params={c.ilustracao.params}
                  titulo={c.ilustracao.alt}
                  className="border border-border"
                />
                <figcaption className="text-center text-[11px] font-medium">{c.titulo}</figcaption>
              </figure>
            ) : null,
          )}
        </div>
      )}

      {/* Matriz — só em tela larga. */}
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <caption className="sr-only">{comparador.titulo}</caption>
          <thead>
            <tr>
              <th scope="col" className="w-40 border-b border-border p-3 text-left align-bottom">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Eixo</span>
              </th>
              {comparador.colunas.map((c) => (
                <th key={c.id} scope="col" className="border-b border-border p-3 text-left align-bottom">
                  <span className="block text-sm font-semibold">{c.titulo}</span>
                  <span className="mt-0.5 block text-[11px] font-normal leading-snug text-muted-foreground">
                    {c.subtitulo}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {comparador.eixos.map((eixo) => (
              <tr key={eixo.id} className="align-top">
                <th scope="row" className="border-b border-border p-3 text-left">
                  <span className="block text-sm font-medium">{eixo.rotulo}</span>
                  {eixo.comoAvaliar !== '—' && (
                    <span className="mt-0.5 block text-[11px] font-normal leading-snug text-muted-foreground">
                      {eixo.comoAvaliar}
                    </span>
                  )}
                </th>
                {comparador.colunas.map((c) => {
                  const celula = c.celulas[eixo.id]
                  return (
                    <td
                      key={c.id}
                      className={`border-b border-border p-3 ${
                        celula?.decisiva ? 'bg-sky-500/10 ring-1 ring-inset ring-sky-500/30' : ''
                      }`}
                    >
                      {celula ? (
                        <>
                          <span className={`block text-sm ${celula.decisiva ? 'font-semibold' : ''}`}>
                            {celula.valor}
                          </span>
                          {celula.detalhe && (
                            <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                              <Enfase texto={celula.detalhe} />
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Uma causa por vez — celular. */}
      <div className="space-y-4 lg:hidden">
        <div className="flex flex-wrap gap-2">
          {comparador.colunas.map((c) => (
            <button
              key={c.id}
              onClick={() => setColunaAtiva(c.id)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                c.id === colunaAtiva
                  ? 'border-sky-500 bg-sky-500 text-white'
                  : 'border-border bg-card text-muted-foreground'
              }`}
            >
              {c.titulo}
            </button>
          ))}
        </div>
        {coluna && (
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm font-semibold">{coluna.titulo}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{coluna.subtitulo}</p>
            <dl className="mt-4 space-y-3">
              {comparador.eixos.map((eixo) => {
                const celula = coluna.celulas[eixo.id]
                if (!celula) return null
                return (
                  <div
                    key={eixo.id}
                    className={`rounded-lg p-2.5 ${celula.decisiva ? 'bg-sky-500/10 ring-1 ring-inset ring-sky-500/30' : 'bg-muted/40'}`}
                  >
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {eixo.rotulo}
                    </dt>
                    <dd className={`mt-0.5 text-sm ${celula.decisiva ? 'font-semibold' : ''}`}>{celula.valor}</dd>
                    {celula.detalhe && (
                      <dd className="mt-1 text-xs leading-relaxed text-muted-foreground"><Enfase texto={celula.detalhe} /></dd>
                    )}
                  </div>
                )
              })}
            </dl>
          </div>
        )}
      </div>

      <section className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-4 sm:p-5">
        <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
          <Lightbulb className="h-3.5 w-3.5" />
          Quando a tabela empata
        </h2>
        <p className="mt-2 text-sm leading-relaxed">{comparador.desempate}</p>
      </section>

      <footer className="border-t border-border pt-5">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Rows3 className="h-3.5 w-3.5" />
          Referências
        </p>
        <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
          {comparador.referencias.map((ref) => (
            <li key={ref}>{ref}</li>
          ))}
        </ul>
      </footer>
    </article>
  )
}
