'use client'

import React, { useMemo, useState, useCallback } from 'react'
import { Check, X, RefreshCw, Trophy, ChevronRight, Target } from 'lucide-react'
import { ECG_CATALOG, type EcgEntry } from '@/lib/ecg/catalog'
import { computeMeasurements } from '@/lib/ecg/engine'
import { useEcg12 } from './use-ecg-signal'
import { Ecg12Lead } from './ecg-12-lead'

type QuizMode = 'treino' | 'prova' | 'residencia' | 'especialista'
const MODE_OPTS: Record<QuizMode, { label: string; options: number; measures: boolean; desc: string }> = {
  treino: { label: 'Treino', options: 4, measures: false, desc: 'Diagnóstico com 4 alternativas e feedback imediato.' },
  prova: { label: 'Prova', options: 5, measures: true, desc: '5 alternativas + estimar FC e QRS.' },
  residencia: { label: 'Residência', options: 6, measures: true, desc: '6 alternativas + medidas. Nível de banca.' },
  especialista: { label: 'Especialista', options: 8, measures: true, desc: 'Máxima dificuldade: 8 alternativas + medidas finas.' },
}

function shuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr]
  let s = seed
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280
    const j = Math.floor((s / 233280) * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function EcgQuiz({ dark }: { dark: boolean }) {
  const [mode, setMode] = useState<QuizMode>('treino')
  const [round, setRound] = useState(0)
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 100000))
  const [picked, setPicked] = useState<string | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [score, setScore] = useState({ correct: 0, total: 0 })
  const [fcGuess, setFcGuess] = useState('')

  const target = useMemo(() => {
    const idx = Math.abs((seed + round * 7919)) % ECG_CATALOG.length
    return ECG_CATALOG[idx]
  }, [seed, round])

  const { map: signals, fs } = useEcg12(target.pattern, 8000, 250)
  const measures = useMemo(() => computeMeasurements(target.pattern), [target])

  const options = useMemo(() => {
    const cfg = MODE_OPTS[mode]
    const sameCat = ECG_CATALOG.filter((e) => e.id !== target.id && e.categoria === target.categoria)
    const others = ECG_CATALOG.filter((e) => e.id !== target.id && e.categoria !== target.categoria)
    const distractors = [...shuffle(sameCat, seed + round), ...shuffle(others, seed + round + 3)].slice(0, cfg.options - 1)
    return shuffle([target, ...distractors], seed + round + 1)
  }, [target, mode, seed, round])

  const submit = useCallback(() => {
    if (!picked || revealed) return
    setRevealed(true)
    setScore((s) => ({ correct: s.correct + (picked === target.id ? 1 : 0), total: s.total + 1 }))
  }, [picked, revealed, target])

  const next = useCallback(() => {
    setPicked(null); setRevealed(false); setFcGuess(''); setRound((r) => r + 1)
  }, [])

  const restart = useCallback(() => {
    setSeed(Math.floor(Math.random() * 100000)); setRound(0); setPicked(null); setRevealed(false); setFcGuess(''); setScore({ correct: 0, total: 0 })
  }, [])

  const cfg = MODE_OPTS[mode]
  const fcErr = fcGuess ? Math.abs(Number(fcGuess) - measures.hr) : null

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(MODE_OPTS) as QuizMode[]).map((m) => (
            <button key={m} onClick={() => { setMode(m); restart() }}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${mode === m ? 'bg-primary text-primary-foreground' : 'bg-white/[0.05] text-muted-foreground hover:text-foreground'}`}>
              {MODE_OPTS[m].label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-lg bg-white/[0.05] px-3 py-1.5 text-xs font-bold">
            <Trophy className="h-3.5 w-3.5 text-amber-400" /> {score.correct}/{score.total}
            {score.total > 0 && <span className="text-muted-foreground">({Math.round((score.correct / score.total) * 100)}%)</span>}
          </div>
          <button onClick={restart} className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.05] px-3 py-1.5 text-xs font-bold hover:bg-white/10">
            <RefreshCw className="h-3.5 w-3.5" /> Reiniciar
          </button>
        </div>
      </div>

      <p className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs text-muted-foreground">
        <Target className="h-3.5 w-3.5 text-primary" /> {cfg.desc}
      </p>

      {/* ECG a interpretar */}
      <div className="rounded-xl border border-white/[0.1] p-1">
        <Ecg12Lead signals={signals} fs={fs} speedMmS={25} gainMmMv={10} zoom={1} dark={dark} live={false} />
      </div>

      {/* Estimativas numéricas */}
      {cfg.measures && (
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <span className="font-bold text-muted-foreground">Estime a FC (bpm):</span>
            <input value={fcGuess} onChange={(e) => setFcGuess(e.target.value.replace(/\D/g, ''))} inputMode="numeric"
              className="w-20 rounded-lg border border-white/[0.12] bg-white/[0.04] px-2 py-1.5 text-center font-bold outline-none focus:border-primary/40" placeholder="—" />
          </label>
          {revealed && fcErr != null && (
            <span className={`text-xs font-bold ${fcErr <= 10 ? 'text-emerald-500' : 'text-amber-500'}`}>
              Real: {measures.hr} bpm {fcErr <= 10 ? '✓ ótimo' : `(erro ${fcErr})`}
            </span>
          )}
        </div>
      )}

      {/* Alternativas */}
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((opt) => {
          const isCorrect = opt.id === target.id
          const isPicked = picked === opt.id
          let cls = 'border-white/[0.1] bg-white/[0.02] hover:bg-white/[0.05]'
          if (revealed && isCorrect) cls = 'border-emerald-500/50 bg-emerald-500/15'
          else if (revealed && isPicked && !isCorrect) cls = 'border-red-500/50 bg-red-500/15'
          else if (isPicked) cls = 'border-primary/50 bg-primary/10'
          return (
            <button key={opt.id} disabled={revealed} onClick={() => setPicked(opt.id)}
              className={`flex items-center justify-between gap-2 rounded-xl border p-3 text-left text-sm font-semibold transition ${cls}`}>
              <span>{opt.nome}</span>
              {revealed && isCorrect && <Check className="h-4 w-4 shrink-0 text-emerald-500" />}
              {revealed && isPicked && !isCorrect && <X className="h-4 w-4 shrink-0 text-red-500" />}
            </button>
          )
        })}
      </div>

      {!revealed ? (
        <button onClick={submit} disabled={!picked}
          className="w-full rounded-xl bg-primary py-3 text-sm font-black text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50">
          Responder
        </button>
      ) : (
        <div className="space-y-3">
          <div className={`rounded-xl border p-4 ${picked === target.id ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-red-500/40 bg-red-500/10'}`}>
            <p className="flex items-center gap-2 text-sm font-black">
              {picked === target.id ? <><Check className="h-4 w-4 text-emerald-500" /> Correto!</> : <><X className="h-4 w-4 text-red-500" /> Resposta: {target.nome}</>}
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-foreground/85">{target.clinical.resumo}</p>
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
              {[['FC', `${measures.hr}`], ['PR', measures.pr != null ? `${measures.pr}` : '—'], ['QRS', `${measures.qrs}`], ['QTc', `${measures.qtc}`], ['Eixo', `${measures.axis}°`], ['Conduta', '']].slice(0, 5).map(([l, v]) => (
                <div key={l} className="rounded-lg bg-black/20 p-2 text-center">
                  <p className="text-[9px] font-bold uppercase text-muted-foreground">{l}</p>
                  <p className="text-sm font-black tabular-nums">{v}</p>
                </div>
              ))}
            </div>
            <div className="mt-3">
              <p className="text-[11px] font-bold uppercase text-muted-foreground">Critérios-chave</p>
              <ul className="mt-1 space-y-1">
                {target.clinical.criterios.slice(0, 4).map((cr, i) => (
                  <li key={i} className="flex gap-1.5 text-[12.5px] text-foreground/85"><span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />{cr}</li>
                ))}
              </ul>
            </div>
            <div className="mt-3">
              <p className="text-[11px] font-bold uppercase text-muted-foreground">Conduta</p>
              <ul className="mt-1 space-y-1">
                {target.clinical.condutaInicial.map((cd, i) => (
                  <li key={i} className="flex gap-1.5 text-[12.5px] text-foreground/85"><span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-500" />{cd}</li>
                ))}
              </ul>
            </div>
          </div>
          <button onClick={next} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-black text-primary-foreground hover:bg-primary/90">
            Próximo ECG <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
