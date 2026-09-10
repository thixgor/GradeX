'use client'

import { useEffect, useRef, useState } from 'react'
import { GripVertical, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Question } from '@/lib/types'
import { destinoDoArraste, resumoDaQuestao } from '@/lib/provas/ordem-das-questoes'

/**
 * A régua de questões do editor de provas: clicar para ir, arrastar para
 * reordenar.
 *
 * ## Por que ela existe
 *
 * O editor mostra uma questão por vez e dizia só "12/40". Para chegar na
 * questão certa era clicar "Próxima" até bater o olho nela, e para reordenar
 * eram as setinhas — que empurram a questão uma casa por clique contra
 * vizinhas que a tela nunca mostrou. Nos dois casos o admin trabalha às cegas
 * por falta da mesma informação: o que tem DENTRO das outras questões.
 *
 * A régua resolve os dois de uma vez porque é a mesma lista: cada questão
 * aparece com a fonte do enunciado ("ENEM 2023", "APG 4 — Cardio"), que é como
 * o admin chama as questões dele; sem fonte, entra o começo do enunciado.
 * Ver `lib/provas/ordem-das-questoes.ts`.
 *
 * ## Arrastar
 *
 * É `draggable` nativo, como o resto do admin (materiais, árvore de aulas).
 * Ele não existe em toque — por isso as setinhas continuam no cabeçalho da
 * questão: no celular elas são o único jeito de reordenar.
 *
 * A marca de destino é uma barra ENTRE dois cartões, não um cartão aceso: o
 * que se solta aqui é uma posição ("antes da 3"), e mostrar isso como uma
 * questão iluminada sugeriria uma troca, que não é o que acontece.
 */
