'use client'

import { useMemo, useState } from 'react'
import { ChevronRight, Layers } from 'lucide-react'
import {
  CardDeAula,
  EstadoVazio,
  ResumoDoCurso,
  Trilho,
  type AulaNaBiblioteca,
} from '@/components/aulas/biblioteca'
import { contarAulas, temConteudo, type RamoDoCurso } from '@/lib/aulas/ramos'
import { cn } from '@/lib/utils'

/**
 * O conteúdo de um curso, em árvore.
 *
 * Estes componentes viviam dentro de `app/aulas/page.tsx`, onde o curso abria
 * embutido na biblioteca. A página dedicada do curso (§18) precisa exatamente
 * do mesmo desenho — e reescrevê-lo lá significaria manter duas versões da
 * organização que o aluno já aprendeu a ler, que divergiriam no primeiro
 * ajuste.
 *
 * O formato atual é a segunda tentativa. A primeira empilhava os quatro níveis
 * verticalmente: tópico, subtópico, módulo e submódulo viravam uma sequência de
 * títulos que descia sem fim, e a hierarquia existia só no tamanho da fonte. As
 * duas correções estão aqui:
 *
 *  1. **Tópicos viram abas.** Um assunto por vez, então a página tem fim.
 *  2. **Os níveis abaixo ganham contenção visual.** Subtópico é um bloco com
 *     borda própria; os módulos moram dentro dele. Dá para VER o agrupamento.
 */

export type Ramo = RamoDoCurso<AulaNaBiblioteca & { _id: string }>

export function CursoAberto({
  ramos,
  progresso,
}: {
  ramos: Ramo[]
  progresso?: { total: number; concluidas: number }
}) {
  const comConteudo = useMemo(() => ramos.filter(temConteudo), [ramos])
  const [abaAtiva, setAbaAtiva] = useState<string | null>(null)

  // A aba escolhida some quando a busca muda os ramos; voltar para a primeira
  // é melhor do que mostrar uma tela vazia sem explicação.
  const aba = comConteudo.find((r) => r.id === abaAtiva) || comConteudo[0]

  if (comConteudo.length === 0) {
    return (
      <EstadoVazio
        icone={Layers}
        titulo="Nenhuma aula por aqui ainda"
        descricao="Assim que as aulas deste curso forem liberadas, elas aparecem organizadas por módulo."
        acaoLabel="Ver outros cursos"
        acaoHref="/aulas"
      />
    )
  }

  return (
    <div className="space-y-5">
      {progresso && progresso.total > 0 ? (
        <div className="rounded-xl border border-border bg-card p-4">
          <ResumoDoCurso concluidas={progresso.concluidas} total={progresso.total} />
        </div>
      ) : null}

      {/* Abas dos tópicos — só aparecem quando há mais de um assunto. */}
      {comConteudo.length > 1 ? (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0">
          {comConteudo.map((r) => {
            const { total, concluidas } = contarAulas(r)
            const ativa = r.id === aba?.id
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setAbaAtiva(r.id)}
                aria-pressed={ativa}
                className={cn(
                  'inline-flex flex-none items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition',
                  ativa
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card text-muted-foreground hover:text-foreground',
                )}
              >
                {r.nome}
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums',
                    ativa ? 'bg-primary-foreground/20' : 'bg-muted',
                  )}
                >
                  {concluidas}/{total}
                </span>
              </button>
            )
          })}
        </div>
      ) : null}

      {aba ? <ConteudoDoRamo ramo={aba} /> : null}
    </div>
  )
}

/**
 * O conteúdo de um tópico: aulas soltas primeiro, depois os blocos filhos.
 *
 * Cada filho com netos (subtópico contendo módulos) vira um bloco cercado; um
 * filho folha (módulo com aulas) vira só um trilho rotulado. Assim a moldura
 * aparece onde ela informa algo — agrupar — e não em volta de cada linha.
 */
function ConteudoDoRamo({ ramo }: { ramo: Ramo }) {
  const filhos = ramo.filhos.filter(temConteudo)

  return (
    <div className="space-y-5">
      {ramo.aulas.length > 0 ? (
        <Trilho>
          {ramo.aulas.map((aula) => (
            <CardDeAula key={aula._id} aula={aula} noTrilho />
          ))}
        </Trilho>
      ) : null}

      {filhos.map((filho) =>
        filho.filhos.some(temConteudo) ? (
          <BlocoAgrupador key={filho.id} ramo={filho} />
        ) : (
          <TrilhoRotulado key={filho.id} ramo={filho} />
        ),
      )}
    </div>
  )
}

/** Subtópico (ou módulo com submódulos): bloco cercado que agrupa os filhos. */
function BlocoAgrupador({ ramo }: { ramo: Ramo }) {
  const [aberto, setAberto] = useState(true)
  const { total, concluidas } = contarAulas(ramo)
  const filhos = ramo.filhos.filter(temConteudo)

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-muted/20">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-muted/40"
      >
        <span className="flex min-w-0 items-center gap-2">
          <ChevronRight
            className={cn('h-4 w-4 flex-none text-muted-foreground transition-transform', aberto && 'rotate-90')}
          />
          <span className="truncate font-bold">{ramo.nome}</span>
        </span>
        <span className="flex-none text-xs text-muted-foreground">
          {concluidas}/{total}
        </span>
      </button>

      {aberto ? (
        <div className="space-y-4 border-t border-border px-4 py-4">
          {ramo.aulas.length > 0 ? (
            <Trilho>
              {ramo.aulas.map((aula) => (
                <CardDeAula key={aula._id} aula={aula} noTrilho />
              ))}
            </Trilho>
          ) : null}

          {filhos.map((filho) =>
            filho.filhos.some(temConteudo) ? (
              <BlocoAgrupador key={filho.id} ramo={filho} />
            ) : (
              <TrilhoRotulado key={filho.id} ramo={filho} />
            ),
          )}
        </div>
      ) : null}
    </section>
  )
}

/** Módulo folha: rótulo, progresso e o trilho de aulas. */
function TrilhoRotulado({ ramo }: { ramo: Ramo }) {
  const { total, concluidas } = contarAulas(ramo)

  return (
    <section>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <h3 className="flex items-center gap-1.5 text-sm font-bold">
          <Layers className="h-3.5 w-3.5 text-primary" />
          {ramo.nome}
        </h3>
        <span className="text-xs text-muted-foreground">
          {concluidas}/{total}
        </span>
      </div>
      <Trilho>
        {ramo.aulas.map((aula) => (
          <CardDeAula key={aula._id} aula={aula} noTrilho />
        ))}
      </Trilho>
    </section>
  )
}
