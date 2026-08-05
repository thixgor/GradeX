'use client'

import React, { useCallback, useMemo, useRef, useState } from 'react'
import { X, ArrowRight, ArrowLeft, Trophy, RotateCcw, Zap } from 'lucide-react'
import type { Lesson } from '@/lib/ecg/course/types'
import { isGraded } from '@/lib/ecg/course/types'
import { TeachView, LabView, QuizView, OrderView, MatchView, FillView } from './lesson-blocks'

/**
 * Player de uma lição: um passo por tela, com barra de progresso no topo.
 *
 * Passos expositivos avançam livremente; passos avaliados travam o botão até a
 * resposta. A pontuação considera apenas a PRIMEIRA tentativa de cada questão —
 * é ela que define o XP ganho ao final.
 */

interface Props {
  lesson: Lesson
  moduleTitle: string
  onExit: () => void
  onComplete: (score: number, xp: number) => void
  onNext?: () => void
  hasNext?: boolean
}

export function LessonRunner({ lesson, moduleTitle, onExit, onComplete, onNext, hasNext }: Props) {
  const [i, setI] = useState(0)
  const [resolved, setResolved] = useState(false)
  const [finished, setFinished] = useState(false)
  const answers = useRef<Record<number, boolean>>({})
  const topRef = useRef<HTMLDivElement>(null)

  const gradedTotal = useMemo(() => lesson.steps.filter(isGraded).length, [lesson])
  const step = lesson.steps[i]
  const isLast = i === lesson.steps.length - 1
  const needsAnswer = isGraded(step)
  const canAdvance = !needsAnswer || resolved

  const scrollTop = useCallback(() => {
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const handleAnswer = useCallback((correct: boolean) => {
    if (answers.current[i] === undefined) answers.current[i] = correct
  }, [i])

  const advance = useCallback(() => {
    if (isLast) {
      const hits = Object.values(answers.current).filter(Boolean).length
      const score = gradedTotal ? hits / gradedTotal : 1
      onComplete(score, lesson.xp)
      setFinished(true)
      scrollTop()
      return
    }
    setI((v) => v + 1)
    setResolved(false)
    scrollTop()
  }, [isLast, gradedTotal, lesson.xp, onComplete, scrollTop])

  const back = useCallback(() => {
    if (i === 0) { onExit(); return }
    setI((v) => v - 1)
    setResolved(true)   // passos já vistos ficam liberados
    scrollTop()
  }, [i, onExit, scrollTop])

  function restart() {
    answers.current = {}
    setI(0)
    setResolved(false)
    setFinished(false)
    scrollTop()
  }

  /* ── tela de resultado ── */
  if (finished) {
    const hits = Object.values(answers.current).filter(Boolean).length
    const pct = gradedTotal ? Math.round((hits / gradedTotal) * 100) : 100
    const tone = pct >= 80 ? 'emerald' : pct >= 50 ? 'amber' : 'rose'
    const msg = pct === 100
      ? 'Gabaritou. Esse conteúdo está consolidado.'
      : pct >= 80
        ? 'Muito bom. Vale reler os pontos que escaparam antes de seguir.'
        : pct >= 50
          ? 'Deu para fixar o essencial — refazer esta lição depois rende bastante.'
          : 'Vale refazer com calma: os laboratórios interativos ajudam mais que a leitura corrida.'

    return (
      <div ref={topRef} className="mx-auto max-w-2xl py-6">
        <div className={`rounded-2xl border p-6 text-center sm:p-8 ${
          tone === 'emerald' ? 'border-emerald-500/35 bg-emerald-500/[0.06]'
            : tone === 'amber' ? 'border-amber-500/35 bg-amber-500/[0.06]'
              : 'border-rose-500/35 bg-rose-500/[0.06]'
        }`}>
          <Trophy className={`mx-auto h-12 w-12 ${
            tone === 'emerald' ? 'text-emerald-500' : tone === 'amber' ? 'text-amber-500' : 'text-rose-500'
          }`} />
          <h3 className="mt-3 font-heading text-2xl font-black tracking-tight">Lição concluída</h3>
          <p className="mt-1 text-sm text-muted-foreground">{lesson.title}</p>

          <div className="mt-5 grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-border bg-card px-3 py-2.5">
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Acertos</p>
              <p className="font-mono text-xl font-black">{hits}/{gradedTotal || 0}</p>
            </div>
            <div className="rounded-xl border border-border bg-card px-3 py-2.5">
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Aproveitamento</p>
              <p className="font-mono text-xl font-black">{pct}%</p>
            </div>
            <div className="rounded-xl border border-border bg-card px-3 py-2.5">
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">XP</p>
              <p className="inline-flex items-center gap-1 font-mono text-xl font-black text-amber-500">
                <Zap className="h-4 w-4" />+{Math.round(lesson.xp * (0.5 + 0.5 * (gradedTotal ? hits / gradedTotal : 1)))}
              </p>
            </div>
          </div>

          <p className="mt-4 text-[13.5px] leading-relaxed">{msg}</p>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={restart}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-muted/40 px-5 text-sm font-bold transition hover:border-primary/40"
            >
              <RotateCcw className="h-4 w-4" /> Refazer
            </button>
            {hasNext && onNext && (
              <button
                type="button"
                onClick={onNext}
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-black text-primary-foreground transition hover:bg-primary/90"
              >
                Próxima lição <ArrowRight className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onExit}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-muted/40 px-5 text-sm font-bold transition hover:border-primary/40"
            >
              Voltar à trilha
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div ref={topRef}>
      {/* Cabeçalho fixo da lição */}
      <div className="sticky top-0 z-20 -mx-1 mb-4 bg-background/90 px-1 pb-3 pt-2 backdrop-blur">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onExit}
            aria-label="Sair da lição"
            className="shrink-0 rounded-lg border border-border bg-muted/40 p-2 text-muted-foreground transition hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${((i + 1) / lesson.steps.length) * 100}%` }}
            />
          </div>
          <span className="shrink-0 font-mono text-xs font-black text-muted-foreground">
            {i + 1}/{lesson.steps.length}
          </span>
        </div>
        <p className="mt-1.5 truncate pl-11 text-[11px] font-semibold text-muted-foreground">
          {moduleTitle} · {lesson.title}
        </p>
      </div>

      <div className="mx-auto max-w-3xl pb-28">
        {step.kind === 'teach' && <TeachView step={step} />}
        {step.kind === 'lab' && <LabView step={step} />}
        {step.kind === 'quiz' && (
          <QuizView key={i} step={step} onAnswer={handleAnswer} onResolved={() => setResolved(true)} />
        )}
        {step.kind === 'order' && (
          <OrderView key={i} step={step} onAnswer={handleAnswer} onResolved={() => setResolved(true)} />
        )}
        {step.kind === 'match' && (
          <MatchView key={i} step={step} onAnswer={handleAnswer} onResolved={() => setResolved(true)} />
        )}
        {step.kind === 'fill' && (
          <FillView key={i} step={step} onAnswer={handleAnswer} onResolved={() => setResolved(true)} />
        )}
      </div>

      {/* Barra de navegação */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center gap-2">
          <button
            type="button"
            onClick={back}
            className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-border bg-muted/40 px-4 text-sm font-bold text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> {i === 0 ? 'Sair' : 'Voltar'}
          </button>
          <button
            type="button"
            onClick={advance}
            disabled={!canAdvance}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-black text-primary-foreground transition hover:bg-primary/90 disabled:opacity-40"
          >
            {needsAnswer && !resolved ? 'Responda para continuar' : isLast ? 'Concluir lição' : 'Continuar'}
            {canAdvance && <ArrowRight className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}
