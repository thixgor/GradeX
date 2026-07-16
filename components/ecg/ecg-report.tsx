'use client'

import React, { useMemo, useState } from 'react'
import { FileText, Stethoscope, CheckCircle2, XCircle, RotateCcw, Trophy, ChevronRight, ClipboardList } from 'lucide-react'
import type { EcgMeasured } from '@/lib/ecg/measure'
import { ECG_CATALOG, type EcgEntry } from '@/lib/ecg/catalog'
import { buildReport, gradingTruth, type ReportStatus } from '@/lib/ecg/report'

const STATUS_STYLE: Record<ReportStatus, string> = {
  normal: 'border-emerald-400/40 bg-emerald-500/[0.07] text-emerald-700 dark:text-emerald-300',
  alterado: 'border-red-400/40 bg-red-500/[0.07] text-red-600 dark:text-red-300',
  atencao: 'border-amber-400/40 bg-amber-500/[0.07] text-amber-700 dark:text-amber-300',
  neutro: 'border-white/10 bg-white/[0.03] text-muted-foreground',
}
const STATUS_DOT: Record<ReportStatus, string> = {
  normal: 'bg-emerald-400', alterado: 'bg-red-400', atencao: 'bg-amber-400', neutro: 'bg-white/40',
}

/* ─────────────────────────── LAUDO AUTOMÁTICO ─────────────────────────── */
function LaudoPanel({ entry, measured }: { entry: EcgEntry; measured: EcgMeasured }) {
  const report = useMemo(() => buildReport(entry, measured), [entry, measured])
  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2">
        {report.sections.map((s, i) => (
          <div key={i} className={`rounded-lg border px-3 py-2 ${STATUS_STYLE[s.status]}`}>
            <div className="flex items-center gap-1.5">
              <span className={`inline-block h-1.5 w-1.5 rounded-full ${STATUS_DOT[s.status]}`} />
              <span className="text-[10px] font-bold uppercase tracking-wide opacity-70">{s.passo}</span>
            </div>
            <div className="mt-0.5 text-sm font-semibold text-foreground">{s.titulo}</div>
            <div className="text-xs">{s.achado}</div>
            {s.detalhe && <div className="mt-0.5 text-[11px] opacity-80">{s.detalhe}</div>}
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-primary/30 bg-primary/[0.06] p-3">
        <div className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-primary">
          <ClipboardList className="h-3.5 w-3.5" /> Conclusão
        </div>
        {report.conclusao.map((l, i) => (
          <p key={i} className={i === 0 ? 'text-sm font-bold text-foreground' : 'mt-0.5 text-xs text-muted-foreground'}>{l}</p>
        ))}
      </div>
      <p className="text-[10px] italic text-muted-foreground">
        Laudo gerado a partir das medidas detectadas no traçado. Ferramenta educacional — não substitui a
        avaliação médica.
      </p>
    </div>
  )
}

/* ───────────────────── MODO GUIADO "INTERPRETE ESTE ECG" ───────────────────── */
interface Step {
  key: string
  pergunta: string
  options: { label: string; value: string }[]
  correct: string
  explica: (v: string, correct: boolean) => string
}

function shuffle<T>(a: T[]): T[] {
  const r = [...a]
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[r[i], r[j]] = [r[j], r[i]] }
  return r
}

function buildSteps(entry: EcgEntry, m: EcgMeasured): Step[] {
  const t = gradingTruth(entry, m)
  const steps: Step[] = []

  steps.push({
    key: 'ritmo', pergunta: '1. O ritmo é regular ou irregular?',
    options: [{ label: 'Regular', value: 'regular' }, { label: 'Irregular', value: 'irregular' }],
    correct: t.ritmo,
    explica: (_v, ok) => `O R-R ${t.ritmo === 'regular' ? 'é constante → ritmo regular' : 'varia → ritmo irregular'}.${ok ? '' : ''}`,
  })

  steps.push({
    key: 'fc', pergunta: `2. Qual a frequência cardíaca? (medida: ${m.hr ?? '—'} bpm)`,
    options: [
      { label: 'Bradicardia (< 60)', value: 'bradi' },
      { label: 'Normal (60–100)', value: 'normal' },
      { label: 'Taquicardia (> 100)', value: 'taqui' },
    ],
    correct: t.fcClass,
    explica: () => `FC medida ${m.hr ?? '—'} bpm → ${t.fcClass === 'bradi' ? 'bradicardia' : t.fcClass === 'taqui' ? 'taquicardia' : 'normocardia'}.`,
  })

  steps.push({
    key: 'eixo', pergunta: `3. Como está o eixo elétrico? (medido: ${m.axis ?? '—'}°)`,
    options: [
      { label: 'Normal (−30° a +90°)', value: 'normal' },
      { label: 'Desvio p/ esquerda', value: 'esquerdo' },
      { label: 'Desvio p/ direita', value: 'direito' },
      { label: 'Extremo (noroeste)', value: 'extremo' },
    ],
    correct: t.axisClass,
    explica: () => `Eixo medido ${m.axis ?? '—'}° → ${({ normal: 'normal', esquerdo: 'desvio à esquerda', direito: 'desvio à direita', extremo: 'desvio extremo' } as const)[t.axisClass]}.`,
  })

  if (t.prClass) {
    steps.push({
      key: 'pr', pergunta: `4. O intervalo PR está… (medido: ${m.pr ?? '—'} ms)`,
      options: [
        { label: 'Curto (< 120 ms)', value: 'curto' },
        { label: 'Normal (120–200 ms)', value: 'normal' },
        { label: 'Prolongado (≥ 200 ms)', value: 'prolongado' },
      ],
      correct: t.prClass,
      explica: () => `PR medido ${m.pr ?? '—'} ms → ${t.prClass}.`,
    })
  }

  steps.push({
    key: 'qrs', pergunta: `5. A duração do QRS está… (medida: ${m.qrs ?? '—'} ms)`,
    options: [
      { label: 'Estreito (< 120 ms)', value: 'estreito' },
      { label: 'Largo (≥ 120 ms)', value: 'largo' },
    ],
    correct: t.qrsClass,
    explica: () => `QRS medido ${m.qrs ?? '—'} ms → ${t.qrsClass}. QRS largo sugere origem/condução ventricular anômala (bloqueio de ramo, ectopia, pré-excitação, marca-passo).`,
  })

  steps.push({
    key: 'qt', pergunta: `6. O QTc está… (medido: ${m.qtc ?? '—'} ms)`,
    options: [
      { label: 'Curto (< 350 ms)', value: 'curto' },
      { label: 'Normal', value: 'normal' },
      { label: 'Prolongado (> 470 ms)', value: 'prolongado' },
    ],
    correct: t.qtClass,
    explica: () => `QTc ${m.qtc ?? '—'} ms → ${t.qtClass}.`,
  })

  // 7. Diagnóstico — correto + distratores da mesma categoria
  const distratores = ECG_CATALOG
    .filter((e) => e.categoria === entry.categoria && e.id !== entry.id)
    .slice(0, 8)
  const opts = shuffle([entry, ...shuffle(distratores).slice(0, 3)]).map((e) => ({ label: e.nome, value: e.id }))
  steps.push({
    key: 'dx', pergunta: '7. Qual o diagnóstico eletrocardiográfico?',
    options: opts,
    correct: entry.id,
    explica: () => `${entry.nome}. ${entry.clinical.resumo}`,
  })

  return steps
}

function GuidedReading({ entry, measured }: { entry: EcgEntry; measured: EcgMeasured }) {
  const steps = useMemo(() => buildSteps(entry, measured), [entry, measured])
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)

  // reinicia ao trocar de padrão
  const sig = entry.id
  const [lastSig, setLastSig] = useState(sig)
  if (sig !== lastSig) { setLastSig(sig); setIdx(0); setPicked(null); setScore(0); setDone(false) }

  if (measured.quality !== 'ok') {
    return <p className="text-xs text-muted-foreground">O modo guiado precisa de complexos organizados. Selecione um traçado com QRS identificáveis.</p>
  }

  const step = steps[idx]
  const answered = picked != null
  const correct = answered && picked === step.correct

  const choose = (v: string) => {
    if (answered) return
    setPicked(v)
    if (v === step.correct) setScore((s) => s + 1)
  }
  const next = () => {
    if (idx + 1 >= steps.length) { setDone(true); return }
    setIdx((i) => i + 1); setPicked(null)
  }
  const restart = () => { setIdx(0); setPicked(null); setScore(0); setDone(false) }

  if (done) {
    const pct = Math.round((score / steps.length) * 100)
    return (
      <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4 text-center">
        <Trophy className={`mx-auto h-8 w-8 ${pct >= 70 ? 'text-amber-400' : 'text-muted-foreground'}`} />
        <p className="mt-2 text-lg font-bold">{score} / {steps.length} <span className="text-sm font-normal text-muted-foreground">({pct}%)</span></p>
        <p className="text-xs text-muted-foreground">{pct >= 85 ? 'Excelente leitura sistemática!' : pct >= 60 ? 'Bom — revise os passos que errou.' : 'Continue treinando o método.'}</p>
        <button onClick={restart} className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground">
          <RotateCcw className="h-3.5 w-3.5" /> Refazer
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground">
        <span>Passo {idx + 1} de {steps.length}</span>
        <span>Acertos: {score}</span>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${((idx + (answered ? 1 : 0)) / steps.length) * 100}%` }} />
      </div>
      <p className="text-sm font-bold">{step.pergunta}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {step.options.map((o) => {
          const isCorrect = answered && o.value === step.correct
          const isWrongPick = answered && o.value === picked && o.value !== step.correct
          return (
            <button
              key={o.value}
              onClick={() => choose(o.value)}
              disabled={answered}
              className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm font-semibold transition
                ${isCorrect ? 'border-emerald-400/60 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                  : isWrongPick ? 'border-red-400/60 bg-red-500/15 text-red-600 dark:text-red-300'
                  : answered ? 'border-white/10 bg-white/[0.02] text-muted-foreground'
                  : 'border-white/10 bg-white/[0.03] hover:border-primary/40 hover:bg-primary/[0.06]'}`}
            >
              {o.label}
              {isCorrect && <CheckCircle2 className="h-4 w-4 shrink-0" />}
              {isWrongPick && <XCircle className="h-4 w-4 shrink-0" />}
            </button>
          )
        })}
      </div>
      {answered && (
        <div className={`rounded-lg border px-3 py-2 text-xs ${correct ? 'border-emerald-400/40 bg-emerald-500/[0.07] text-emerald-700 dark:text-emerald-300' : 'border-amber-400/40 bg-amber-500/[0.07] text-amber-700 dark:text-amber-300'}`}>
          <span className="font-bold">{correct ? 'Correto. ' : 'Resposta correta destacada. '}</span>
          {step.explica(picked!, correct)}
        </div>
      )}
      {answered && (
        <div className="flex justify-end">
          <button onClick={next} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground">
            {idx + 1 >= steps.length ? 'Ver resultado' : 'Próximo'} <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────── WRAPPER ─────────────────────────── */
export function EcgReport({ entry, measured }: { entry: EcgEntry; measured: EcgMeasured }) {
  const [mode, setMode] = useState<'laudo' | 'guiado'>('laudo')
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-bold">
          <Stethoscope className="h-4 w-4 text-primary" /> Leitura sistemática e laudo
        </h3>
        <div className="flex items-center gap-1 rounded-lg bg-black/20 p-1">
          <button onClick={() => setMode('laudo')} className={`inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-bold transition ${mode === 'laudo' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
            <FileText className="h-3.5 w-3.5" /> Laudo
          </button>
          <button onClick={() => setMode('guiado')} className={`inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-bold transition ${mode === 'guiado' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
            <Stethoscope className="h-3.5 w-3.5" /> Interprete
          </button>
        </div>
      </div>
      {mode === 'laudo' ? <LaudoPanel entry={entry} measured={measured} /> : <GuidedReading entry={entry} measured={measured} />}
    </div>
  )
}
