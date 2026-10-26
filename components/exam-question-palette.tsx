'use client'

import { useEffect } from 'react'
import { Lock, StickyNote } from 'lucide-react'
import { useAnnotationModeActive } from '@/components/inline-annotation-canvas'
import { Folha, MiniAnel } from '@/components/exam/pecas-da-prova'

export interface PaletteQuestion {
  id: string
  number: number
  type: 'multiple-choice' | 'discursive' | 'essay'
  answered: boolean
  hasAnnotation?: boolean
  locked?: boolean
}

interface ExamQuestionPaletteProps {
  questions: PaletteQuestion[]
  currentIndex: number
  onJump: (index: number) => void
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Questões que não podem ser abertas agora (tempo por questão não volta). */
  isDisabled?: (index: number) => boolean
}

const ROTULO_DO_TIPO = {
  'multiple-choice': 'Múltipla escolha',
  discursive: 'Discursivas',
  essay: 'Redação',
} as const

/**
 * O mapa de questões da prova: uma folha com a grade de números.
 *
 * Quem abre é o meio da barra do rodapé da prova (a posição e o progresso) —
 * antes era um botão flutuante próprio, empilhado sobre a barra de navegação e
 * disputando o mesmo canto da tela com o botão de anotação. Precisa morar
 * dentro do escopo `.vidro-ios` (os estilos vêm de `prova-ios.css`).
 */
export function ExamQuestionPalette({
  questions,
  currentIndex,
  onJump,
  open,
  onOpenChange,
  isDisabled,
}: ExamQuestionPaletteProps) {
  // Enquanto a pessoa desenha, a folha não fica aberta por cima do desenho.
  const annotating = useAnnotationModeActive()
  useEffect(() => {
    if (annotating && open) onOpenChange(false)
  }, [annotating, open, onOpenChange])

  if (!open) return null

  const answered = questions.filter((q) => q.answered).length
  const total = questions.length
  const pct = total ? Math.round((answered / total) * 100) : 0
  const tipos = (['multiple-choice', 'discursive', 'essay'] as const).filter((t) =>
    questions.some((q) => q.type === t),
  )

  return (
    <Folha
      titulo="Mapa de questões"
      subtitulo={
        <span className="tabular-nums">
          {answered} de {total} respondidas · {pct}%
        </span>
      }
      icone={<MiniAnel fracao={total ? answered / total : 0} />}
      onFechar={() => onOpenChange(false)}
      largura="lg"
    >
      <div className="space-y-5">
        <div className="pv-grade">
          {questions.map((q, idx) => {
            const atual = idx === currentIndex
            const bloqueada = isDisabled?.(idx) ?? false
            return (
              <button
                key={q.id}
                type="button"
                disabled={bloqueada}
                data-respondida={q.answered}
                aria-current={atual || undefined}
                aria-label={`Questão ${q.number}${q.answered ? ', respondida' : ', sem resposta'}${atual ? ', atual' : ''}`}
                onClick={() => {
                  onJump(idx)
                  onOpenChange(false)
                }}
              >
                {q.number}
                {q.hasAnnotation && (
                  <StickyNote className="absolute bottom-1 right-1 h-3 w-3 opacity-70" aria-hidden />
                )}
                {q.locked && <Lock className="absolute bottom-1 left-1 h-3 w-3 opacity-70" aria-hidden />}
              </button>
            )
          })}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[12.5px] ios-rotulo-2">
          <span className="inline-flex items-center gap-1.5">
            <span
              className="h-3 w-3 rounded-[4px] bg-[var(--ios-tinta-suave)]"
              style={{ boxShadow: 'inset 0 0 0 1.5px var(--ios-tinta)' }}
            />
            Respondida
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-[4px] bg-[var(--ios-preenchimento-forte)]" />
            Sem resposta
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-[4px] bg-[var(--ios-rotulo)]" />
            Atual
          </span>
          <span className="inline-flex items-center gap-1.5">
            <StickyNote className="h-3.5 w-3.5" /> Anotação
          </span>
          {questions.some((q) => q.locked) && (
            <span className="inline-flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" /> Conferida
            </span>
          )}
        </div>

        {tipos.length > 1 && (
          <ul className="ios-lista">
            {tipos.map((tipo) => {
              const doTipo = questions.filter((q) => q.type === tipo)
              return (
                <li key={tipo}>
                  <div className="ios-linha min-h-[46px] justify-between text-[15px]">
                    <span>{ROTULO_DO_TIPO[tipo]}</span>
                    <span className="font-semibold tabular-nums ios-rotulo-2">
                      {doTipo.filter((q) => q.answered).length}/{doTipo.length}
                    </span>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </Folha>
  )
}
