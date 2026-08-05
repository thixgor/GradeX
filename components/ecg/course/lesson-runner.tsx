'use client'

import React, { useCallback, useMemo, useRef, useState } from 'react'
import {
  X, ArrowRight, ArrowLeft, Trophy, RotateCcw, Zap, Check,
  BookOpen, Beaker, HelpCircle,
} from 'lucide-react'
import type { Lesson, ModuleColor, Step } from '@/lib/ecg/course/types'
import { isGraded } from '@/lib/ecg/course/types'
import { TeachView, LabView, QuizView, OrderView, MatchView, FillView } from './lesson-blocks'

/**
 * Player de uma lição: um passo por tela.
 *
 * Duas decisões que definem o comportamento:
 *  - a pontuação considera apenas a PRIMEIRA tentativa de cada questão;
 *  - as respostas ficam guardadas por índice de passo, então voltar e avançar
 *    reexibe a questão já respondida, com a correção, em vez de zerá-la.
 */

interface Props {
  lesson: Lesson
  moduleTitle: string
  moduleColor?: ModuleColor
  onExit: () => void
  onComplete: (score: number, xp: number) => void
  onNext?: () => void
  hasNext?: boolean
}

const KIND_META: Record<Step['kind'], { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  teach: { label: 'Teoria', icon: BookOpen },
  lab: { label: 'Laboratório', icon: Beaker },
  quiz: { label: 'Questão', icon: HelpCircle },
  order: { label: 'Ordenar', icon: HelpCircle },
  match: { label: 'Parear', icon: HelpCircle },
  fill: { label: 'Completar', icon: HelpCircle },
}

