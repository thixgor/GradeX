'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Lock, Check, Play, Flame, Zap, Trophy, Unlock, RotateCcw, ArrowRight,
  BookOpen, Beaker, HelpCircle, Star,
} from 'lucide-react'
import { COURSE, COURSE_TOTALS, findLesson, lessonAfter } from '@/lib/ecg/course/curriculum'
import type { CourseModule, Lesson, ModuleColor } from '@/lib/ecg/course/types'
import { useCourseProgress } from './use-course-progress'
import { LessonRunner } from './lesson-runner'

/**
 * Trilha de ensino do Manual do Eletrocardiograma.
 *
 * Formato de trilha (uma lição por nó, desbloqueio sequencial, XP e ofensiva
 * diária) aplicado a conteúdo médico: cada nó abre um player de lição com
 * teoria curta, laboratório interativo e questões. O progresso fica no
 * aparelho — não depende de conta nem de rede.
 */

const COLOR: Record<ModuleColor, { chip: string; node: string; ring: string; text: string; line: string }> = {
  emerald: { chip: 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 border-emerald-500/30', node: 'bg-emerald-500', ring: 'ring-emerald-500/40', text: 'text-emerald-500', line: 'border-emerald-500/25' },
  sky: { chip: 'bg-sky-500/12 text-sky-600 dark:text-sky-400 border-sky-500/30', node: 'bg-sky-500', ring: 'ring-sky-500/40', text: 'text-sky-500', line: 'border-sky-500/25' },
  violet: { chip: 'bg-violet-500/12 text-violet-600 dark:text-violet-400 border-violet-500/30', node: 'bg-violet-500', ring: 'ring-violet-500/40', text: 'text-violet-500', line: 'border-violet-500/25' },
  amber: { chip: 'bg-amber-500/12 text-amber-600 dark:text-amber-400 border-amber-500/30', node: 'bg-amber-500', ring: 'ring-amber-500/40', text: 'text-amber-500', line: 'border-amber-500/25' },
  rose: { chip: 'bg-rose-500/12 text-rose-600 dark:text-rose-400 border-rose-500/30', node: 'bg-rose-500', ring: 'ring-rose-500/40', text: 'text-rose-500', line: 'border-rose-500/25' },
  cyan: { chip: 'bg-cyan-500/12 text-cyan-600 dark:text-cyan-400 border-cyan-500/30', node: 'bg-cyan-500', ring: 'ring-cyan-500/40', text: 'text-cyan-500', line: 'border-cyan-500/25' },
  lime: { chip: 'bg-lime-500/12 text-lime-600 dark:text-lime-400 border-lime-500/30', node: 'bg-lime-500', ring: 'ring-lime-500/40', text: 'text-lime-500', line: 'border-lime-500/25' },
  orange: { chip: 'bg-orange-500/12 text-orange-600 dark:text-orange-400 border-orange-500/30', node: 'bg-orange-500', ring: 'ring-orange-500/40', text: 'text-orange-500', line: 'border-orange-500/25' },
  fuchsia: { chip: 'bg-fuchsia-500/12 text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-500/30', node: 'bg-fuchsia-500', ring: 'ring-fuchsia-500/40', text: 'text-fuchsia-500', line: 'border-fuchsia-500/25' },
  teal: { chip: 'bg-teal-500/12 text-teal-600 dark:text-teal-400 border-teal-500/30', node: 'bg-teal-500', ring: 'ring-teal-500/40', text: 'text-teal-500', line: 'border-teal-500/25' },
  indigo: { chip: 'bg-indigo-500/12 text-indigo-600 dark:text-indigo-400 border-indigo-500/30', node: 'bg-indigo-500', ring: 'ring-indigo-500/40', text: 'text-indigo-500', line: 'border-indigo-500/25' },
}

/** Deslocamento horizontal (% da largura) que dá o serpenteado da trilha. */
const OFFSETS = [0, 16, 23, 16, 0, -16, -23, -16]

function countKinds(lesson: Lesson) {
  let labs = 0
  let questions = 0
  for (const s of lesson.steps) {
    if (s.kind === 'lab') labs++
    else if (s.kind === 'teach' && s.widget) labs++
    if (s.kind !== 'teach' && s.kind !== 'lab') questions++
  }
  return { labs, questions }
}

export function EcgCourse() {
  const { progress, hydrated, stats, nextLessonId, completeLesson, isDone, isUnlocked, setFreeMode, reset } = useCourseProgress()
  const [openId, setOpenId] = useState<string | null>(null)

  const open = openId ? findLesson(openId) : null

  const startNext = useCallback(() => {
    if (nextLessonId) setOpenId(nextLessonId)
  }, [nextLessonId])

  useEffect(() => {
    if (openId) window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [openId])

  const nextInfo = useMemo(() => (nextLessonId ? findLesson(nextLessonId) : null), [nextLessonId])

  if (!hydrated) {
    return <div className="h-64 animate-pulse rounded-2xl border border-border bg-muted/30" />
  }

  if (open) {
    const next = lessonAfter(open.lesson.id)
    return (
      <LessonRunner
        lesson={open.lesson}
        moduleTitle={open.module.title}
        onExit={() => setOpenId(null)}
        onComplete={(score, xp) => completeLesson(open.lesson.id, score, xp)}
        hasNext={!!next}
        onNext={() => next && setOpenId(next)}
      />
    )
  }

  return (
    <div className="pb-8">
      {/* ── Painel do aluno ── */}
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">Trilha de ensino</p>
            <h3 className="font-heading text-lg font-black tracking-tight sm:text-xl">
              Eletrocardiograma do zero ao laudo
            </h3>
            <p className="mt-0.5 text-[12.5px] text-muted-foreground">
              {COURSE_TOTALS.modules} módulos · {COURSE_TOTALS.lessons} lições · {COURSE_TOTALS.questions} questões ·
              cerca de {Math.round(COURSE_TOTALS.minutes / 60)} h de estudo
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Stat icon={Zap} value={progress.xp} label="XP" tone="text-amber-500" />
            <Stat icon={Flame} value={progress.streak} label="dias" tone="text-orange-500" />
            <Stat icon={Trophy} value={`${stats.pct}%`} label="trilha" tone="text-emerald-500" />
          </div>
        </div>

        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${stats.pct}%` }} />
        </div>
        <p className="mt-1.5 text-[11.5px] text-muted-foreground">
          {stats.done} de {stats.total} lições concluídas
          {stats.done > 0 && ` · aproveitamento médio de ${Math.round(stats.accuracy * 100)}%`}
          {progress.bestStreak > 1 && ` · melhor ofensiva: ${progress.bestStreak} dias`}
        </p>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          {nextInfo ? (
            <button
              type="button"
              onClick={startNext}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-black text-primary-foreground transition hover:bg-primary/90"
            >
              <Play className="h-4 w-4" />
              {stats.done === 0 ? 'Começar a trilha' : 'Continuar'} — {nextInfo.lesson.title}
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <div className="flex-1 rounded-xl border border-emerald-500/35 bg-emerald-500/[0.07] px-4 py-3 text-center text-[13px] font-bold text-emerald-600 dark:text-emerald-400">
              Trilha completa. Refaça qualquer lição para revisar.
            </div>
          )}
          <button
            type="button"
            onClick={() => setFreeMode(!progress.freeMode)}
            title="Liberar todas as lições, sem ordem"
            className={`inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border px-4 text-xs font-bold transition ${
              progress.freeMode ? 'border-primary/50 bg-primary/10 text-primary' : 'border-border bg-muted/40 text-muted-foreground hover:text-foreground'
            }`}
          >
            {progress.freeMode ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
            Modo livre
          </button>
          {stats.done > 0 && (
            <button
              type="button"
              onClick={() => { if (confirm('Zerar todo o progresso da trilha? Isso não pode ser desfeito.')) reset() }}
              title="Zerar progresso"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-muted/40 px-3 text-muted-foreground transition hover:border-rose-500/40 hover:text-rose-500"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── Trilha ── */}
      <div className="mt-6 space-y-8">
        {COURSE.map((mod, mi) => (
          <ModuleTrack
            key={mod.id}
            mod={mod}
            index={mi}
            isDone={isDone}
            isUnlocked={isUnlocked}
            onOpen={setOpenId}
            currentId={nextLessonId}
          />
        ))}
      </div>
    </div>
  )
}

function Stat({ icon: Icon, value, label, tone }: { icon: any; value: React.ReactNode; label: string; tone: string }) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 px-3 py-1.5 text-center">
      <p className={`inline-flex items-center gap-1 font-mono text-base font-black leading-none ${tone}`}>
        <Icon className="h-3.5 w-3.5" />{value}
      </p>
      <p className="mt-0.5 text-[9.5px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  )
}

function ModuleTrack({
  mod, index, isDone, isUnlocked, onOpen, currentId,
}: {
  mod: CourseModule
  index: number
  isDone: (id: string) => boolean
  isUnlocked: (id: string) => boolean
  onOpen: (id: string) => void
  currentId: string | null
}) {
  const c = COLOR[mod.color]
  const done = mod.lessons.filter((l) => isDone(l.id)).length
  const complete = done === mod.lessons.length

  return (
    <section>
      <div className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${c.chip}`}>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-background/60 font-mono text-sm font-black">
          {String(index + 1).padStart(2, '0')}
        </span>
        <div className="min-w-0 flex-1">
          <h4 className="font-heading text-base font-black leading-tight tracking-tight">{mod.title}</h4>
          <p className="truncate text-[12px] opacity-85">{mod.tagline}</p>
        </div>
        <span className="shrink-0 font-mono text-xs font-black">
          {complete ? <Check className="h-4 w-4" /> : `${done}/${mod.lessons.length}`}
        </span>
      </div>

      <div className="relative mx-auto mt-4 max-w-md">
        {/* fio da trilha */}
        <div className={`absolute inset-y-4 left-1/2 -ml-px w-0.5 border-l-2 border-dashed ${c.line}`} aria-hidden />

        <ul className="relative space-y-4">
          {mod.lessons.map((lesson, li) => {
            const unlocked = isUnlocked(lesson.id)
            const finished = isDone(lesson.id)
            const current = lesson.id === currentId
            const offset = OFFSETS[li % OFFSETS.length]
            const { labs, questions } = countKinds(lesson)

            return (
              <li key={lesson.id} className="flex justify-center">
                <div className="w-full" style={{ transform: `translateX(${offset}%)` }}>
                  <button
                    type="button"
                    onClick={() => unlocked && onOpen(lesson.id)}
                    disabled={!unlocked}
                    className={`group flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${
                      !unlocked
                        ? 'cursor-not-allowed border-border bg-muted/20 opacity-55'
                        : finished
                          ? 'border-emerald-500/40 bg-emerald-500/[0.06] hover:border-emerald-500/60'
                          : current
                            ? `border-primary/60 bg-card shadow-sm ring-2 ${c.ring}`
                            : 'border-border bg-card hover:border-primary/40'
                    }`}
                  >
                    <span
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white shadow-sm ${
                        !unlocked ? 'bg-muted-foreground/30' : finished ? 'bg-emerald-500' : c.node
                      }`}
                    >
                      {!unlocked ? <Lock className="h-5 w-5" />
                        : finished ? <Check className="h-6 w-6" />
                          : <Play className="h-5 w-5 fill-current" />}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate text-[14px] font-black leading-tight">{lesson.title}</span>
                        {finished && <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />}
                      </span>
                      <span className="mt-0.5 block truncate text-[11.5px] text-muted-foreground">{lesson.subtitle}</span>
                      <span className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[10.5px] font-semibold text-muted-foreground">
                        <span className="inline-flex items-center gap-1"><BookOpen className="h-3 w-3" />{lesson.minutes} min</span>
                        {labs > 0 && <span className="inline-flex items-center gap-1"><Beaker className="h-3 w-3" />{labs} lab</span>}
                        {questions > 0 && <span className="inline-flex items-center gap-1"><HelpCircle className="h-3 w-3" />{questions} {questions === 1 ? 'questão' : 'questões'}</span>}
                        <span className="inline-flex items-center gap-1 text-amber-500"><Zap className="h-3 w-3" />{lesson.xp} XP</span>
                      </span>
                    </span>
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
