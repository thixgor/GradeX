'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  ChevronRight,
  GitCompareArrows,
  ListChecks,
  Microscope,
  Search,
  Target,
} from 'lucide-react'
import type { Sinal } from '@/lib/semiologia/esquemas'
import { ROTAS } from '@/lib/semiologia/rotas'
import { Deslizador } from './deslizador'
import { CONTROLES } from './ilustracoes/controles'
import { Ilustracao } from './ilustracoes/registro'

/**
 * A ficha de um sinal.
 *
 * A ordem das seções é o caminho do raciocínio à beira do leito, e não a ordem
 * do livro: o que conta como presente → como se procura → por que aparece → o
 * que muda → onde engana. As armadilhas ficam **por último** de propósito. Lidas
 * antes do mecanismo, viram lista de exceções para decorar; lidas depois, são
 * consequência do que o aluno acabou de entender.
 *
 * O desempenho diagnóstico aparece em destaque quando existe, com a leitura
 * escrita ao lado do número — porque "LR+ 2,0" não significa nada sozinho, e o
 * que o aluno precisa levar é "isto não sustenta a decisão sozinho".
 */
export function FichaDeSinal({ sinal }: { sinal: Sinal }) {
  const controle = sinal.ilustracao ? CONTROLES[sinal.ilustracao.id] : undefined
  const [valor, setValor] = useState(() => {
    if (!controle) return 0
    const doDado = sinal.ilustracao?.params?.[controle.param]
    return typeof doDado === 'number' ? doDado : controle.padrao
  })

  const params = sinal.ilustracao
    ? controle
      ? { ...sinal.ilustracao.params, [controle.param]: valor }
      : sinal.ilustracao.params
    : undefined

  return (
    <article className="space-y-8">
      <header>
        <Link
          href={ROTAS.sinais}
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronRight className="h-3 w-3 rotate-180" />
          Sinais do exame físico
        </Link>
        <p className="mt-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {sinal.sistema.replace('-', ' e ')}
        </p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{sinal.nome}</h1>
        {sinal.sinonimos.length > 0 && (
          <p className="mt-1 text-sm italic text-muted-foreground">{sinal.sinonimos.join(' · ')}</p>
        )}
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">{sinal.resumo}</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        {/* Figura, com o controle quando o parâmetro tem significado clínico. */}
        {sinal.ilustracao && (
          <div className="space-y-3">
            <Ilustracao
              id={sinal.ilustracao.id}
              params={params}
              titulo={sinal.ilustracao.alt}
              className="border border-border"
            />
            {controle && <Deslizador id="controle-figura" controle={controle} valor={valor} onMudar={setValor} />}
          </div>
        )}

        <div className="space-y-5">
          <Bloco icone={Target} titulo="O que conta como presente">
            <p className="text-sm leading-relaxed">{sinal.definicao}</p>
          </Bloco>

          <Bloco icone={Microscope} titulo="Por que aparece">
            <p className="text-sm leading-relaxed text-muted-foreground">{sinal.mecanismo}</p>
          </Bloco>

          <Bloco icone={BookOpen} titulo="O que muda">
            <p className="text-sm leading-relaxed text-muted-foreground">{sinal.significado}</p>
          </Bloco>

          {sinal.comparador && (
            <Link
              href={ROTAS.comparador(sinal.comparador)}
              className="flex items-center gap-3 rounded-xl border border-sky-500/40 bg-sky-500/5 p-4 transition-colors hover:bg-sky-500/10"
            >
              <GitCompareArrows className="h-5 w-5 shrink-0 text-sky-600 dark:text-sky-400" />
              <div className="min-w-0">
                <p className="text-sm font-semibold">Comparar entre as causas</p>
                <p className="text-xs text-muted-foreground">
                  O mesmo achado, causa por causa, com a célula que decide destacada.
                </p>
              </div>
              <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" />
            </Link>
          )}
        </div>
      </div>

      <Bloco icone={Search} titulo="Como se procura">
        <ol className="space-y-3">
          {sinal.comoProcurar.map((item, i) => (
            <li key={item.passo} className="flex gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-500/15 text-[11px] font-semibold text-sky-700 dark:text-sky-300">
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-medium">{item.passo}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{item.detalhe}</p>
              </div>
            </li>
          ))}
        </ol>
      </Bloco>

      {sinal.desempenho && sinal.desempenho.length > 0 && (
        <Bloco icone={BarChart3} titulo="Quanto vale este sinal">
          <div className="space-y-4">
            {sinal.desempenho.map((item) => (
              <div key={item.alvo} className="rounded-lg border border-border p-4">
                <p className="text-sm font-medium">{item.alvo}</p>
                <dl className="mt-2.5 flex flex-wrap gap-x-6 gap-y-2">
                  {[
                    ['Sensibilidade', item.sensibilidade],
                    ['Especificidade', item.especificidade],
                    ['LR+', item.razaoPositiva],
                    ['LR−', item.razaoNegativa],
                  ]
                    .filter(([, valor]) => valor)
                    .map(([rotulo, valor]) => (
                      <div key={rotulo}>
                        <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">{rotulo}</dt>
                        <dd className="text-sm font-semibold tabular-nums">{valor}</dd>
                      </div>
                    ))}
                </dl>
                <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{item.leitura}</p>
                <p className="mt-1.5 text-[11px] text-muted-foreground/80">{item.fonte}</p>
              </div>
            ))}
          </div>
        </Bloco>
      )}

      <Bloco icone={ListChecks} titulo="Causas, por mecanismo">
        <div className="grid gap-4 sm:grid-cols-2">
          {sinal.causas.map((grupo) => (
            <div key={grupo.titulo} className="rounded-lg border border-border p-4">
              <p className="text-sm font-semibold">{grupo.titulo}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{grupo.mecanismo}</p>
              <ul className="mt-2.5 space-y-1">
                {grupo.itens.map((item) => (
                  <li key={item} className="flex gap-2 text-sm text-muted-foreground">
                    <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-muted-foreground/60" />
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Bloco>

      <Bloco icone={AlertTriangle} titulo="Onde engana">
        <ul className="space-y-2">
          {sinal.armadilhas.map((item) => (
            <li key={item} className="flex gap-2 text-sm text-muted-foreground">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </Bloco>

      {sinal.patologias && sinal.patologias.length > 0 && (
        <Bloco icone={BookOpen} titulo="Patologias em que este sinal é peça-chave">
          <ul className="flex flex-wrap gap-2">
            {sinal.patologias.map((slug) => (
              <li key={slug}>
                <Link
                  href={`/manual-clinico/${slug}`}
                  className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
                >
                  {slug.replace(/-/g, ' ')}
                  <ChevronRight className="h-3 w-3" />
                </Link>
              </li>
            ))}
          </ul>
        </Bloco>
      )}

      <footer className="border-t border-border pt-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Referências</p>
        <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
          {sinal.referencias.map((ref) => (
            <li key={ref}>{ref}</li>
          ))}
        </ul>
      </footer>
    </article>
  )
}

function Bloco({
  icone: Icone,
  titulo,
  children,
}: {
  icone: typeof Target
  titulo: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <Icone className="h-3.5 w-3.5" />
        {titulo}
      </h2>
      {children}
    </section>
  )
}
