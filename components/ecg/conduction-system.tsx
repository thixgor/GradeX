'use client'

import React, { useEffect, useRef, useState } from 'react'

type WallKey = 'anterior' | 'septal' | 'inferior' | 'lateral' | 'posterior' | 'rv' | 'lv'

interface Props {
  rate: number
  dark: boolean
  highlightWalls?: WallKey[]
  arteryLabel?: string
  ectopicOrigin?: { x: number; y: number; label: string } | null
  abnormalConduction?: boolean
  axisDeg?: number
  axisLabel?: string
}

const STAGES: { id: string; t: number; label: string }[] = [
  { id: 'sa', t: 0.0, label: 'Nó SA' },
  { id: 'atria', t: 0.06, label: 'Átrios' },
  { id: 'av', t: 0.22, label: 'Nó AV' },
  { id: 'his', t: 0.32, label: 'His' },
  { id: 'branches', t: 0.4, label: 'Ramos' },
  { id: 'purkinje', t: 0.48, label: 'Purkinje' },
  { id: 'ventricles', t: 0.56, label: 'Ventrículos' },
]

// caminho principal da despolarização (SA → átrios → AV → His → ramo esq → ápice do VE)
const COND_PATH = 'M 96 78 C 130 96 150 110 160 138 L 160 165 L 158 182 C 150 210 200 220 215 262'

const WALL_OVERLAY: Record<string, string> = {
  septal: 'M160 150 L160 250 L138 235 C120 205 128 168 150 140 Z',
  anterior: 'M150 140 C112 150 96 196 118 244 L160 250 L160 150 Z',
  inferior: 'M118 244 C140 286 168 300 172 314 L172 250 L160 250 Z',
  lateral: 'M172 250 L172 314 C210 292 236 250 244 214 L200 196 Z',
  posterior: 'M200 196 L244 214 C266 176 260 128 226 104 L188 150 Z',
  lv: 'M160 150 C210 158 244 196 236 250 C226 300 180 306 172 320 L160 150 Z',
  rv: 'M160 150 C120 150 92 196 108 246 C120 286 150 300 158 316 L160 150 Z',
}

/**
 * Esquema 2D animado do coração e do sistema de condução: frente de
 * despolarização luminosa que percorre o caminho em tempo real, câmaras que
 * acendem, realce pulsante de parede/artéria, vetor elétrico e linha do tempo.
 */
