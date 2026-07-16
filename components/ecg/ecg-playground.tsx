'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { X, FlaskConical, Play, Pause, RotateCcw } from 'lucide-react'
import { synthesizeLead, computeMeasurements, type LeadName } from '@/lib/ecg/engine'
import {
  PLAYGROUND_SCENARIOS, defaultValues, type PlaygroundScenario, type Tone,
} from '@/lib/ecg/playground'
import { EcgLeadCanvas } from './ecg-lead-canvas'

const TONE_TEXT: Record<Tone, string> = {
  normal: 'text-emerald-600 dark:text-emerald-300',
  info: 'text-sky-600 dark:text-sky-300',
  warn: 'text-amber-600 dark:text-amber-300',
  danger: 'text-red-600 dark:text-red-300',
}
const TONE_BG: Record<Tone, string> = {
  normal: 'bg-emerald-500/15 border-emerald-400/40',
  info: 'bg-sky-500/15 border-sky-400/40',
  warn: 'bg-amber-500/15 border-amber-400/40',
  danger: 'bg-red-500/15 border-red-400/40',
}
const TONE_ZONE: Record<Tone, string> = {
  normal: 'rgba(16,185,129,0.55)', info: 'rgba(56,189,248,0.55)',
  warn: 'rgba(245,158,11,0.6)', danger: 'rgba(239,68,68,0.65)',
}

interface Props { dark: boolean; onClose: () => void; initialScenario?: string }

