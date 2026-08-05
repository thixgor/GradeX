'use client'

import React, { useMemo, useState } from 'react'
import {
  Lightbulb, AlertTriangle, HelpCircle, GraduationCap, Stethoscope,
  Check, X, ArrowRight, MoveHorizontal,
} from 'lucide-react'
import type {
  Callout, FillStep, MatchStep, OrderStep, QuizStep, TeachStep, LabStep,
} from '@/lib/ecg/course/types'
import { CourseWidget } from './widgets'

/**
 * Renderização de cada tipo de passo de lição.
 *
 * Dois cuidados atravessam o arquivo:
 *  - o embaralhamento é DETERMINÍSTICO (semente derivada do enunciado). Sem
 *    isso, voltar um passo e avançar de novo reordenaria as alternativas e a
 *    resposta guardada apontaria para outra opção;
 *  - todo alvo clicável tem pelo menos ~48 px de altura, porque a lição é
 *    feita majoritariamente no celular.
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
    <aside className={`rounded-xl border p-3 sm:p-3.5 ${s.cls}`}>
      <p className={`mb-1 inline-flex items-center gap-1.5 text-[10.5px] font-black uppercase tracking-wider ${s.text}`}>
        <Icon className="h-3.5 w-3.5 shrink-0" />
        {c.title || s.label}
      </p>
      <p className="text-[13px] leading-relaxed sm:text-[13.5px]">{c.text}</p>
    </aside>
  )
}

/* ───────────────────────── teach / lab ───────────────────────── */

