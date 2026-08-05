'use client'

import React, { useMemo, useState } from 'react'
import {
  Lightbulb, AlertTriangle, HelpCircle, GraduationCap, Stethoscope,
  Check, X, ArrowRight,
} from 'lucide-react'
import type {
  Callout, FillStep, MatchStep, OrderStep, QuizStep, TeachStep, LabStep,
} from '@/lib/ecg/course/types'
import { CourseWidget } from './widgets'

/**
 * Renderização de cada tipo de passo de lição.
 *
 * Os passos avaliados (quiz, ordenar, parear, completar) avisam o player pelo
 * callback `onAnswer(correct)` — que só dispara UMA vez, no primeiro palpite,
 * porque é ele que define a pontuação da lição.
 */

/* ───────────────────────── callouts ───────────────────────── */

const CALLOUT_STYLE = {
  macete: { icon: Lightbulb, cls: 'border-amber-500/30 bg-amber-500/[0.07]', text: 'text-amber-600 dark:text-amber-400', label: 'Macete' },
  porque: { icon: HelpCircle, cls: 'border-sky-500/30 bg-sky-500/[0.07]', text: 'text-sky-600 dark:text-sky-400', label: 'Por quê' },
  atencao: { icon: AlertTriangle, cls: 'border-rose-500/30 bg-rose-500/[0.07]', text: 'text-rose-600 dark:text-rose-400', label: 'Atenção' },
  prova: { icon: GraduationCap, cls: 'border-violet-500/30 bg-violet-500/[0.07]', text: 'text-violet-600 dark:text-violet-400', label: 'Cai em prova' },
  clinica: { icon: Stethoscope, cls: 'border-emerald-500/30 bg-emerald-500/[0.07]', text: 'text-emerald-600 dark:text-emerald-400', label: 'Na prática' },
} as const

export function CalloutBox({ c }: { c: Callout }) {
  const s = CALLOUT_STYLE[c.kind]
  const Icon = s.icon
  return (
    <div className={`rounded-xl border p-3.5 ${s.cls}`}>
      <p className={`mb-1 inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider ${s.text}`}>
        <Icon className="h-3.5 w-3.5" />
        {c.title || s.label}
      </p>
      <p className="text-[13.5px] leading-relaxed">{c.text}</p>
    </div>
  )
}

/* ───────────────────────── teach / lab ───────────────────────── */