export function LessonRunner({ lesson, moduleTitle, onExit, onComplete, onNext, hasNext }: Props) {
  const [i, setI] = useState(0)
  const [finished, setFinished] = useState(false)
  /** Estado guardado de cada passo avaliado, por índice. */
  const [saved, setSaved] = useState<Record<number, unknown>>({})
  const answers = useRef<Record<number, boolean>>({})
  const topRef = useRef<HTMLDivElement>(null)

  const gradedTotal = useMemo(() => lesson.steps.filter(isGraded).length, [lesson])
  const step = lesson.steps[i]
  const isLast = i === lesson.steps.length - 1
  const needsAnswer = isGraded(step)
  const canAdvance = !needsAnswer || saved[i] !== undefined

  const scrollTop = useCallback(() => {
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const handleAnswer = useCallback((correct: boolean) => {
    if (answers.current[i] === undefined) answers.current[i] = correct
  }, [i])

  const handleSave = useCallback((state: unknown) => {
    setSaved((s) => ({ ...s, [i]: state }))
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
    scrollTop()
  }, [isLast, gradedTotal, lesson.xp, onComplete, scrollTop])

  const back = useCallback(() => {
    if (i === 0) { onExit(); return }
    setI((v) => v - 1)
    scrollTop()
  }, [i, onExit, scrollTop])

  const restart = useCallback(() => {
    answers.current = {}
    setSaved({})
    setI(0)
    setFinished(false)
    scrollTop()
  }, [scrollTop])

  /* ── tela de resultado ── */
  if (finished) {
    const hits = Object.values(answers.current).filter(Boolean).length
    const pct = gradedTotal ? Math.round((hits / gradedTotal) * 100) : 100
    const gained = Math.round(lesson.xp * (0.5 + 0.5 * (gradedTotal ? hits / gradedTotal : 1)))
    const tone = pct >= 80 ? 'emerald' : pct >= 50 ? 'amber' : 'rose'
    const msg = pct === 100
      ? 'Gabaritou. Esse conteúdo está consolidado.'
      : pct >= 80
        ? 'Muito bom. Vale reler os pontos que escaparam antes de seguir.'
        : pct >= 50
          ? 'Deu para fixar o essencial — refazer esta lição depois rende bastante.'
          : 'Vale refazer com calma: os laboratórios interativos ajudam mais que a leitura corrida.'

    const ring = `conic-gradient(currentColor ${pct * 3.6}deg, hsl(var(--muted)) 0deg)`

    return (
      <div ref={topRef} className="mx-auto max-w-2xl py-4 sm:py-8">
        <div className={`rounded-2xl border p-5 text-center sm:p-8 ${
          tone === 'emerald' ? 'border-emerald-500/35 bg-emerald-500/[0.06]'
            : tone === 'amber' ? 'border-amber-500/35 bg-amber-500/[0.06]'
              : 'border-rose-500/35 bg-rose-500/[0.06]'
        }`}>
          <div
            className={`mx-auto grid h-24 w-24 place-items-center rounded-full ${
              tone === 'emerald' ? 'text-emerald-500' : tone === 'amber' ? 'text-amber-500' : 'text-rose-500'
            }`}
            style={{ background: ring }}
            role="img"
            aria-label={`Aproveitamento de ${pct} por cento`}
          >
            <span className="grid h-[76px] w-[76px] place-items-center rounded-full bg-card">
              <Trophy className="h-9 w-9" />
            </span>
          </div>

          <h3 className="mt-4 font-heading text-xl font-black tracking-tight sm:text-2xl">Lição concluída</h3>
          <p className="mt-1 text-[13px] text-muted-foreground">{moduleTitle} · {lesson.title}</p>

          <div className="mt-5 grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-border bg-card px-2 py-2.5">
              <p className="text-[9.5px] font-black uppercase tracking-wider text-muted-foreground">Acertos</p>
              <p className="font-mono text-lg font-black sm:text-xl">{hits}/{gradedTotal || 0}</p>
            </div>
            <div className="rounded-xl border border-border bg-card px-2 py-2.5">
              <p className="text-[9.5px] font-black uppercase tracking-wider text-muted-foreground">Aproveit.</p>
              <p className="font-mono text-lg font-black sm:text-xl">{pct}%</p>
            </div>
            <div className="rounded-xl border border-border bg-card px-2 py-2.5">
              <p className="text-[9.5px] font-black uppercase tracking-wider text-muted-foreground">XP</p>
              <p className="inline-flex items-center gap-0.5 font-mono text-lg font-black text-amber-500 sm:text-xl">
                <Zap className="h-4 w-4" />+{gained}
              </p>
            </div>
          </div>

          <p className="mt-4 text-[13px] leading-relaxed sm:text-[13.5px]">{msg}</p>

          <div className="mt-6 space-y-2">
            {hasNext && onNext && (
              <button
                type="button"
                onClick={onNext}
                className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-black text-primary-foreground transition hover:bg-primary/90 active:scale-[0.99]"
              >
                Próxima lição <ArrowRight className="h-4 w-4" />
              </button>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={restart}
                className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-muted/40 px-4 text-[13px] font-bold transition hover:border-primary/40"
              >
                <RotateCcw className="h-4 w-4" /> Refazer
              </button>
              <button
                type="button"
                onClick={onExit}
                className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-muted/40 px-4 text-[13px] font-bold transition hover:border-primary/40"
              >
                Voltar à trilha
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const meta = KIND_META[step.kind]
  const MetaIcon = meta.icon

  return (
    <div ref={topRef}>
      {/* Cabeçalho fixo da lição */}
      <header className="sticky top-0 z-30 -mx-3 mb-4 border-b border-border/60 bg-background/95 px-3 pb-2.5 pt-2 backdrop-blur-md sm:-mx-4 sm:px-4">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onExit}
            aria-label="Sair da lição e voltar à trilha"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/40 text-muted-foreground transition hover:text-foreground active:scale-95"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Progresso em segmentos: mostra onde você está, não só quanto falta */}
          <div className="flex flex-1 items-center gap-1" role="progressbar"
            aria-valuenow={i + 1} aria-valuemin={1} aria-valuemax={lesson.steps.length}
            aria-label={`Passo ${i + 1} de ${lesson.steps.length}`}>
            {lesson.steps.map((_, idx) => (
              <span
                key={idx}
                className={`h-2 flex-1 rounded-full transition-colors duration-300 ${
                  idx < i ? 'bg-primary' : idx === i ? 'bg-primary/60' : 'bg-muted'
                }`}
              />
            ))}
          </div>

          <span className="shrink-0 font-mono text-[11px] font-black text-muted-foreground">
            {i + 1}/{lesson.steps.length}
          </span>
        </div>

        <div className="mt-1.5 flex items-center gap-2 pl-11">
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[9.5px] font-black uppercase tracking-wider text-muted-foreground">
            <MetaIcon className="h-2.5 w-2.5" /> {meta.label}
          </span>
          <span className="min-w-0 flex-1 line-clamp-1 text-[11px] font-semibold text-muted-foreground">
            {moduleTitle} · {lesson.title}
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-3xl pb-32">
        {step.kind === 'teach' && <TeachView step={step} />}
        {step.kind === 'lab' && <LabView step={step} />}
        {step.kind === 'quiz' && (
          <QuizView key={i} step={step} onAnswer={handleAnswer} onSave={handleSave} saved={saved[i] as number | undefined} />
        )}
        {step.kind === 'order' && (
          <OrderView key={i} step={step} onAnswer={handleAnswer} onSave={handleSave} saved={saved[i] as { picked: number[] } | undefined} />
        )}
        {step.kind === 'match' && (
          <MatchView key={i} step={step} onAnswer={handleAnswer} onSave={handleSave} saved={saved[i] as { solved: number[]; misses: number } | undefined} />
        )}
        {step.kind === 'fill' && (
          <FillView key={i} step={step} onAnswer={handleAnswer} onSave={handleSave} saved={saved[i] as string | undefined} />
        )}
      </div>

      {/* Barra de navegação */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-3 pb-[calc(0.7rem+env(safe-area-inset-bottom))] pt-2.5 backdrop-blur-md sm:px-4">
        <div className="mx-auto flex max-w-3xl items-center gap-2">
          <button
            type="button"
            onClick={back}
            className="inline-flex min-h-[48px] items-center justify-center gap-1.5 rounded-xl border border-border bg-muted/40 px-3.5 text-[13px] font-bold text-muted-foreground transition hover:text-foreground active:scale-[0.97] sm:px-4"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">{i === 0 ? 'Sair' : 'Voltar'}</span>
          </button>
          <button
            type="button"
            onClick={advance}
            disabled={!canAdvance}
            className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-[13px] font-black text-primary-foreground transition hover:bg-primary/90 active:scale-[0.99] disabled:opacity-40 disabled:active:scale-100 sm:text-sm"
          >
            {needsAnswer && !canAdvance
              ? 'Responda para continuar'
              : isLast ? <>Concluir lição <Check className="h-4 w-4" /></>
                : <>Continuar <ArrowRight className="h-4 w-4" /></>}
          </button>
        </div>
      </nav>
    </div>
  )
}