export function TeachView({ step }: { step: TeachStep }) {
  return (
    <article className="space-y-4">
      <h3 className="font-heading text-[19px] font-black leading-tight tracking-tight sm:text-2xl">{step.title}</h3>

      {step.lead && (
        <p className="border-l-[3px] border-primary/60 pl-3 text-[14.5px] font-semibold leading-relaxed sm:text-[15px]">
          {step.lead}
        </p>
      )}

      {step.body?.map((p, i) => (
        <p key={i} className="text-[14px] leading-relaxed text-foreground/85 sm:text-[14.5px]">{p}</p>
      ))}

      {step.bullets && (
        <ul className="space-y-2">
          {step.bullets.map((b) => (
            <li key={b.t} className="rounded-xl border border-border bg-muted/25 p-3">
              <strong className="text-[13px] sm:text-[13.5px]">{b.t}</strong>
              <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted-foreground sm:text-[13px]">{b.d}</p>
            </li>
          ))}
        </ul>
      )}

      {step.table && (
        <figure className="m-0">
          <div className="relative overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[540px] border-collapse text-left text-[12px] sm:text-[12.5px]">
              <thead>
                <tr className="bg-muted/50">
                  {step.table.head.map((h) => (
                    <th key={h} className="border-b border-border px-2.5 py-2 text-[10px] font-black uppercase tracking-wider text-muted-foreground sm:px-3">
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
                        className={`border-b border-border/60 px-2.5 py-2 align-top leading-relaxed sm:px-3 ${
                          j === 0 ? 'font-bold' : ''
                        } ${step.table?.numericFrom != null && j === step.table.numericFrom ? 'whitespace-nowrap font-mono font-bold text-primary' : ''}`}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <figcaption className="mt-1.5 flex items-start gap-1.5 text-[11px] leading-snug text-muted-foreground">
            <MoveHorizontal className="mt-0.5 h-3 w-3 shrink-0 sm:hidden" />
            <span>{step.table.caption || <span className="sm:hidden">Arraste a tabela para o lado para ver todas as colunas.</span>}</span>
          </figcaption>
        </figure>
      )}

      {step.widget && <CourseWidget spec={step.widget} />}

      {step.callouts?.map((c, i) => <CalloutBox key={i} c={c} />)}
    </article>
  )
}

export function LabView({ step }: { step: LabStep }) {
  return (
    <article className="space-y-4">
      <h3 className="font-heading text-[19px] font-black leading-tight tracking-tight sm:text-2xl">{step.title}</h3>
      {step.intro && <p className="text-[14px] leading-relaxed text-foreground/85 sm:text-[14.5px]">{step.intro}</p>}
      <CourseWidget spec={step.widget} />
      {step.outro && (
        <p className="rounded-xl border border-border bg-muted/25 p-3 text-[13px] leading-relaxed sm:text-[13.5px]">
          {step.outro}
        </p>
      )}
      {step.callouts?.map((c, i) => <CalloutBox key={i} c={c} />)}
    </article>
  )
}

/* ───────────────────────── util ───────────────────────── */

/** Hash simples e estável de uma string — semente do embaralhamento. */
function seedOf(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/**
 * Embaralhamento determinístico: a mesma pergunta gera sempre a mesma ordem.
 * É o que permite guardar a resposta por índice e restaurá-la ao voltar.
 */
function stableShuffle<T>(arr: T[], seedStr: string): T[] {
  const a = [...arr]
  let s = seedOf(seedStr) || 1
  const rand = () => {
    s ^= s << 13; s >>>= 0
    s ^= s >> 17
    s ^= s << 5; s >>>= 0
    return s / 4294967296
  }
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
      ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function Explanation({ correct, text }: { correct: boolean; text: string }) {
  return (
    <div
      role="status"
      className={`rounded-xl border p-3 sm:p-3.5 ${
        correct ? 'border-emerald-500/35 bg-emerald-500/[0.07]' : 'border-rose-500/35 bg-rose-500/[0.07]'
      }`}
    >
      <p className={`mb-1 inline-flex items-center gap-1.5 text-[10.5px] font-black uppercase tracking-wider ${
        correct ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
      }`}>
        {correct ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
        {correct ? 'Isso mesmo' : 'Não é essa'}
      </p>
      <p className="text-[13px] leading-relaxed sm:text-[13.5px]">{text}</p>
    </div>
  )
}

function Prompt({ stem, question }: { stem?: string; question: string }) {
  return (
    <>
      {stem && (
        <div className="rounded-xl border border-border bg-muted/30 p-3 sm:p-3.5">
          <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-muted-foreground">Caso clínico</p>
          <p className="text-[13px] leading-relaxed sm:text-[13.5px]">{stem}</p>
        </div>
      )}
      <h3 className="font-heading text-[17px] font-black leading-tight tracking-tight sm:text-xl">{question}</h3>
    </>
  )
}

interface GradedProps<S> {
  /** Disparado só na primeira resposta — define a pontuação. */
  onAnswer: (correct: boolean) => void
  /** Guarda o estado da resposta para restaurar ao voltar um passo. */
  onSave: (state: S) => void
  saved?: S
}

/* ───────────────────────── quiz ───────────────────────── */

export function QuizView({
  step, onAnswer, onSave, saved,
}: { step: QuizStep } & GradedProps<number>) {
  const options = useMemo(() => stableShuffle(step.options, step.question), [step])
  const [picked, setPicked] = useState<number | null>(saved ?? null)
  const correctIdx = options.findIndex((o) => o.correct)

  function pick(i: number) {
    if (picked != null) return
    setPicked(i)
    onAnswer(!!options[i].correct)
    onSave(i)
  }

  return (
    <div className="space-y-4">
      <Prompt stem={step.stem} question={step.question} />

      <div className="space-y-2" role="radiogroup" aria-label={step.question}>
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
                : 'border-border bg-muted/15 opacity-55'
          return (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={isPicked}
              onClick={() => pick(i)}
              disabled={revealed}
              className={`flex min-h-[52px] w-full items-start gap-3 rounded-xl border p-3 text-left transition active:scale-[0.995] disabled:cursor-default sm:p-3.5 ${style}`}
            >
              <span className={`mt-px flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-black ${
                revealed && isCorrect ? 'border-emerald-500 bg-emerald-500 text-white'
                  : revealed && isPicked ? 'border-rose-500 bg-rose-500 text-white'
                    : 'border-muted-foreground/40 text-muted-foreground'
              }`}>
                {revealed && isCorrect ? <Check className="h-3.5 w-3.5" />
                  : revealed && isPicked ? <X className="h-3.5 w-3.5" />
                    : String.fromCharCode(65 + i)}
              </span>
              <span className="text-[13px] leading-relaxed sm:text-[13.5px]">{o.text}</span>
            </button>
          )
        })}
      </div>

      {picked != null && <Explanation correct={picked === correctIdx} text={step.explain} />}
    </div>
  )
}

/* ───────────────────────── ordenar ───────────────────────── */

interface OrderSaved { picked: number[] }

export function OrderView({
  step, onAnswer, onSave, saved,
}: { step: OrderStep } & GradedProps<OrderSaved>) {
  const pool = useMemo(
    () => stableShuffle(step.items.map((t, i) => ({ t, i })), step.question),
    [step],
  )
  const [picked, setPicked] = useState<number[]>(saved?.picked ?? [])
  const [checked, setChecked] = useState(!!saved)

  const complete = picked.length === step.items.length
  const correct = checked && picked.every((idx, pos) => idx === pos)

  function toggle(i: number) {
    if (checked) return
    setPicked((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]))
  }

  function check() {
    setChecked(true)
    onAnswer(picked.every((idx, pos) => idx === pos))
    onSave({ picked })
  }

  return (
    <div className="space-y-4">
      <Prompt question={step.question} />
      <p className="text-[12.5px] leading-snug text-muted-foreground">
        {step.hint || 'Toque nos itens na ordem certa. Toque de novo para tirar da sequência.'}
      </p>

      <ol className="space-y-1.5">
        {pool.map((item) => {
          const pos = picked.indexOf(item.i)
          const on = pos >= 0
          const right = checked && on && pos === item.i
          const wrong = checked && on && pos !== item.i
          return (
            <li key={item.i}>
              <button
                type="button"
                onClick={() => toggle(item.i)}
                disabled={checked}
                className={`flex min-h-[52px] w-full items-center gap-3 rounded-xl border p-2.5 text-left transition active:scale-[0.995] disabled:cursor-default sm:p-3 ${
                  right ? 'border-emerald-500/60 bg-emerald-500/10'
                    : wrong ? 'border-rose-500/60 bg-rose-500/10'
                      : on ? 'border-primary/60 bg-primary/10'
                        : 'border-border bg-muted/25 hover:border-primary/40'
                }`}
              >
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[12px] font-black ${
                  on ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  {on ? pos + 1 : '·'}
                </span>
                <span className="text-[12.5px] leading-snug sm:text-[13px]">{item.t}</span>
              </button>
            </li>
          )
        })}
      </ol>

      {!checked && (
        <button
          type="button"
          onClick={check}
          disabled={!complete}
          className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-black text-primary-foreground transition active:scale-[0.99] disabled:opacity-40"
        >
          {complete ? 'Conferir a ordem' : `Faltam ${step.items.length - picked.length}`}
          {complete && <ArrowRight className="h-4 w-4" />}
        </button>
      )}

      {checked && (
        <>
          {!correct && (
            <div className="rounded-xl border border-border bg-muted/30 p-3">
              <p className="mb-1.5 text-[10px] font-black uppercase tracking-wider text-muted-foreground">Ordem correta</p>
              <ol className="ml-4 list-decimal space-y-0.5 text-[12.5px] leading-snug">
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

interface MatchSaved { solved: number[]; misses: number }

export function MatchView({
  step, onAnswer, onSave, saved,
}: { step: MatchStep } & GradedProps<MatchSaved>) {
  const rights = useMemo(
    () => stableShuffle(step.pairs.map((p, i) => ({ text: p.right, i })), step.question),
    [step],
  )
  const [selLeft, setSelLeft] = useState<number | null>(null)
  const [solved, setSolved] = useState<number[]>(saved?.solved ?? [])
  const [misses, setMisses] = useState(saved?.misses ?? 0)
  const [flash, setFlash] = useState<number | null>(null)
  const [reported, setReported] = useState(!!saved)

  function pickRight(i: number) {
    if (selLeft == null || solved.includes(i)) return
    if (i === selLeft) {
      const next = [...solved, i]
      setSolved(next)
      setSelLeft(null)
      if (next.length === step.pairs.length && !reported) {
        setReported(true)
        onAnswer(misses === 0)
        onSave({ solved: next, misses })
      }
    } else {
      setMisses((m) => m + 1)
      setFlash(i)
      setTimeout(() => setFlash(null), 420)
    }
  }

  const done = solved.length === step.pairs.length

  return (
    <div className="space-y-4">
      <Prompt question={step.question} />
      <p className="text-[12.5px] leading-snug text-muted-foreground">
        Toque num item da esquerda e depois no par correspondente da direita.
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
                aria-pressed={selLeft === i}
                className={`flex min-h-[52px] w-full items-center rounded-xl border p-2.5 text-left text-[12px] font-semibold leading-snug transition active:scale-[0.98] disabled:cursor-default sm:text-[12.5px] ${
                  ok ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                    : selLeft === i ? 'border-primary bg-primary/15 ring-2 ring-primary/30'
                      : 'border-border bg-muted/25 hover:border-primary/40'
                }`}
              >
                {ok && <Check className="mr-1.5 h-3.5 w-3.5 shrink-0" />}
                <span className="min-w-0">{p.left}</span>
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
                className={`flex min-h-[52px] w-full items-center rounded-xl border p-2.5 text-left text-[12px] font-semibold leading-snug transition active:scale-[0.98] disabled:cursor-default sm:text-[12.5px] ${
                  ok ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                    : flash === r.i ? 'border-rose-500 bg-rose-500/15'
                      : selLeft != null ? 'border-primary/30 bg-muted/25 hover:border-primary/50'
                        : 'border-border bg-muted/15'
                }`}
              >
                {ok && <Check className="mr-1.5 h-3.5 w-3.5 shrink-0" />}
                <span className="min-w-0">{r.text}</span>
              </button>
            )
          })}
        </div>
      </div>

      {!done && (
        <p className="text-center text-[11.5px] font-semibold text-muted-foreground" role="status">
          {solved.length}/{step.pairs.length} pares
          {misses > 0 && <span className="text-rose-500"> · {misses} {misses === 1 ? 'erro' : 'erros'}</span>}
        </p>
      )}

      {done && <Explanation correct={misses === 0} text={step.explain} />}
    </div>
  )
}

/* ───────────────────────── completar ───────────────────────── */

export function FillView({
  step, onAnswer, onSave, saved,
}: { step: FillStep } & GradedProps<string>) {
  const options = useMemo(() => stableShuffle(step.options, step.sentence), [step])
  const [picked, setPicked] = useState<string | null>(saved ?? null)
  const parts = step.sentence.split('___')

  function pick(o: string) {
    if (picked) return
    setPicked(o)
    onAnswer(o === step.answer)
    onSave(o)
  }

  return (
    <div className="space-y-4">
      <Prompt question={step.question} />

      <p className="rounded-xl border border-border bg-muted/30 p-3.5 text-[14.5px] leading-loose sm:p-4 sm:text-[15px]">
        {parts[0]}
        <span className={`mx-1 inline-flex min-w-[100px] justify-center rounded-md border-b-2 px-2 py-0.5 font-black ${
          picked
            ? picked === step.answer
              ? 'border-emerald-500 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
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
            className={`min-h-[48px] flex-1 rounded-xl border px-4 text-[13px] font-bold transition active:scale-[0.98] disabled:cursor-default sm:flex-none sm:text-[13.5px] ${
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