export function SeletorDeQuestoes({
  questoes,
  atual,
  onSelecionar,
  onMover,
  onExcluir,
}: {
  questoes: Question[]
  /** Índice da questão aberta, ou -1 quando nenhuma está. */
  atual: number
  onSelecionar: (indice: number) => void
  onMover: (de: number, para: number) => void
  onExcluir?: (indice: number) => void
}) {
  // A questão sendo arrastada e a fenda sob o cursor (0..questoes.length).
  const [arrastando, setArrastando] = useState<number | null>(null)
  const [fenda, setFenda] = useState<number | null>(null)
  const listaRef = useRef<HTMLDivElement>(null)

  // Traz a questão aberta para dentro da vista — a régua rola, e navegar pelos
  // botões "Anterior/Próxima" numa prova longa deixaria a atual fora da tela.
  useEffect(() => {
    const alvo = listaRef.current?.querySelector<HTMLElement>('[data-atual="true"]')
    alvo?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [atual, questoes.length])

  if (questoes.length === 0) return null

  function soltar(insercao: number) {
    if (arrastando === null) return
    const destino = destinoDoArraste(arrastando, insercao)
    if (destino !== arrastando) onMover(arrastando, destino)
    setArrastando(null)
    setFenda(null)
  }

  /** A fenda mais perto do cursor: antes deste cartão, ou depois dele. */
  function fendaSobreOCartao(e: React.DragEvent, indice: number) {
    const caixa = e.currentTarget.getBoundingClientRect()
    return e.clientX < caixa.left + caixa.width / 2 ? indice : indice + 1
  }

  return (
    <div className="rounded-lg border bg-muted/40 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-muted-foreground">
          QUESTÕES DA PROVA ({questoes.length})
        </p>
        <p className="hidden text-xs text-muted-foreground sm:block">
          Clique para abrir · arraste para reordenar
        </p>
      </div>

      <div
        ref={listaRef}
        className="flex max-h-56 flex-wrap gap-1 overflow-y-auto"
        onDragLeave={(e) => {
          // Só apaga a marca quando o cursor sai da régua inteira; sair de um
          // cartão para o vizinho dispara este evento o tempo todo.
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFenda(null)
        }}
        onDrop={(e) => {
          e.preventDefault()
          if (fenda !== null) soltar(fenda)
        }}
        onDragOver={(e) => {
          if (arrastando !== null) e.preventDefault()
        }}
      >
        {questoes.map((questao, indice) => {
          const resumo = resumoDaQuestao(questao)
          const eAtual = indice === atual
          const icone = questao.type === 'multiple-choice' ? '📝' : questao.type === 'discursive' ? '✏️' : '✍️'

          return (
            <div key={questao.id} className="flex items-stretch">
              {/* A barra de destino ocupa espaço de verdade: piscar uma borda
                  dentro do cartão faria a lista tremer a cada movimento. */}
              <div
                className={cn(
                  'w-1 shrink-0 rounded-full transition-colors',
                  fenda === indice ? 'bg-purple-500' : 'bg-transparent'
                )}
                aria-hidden
              />
              <div
                data-atual={eAtual}
                draggable
                onDragStart={(e) => {
                  setArrastando(indice)
                  e.dataTransfer.effectAllowed = 'move'
                  // Firefox só inicia o arraste se houver dado no evento.
                  e.dataTransfer.setData('text/plain', questao.id)
                }}
                onDragEnd={() => {
                  setArrastando(null)
                  setFenda(null)
                }}
                onDragOver={(e) => {
                  if (arrastando === null) return
                  e.preventDefault()
                  e.dataTransfer.dropEffect = 'move'
                  setFenda(fendaSobreOCartao(e, indice))
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  soltar(fendaSobreOCartao(e, indice))
                }}
                className={cn(
                  'group flex max-w-[15rem] items-center gap-1 rounded-md border px-1.5 py-1 text-xs transition-colors',
                  eAtual
                    ? 'border-purple-500 bg-purple-100 dark:bg-purple-900/60'
                    : 'border-transparent bg-background hover:border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/30',
                  arrastando === indice && 'opacity-40'
                )}
              >
                <GripVertical
                  className="h-3.5 w-3.5 shrink-0 cursor-grab text-muted-foreground active:cursor-grabbing"
                  aria-hidden
                />
                <button
                  type="button"
                  onClick={() => onSelecionar(indice)}
                  className="flex min-w-0 items-center gap-1 text-left"
                  title={
                    resumo.texto
                      ? `Questão ${questao.number} — ${resumo.origem === 'fonte' ? 'Fonte: ' : ''}${resumo.texto}`
                      : `Questão ${questao.number} (sem enunciado)`
                  }
                >
                  <span className="font-semibold">{questao.number}.</span>
                  <span aria-hidden>{icone}</span>
                  <span
                    className={cn(
                      'truncate',
                      resumo.origem === 'fonte'
                        ? 'font-medium text-foreground'
                        : 'italic text-muted-foreground'
                    )}
                  >
                    {resumo.texto || 'sem enunciado'}
                  </span>
                </button>
                {onExcluir && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirm(`Deseja realmente excluir a questão ${questao.number}?`)) {
                        onExcluir(indice)
                      }
                    }}
                    className="shrink-0 text-red-500 opacity-0 transition-opacity hover:text-red-700 group-hover:opacity-100 dark:text-red-400 dark:hover:text-red-300"
                    title={`Excluir questão ${questao.number}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          )
        })}

        {/* A fenda do fim: sem ela não dá para soltar depois da última. */}
        <div
          className={cn(
            'w-1 shrink-0 rounded-full transition-colors',
            fenda === questoes.length ? 'bg-purple-500' : 'bg-transparent'
          )}
          aria-hidden
        />
        <div
          className="min-w-[2rem] flex-1"
          onDragOver={(e) => {
            if (arrastando === null) return
            e.preventDefault()
            e.dataTransfer.dropEffect = 'move'
            setFenda(questoes.length)
          }}
          onDrop={(e) => {
            e.preventDefault()
            e.stopPropagation()
            soltar(questoes.length)
          }}
        />
      </div>
    </div>
  )
}
