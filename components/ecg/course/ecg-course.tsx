'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Lock, Check, Play, Flame, Zap, Trophy, Unlock, RotateCcw, ArrowRight,
  BookOpen, Beaker, HelpCircle, Crown, X, ChevronUp,
} from 'lucide-react'
import { COURSE, COURSE_TOTALS, findLesson, lessonAfter } from '@/lib/ecg/course/curriculum'
import type { CourseModule, Lesson, ModuleColor } from '@/lib/ecg/course/types'
import { EcgPaperPicker } from '../use-ecg-paper'
import { useCourseProgress } from './use-course-progress'
import { LessonRunner } from './lesson-runner'

/**
 * Trilha de ensino do Manual do Eletrocardiograma.
 *
 * Formato de trilha (um nó por lição, desbloqueio sequencial, XP e ofensiva
 * diária) aplicado a conteúdo médico. O caminho serpenteia como num app de
 * idiomas, mas com uma diferença que importa no celular: os nós são CÍRCULOS
 * posicionados em porcentagem da largura, e não cartões de largura fixa — é o
 * que garante que a trilha caiba igualmente bem em 360 px e em 1920 px.
 *
 * O progresso mora no aparelho (localStorage), sem conta e sem rede.
 */

/* ───────────────────────── cores por módulo ───────────────────────── */

interface Palette {
  /* faixa do cabeçalho do módulo */
  band: string
  /* preenchimento do nó desbloqueado */
  node: string
  /* traço do trilho */
  rail: string
  text: string
  soft: string
}

const COLOR: Record<ModuleColor, Palette> = {
  emerald: { band: 'from-emerald-500/15 to-transparent border-emerald-500/25', node: 'bg-emerald-500', rail: '#10b981', text: 'text-emerald-600 dark:text-emerald-400', soft: 'bg-emerald-500/10' },
  sky: { band: 'from-sky-500/15 to-transparent border-sky-500/25', node: 'bg-sky-500', rail: '#0ea5e9', text: 'text-sky-600 dark:text-sky-400', soft: 'bg-sky-500/10' },
  violet: { band: 'from-violet-500/15 to-transparent border-violet-500/25', node: 'bg-violet-500', rail: '#8b5cf6', text: 'text-violet-600 dark:text-violet-400', soft: 'bg-violet-500/10' },
  amber: { band: 'from-amber-500/15 to-transparent border-amber-500/25', node: 'bg-amber-500', rail: '#f59e0b', text: 'text-amber-600 dark:text-amber-400', soft: 'bg-amber-500/10' },
  rose: { band: 'from-rose-500/15 to-transparent border-rose-500/25', node: 'bg-rose-500', rail: '#f43f5e', text: 'text-rose-600 dark:text-rose-400', soft: 'bg-rose-500/10' },
  cyan: { band: 'from-cyan-500/15 to-transparent border-cyan-500/25', node: 'bg-cyan-500', rail: '#06b6d4', text: 'text-cyan-600 dark:text-cyan-400', soft: 'bg-cyan-500/10' },
  lime: { band: 'from-lime-500/15 to-transparent border-lime-500/25', node: 'bg-lime-500', rail: '#84cc16', text: 'text-lime-600 dark:text-lime-400', soft: 'bg-lime-500/10' },
  orange: { band: 'from-orange-500/15 to-transparent border-orange-500/25', node: 'bg-orange-500', rail: '#f97316', text: 'text-orange-600 dark:text-orange-400', soft: 'bg-orange-500/10' },
  fuchsia: { band: 'from-fuchsia-500/15 to-transparent border-fuchsia-500/25', node: 'bg-fuchsia-500', rail: '#d946ef', text: 'text-fuchsia-600 dark:text-fuchsia-400', soft: 'bg-fuchsia-500/10' },
  teal: { band: 'from-teal-500/15 to-transparent border-teal-500/25', node: 'bg-teal-500', rail: '#14b8a6', text: 'text-teal-600 dark:text-teal-400', soft: 'bg-teal-500/10' },
  indigo: { band: 'from-indigo-500/15 to-transparent border-indigo-500/25', node: 'bg-indigo-500', rail: '#6366f1', text: 'text-indigo-600 dark:text-indigo-400', soft: 'bg-indigo-500/10' },
}

