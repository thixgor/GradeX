'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Search, X } from 'lucide-react'

import { buscar, type ItemDoIndice, type TipoDeResultado } from '@/lib/exames-laboratoriais/busca'

/**
 * A busca da central.
 *
 * Recebe o índice leve montado no servidor — nome, sigla, sinônimos e uma
 * linha de resumo por item. O conteúdo profundo não vem junto: ele só é
 * carregado quando a pessoa abre o que encontrou.
 *
 * O que essa busca precisa acertar, e a maioria das buscas de exame erra:
 *
 * - **sinônimos**: quem digita "TGO" tem de achar a AST, e vice-versa;
 * - **alterações**: "hiponatremia" não é o nome de um exame, é o nome de um
 *   achado — e é assim que a pessoa pensa ao ler um laudo;
 * - **perguntas**: quem digita uma frase inteira quer a explicação, não uma
 *   lista de resultados. Por isso perguntas aparecem primeiro, já com a
 *   resposta curta visível.
 */

const ROTULO_DO_TIPO: Record<TipoDeResultado, string> = {
  pergunta: 'Pergunta',
  alteracao: 'Alteração',
  marcador: 'Marcador',
  exame: 'Exame',
  padrao: 'Padrão',
  doenca: 'Doença',
  sistema: 'Sistema',
}

const EXEMPLOS = ['Hemoglobina', 'TGO', 'Creatinina', 'Troponina', 'Hiponatremia', 'Anemia ferropriva', 'Colestase']

const PERGUNTAS_EXEMPLO = [
  'Por que a ferritina aumenta na inflamação?',
  'Qual a diferença entre TGO e TGP?',
  'Como diferenciar anemia ferropriva de talassemia?',
  'Por que o potássio aumenta na insuficiência renal?',
]

export function BuscaInteligente({ indice, autoFoco = false }: { indice: ItemDoIndice[]; autoFoco?: boolean }) {
  const [consulta, setConsulta] = useState('')
  const resultados = useMemo(() => buscar(indice, consulta), [indice, consulta])
  const buscando = consulta.trim().length >= 2

  return (
    <div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={consulta}
          onChange={(e) => setConsulta(e.target.value)}
          autoFocus={autoFoco}
          placeholder="Pesquisar exame, marcador, alteração ou doença..."
          aria-label="Pesquisar na central de exames laboratoriais"
          className="h-14 w-full rounded-xl border border-border bg-card pl-12 pr-11 text-base shadow-sm outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
        />
        {consulta && (
          <button
            onClick={() => setConsulta('')}
            aria-label="Limpar busca"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {!buscando && (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Experimente</span>
            {EXEMPLOS.map((e) => (
              <button
                key={e}
                onClick={() => setConsulta(e)}
                className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs transition hover:border-primary/35 hover:text-foreground"
              >
                {e}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Ou pergunte</span>
            {PERGUNTAS_EXEMPLO.map((p) => (
              <button
                key={p}
                onClick={() => setConsulta(p)}
                className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs text-primary transition hover:border-primary/40"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {buscando && (
        <div className="mt-4">
          {resultados.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
              Nada encontrado para <span className="font-semibold text-foreground">{consulta}</span>. Tente o nome do
              exame, a sigla, o nome da alteração (por exemplo, “hipercalemia”) ou o nome da doença.
            </p>
          ) : (
            <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
              {resultados.map((r) => (
                <li key={`${r.tipo}-${r.id}-${r.titulo}`}>
                  <Link
                    href={r.href}
                    prefetch={false}
                    className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/40"
                  >
                    <span className="lab-etiqueta lab-etiqueta-neutro mt-0.5 shrink-0">{ROTULO_DO_TIPO[r.tipo]}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold leading-snug">{r.titulo}</span>
                      {r.detalhe && (
                        <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground line-clamp-2">
                          {r.detalhe}
                        </span>
                      )}
                    </span>
                    <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground/50" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