export function EcgPlayground({ dark, onClose, initialScenario }: Props) {
  const [scenarioId, setScenarioId] = useState(initialScenario ?? PLAYGROUND_SCENARIOS[0].id)
  const scenario = useMemo<PlaygroundScenario>(
    () => PLAYGROUND_SCENARIOS.find((s) => s.id === scenarioId) ?? PLAYGROUND_SCENARIOS[0],
    [scenarioId],
  )
  const [values, setValues] = useState<Record<string, number>>(() => defaultValues(scenario))
  const [live, setLive] = useState(false)
  const rafRef = useRef<number>(0)

  // reinicia valores ao trocar de cenário
  useEffect(() => { cancelAnimationFrame(rafRef.current); setValues(defaultValues(scenario)) }, [scenario])
  // ESC fecha
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('keydown', onKey); cancelAnimationFrame(rafRef.current) }
  }, [onClose])

  const pattern = useMemo(() => scenario.build(values), [scenario, values])
  const leads = scenario.leads ?? (['II', 'V2', 'V5'] as LeadName[])
  // sintetiza só as derivações do cenário (re-síntese ao vivo a cada arrasto)
  const signals = useMemo(() => {
    const m = {} as Record<LeadName, Float32Array>
    for (const l of leads) m[l] = synthesizeLead(pattern, l, { durationMs: 8000, fs: 250, seed: 7 })
    return m
  }, [pattern, leads])
  const measures = useMemo(() => computeMeasurements(pattern), [pattern])
  const findings = useMemo(() => scenario.findings(values), [scenario, values])

  // animação de preset (infusão de droga / manobra): tween suave até o alvo
  const animateTo = useCallback((targets: Record<string, number>) => {
    cancelAnimationFrame(rafRef.current)
    const start = { ...values }
    const t0 = performance.now(), dur = 1100
    const tick = () => {
      const k = Math.min(1, (performance.now() - t0) / dur)
      const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2
      const next = { ...start }
      for (const id in targets) next[id] = start[id] + (targets[id] - start[id]) * e
      setValues(next)
      if (k < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [values])

  const setVal = (id: string, v: number) => { cancelAnimationFrame(rafRef.current); setValues((s) => ({ ...s, [id]: v })) }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative flex max-h-[96vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border shadow-2xl ${dark ? 'border-white/10 bg-[#0b1210] text-slate-100' : 'border-black/10 bg-white text-slate-900'}`}>
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <FlaskConical className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-bold leading-tight">Laboratório vivo do ECG</h2>
            <p className="truncate text-[11px] text-muted-foreground">Arraste os controles — o traçado se redesenha na hora</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-muted-foreground transition hover:bg-white/10 hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Seletor de cenário */}
        <div className="flex gap-1.5 overflow-x-auto border-b border-white/10 px-3 py-2">
          {PLAYGROUND_SCENARIOS.map((s) => (
            <button key={s.id} onClick={() => setScenarioId(s.id)}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${scenarioId === s.id ? 'bg-primary text-primary-foreground' : 'bg-white/[0.05] text-muted-foreground hover:text-foreground'}`}>
              <span>{s.emoji}</span> {s.title}
            </button>
          ))}
        </div>

        {/* Corpo */}
        <div className="grid flex-1 gap-0 overflow-y-auto md:grid-cols-[1.4fr_1fr]">
          {/* ECG ao vivo */}
          <div className="border-b border-white/10 p-3 md:border-b-0 md:border-r">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-muted-foreground">{scenario.blurb}</p>
              <button onClick={() => setLive((v) => !v)}
                className={`inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold transition ${live ? 'bg-emerald-500 text-white' : 'bg-white/[0.06] text-muted-foreground hover:text-foreground'}`}>
                {live ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />} {live ? 'Monitor' : 'Estático'}
              </button>
            </div>
            <div className="space-y-1">
              {leads.map((l, i) => (
                <EcgLeadCanvas key={l} signal={signals[l]} fs={250} lead={l} label={l}
                  speedMmS={25} gainMmMv={10} zoom={1} dark={dark} live={live}
                  height={i === 0 ? 120 : 96} showCalibration={i === 0} />
              ))}
            </div>
            {/* medidas ao vivo */}
            <div className="mt-2 grid grid-cols-5 gap-1.5">
              <LiveTile label="FC" value={`${measures.hr}`} unit="bpm" />
              <LiveTile label="PR" value={measures.pr != null ? `${measures.pr}` : '—'} unit="ms" />
              <LiveTile label="QRS" value={`${measures.qrs}`} unit="ms" warn={measures.qrs >= 120} />
              <LiveTile label="QT" value={`${measures.qt}`} unit="ms" />
              <LiveTile label="QTc" value={`${measures.qtc}`} unit="ms" warn={measures.qtc > 460 || measures.qtc < 350} />
            </div>
          </div>

          {/* Controles + achados */}
          <div className="flex flex-col gap-3 p-3">
            {scenario.controls.map((c) => (
              <div key={c.id}>
                <div className="mb-1 flex items-baseline justify-between">
                  <label className="text-xs font-bold">{c.label}</label>
                  <span className="font-mono text-lg font-bold tabular-nums text-primary">
                    {c.format ? c.format(values[c.id]) : Math.round(values[c.id])}
                    <span className="ml-0.5 text-[11px] font-semibold text-muted-foreground">{c.unit}</span>
                  </span>
                </div>
                {/* barra de zonas clínicas */}
                {c.zones && (
                  <div className="relative mb-1 h-1.5 w-full overflow-hidden rounded-full">
                    {c.zones.map((z, zi) => (
                      <div key={zi} className="absolute top-0 h-full"
                        style={{
                          left: `${((z.from - c.min) / (c.max - c.min)) * 100}%`,
                          width: `${((z.to - z.from) / (c.max - c.min)) * 100}%`,
                          background: TONE_ZONE[z.tone],
                        }} title={z.label} />
                    ))}
                  </div>
                )}
                <input type="range" min={c.min} max={c.max} step={c.step} value={values[c.id]}
                  onChange={(e) => setVal(c.id, parseFloat(e.target.value))}
                  className="ecg-range w-full" />
                {c.zones && (
                  <div className="mt-0.5 flex justify-between text-[9px] font-semibold text-muted-foreground">
                    <span>{c.min}{c.unit}</span><span>{c.max}{c.unit}</span>
                  </div>
                )}
              </div>
            ))}

            {/* presets (drogas / manobras) */}
            {scenario.presets && (
              <div>
                <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Drogas e manobras</p>
                <div className="flex flex-wrap gap-1.5">
                  {scenario.presets.map((pr) => (
                    <button key={pr.label} onClick={() => animateTo(pr.set)}
                      className={`group inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-bold transition hover:brightness-110 ${TONE_BG[pr.tone ?? 'info']}`}
                      title={pr.hint}>
                      {pr.label}
                      {pr.hint && <span className="text-[9px] font-normal opacity-70">· {pr.hint}</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* achados ao vivo */}
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Achados eletrocardiográficos</p>
              <ul className="space-y-1">
                {findings.map((f, i) => (
                  <li key={i} className={`flex items-start gap-1.5 text-xs font-semibold ${TONE_TEXT[f.tone]}`}>
                    <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: TONE_ZONE[f.tone] }} />
                    {f.text}
                  </li>
                ))}
              </ul>
            </div>

            <button onClick={() => { cancelAnimationFrame(rafRef.current); setValues(defaultValues(scenario)) }}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-muted-foreground transition hover:text-foreground">
              <RotateCcw className="h-3.5 w-3.5" /> Restaurar valores basais
            </button>
          </div>
        </div>
      </div>

      {/* estilo do slider */}
      <style jsx global>{`
        .ecg-range { -webkit-appearance: none; appearance: none; height: 6px; border-radius: 9999px;
          background: ${dark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.14)'}; outline: none; }
        .ecg-range::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 20px; height: 20px;
          border-radius: 9999px; background: #22d3ee; border: 3px solid #06202a; cursor: grab;
          box-shadow: 0 1px 6px rgba(0,0,0,0.4); transition: transform .08s; }
        .ecg-range::-webkit-slider-thumb:active { cursor: grabbing; transform: scale(1.15); }
        .ecg-range::-moz-range-thumb { width: 20px; height: 20px; border-radius: 9999px; background: #22d3ee;
          border: 3px solid #06202a; cursor: grab; }
      `}</style>
    </div>
  )
}

function LiveTile({ label, value, unit, warn }: { label: string; value: string; unit: string; warn?: boolean }) {
  return (
    <div className={`rounded-lg border px-1.5 py-1 text-center ${warn ? 'border-amber-400/40 bg-amber-500/10' : 'border-white/10 bg-white/[0.03]'}`}>
      <div className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`font-mono text-sm font-bold tabular-nums ${warn ? 'text-amber-500' : ''}`}>{value}</div>
      <div className="text-[8px] text-muted-foreground">{unit}</div>
    </div>
  )
}