/* ───────────────────────── geometria da trilha ───────────────────────── */

/** Altura de cada degrau (px). Comporta o nó + duas linhas de rótulo. */
const ROW = 136
/** Diâmetro do nó (px). */
const NODE = 66
/**
 * Posição horizontal de cada degrau, em % da largura da coluna.
 * A amplitude fica entre 24% e 76% para que o rótulo (≈ 150 px) caiba inteiro
 * dentro da coluna mesmo nos extremos, numa tela de 360 px.
 */
const POS = [50, 68, 76, 68, 50, 32, 24, 32]

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

/* ───────────────────────── componente principal ───────────────────────── */

export function EcgCourse() {
  const {
    progress, hydrated, stats, nextLessonId,
    completeLesson, isDone, isUnlocked, setFreeMode, reset,
  } = useCourseProgress()
  const [openId, setOpenId] = useState<string | null>(null)
  const [lockedHint, setLockedHint] = useState<string | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)

  const open = openId ? findLesson(openId) : null

  useEffect(() => {
    if (openId) window.scrollTo({ top: 0, behavior: 'auto' })
  }, [openId])

  // A dica de lição travada some sozinha — não vira um aviso preso na tela.
  useEffect(() => {
    if (!lockedHint) return
    const t = setTimeout(() => setLockedHint(null), 4000)
    return () => clearTimeout(t)
  }, [lockedHint])

  const handlePick = useCallback((id: string, unlocked: boolean) => {
    if (unlocked) { setOpenId(id); return }
    setLockedHint(id)
  }, [])

  const nextInfo = useMemo(() => (nextLessonId ? findLesson(nextLessonId) : null), [nextLessonId])

  if (!hydrated) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Carregando a trilha">
        <div className="h-44 animate-pulse rounded-2xl border border-border bg-muted/30" />
        <div className="h-16 animate-pulse rounded-2xl border border-border bg-muted/20" />
        <div className="h-64 animate-pulse rounded-2xl border border-border bg-muted/10" />
      </div>
    )
  }

  if (open) {
    const next = lessonAfter(open.lesson.id)
    return (
      <LessonRunner
        lesson={open.lesson}
        moduleTitle={open.module.title}
        moduleColor={open.module.color}
        onExit={() => setOpenId(null)}
        onComplete={(score, xp) => completeLesson(open.lesson.id, score, xp)}
        hasNext={!!next}
        onNext={() => next && setOpenId(next)}
      />
    )
  }

  return (
    <div className="pb-6">
      <CourseHud
        stats={stats}
        xp={progress.xp}
        streak={progress.streak}
        bestStreak={progress.bestStreak}
        freeMode={progress.freeMode}
        nextTitle={nextInfo?.lesson.title ?? null}
        started={stats.done > 0}
        onStart={() => nextLessonId && setOpenId(nextLessonId)}
        onToggleFree={() => setFreeMode(!progress.freeMode)}
        confirmReset={confirmReset}
        onAskReset={() => setConfirmReset(true)}
        onCancelReset={() => setConfirmReset(false)}
        onConfirmReset={() => { reset(); setConfirmReset(false) }}
      />

      <div className="mt-5 space-y-6 sm:mt-6 sm:space-y-8">
        {COURSE.map((mod, mi) => (
          <ModuleTrack
            key={mod.id}
            mod={mod}
            index={mi}
            isDone={isDone}
            isUnlocked={isUnlocked}
            onPick={handlePick}
            currentId={nextLessonId}
            lockedHint={lockedHint}
            freeMode={progress.freeMode}
            onEnableFree={() => { setFreeMode(true); setLockedHint(null) }}
          />
        ))}
      </div>
    </div>
  )
}

