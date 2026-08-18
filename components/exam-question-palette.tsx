'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { LayoutGrid, X, CheckCircle2, Circle, StickyNote, Lock } from 'lucide-react'
import { useAnnotationModeActive } from '@/components/inline-annotation-canvas'

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
  /** When true, renders inline (used in scroll mode to jump via scrollIntoView).
   *  Caller still receives the index in onJump. */
  inline?: boolean
  /** Sobe o botão flutuante quando existe uma barra de navegação fixa no rodapé
   *  (modo paginado), para os dois não ocuparem o mesmo canto da tela. */
  raised?: boolean
}

export function ExamQuestionPalette({ questions, currentIndex, onJump, raised = false }: ExamQuestionPaletteProps) {
  const [open, setOpen] = useState(false)
  // Enquanto a pessoa está desenhando, o botão flutuante sai da frente — a
  // barra de anotação já ocupa esse canto da tela.
  const annotating = useAnnotationModeActive()

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (annotating) setOpen(false)
  }, [annotating])

  const answered = questions.filter(q => q.answered).length
  const total = questions.length
  const pct = total ? Math.round((answered / total) * 100) : 0

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Mapa de questões"
        className={cn(
          'fixed right-3 sm:right-5 z-50 group flex items-center gap-2 pl-3 pr-3.5 py-2.5 rounded-2xl bg-background/95 backdrop-blur-md border border-border/60 shadow-lg shadow-black/5 hover:shadow-xl hover:scale-[1.03] transition-all',
          raised
            ? 'bottom-[calc(6rem+env(safe-area-inset-bottom))] sm:bottom-[calc(6.5rem+env(safe-area-inset-bottom))]'
            : 'bottom-20 sm:bottom-24',
          annotating && 'pointer-events-none opacity-0 translate-y-2'
        )}
      >
        <div className="relative">
          <LayoutGrid className="h-4 w-4 text-primary" />
          {answered < total && (
            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-amber-500 ring-2 ring-background" />
          )}
        </div>
        <div className="text-left leading-tight">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Questões</p>
          <p className="text-xs font-bold tabular-nums">{answered}/{total}</p>
        </div>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-150"
            onClick={() => setOpen(false)}
          />
          <aside className="fixed right-0 top-0 bottom-0 z-[81] w-full sm:w-[380px] bg-background border-l border-border/60 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            {/* Header */}
            <header className="flex items-center justify-between px-5 py-4 border-b border-border/60 bg-gradient-to-r from-primary/5 via-background to-background">
              <div>
                <h2 className="text-base font-bold">Mapa de Questões</h2>
                <p className="text-[11px] text-muted-foreground">Clique para navegar</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                title="Fechar (Esc)"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            {/* Progress */}
            <div className="px-5 py-3 border-b border-border/60">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-medium text-muted-foreground">Progresso</span>
                <span className="text-[11px] font-bold tabular-nums">{answered}/{total} · {pct}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500 rounded-full"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            {/* Legend */}
            <div className="px-5 py-2.5 border-b border-border/60 flex items-center gap-3 text-[10px] text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-emerald-500" /> Respondida</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm border border-border" /> Pendente</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-primary/80 ring-2 ring-primary/30" /> Atual</span>
              <span className="flex items-center gap-1"><StickyNote className="h-3 w-3 text-violet-500" /> Com anotação</span>
              <span className="flex items-center gap-1"><Lock className="h-3 w-3 text-amber-500" /> Bloqueada</span>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto p-5">
              <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
                {questions.map((q, idx) => {
                  const isCurrent = idx === currentIndex
                  return (
                    <button
                      key={q.id}
                      onClick={() => { onJump(idx); setOpen(false) }}
                      className={cn(
                        'relative aspect-square rounded-xl flex items-center justify-center font-bold text-sm border-2 transition-all duration-150',
                        isCurrent && 'ring-2 ring-primary/40 scale-105 z-10',
                        q.answered
                          ? 'bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:border-emerald-500'
                          : 'bg-background border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground',
                        isCurrent && (q.answered ? 'border-emerald-500' : 'border-primary'),
                        q.locked && 'opacity-75'
                      )}
                    >
                      <span className="tabular-nums">{q.number}</span>
                      {q.answered && (
                        <CheckCircle2 className="absolute -top-1 -right-1 h-3.5 w-3.5 text-emerald-500 bg-background rounded-full" />
                      )}
                      {q.hasAnnotation && (
                        <StickyNote className="absolute -bottom-1 -right-1 h-3 w-3 text-violet-500 bg-background rounded-full p-[1px]" />
                      )}
                      {q.locked && (
                        <Lock className="absolute -bottom-1 -left-1 h-3 w-3 text-amber-500 bg-background rounded-full p-[1px]" />
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Type breakdown */}
              <div className="mt-6 space-y-1.5">
                {(['multiple-choice', 'discursive', 'essay'] as const).map(type => {
                  const ofType = questions.filter(q => q.type === type)
                  if (ofType.length === 0) return null
                  const answeredCount = ofType.filter(q => q.answered).length
                  const label = type === 'multiple-choice' ? 'Múltipla Escolha' : type === 'discursive' ? 'Discursivas' : 'Redação'
                  const color = type === 'multiple-choice' ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300' : type === 'discursive' ? 'bg-violet-500/15 text-violet-700 dark:text-violet-300' : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                  return (
                    <div key={type} className={cn('flex items-center justify-between px-3 py-2 rounded-lg text-xs', color)}>
                      <span className="font-medium">{label}</span>
                      <span className="tabular-nums font-bold">{answeredCount}/{ofType.length}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </aside>
        </>
      )}
    </>
  )
}
