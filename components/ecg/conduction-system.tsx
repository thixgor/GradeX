'use client'

import React, { useEffect, useRef, useState } from 'react'

type WallKey = 'anterior' | 'septal' | 'inferior' | 'lateral' | 'posterior' | 'rv' | 'lv'

interface Props {
  rate: number
  dark: boolean
  /** paredes destacadas (IAM) */
  highlightWalls?: WallKey[]
  /** rótulo da artéria culpada */
  arteryLabel?: string
  /** origem do impulso ectópico (arritmia): coordenadas relativas 0..1 */
  ectopicOrigin?: { x: number; y: number; label: string } | null
  /** desativa a sequência normal (ritmos sem condução AV normal) */
  abnormalConduction?: boolean
}

// estágios da despolarização normal (fração do ciclo em que cada estrutura acende)
const STAGES: { id: string; t: number; label: string }[] = [
  { id: 'sa', t: 0.0, label: 'Nó SA' },
  { id: 'atria', t: 0.08, label: 'Átrios' },
  { id: 'av', t: 0.22, label: 'Nó AV' },
  { id: 'his', t: 0.32, label: 'Feixe de His' },
  { id: 'branches', t: 0.4, label: 'Ramos' },
  { id: 'purkinje', t: 0.48, label: 'Purkinje' },
  { id: 'ventricles', t: 0.56, label: 'Ventrículos' },
]

/**
 * Coração esquemático com o sistema de condução animado em tempo real,
 * sincronizado à frequência. Realça paredes (IAM) e origem de arritmias.
 */
export function ConductionSystem({ rate, dark, highlightWalls = [], arteryLabel, ectopicOrigin, abnormalConduction }: Props) {
  const [phase, setPhase] = useState(0)
  const [activeStage, setActiveStage] = useState('sa')
  const rafRef = useRef<number>(0)
  const startRef = useRef<number>(performance.now())

  useEffect(() => {
    const cycleMs = 60000 / Math.max(30, rate || 60)
    const loop = () => {
      const p = ((performance.now() - startRef.current) % cycleMs) / cycleMs
      setPhase(p)
      let cur = STAGES[0].id
      for (const s of STAGES) if (p >= s.t) cur = s.id
      setActiveStage(cur)
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [rate])

  const lit = (id: string) => {
    const idx = STAGES.findIndex((s) => s.id === id)
    if (idx < 0) return 0
    const t = STAGES[idx].t
    const next = STAGES[idx + 1]?.t ?? t + 0.12
    if (phase >= t && phase < next + 0.06) return 1
    return 0.25
  }

  const stroke = dark ? '#1f6b45' : '#c05050'
  const dim = dark ? 'rgba(120,230,160,0.25)' : 'rgba(180,60,60,0.25)'
  const hot = dark ? '#5cf0a0' : '#e23b3b'
  const wallFill = (w: WallKey) => (highlightWalls.includes(w) ? 'rgba(239,68,68,0.55)' : dark ? 'rgba(63,240,138,0.06)' : 'rgba(200,60,60,0.05)')

  return (
    <div className="flex flex-col items-center gap-3">
      <svg viewBox="0 0 320 340" className="w-full max-w-[320px]" role="img" aria-label="Sistema de condução cardíaco animado">
        {/* silhueta do coração / câmaras */}
        <path d="M160 60 C120 20 40 40 40 130 C40 210 120 270 160 320 C200 270 280 210 280 130 C280 40 200 20 160 60 Z"
          fill={dark ? 'rgba(20,40,30,0.6)' : 'rgba(255,240,240,0.8)'} stroke={stroke} strokeWidth={2} />

        {/* paredes (para realce de IAM) */}
        <path d="M160 60 C130 40 90 50 80 110 L160 150 Z" fill={wallFill('septal')} stroke={dim} />
        <path d="M80 110 C60 150 70 210 120 250 L160 150 Z" fill={wallFill('anterior')} stroke={dim} />
        <path d="M120 250 C150 280 160 300 160 320 L160 150 Z" fill={wallFill('inferior')} stroke={dim} />
        <path d="M160 150 L160 320 C170 300 200 270 230 220 Z" fill={wallFill('lateral')} stroke={dim} />
        <path d="M160 150 L230 220 C270 180 265 120 230 90 Z" fill={wallFill('posterior')} stroke={dim} />

        {/* nó SA */}
        <circle cx={210} cy={95} r={9} fill={hot} opacity={lit('sa')} />
        <circle cx={210} cy={95} r={5} fill={hot} />
        {/* despolarização atrial (ondas) */}
        <path d="M210 100 C170 120 120 120 95 135" fill="none" stroke={hot} strokeWidth={3} opacity={lit('atria')} strokeLinecap="round" />
        <path d="M210 100 C240 120 250 140 245 160" fill="none" stroke={hot} strokeWidth={3} opacity={lit('atria')} strokeLinecap="round" />
        {/* nó AV */}
        <circle cx={165} cy={158} r={8} fill={abnormalConduction ? dim : hot} opacity={abnormalConduction ? 0.3 : lit('av')} />
        {/* feixe de His */}
        <line x1={165} y1={166} x2={165} y2={190} stroke={hot} strokeWidth={3} opacity={lit('his')} />
        {/* ramos */}
        <path d="M165 190 L120 230" stroke={hot} strokeWidth={3} opacity={lit('branches')} strokeLinecap="round" />
        <path d="M165 190 L215 230" stroke={hot} strokeWidth={3} opacity={lit('branches')} strokeLinecap="round" />
        {/* Purkinje */}
        <path d="M120 230 L100 265 M120 230 L135 270 M215 230 L235 265 M215 230 L200 272" stroke={hot} strokeWidth={2} opacity={lit('purkinje')} strokeLinecap="round" />

        {/* origem ectópica (arritmia) */}
        {ectopicOrigin && (
          <g>
            <circle cx={40 + ectopicOrigin.x * 240} cy={40 + ectopicOrigin.y * 260} r={11} fill="none" stroke="#f59e0b" strokeWidth={2}>
              <animate attributeName="r" values="8;16;8" dur="1s" repeatCount="indefinite" />
            </circle>
            <circle cx={40 + ectopicOrigin.x * 240} cy={40 + ectopicOrigin.y * 260} r={5} fill="#f59e0b" />
          </g>
        )}

        <text x={224} y={90} fontSize={9} fill={dark ? '#7fe6a5' : '#9a2b2b'}>SA</text>
        <text x={175} y={158} fontSize={9} fill={dark ? '#7fe6a5' : '#9a2b2b'}>AV</text>
      </svg>

      {/* legenda da sequência */}
      <div className="flex flex-wrap justify-center gap-1.5">
        {STAGES.map((s) => (
          <span key={s.id}
            className={`rounded-md px-2 py-0.5 text-[10px] font-bold transition-colors ${
              activeStage === s.id
                ? 'bg-emerald-500 text-white'
                : dark ? 'bg-white/[0.06] text-muted-foreground' : 'bg-black/[0.05] text-muted-foreground'
            }`}>
            {s.label}
          </span>
        ))}
      </div>

      {arteryLabel && (
        <div className="rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-1.5 text-center text-xs font-bold text-red-500 dark:text-red-300">
          Artéria culpada provável: {arteryLabel}
        </div>
      )}
      {ectopicOrigin && (
        <div className="rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-1.5 text-center text-xs font-bold text-amber-600 dark:text-amber-300">
          Origem: {ectopicOrigin.label}
        </div>
      )}
    </div>
  )
}

export type { WallKey }