/* ───────────────────────── painel do aluno ───────────────────────── */

function CourseHud({
  stats, xp, streak, bestStreak, freeMode, nextTitle, started,
  onStart, onToggleFree, confirmReset, onAskReset, onCancelReset, onConfirmReset,
}: {
  stats: { done: number; total: number; pct: number; accuracy: number }
  xp: number
  streak: number
  bestStreak: number
  freeMode: boolean
  nextTitle: string | null
  started: boolean
  onStart: () => void
  onToggleFree: () => void
  confirmReset: boolean
  onAskReset: () => void
  onCancelReset: () => void
  onConfirmReset: () => void
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm lg:grid lg:grid-cols-[1.25fr_1fr]">
      <div className="bg-gradient-to-br from-primary/[0.07] to-transparent p-3.5 sm:p-5">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-primary">Trilha de ensino</p>
        <h3 className="mt-1 font-heading text-lg font-black leading-tight tracking-tight sm:text-2xl">
          Eletrocardiograma do zero ao laudo
        </h3>
        <p className="mt-1 text-[11.5px] leading-snug text-muted-foreground sm:text-[13px]">
          {COURSE_TOTALS.modules} módulos · {COURSE_TOTALS.lessons} lições · {COURSE_TOTALS.questions} questões ·
          {' '}~{Math.round(COURSE_TOTALS.minutes / 60)} h
        </p>

        {/* Placar: grade de 3 no celular, sem risco de estourar a linha */}
        <div className="mt-3 grid grid-cols-3 gap-1.5 sm:gap-2">
          <Stat icon={Zap} value={xp} label="XP" tone="text-amber-500" />
          <Stat icon={Flame} value={streak} label={streak === 1 ? 'dia' : 'dias'} tone="text-orange-500"
            sub={bestStreak > 1 ? `recorde ${bestStreak}` : undefined} />
          <Stat icon={Trophy} value={`${stats.pct}%`} label="trilha" tone="text-emerald-500"
            sub={stats.done > 0 ? `${Math.round(stats.accuracy * 100)}% acerto` : undefined} />
        </div>

        {/* Progresso */}
        <div className="mt-3">
          <div className="h-2.5 overflow-hidden rounded-full bg-muted" role="progressbar"
            aria-valuenow={stats.pct} aria-valuemin={0} aria-valuemax={100}
            aria-label="Progresso da trilha">
            <div className="h-full rounded-full bg-gradient-to-r from-primary/70 to-primary transition-all duration-500"
              style={{ width: `${stats.pct}%` }} />
          </div>
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            {stats.done} de {stats.total} lições concluídas
          </p>
        </div>
      </div>

      {/* Ações */}
      <div className="flex flex-col justify-center border-t border-border p-3 sm:p-4 lg:border-l lg:border-t-0">
        {nextTitle ? (
          <button
            type="button"
            onClick={onStart}
            className="flex min-h-[52px] w-full items-center gap-3 rounded-xl bg-primary px-4 py-2.5 text-left text-primary-foreground shadow-sm transition hover:bg-primary/90 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Play className="h-5 w-5 shrink-0 fill-current" />
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-black leading-tight">
                {started ? 'Continuar de onde parou' : 'Começar a trilha'}
              </span>
              <span className="block line-clamp-1 text-[11px] font-medium leading-tight opacity-85">{nextTitle}</span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 opacity-80" />
          </button>
        ) : (
          <div className="flex min-h-[52px] items-center gap-2.5 rounded-xl border border-emerald-500/35 bg-emerald-500/[0.07] px-4 py-2.5">
            <Crown className="h-5 w-5 shrink-0 text-emerald-500" />
            <p className="text-[12.5px] font-bold leading-snug text-emerald-700 dark:text-emerald-300">
              Trilha completa. Toque em qualquer nó para revisar.
            </p>
          </div>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onToggleFree}
            aria-pressed={freeMode}
            className={`inline-flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 text-[11.5px] font-bold transition sm:flex-none ${
              freeMode
                ? 'border-primary/50 bg-primary/10 text-primary'
                : 'border-border bg-muted/40 text-muted-foreground hover:text-foreground'
            }`}
          >
            {freeMode ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
            Modo livre {freeMode ? 'ligado' : 'desligado'}
          </button>

          {started && !confirmReset && (
            <button
              type="button"
              onClick={onAskReset}
              className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl border border-border bg-muted/40 px-3 text-[11.5px] font-bold text-muted-foreground transition hover:border-rose-500/40 hover:text-rose-500"
            >
              <RotateCcw className="h-4 w-4" /> Zerar
            </button>
          )}

          {confirmReset && (
            <div className="flex w-full items-center gap-2 rounded-xl border border-rose-500/35 bg-rose-500/[0.07] p-2 sm:w-auto">
              <span className="flex-1 px-1 text-[11.5px] font-bold text-rose-600 dark:text-rose-400">
                Apagar todo o progresso?
              </span>
              <button
                type="button"
                onClick={onConfirmReset}
                className="inline-flex min-h-[36px] items-center rounded-lg bg-rose-500 px-3 text-[11.5px] font-black text-white"
              >
                Apagar
              </button>
              <button
                type="button"
                onClick={onCancelReset}
                aria-label="Cancelar"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        <p className="mt-2 text-[10.5px] leading-snug text-muted-foreground">
          {freeMode
            ? 'Todas as lições liberadas. Desligue para voltar ao caminho guiado.'
            : 'Cada lição abre a próxima. Ative o modo livre para navegar fora de ordem.'}
        </p>

        {/* Aparência do papel — vale para os traçados de toda a trilha e também
            para o simulador, porque a preferência é uma só. */}
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
          <EcgPaperPicker label="Papel" />
          <span className="text-[10.5px] leading-snug text-muted-foreground">
            Vale para todos os traçados, inclusive o simulador.
          </span>
        </div>
      </div>
    </section>
  )
}

function Stat({
  icon: Icon, value, label, tone, sub,
}: {
  icon: React.ComponentType<{ className?: string }>
  value: React.ReactNode
  label: string
  tone: string
  sub?: string
}) {
  return (
    <div className="min-w-0 rounded-xl border border-border bg-background/70 px-2 py-1.5 text-center">
      <p className={`flex items-center justify-center gap-1 font-mono text-[15px] font-black leading-none ${tone}`}>
        <Icon className="h-3.5 w-3.5" />
        <span className="line-clamp-1">{value}</span>
      </p>
      <p className="mt-1 line-clamp-1 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      {sub && <p className="line-clamp-1 text-[9px] leading-tight text-muted-foreground/70">{sub}</p>}
    </div>
  )
}

/* ───────────────────────── trilho de um módulo ───────────────────────── */

function ModuleTrack({
  mod, index, isDone, isUnlocked, onPick, currentId, lockedHint, freeMode, onEnableFree,
}: {
  mod: CourseModule
  index: number
  isDone: (id: string) => boolean
  isUnlocked: (id: string) => boolean
  onPick: (id: string, unlocked: boolean) => void
  currentId: string | null
  lockedHint: string | null
  freeMode: boolean
  onEnableFree: () => void
}) {
  const c = COLOR[mod.color]
  const done = mod.lessons.filter((l) => isDone(l.id)).length
  const total = mod.lessons.length
  const complete = done === total
  const pct = Math.round((done / total) * 100)

  const trackH = mod.lessons.length * ROW
  const hintIdx = lockedHint ? mod.lessons.findIndex((l) => l.id === lockedHint) : -1

  // Trilho: curva que passa exatamente pelo centro de cada nó. O eixo x é
  // percentual (0–100) e o y é em pixels — `preserveAspectRatio="none"` mapeia
  // cada eixo independentemente, e `vector-effect` mantém a espessura do traço.
  const rail = useMemo(() => {
    const pts = mod.lessons.map((_, i) => ({ x: POS[i % POS.length], y: i * ROW + NODE / 2 }))
    if (pts.length < 2) return ''
    let d = `M${pts[0].x} ${pts[0].y}`
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1]
      const b = pts[i]
      const mid = (a.y + b.y) / 2
      d += ` C${a.x} ${mid} ${b.x} ${mid} ${b.x} ${b.y}`
    }
    return d
  }, [mod.lessons])

  return (
    <section
      aria-labelledby={`mod-${mod.id}`}
      className="lg:grid lg:grid-cols-[minmax(0,1fr)_27rem] lg:items-start lg:gap-8"
    >
      {/* Cabeçalho do módulo — vira coluna fixa no desktop, onde sobra largura */}
      <div className={`flex items-center gap-3 rounded-2xl border bg-gradient-to-r px-3 py-2.5 sm:px-4 sm:py-3 lg:sticky lg:top-4 lg:flex-col lg:items-start lg:gap-2 lg:px-5 lg:py-5 ${c.band}`}>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-mono text-[13px] font-black sm:h-10 sm:w-10 ${c.soft} ${c.text}`}>
          {complete ? <Check className="h-5 w-5" /> : String(index + 1).padStart(2, '0')}
        </span>
        <div className="min-w-0 flex-1">
          <h4 id={`mod-${mod.id}`} className={`font-heading text-[15px] font-black leading-tight tracking-tight sm:text-base ${c.text}`}>
            {mod.title}
          </h4>
          <p className="line-clamp-1 text-[11px] leading-snug text-muted-foreground sm:text-[12px]">{mod.tagline}</p>
        </div>
        <div className="shrink-0 text-right lg:w-full lg:text-left">
          <span className={`font-mono text-[13px] font-black ${c.text}`}>
            {done}/{total}<span className="hidden lg:inline"> lições</span>
          </span>
          <div className="mt-1 h-1 w-10 overflow-hidden rounded-full bg-muted sm:w-14 lg:h-1.5 lg:w-full">
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, backgroundColor: c.rail }} />
          </div>
        </div>

        {/* Índice do módulo — só no desktop, onde a coluna da esquerda sobraria
            vazia. Dá a visão geral e serve de atalho para quem usa mouse. */}
        <ol className="hidden w-full lg:mt-1 lg:block">
          {mod.lessons.map((lesson, li) => {
            const unlocked = isUnlocked(lesson.id)
            const finished = isDone(lesson.id)
            const current = lesson.id === currentId
            return (
              <li key={lesson.id}>
                <button
                  type="button"
                  onClick={() => onPick(lesson.id, unlocked)}
                  disabled={!unlocked}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition ${
                    unlocked ? 'hover:bg-background/60' : 'cursor-not-allowed opacity-55'
                  } ${current ? 'bg-background/70' : ''}`}
                >
                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${
                    finished ? 'bg-emerald-500 text-white'
                      : unlocked ? `${c.node} text-white` : 'bg-muted-foreground/25 text-muted-foreground'
                  }`}>
                    {finished ? <Check className="h-3 w-3" strokeWidth={3} /> : !unlocked ? <Lock className="h-2.5 w-2.5" /> : li + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-1 text-[12px] font-bold leading-tight">{lesson.title}</span>
                    <span className="line-clamp-1 text-[10.5px] leading-tight text-muted-foreground">{lesson.subtitle}</span>
                  </span>
                  <span className="shrink-0 font-mono text-[10px] font-bold text-muted-foreground">{lesson.minutes}′</span>
                </button>
              </li>
            )
          })}
        </ol>
      </div>

      {/* Serpentina */}
      <div className="relative mx-auto mt-3 w-full max-w-[26rem] px-1 sm:max-w-[27rem] lg:mt-0" style={{ height: trackH }}>
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox={`0 0 100 ${trackH}`}
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            d={rail}
            fill="none"
            stroke={c.rail}
            strokeOpacity="0.3"
            strokeWidth="3"
            strokeDasharray="7 7"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {mod.lessons.map((lesson, li) => {
          const unlocked = isUnlocked(lesson.id)
          const finished = isDone(lesson.id)
          const current = lesson.id === currentId
          const { labs, questions } = countKinds(lesson)
          const left = POS[li % POS.length]

          return (
            <div
              key={lesson.id}
              className="absolute flex w-[9.5rem] -translate-x-1/2 flex-col items-center text-center"
              style={{ left: `${left}%`, top: li * ROW }}
            >
              <button
                type="button"
                onClick={() => onPick(lesson.id, unlocked)}
                aria-label={
                  unlocked
                    ? `${finished ? 'Revisar' : 'Começar'} lição: ${lesson.title}`
                    : `Lição bloqueada: ${lesson.title}. Conclua a anterior para liberar.`
                }
                className={`relative flex items-center justify-center rounded-full shadow-md transition
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background
                  active:scale-95 ${
                  !unlocked
                    ? 'cursor-not-allowed bg-muted text-muted-foreground/70 shadow-none ring-1 ring-inset ring-border'
                    : finished
                      ? 'bg-emerald-500 text-white hover:brightness-110'
                      : `${c.node} text-white hover:brightness-110 ${current ? 'course-node-current' : ''}`
                }`}
                style={{ height: NODE, width: NODE }}
              >
                {!unlocked ? <Lock className="h-6 w-6" />
                  : finished ? <Check className="h-8 w-8" strokeWidth={3} />
                    : <Play className="ml-0.5 h-7 w-7 fill-current" />}

                {finished && (
                  <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-amber-400 text-amber-950">
                    <Crown className="h-3.5 w-3.5" />
                  </span>
                )}
                {current && unlocked && !finished && (
                  <span className="absolute -bottom-1 rounded-full border-2 border-background bg-foreground px-1.5 py-px text-[8.5px] font-black uppercase tracking-wide text-background">
                    aqui
                  </span>
                )}
              </button>

              <p className={`mt-2 line-clamp-2 rounded-md bg-background/85 px-1 text-[11.5px] font-bold leading-tight backdrop-blur-[2px] ${
                unlocked ? '' : 'text-muted-foreground'
              }`}>
                {lesson.title}
              </p>
              <p className="mt-0.5 flex flex-wrap items-center justify-center gap-x-1.5 rounded-md bg-background/85 px-1 text-[9.5px] font-semibold text-muted-foreground backdrop-blur-[2px]">
                <span className="inline-flex items-center gap-0.5"><BookOpen className="h-2.5 w-2.5" />{lesson.minutes}min</span>
                {labs > 0 && <span className="inline-flex items-center gap-0.5"><Beaker className="h-2.5 w-2.5" />{labs}</span>}
                {questions > 0 && <span className="inline-flex items-center gap-0.5"><HelpCircle className="h-2.5 w-2.5" />{questions}</span>}
                <span className="inline-flex items-center gap-0.5 text-amber-500"><Zap className="h-2.5 w-2.5" />{lesson.xp}</span>
              </p>
            </div>
          )
        })}
      </div>

      {/* Aviso de lição travada — aparece abaixo do trilho do módulo em questão */}
      {hintIdx >= 0 && !freeMode && (
        <div className="mx-auto mt-2 flex max-w-[26rem] items-center gap-2 rounded-xl border border-amber-500/35 bg-amber-500/[0.08] p-2.5 lg:col-start-2 sm:max-w-[27rem]">
          <Lock className="h-4 w-4 shrink-0 text-amber-500" />
          <p className="flex-1 text-[11.5px] font-semibold leading-snug text-amber-700 dark:text-amber-300">
            Conclua <ChevronUp className="inline h-3 w-3" /> a lição anterior para liberar esta.
          </p>
          <button
            type="button"
            onClick={onEnableFree}
            className="shrink-0 rounded-lg bg-amber-500 px-2.5 py-1.5 text-[11px] font-black text-white"
          >
            Liberar tudo
          </button>
        </div>
      )}
    </section>
  )
}
