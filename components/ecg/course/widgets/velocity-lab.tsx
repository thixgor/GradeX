'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Play, Pause, RotateCcw } from 'lucide-react'
import { LabButton, LabNote, LabShell } from './ui'

/**
 * Laboratório de velocidades de condução.
 *
 * Mostra as duas grandezas lado a lado — quanto TEMPO o impulso gasta em cada
 * estação (a corrida, em câmera lenta) e a que VELOCIDADE ele viaja em cada uma
 * (a barra logarítmica). O ponto pedagógico é ver que o trecho mais demorado é
 * também o mais curto: o nó AV gasta um terço do tempo total percorrendo
 * milímetros.
 */

interface Leg {
  id: string
  name: string
  /** Tempo real gasto no trecho (ms). */
  ms: number
  /** Velocidade de condução (m/s). */
  ms1: number
  velocityLabel: string
  color: string
  note: string
}

const LEGS: Leg[] = [
  { id: 'atria', name: 'Átrios (vias internodais + Bachmann)', ms: 90, ms1: 1, velocityLabel: '~1 m/s', color: '#38bdf8', note: 'É a onda P inteira. Fase 0 de sódio, fibras finas: rápido o bastante para a P caber em menos de 120 ms.' },
  { id: 'av', name: 'Nó atrioventricular', ms: 90, ms1: 0.05, velocityLabel: '0,02–0,05 m/s', color: '#facc15', note: 'Um terço do tempo total gasto em poucos milímetros. Fase 0 de CÁLCIO e conexina 45 de baixa condutância. É o pedágio — e é de propósito.' },
  { id: 'his', name: 'Feixe de His', ms: 12, ms1: 1.2, velocityLabel: '1–1,5 m/s', color: '#a78bfa', note: 'Volta o sódio, volta a velocidade. O impulso atravessa o septo membranoso quase instantaneamente.' },
  { id: 'branches', name: 'Ramos e fascículos', ms: 18, ms1: 3, velocityLabel: '2–4 m/s', color: '#34d399', note: 'Ativação praticamente simultânea dos dois ventrículos. Se um ramo falha, esse trecho vira um desvio longo — e o QRS alarga.' },
  { id: 'purkinje', name: 'Rede de Purkinje', ms: 12, ms1: 4, velocityLabel: '2–4 m/s', color: '#4ade80', note: 'O tecido mais veloz do corpo humano. Fibras grossas, conexina 40, fase 0 rápida.' },
  { id: 'myo', name: 'Miocárdio ventricular', ms: 60, ms1: 0.4, velocityLabel: '0,3–0,5 m/s', color: '#fb7185', note: 'É o QRS. Note a queda: dez vezes mais lento que o Purkinje. Um estímulo que nasce AQUI (extrassístole, escape, marca-passo) percorre tudo nessa velocidade — e por isso alarga o complexo.' },
]

const TOTAL = LEGS.reduce((s, l) => s + l.ms, 0)
/** Câmera lenta: o percurso real de ~280 ms é mostrado em ~5,6 s. */
const SLOWDOWN = 20

export function VelocityLab() {
  const [t, setT] = useState(0)
  const [playing, setPlaying] = useState(false)
  const raf = useRef(0)
  const start = useRef(0)

  useEffect(() => {
    if (!playing) return
    start.current = performance.now() - t * SLOWDOWN
    const loop = () => {
      const elapsed = (performance.now() - start.current) / SLOWDOWN
      if (elapsed >= TOTAL) { setT(TOTAL); setPlaying(false); return }
      setT(elapsed)
      raf.current = requestAnimationFrame(loop)
    }
    raf.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf.current)
  }, [playing]) // eslint-disable-line react-hooks/exhaustive-deps

  // Qual trecho o impulso está percorrendo agora
  let acc = 0
  let currentIdx = 0
  for (let i = 0; i < LEGS.length; i++) {
    if (t >= acc && t < acc + LEGS[i].ms) { currentIdx = i; break }
    acc += LEGS[i].ms
    currentIdx = i
  }
  const current = LEGS[currentIdx]

  const maxV = 4
  const barPct = (v: number) => `${Math.max(2, (Math.log10(v * 100) / Math.log10(maxV * 100)) * 100)}%`

  return (
    <LabShell>
      {/* Corrida */}
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">
          A corrida do impulso — {SLOWDOWN}× mais devagar
        </p>
        <p className="font-mono text-sm font-black text-primary">{Math.round(t)} ms</p>
      </div>

      <div className="flex h-9 w-full overflow-hidden rounded-lg border border-border bg-muted/30">
        {LEGS.map((leg, idx) => {
          let before = 0
          for (let i = 0; i < idx; i++) before += LEGS[i].ms
          const filled = Math.max(0, Math.min(1, (t - before) / leg.ms))
          return (
            <div
              key={leg.id}
              className="relative border-r border-background/60 last:border-r-0"
              style={{ width: `${(leg.ms / TOTAL) * 100}%` }}
              title={`${leg.name} · ${leg.ms} ms · ${leg.velocityLabel}`}
            >
              <div className="absolute inset-0" style={{ backgroundColor: leg.color, opacity: 0.18 }} />
              <div className="absolute inset-y-0 left-0 transition-none" style={{ width: `${filled * 100}%`, backgroundColor: leg.color, opacity: 0.75 }} />
              <span className="absolute inset-0 flex items-center justify-center px-1 text-[9px] font-black text-foreground/80">
                {leg.ms} ms
              </span>
            </div>
          )
        })}
      </div>

      <div className="mt-2 flex items-center gap-2">
        <LabButton active tone="primary" onClick={() => { if (t >= TOTAL) setT(0); setPlaying((p) => !p) }}>
          {playing ? <><Pause className="h-4 w-4" /> Pausar</> : <><Play className="h-4 w-4" /> Rodar a corrida</>}
        </LabButton>
        <LabButton onClick={() => { setPlaying(false); setT(0) }}><RotateCcw className="h-4 w-4" /> Zerar</LabButton>
        <span className="ml-auto text-[11px] text-muted-foreground">Total: {TOTAL} ms (P + PR + QRS)</span>
      </div>

      <LabNote title={current.name} tone="info">{current.note}</LabNote>

      {/* Barras de velocidade */}
      <p className="mb-1.5 mt-3 text-xs font-black uppercase tracking-wider text-muted-foreground">
        Velocidade de condução (escala logarítmica)
      </p>
      <div className="space-y-1.5">
        {LEGS.map((leg) => (
          <div key={leg.id} className="flex items-center gap-2">
            <span className="w-[38%] shrink-0 line-clamp-1 text-[11px] font-semibold">{leg.name}</span>
            <div className="h-4 flex-1 overflow-hidden rounded bg-muted/40">
              <div className="h-full rounded" style={{ width: barPct(leg.ms1), backgroundColor: leg.color, opacity: 0.85 }} />
            </div>
            <span className="w-[68px] shrink-0 text-right font-mono text-[11px] font-black">{leg.velocityLabel.split(' ')[0]}</span>
          </div>
        ))}
      </div>

      <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
        Repare no paradoxo: o nó AV é o trecho mais CURTO em distância e o mais DEMORADO em tempo. Já o miocárdio
        ventricular percorre bastante caminho, mas a 0,4 m/s — é ele quem define a largura do QRS.
      </p>
    </LabShell>
  )
}