export function TeachView({ step }: { step: TeachStep }) {
  return (
    <div className="space-y-4">
      <h3 className="font-heading text-xl font-black leading-tight tracking-tight sm:text-2xl">{step.title}</h3>

      {step.lead && (
        <p className="border-l-2 border-primary/60 pl-3 text-[15px] font-semibold leading-relaxed">{step.lead}</p>
      )}

      {step.body?.map((p, i) => (
        <p key={i} className="text-[14.5px] leading-relaxed text-foreground/85">{p}</p>
      ))}

      {step.bullets && (
        <ul className="space-y-2">
          {step.bullets.map((b) => (
            <li key={b.t} className="rounded-xl border border-border bg-muted/25 p-3">
              <strong className="text-[13.5px]">{b.t}</strong>
              <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">{b.d}</p>
            </li>
          ))}
        </ul>
      )}

      {step.table && (
        <figure className="m-0">
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[520px] border-collapse text-left text-[12.5px]">
              <thead>
                <tr className="bg-muted/50">
                  {step.table.head.map((h) => (
                    <th key={h} className="border-b border-border px-3 py-2 font-black uppercase tracking-wider text-[10.5px] text-muted-foreground">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {step.table.rows.map((r, i) => (
                  <tr key={i} className="odd:bg-muted/15">
                    {r.map((cell, j) => (
                      <td
                        key={j}
                        className={`border-b border-border/60 px-3 py-2 align-top leading-relaxed ${
                          j === 0 ? 'font-bold' : ''
                        } ${step.table?.numericFrom != null && j === step.table.numericFrom ? 'font-mono font-bold text-primary' : ''}`}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {step.table.caption && (
            <figcaption className="mt-1.5 text-[11.5px] text-muted-foreground">{step.table.caption}</figcaption>
          )}
        </figure>
      )}

      {step.widget && <CourseWidget spec={step.widget} />}

      {step.callouts?.map((c, i) => <CalloutBox key={i} c={c} />)}
    </div>
  )
}

export function LabView({ step }: { step: LabStep }) {
  return (
    <div className="space-y-4">
      <h3 className="font-heading text-xl font-black leading-tight tracking-tight sm:text-2xl">{step.title}</h3>
      {step.intro && <p className="text-[14.5px] leading-relaxed text-foreground/85">{step.intro}</p>}
      <CourseWidget spec={step.widget} />
      {step.outro && (
        <p className="rounded-xl border border-border bg-muted/25 p-3 text-[13.5px] leading-relaxed">{step.outro}</p>
      )}
      {step.callouts?.map((c, i) => <CalloutBox key={i} c={c} />)}
    </div>
  )
}

/* ───────────────────────── util ───────────────────────── */

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
      ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function Explanation({ correct, text }: { correct: boolean; text: string }) {
  return (
    <div className={`rounded-xl border p-3.5 ${correct ? 'border-emerald-500/35 bg-emerald-500/[0.07]' : 'border-rose-500/35 bg-rose-500/[0.07]'}`}>
      <p className={`mb-1 inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider ${correct ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
        {correct ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
        {correct ? 'Isso mesmo' : 'Não é essa'}
      </p>
      <p className="text-[13.5px] leading-relaxed">{text}</p>
    </div>
  )
}

interface GradedProps {
  /** Disparado só na primeira resposta — define a pontuação. */
  onAnswer: (correct: boolean) => void
  /** Libera o botão de avançar do player. */
  onResolved: () => void
}

/* ───────────────────────── quiz ───────────────────────── */

export function QuizView({ step, onAnswer, onResolved }: { step: QuizStep } & GradedProps) {
  const options = useMemo(() => shuffle(step.options), [step])
  const [picked, setPicked] = useState<number | null>(null)
  const correctIdx = options.findIndex((o) => o.correct)

  function pick(i: number) {
    if (picked != null) return
    setPicked(i)
    onAnswer(!!options[i].correct)
    onResolved()
  }

  return (
    <div className="space-y-4">
      {step.stem && (
        <div className="rounded-xl border border-border bg-muted/30 p-3.5">
          <p className="mb-1 text-[10.5px] font-black uppercase tracking-wider text-muted-foreground">Caso</p>
          <p className="text-[13.5px] leading-relaxed">{step.stem}</p>
        </div>
      )}
      <h3 className="font-heading text-lg font-black leading-tight tracking-tight sm:text-xl">{step.question}</h3>

      <div className="space-y-2">
        {options.map((o, i) => {
          const revealed = picked != null
          const isCorrect = !!o.correct
          const isPicked = picked === i
          const style = !revealed
            ? 'border-border bg-muted/25 hover:border-primary/45 hover:bg-muted/45'
            : isCorrect
              ? 'border-emerald-500/60 bg-emerald-500/10'
              : isPicked
                ? 'border-rose-500/60 bg-rose-500/10'
                : 'border-border bg-muted/15 opacity-60'
          return (
            <button
              key={i}
              type="button"
              onClick={() => pick(i)}
              disabled={revealed}
              className={`flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition ${style}`}
            >
              <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-black ${
                revealed && isCorrect ? 'border-emerald-500 bg-emerald-500 text-white'
                  : revealed && isPicked ? 'border-rose-500 bg-rose-500 text-white'
                    : 'border-muted-foreground/40 text-muted-foreground'
              }`}>
                {revealed && isCorrect ? <Check className="h-3 w-3" /> : revealed && isPicked ? <X className="h-3 w-3" /> : String.fromCharCode(65 + i)}
              </span>
              <span className="text-[13.5px] leading-relaxed">{o.text}</span>
            </button>
          )
        })}
      </div>

      {picked != null && <Explanation correct={picked === correctIdx} text={step.explain} />}
    </div>
  )
}

/* ───────────────────────── ordenar ───────────────────────── */

export function OrderView({ step, onAnswer, onResolved }: { step: OrderStep } & GradedProps) {
  const pool = useMemo(() => shuffle(step.items.map((t, i) => ({ t, i }))), [step])
  const [picked, setPicked] = useState<{ t: string; i: number }[]>([])
  const [checked, setChecked] = useState(false)

  const complete = picked.length === step.items.length
  const correct = checked && picked.every((p, idx) => p.i === idx)

  function toggle(item: { t: string; i: number }) {
    if (checked) return
    setPicked((p) => (p.some((x) => x.i === item.i) ? p.filter((x) => x.i !== item.i) : [...p, item]))
  }

  function check() {
    setChecked(true)
    onAnswer(picked.every((p, idx) => p.i === idx))
    onResolved()
  }

  return (
    <div className="space-y-4">
      <h3 className="font-heading text-lg font-black leading-tight tracking-tight sm:text-xl">{step.question}</h3>
      {step.hint && <p className="text-[13px] text-muted-foreground">{step.hint}</p>}

      <div className="space-y-1.5">
        {pool.map((item) => {
          const pos = picked.findIndex((p) => p.i === item.i)
          const on = pos >= 0
          const right = checked && on && pos === item.i
          const wrong = checked && on && pos !== item.i
          return (
            <button
              key={item.i}
              type="button"
              onClick={() => toggle(item)}
              disabled={checked}
              className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                right ? 'border-emerald-500/60 bg-emerald-500/10'
                  : wrong ? 'border-rose-500/60 bg-rose-500/10'
                    : on ? 'border-primary/60 bg-primary/10'
                      : 'border-border bg-muted/25 hover:border-primary/40'
              }`}
            >
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-black ${
                on ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                {on ? pos + 1 : '·'}
              </span>
              <span className="text-[13.5px] leading-snug">{item.t}</span>
            </button>
          )
        })}
      </div>

      {!checked && (
        <button
          type="button"
          onClick={check}
          disabled={!complete}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-black text-primary-foreground transition disabled:opacity-40"
        >
          Conferir a ordem <ArrowRight className="h-4 w-4" />
        </button>
      )}

      {checked && (
        <>
          {!correct && (
            <div className="rounded-xl border border-border bg-muted/30 p-3">
              <p className="mb-1.5 text-[10.5px] font-black uppercase tracking-wider text-muted-foreground">Ordem correta</p>
              <ol className="ml-4 list-decimal space-y-0.5 text-[13px]">
                {step.items.map((t) => <li key={t}>{t}</li>)}
              </ol>
            </div>
          )}
          <Explanation correct={correct} text={step.explain} />
        </>
      )}
    </div>
  )
}

/* ───────────────────────── parear ───────────────────────── */

export function MatchView({ step, onAnswer, onResolved }: { step: MatchStep } & GradedProps) {
  const rights = useMemo(() => shuffle(step.pairs.map((p, i) => ({ text: p.right, i }))), [step])
  const [selLeft, setSelLeft] = useState<number | null>(null)
  const [solved, setSolved] = useState<number[]>([])
  const [misses, setMisses] = useState(0)
  const [flash, setFlash] = useState<number | null>(null)
  const [reported, setReported] = useState(false)

  function pickRight(i: number) {
    if (selLeft == null || solved.includes(i)) return
    if (i === selLeft) {
      const next = [...solved, i]
      setSolved(next)
      setSelLeft(null)
      if (next.length === step.pairs.length && !reported) {
        setReported(true)
        onAnswer(misses === 0)
        onResolved()
      }
    } else {
      setMisses((m) => m + 1)
      setFlash(i)
      setTimeout(() => setFlash(null), 450)
    }
  }

  const done = solved.length === step.pairs.length

  return (
    <div className="space-y-4">
      <h3 className="font-heading text-lg font-black leading-tight tracking-tight sm:text-xl">{step.question}</h3>
      <p className="text-[13px] text-muted-foreground">
        Toque em um item da esquerda e depois no par correspondente da direita.
      </p>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          {step.pairs.map((p, i) => {
            const ok = solved.includes(i)
            return (
              <button
                key={i}
                type="button"
                onClick={() => !ok && setSelLeft(selLeft === i ? null : i)}
                disabled={ok}
                className={`w-full rounded-xl border p-2.5 text-left text-[12.5px] font-semibold leading-snug transition ${
                  ok ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                    : selLeft === i ? 'border-primary bg-primary/15'
                      : 'border-border bg-muted/25 hover:border-primary/40'
                }`}
              >
                {p.left}
              </button>
            )
          })}
        </div>
        <div className="space-y-1.5">
          {rights.map((r) => {
            const ok = solved.includes(r.i)
            return (
              <button
                key={r.i}
                type="button"
                onClick={() => pickRight(r.i)}
                disabled={ok}
                className={`w-full rounded-xl border p-2.5 text-left text-[12.5px] font-semibold leading-snug transition ${
                  ok ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                    : flash === r.i ? 'border-rose-500 bg-rose-500/15'
                      : selLeft != null ? 'border-border bg-muted/25 hover:border-primary/50'
                        : 'border-border bg-muted/15'
                }`}
              >
                {r.text}
              </button>
            )
          })}
        </div>
      </div>

      {misses > 0 && !done && (
        <p className="text-center text-[12px] font-semibold text-rose-500">
          {misses} {misses === 1 ? 'tentativa errada' : 'tentativas erradas'} — continue
        </p>
      )}

      {done && <Explanation correct={misses === 0} text={step.explain} />}
    </div>
  )
}

/* ───────────────────────── completar ───────────────────────── */

export function FillView({ step, onAnswer, onResolved }: { step: FillStep } & GradedProps) {
  const options = useMemo(() => shuffle(step.options), [step])
  const [picked, setPicked] = useState<string | null>(null)
  const parts = step.sentence.split('___')

  function pick(o: string) {
    if (picked) return
    setPicked(o)
    onAnswer(o === step.answer)
    onResolved()
  }

  return (
    <div className="space-y-4">
      <h3 className="font-heading text-lg font-black leading-tight tracking-tight sm:text-xl">{step.question}</h3>

      <p className="rounded-xl border border-border bg-muted/30 p-4 text-[15px] leading-relaxed">
        {parts[0]}
        <span className={`mx-1 inline-flex min-w-[110px] justify-center rounded-md border-b-2 px-2 py-0.5 font-black ${
          picked
            ? picked === step.answer ? 'border-emerald-500 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
              : 'border-rose-500 bg-rose-500/15 text-rose-600 dark:text-rose-400'
            : 'border-primary/60 bg-primary/5 text-muted-foreground'
        }`}>
          {picked || '?'}
        </span>
        {parts[1]}
      </p>

      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => pick(o)}
            disabled={!!picked}
            className={`rounded-xl border px-4 py-2.5 text-[13.5px] font-bold transition ${
              picked === o
                ? o === step.answer ? 'border-emerald-500/60 bg-emerald-500/10' : 'border-rose-500/60 bg-rose-500/10'
                : picked && o === step.answer ? 'border-emerald-500/60 bg-emerald-500/10'
                  : 'border-border bg-muted/25 hover:border-primary/45'
            }`}
          >
            {o}
          </button>
        ))}
      </div>

      {picked && <Explanation correct={picked === step.answer} text={step.explain} />}
    </div>
  )
}