export function ConductionSystem({ rate, dark, highlightWalls = [], arteryLabel, ectopicOrigin, abnormalConduction, axisDeg, axisLabel }: Props) {
  const [activeStage, setActiveStage] = useState('sa')
  const progressRef = useRef<HTMLDivElement>(null)
  const pathRef = useRef<SVGPathElement>(null)
  const waveRef = useRef<SVGCircleElement>(null)
  const waveGlowRef = useRef<SVGCircleElement>(null)
  const laRef = useRef<SVGEllipseElement>(null)
  const raRef = useRef<SVGEllipseElement>(null)
  const lvRef = useRef<SVGPathElement>(null)
  const rvRef = useRef<SVGPathElement>(null)
  const beamRefs = { atria: useRef<SVGPathElement>(null), his: useRef<SVGLineElement>(null), lbb: useRef<SVGPathElement>(null), rbb: useRef<SVGPathElement>(null), pk: useRef<SVGGElement>(null) }
  const rafRef = useRef<number>(0)
  const startRef = useRef<number>(performance.now())
  const lastStage = useRef('sa')

  const uid = dark ? 'd' : 'l'

  useEffect(() => {
    const path = pathRef.current
    const len = path?.getTotalLength() ?? 0
    const cycleMs = () => 60000 / Math.max(30, rate || 60)
    const between = (p: number, a: number, b: number) => p >= a && p < b

    const loop = () => {
      const p = ((performance.now() - startRef.current) % cycleMs()) / cycleMs()
      // estágio ativo (throttled setState)
      let cur = STAGES[0].id
      for (const s of STAGES) if (p >= s.t) cur = s.id
      if (cur !== lastStage.current) { lastStage.current = cur; setActiveStage(cur) }
      if (progressRef.current) progressRef.current.style.width = `${Math.round(p * 100)}%`

      // frente de despolarização ao longo do caminho
      if (path && len > 0 && waveRef.current && waveGlowRef.current) {
        const visible = !abnormalConduction && p < 0.62
        const f = Math.min(1, Math.max(0, p / 0.56))
        const pt = path.getPointAtLength(len * f)
        for (const c of [waveRef.current, waveGlowRef.current]) { c.setAttribute('cx', String(pt.x)); c.setAttribute('cy', String(pt.y)); c.setAttribute('opacity', visible ? '1' : '0') }
      }

      const setOp = (el: SVGElement | null, on: boolean, base = 0.3, hi = 1) => { if (el) el.setAttribute('opacity', String(on ? hi : base)) }
      // feixes acendem em sequência
      setOp(beamRefs.atria.current, between(p, 0.06, 0.24) && !abnormalConduction, 0.25)
      setOp(beamRefs.his.current, between(p, 0.3, 0.42), 0.3)
      setOp(beamRefs.lbb.current, between(p, 0.38, 0.54), 0.3)
      setOp(beamRefs.rbb.current, between(p, 0.38, 0.54), 0.3)
      setOp(beamRefs.pk.current, between(p, 0.46, 0.62), 0.25)

      // câmaras acendem
      const atriaGlow = between(p, 0.05, 0.22) && !abnormalConduction
      const ventGlow = between(p, 0.44, 0.72)
      const squeeze = ventGlow ? Math.sin(((p - 0.44) / 0.28) * Math.PI) : 0
      if (laRef.current) laRef.current.setAttribute('fill-opacity', String(atriaGlow ? 0.55 : 0.14))
      if (raRef.current) raRef.current.setAttribute('fill-opacity', String(atriaGlow ? 0.55 : 0.14))
      if (lvRef.current) lvRef.current.setAttribute('fill-opacity', String(0.12 + 0.5 * squeeze))
      if (rvRef.current) rvRef.current.setAttribute('fill-opacity', String(0.12 + 0.5 * squeeze))

      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [rate, abnormalConduction])

  const stroke = dark ? '#2a7a52' : '#c07a7a'
  const cond = dark ? '#3ff0a0' : '#12b06a'
  const wall = (w: WallKey) => highlightWalls.includes(w)
  const vec = typeof axisDeg === 'number'
  const vx = vec ? 160 + Math.cos((axisDeg! * Math.PI) / 180) * 70 : 0
  const vy = vec ? 190 - Math.sin((axisDeg! * Math.PI) / 180) * 70 : 0

  return (
    <div className="flex flex-col items-center gap-3">
      <svg viewBox="0 0 340 360" className="w-full max-w-[340px]" role="img" aria-label="Sistema de condução cardíaco animado">
        <defs>
          <radialGradient id={`bg-${uid}`} cx="50%" cy="42%" r="60%">
            <stop offset="0%" stopColor={dark ? '#12211b' : '#eef4f2'} />
            <stop offset="100%" stopColor={dark ? '#070f0c' : '#dbe6e2'} />
          </radialGradient>
          <radialGradient id={`lv-${uid}`} cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#ff6a6a" /><stop offset="100%" stopColor="#a52c2c" />
          </radialGradient>
          <radialGradient id={`rv-${uid}`} cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#f07ea0" /><stop offset="100%" stopColor="#933a5c" />
          </radialGradient>
          <radialGradient id={`atr-${uid}`} cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#ff8a8a" /><stop offset="100%" stopColor="#b14b4b" />
          </radialGradient>
          <filter id={`glow-${uid}`} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="3.2" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id={`soft-${uid}`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>

        <rect x="0" y="0" width="340" height="360" rx="16" fill={`url(#bg-${uid})`} />

        {/* silhueta do coração */}
        <path d="M170 66 C126 22 44 44 44 138 C44 226 128 286 172 330 C216 286 296 226 296 138 C296 44 214 22 170 66 Z"
          fill={dark ? 'rgba(20,40,32,0.5)' : 'rgba(255,246,246,0.6)'} stroke={stroke} strokeWidth={2} />

        {/* câmaras */}
        <path ref={rvRef} d={WALL_OVERLAY.rv} fill={`url(#rv-${uid})`} fillOpacity={0.14} stroke={dark ? 'rgba(240,126,160,0.25)' : 'rgba(147,58,92,0.25)'} />
        <path ref={lvRef} d={WALL_OVERLAY.lv} fill={`url(#lv-${uid})`} fillOpacity={0.14} stroke={dark ? 'rgba(255,106,106,0.25)' : 'rgba(165,44,44,0.25)'} />
        <ellipse ref={raRef} cx="118" cy="100" rx="42" ry="36" fill={`url(#atr-${uid})`} fillOpacity={0.14} transform="rotate(-12 118 100)" />
        <ellipse ref={laRef} cx="210" cy="98" rx="40" ry="34" fill={`url(#atr-${uid})`} fillOpacity={0.14} transform="rotate(12 210 98)" />

        {/* grandes vasos */}
        <path d="M164 70 C160 40 176 30 190 44" fill="none" stroke={dark ? '#c9c2b8' : '#b9b0a4'} strokeWidth={9} strokeLinecap="round" opacity={0.5} />
        <path d="M150 74 C138 46 120 44 112 62" fill="none" stroke={dark ? '#93a8c8' : '#8296b6'} strokeWidth={8} strokeLinecap="round" opacity={0.5} />

        {/* realce de paredes (IAM) */}
        {(['septal', 'anterior', 'inferior', 'lateral', 'posterior', 'rv'] as WallKey[]).map((w) => wall(w) && (
          <path key={w} d={WALL_OVERLAY[w]} fill="#ef4444" stroke="#ff6b6b" strokeWidth={1.5} className="ecg-wall-pulse" />
        ))}

        {/* artérias coronárias */}
        <Coronary d="M162 92 C156 150 160 210 176 262" label="da" arteryLabel={arteryLabel} baseColor="#7a2a2a" uid={uid} />
        <Coronary d="M206 96 C240 120 250 176 232 226" label="cx" arteryLabel={arteryLabel} baseColor="#7a2a2a" uid={uid} />
        <Coronary d="M120 96 C86 128 92 190 116 244" label="cd" arteryLabel={arteryLabel} baseColor="#7a2a2a" uid={uid} />

        {/* sistema de condução (feixes) */}
        <path ref={beamRefs.atria} d="M96 78 C130 96 150 110 160 138" fill="none" stroke={cond} strokeWidth={3} strokeLinecap="round" opacity={0.25} filter={`url(#glow-${uid})`} />
        <line ref={beamRefs.his} x1={160} y1={140} x2={158} y2={168} stroke={cond} strokeWidth={4} strokeLinecap="round" opacity={0.3} filter={`url(#glow-${uid})`} />
        <path ref={beamRefs.lbb} d="M158 168 C150 200 190 210 214 258" fill="none" stroke={cond} strokeWidth={3} strokeLinecap="round" opacity={0.3} filter={`url(#glow-${uid})`} />
        <path ref={beamRefs.rbb} d="M158 168 C140 200 120 214 116 250" fill="none" stroke={cond} strokeWidth={3} strokeLinecap="round" opacity={0.3} filter={`url(#glow-${uid})`} />
        <g ref={beamRefs.pk} opacity={0.25} filter={`url(#glow-${uid})`}>
          <path d="M214 258 l14 16 M214 258 l-8 20 M116 250 l-12 18 M116 250 l10 20" fill="none" stroke={cond} strokeWidth={2} strokeLinecap="round" />
        </g>

        {/* caminho invisível que a frente percorre */}
        <path ref={pathRef} d={COND_PATH} fill="none" stroke="none" />

        {/* nós SA e AV */}
        <circle cx={96} cy={78} r={7} fill={cond} filter={`url(#glow-${uid})`}>
          <animate attributeName="r" values="6;9;6" dur="1.1s" repeatCount="indefinite" />
        </circle>
        <circle cx={160} cy={140} r={6} fill={abnormalConduction ? stroke : cond} filter={`url(#glow-${uid})`} opacity={abnormalConduction ? 0.4 : 1} />

        {/* frente de despolarização */}
        <circle ref={waveGlowRef} cx={96} cy={78} r={12} fill="#eafff6" opacity={0} filter={`url(#soft-${uid})`} />
        <circle ref={waveRef} cx={96} cy={78} r={5} fill="#ffffff" opacity={0} />

        {/* origem ectópica */}
        {ectopicOrigin && (
          <g>
            <circle cx={44 + ectopicOrigin.x * 252} cy={40 + ectopicOrigin.y * 276} r={10} fill="none" stroke="#f59e0b" strokeWidth={2}>
              <animate attributeName="r" values="7;15;7" dur="1s" repeatCount="indefinite" />
            </circle>
            <circle cx={44 + ectopicOrigin.x * 252} cy={40 + ectopicOrigin.y * 276} r={5} fill="#f59e0b" filter={`url(#glow-${uid})`} />
          </g>
        )}

        {/* vetor elétrico */}
        {vec && (
          <g>
            <line x1={160} y1={190} x2={vx} y2={vy} stroke="#38bdf8" strokeWidth={3} markerEnd={`url(#vhead-${uid})`} opacity={0.9} filter={`url(#glow-${uid})`} />
            <circle cx={160} cy={190} r={3.5} fill="#38bdf8" />
          </g>
        )}
        <defs>
          <marker id={`vhead-${uid}`} markerWidth="8" markerHeight="8" refX="5" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 z" fill="#38bdf8" /></marker>
        </defs>

        <text x={80} y={74} fontSize={9} fontWeight={700} fill={dark ? '#7fe6a5' : '#127a4a'}>SA</text>
        <text x={168} y={138} fontSize={9} fontWeight={700} fill={dark ? '#7fe6a5' : '#127a4a'}>AV</text>
      </svg>

      {/* linha do tempo */}
      <div className="w-full max-w-[340px]">
        <div className="mb-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div ref={progressRef} className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-sky-400" style={{ width: '0%' }} />
        </div>
        <div className="flex flex-wrap justify-center gap-1.5">
          {STAGES.map((s) => (
            <span key={s.id} className={`rounded-md px-2 py-0.5 text-[10px] font-bold transition-colors ${activeStage === s.id ? 'bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.5)]' : dark ? 'bg-white/[0.06] text-muted-foreground' : 'bg-black/[0.05] text-muted-foreground'}`}>{s.label}</span>
          ))}
        </div>
      </div>

      {vec && (
        <div className="flex items-center gap-1.5 rounded-lg border border-sky-400/40 bg-sky-500/10 px-3 py-1.5 text-center text-xs font-bold text-sky-600 dark:text-sky-300">
          <span className="inline-block h-2 w-2 rounded-full bg-sky-400" /> Vetor elétrico: {Math.round(axisDeg!)}°{axisLabel ? ` · ${axisLabel}` : ''}
        </div>
      )}
      {arteryLabel && (
        <div className="rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-1.5 text-center text-xs font-bold text-red-500 dark:text-red-300">Artéria culpada provável: {arteryLabel}</div>
      )}
      {ectopicOrigin && (
        <div className="rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-1.5 text-center text-xs font-bold text-amber-600 dark:text-amber-300">Origem: {ectopicOrigin.label}</div>
      )}
    </div>
  )
}

function Coronary({ d, label, arteryLabel, baseColor, uid }: { d: string; label: string; arteryLabel?: string; baseColor: string; uid: string }) {
  const keys: Record<string, string[]> = { da: ['descendente anterior', 'da', 'lad', 'diagonal'], cx: ['circunflexa', 'cx', 'marginal'], cd: ['direita', 'cd', 'rca'] }
  const al = (arteryLabel || '').toLowerCase()
  const hit = !!arteryLabel && (keys[label] || []).some((k) => al.includes(k))
  return (
    <path d={d} fill="none" stroke={hit ? '#ff4444' : baseColor} strokeWidth={hit ? 3.4 : 2} strokeLinecap="round"
      opacity={hit ? 0.95 : 0.5} filter={hit ? `url(#glow-${uid})` : undefined} className={hit ? 'ecg-wall-pulse' : ''} />
  )
}

export type { WallKey }
