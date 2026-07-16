'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import {
  drawGrid, drawTrace, drawLeadLabel, drawCalibration, visibleDurationMs,
  ECG_THEME_DARK, ECG_THEME_LIGHT, type RenderConfig,
} from '@/lib/ecg/render'
import type { LeadName } from '@/lib/ecg/engine'

export type FiducialKind = 'Pon' | 'Poff' | 'Qon' | 'J' | 'Tend' | 'R'

/** Ponto fiducial em ms (tempo absoluto no sinal) para o paquímetro "grudar". */
export interface Fiducial { ms: number; kind: FiducialKind }

interface Caliper {
  active: boolean
  x1: number | null
  x2: number | null
  k1: FiducialKind | null
  k2: FiducialKind | null
}

// pares de fiduciais que formam um intervalo clínico nomeado
export const INTERVAL_NAMES: Record<string, string> = {
  'Pon>Qon': 'PR', 'Qon>Pon': 'PR',
  'Qon>J': 'QRS', 'J>Qon': 'QRS',
  'Qon>Tend': 'QT', 'Tend>Qon': 'QT',
  'R>R': 'RR',
  'Pon>Poff': 'onda P', 'Poff>Pon': 'onda P',
}
export const KIND_COLOR: Record<FiducialKind, string> = {
  Pon: '#38bdf8', Poff: '#38bdf8', Qon: '#f472b6', J: '#fbbf24', Tend: '#fb923c', R: '#e5e7eb',
}

interface Props {
  signal: Float32Array
  fs: number
  lead: LeadName
  label?: string
  speedMmS: number
  gainMmMv: number
  zoom: number
  dark: boolean
  live: boolean
  height?: number
  showCalibration?: boolean
  calipers?: boolean
  onMeasure?: (ms: number, mv: number | null) => void
  teaching?: boolean
  /** pontos fiduciais (ms) para o paquímetro grudar; só ativos em modo estático */
  fiducials?: Fiducial[]
  /** traçado de referência (ECG normal) sobreposto em azul para comparação */
  compareSignal?: Float32Array | null
}

const BASE_PX_PER_MM = 4

/**
 * Uma derivação renderizada em <canvas> com papel milimetrado.
 * Suporta modo estático, modo monitor (varredura contínua D→E), régua/calipers
 * e overlay didático (anatomia do ECG).
 */
export function EcgLeadCanvas({
  signal, fs, lead, label, speedMmS, gainMmMv, zoom, dark, live,
  height = 140, showCalibration = false, calipers = false, onMeasure, teaching = false,
  fiducials, compareSignal,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>(0)
  const startRef = useRef<number>(0)
  const [width, setWidth] = useState(600)
  const [caliper, setCaliper] = useState<Caliper>({ active: false, x1: null, x2: null, k1: null, k2: null })

  const theme = dark ? ECG_THEME_DARK : ECG_THEME_LIGHT
  const pxPerMm = BASE_PX_PER_MM * zoom
  const cfg: RenderConfig = { pxPerMm, speedMmS, gainMmMv, theme }
  const pxPerMs = (speedMmS * pxPerMm) / 1000
  // A anatomia congela o traçado (estático) para as legendas ficarem legíveis e
  // sem tremulação — não faz sentido rotular P/QRS/T num traçado que corre.
  const animate = live && !teaching
  const snapOn = calipers && !animate && !!fiducials && fiducials.length > 0
  // x0 (offset esquerdo) coerente com o render: reserva espaço p/ a barra de calibração
  const x0 = showCalibration ? pxPerMm * 6 : 6

  // responsivo: acompanha a largura do container
  useEffect(() => {
    if (!wrapRef.current) return
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) setWidth(Math.max(240, Math.floor(e.contentRect.width)))
    })
    ro.observe(wrapRef.current)
    return () => ro.disconnect()
  }, [])

  const render = useCallback((offsetMs: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr
      canvas.height = height * dpr
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    drawGrid(ctx, width, height, cfg)
    const baselineY = height * 0.58
    let x0 = 6
    if (showCalibration) {
      drawCalibration(ctx, 4, baselineY, cfg)
      x0 = pxPerMm * 6
    }
    // traçado de referência (ECG normal) sobreposto em azul
    if (compareSignal) {
      drawTrace(ctx, compareSignal, fs, cfg, {
        x0, width: width - x0, baselineY, startMs: offsetMs,
        color: dark ? 'rgba(120,160,255,0.55)' : 'rgba(60,90,200,0.45)', lineWidth: 1.3,
      })
    }
    drawTrace(ctx, signal, fs, cfg, {
      x0, width: width - x0, baselineY, startMs: offsetMs, lineWidth: 1.7 + zoom * 0.15,
    })
    if (label) drawLeadLabel(ctx, label, x0 + 4, 6, theme)

    // linha de varredura no modo monitor
    if (animate) {
      const visMs = visibleDurationMs(width - x0, cfg)
      const sweepX = x0 + ((offsetMs % visMs) / visMs) * (width - x0)
      ctx.fillStyle = dark ? 'rgba(63,240,138,0.10)' : 'rgba(0,0,0,0.05)'
      ctx.fillRect(sweepX, 0, 22, height)
    }

    // overlay didático (anatomia do ECG) — estático, ancorado nos pontos fiduciais
    if (teaching) drawTeaching(ctx, { x0, width: width - x0, baselineY, height, theme, dark, pxPerMs, fiducials })

    // marcadores fiduciais (pontos onde o paquímetro "gruda") — modo estático
    if (snapOn && fiducials) {
      for (const f of fiducials) {
        const fx = x0 + f.ms * pxPerMs
        if (fx < x0 || fx > width) continue
        ctx.strokeStyle = KIND_COLOR[f.kind]
        ctx.globalAlpha = 0.35
        ctx.lineWidth = 1
        ctx.setLineDash([1, 3])
        ctx.beginPath(); ctx.moveTo(fx, 0); ctx.lineTo(fx, height); ctx.stroke()
        ctx.globalAlpha = 1
        ctx.setLineDash([])
      }
    }

    // régua
    if (caliper.x1 != null) {
      ctx.strokeStyle = '#22d3ee'
      ctx.lineWidth = 1.2
      ctx.setLineDash([4, 3])
      ctx.beginPath(); ctx.moveTo(caliper.x1, 0); ctx.lineTo(caliper.x1, height); ctx.stroke()
      if (caliper.x2 != null) {
        ctx.beginPath(); ctx.moveTo(caliper.x2, 0); ctx.lineTo(caliper.x2, height); ctx.stroke()
        ctx.setLineDash([])
        const dtMs = Math.abs(caliper.x2 - caliper.x1) / pxPerMs
        const midX = (caliper.x1 + caliper.x2) / 2
        // se os dois cursores grudaram em fiduciais que formam um intervalo nomeado, rotula
        const name = caliper.k1 && caliper.k2 ? INTERVAL_NAMES[`${caliper.k1}>${caliper.k2}`] : undefined
        const bpm = name === 'RR' && dtMs > 0 ? ` · ${Math.round(60000 / dtMs)} bpm` : ''
        const txt = `${name ? name + ' ' : ''}${Math.round(dtMs)} ms${bpm}`
        ctx.font = 'bold 11px ui-monospace, monospace'
        const w = ctx.measureText(txt).width + 14
        ctx.fillStyle = '#22d3ee'
        ctx.fillRect(midX - w / 2, 2, w, 18)
        ctx.fillStyle = '#00131a'
        ctx.textAlign = 'center'
        ctx.fillText(txt, midX, 15)
        ctx.textAlign = 'left'
      }
      ctx.setLineDash([])
    }
  }, [width, height, cfg, signal, compareSignal, fs, label, animate, showCalibration, pxPerMm, pxPerMs, x0, theme, zoom, teaching, caliper, snapOn, fiducials, dark])

  // loop de animação (monitor) ou render único (estático/anatomia)
  useEffect(() => {
    if (animate) {
      startRef.current = performance.now()
      const loop = () => {
        const elapsed = performance.now() - startRef.current
        render(elapsed)
        rafRef.current = requestAnimationFrame(loop)
      }
      rafRef.current = requestAnimationFrame(loop)
      return () => cancelAnimationFrame(rafRef.current)
    }
    render(0)
  }, [animate, render])

  // interação da régua — com "grude" (snap) aos pontos fiduciais em modo estático
  const handlePointer = useCallback((e: React.PointerEvent) => {
    if (!calipers) return
    const rect = canvasRef.current!.getBoundingClientRect()
    const rawX = e.clientX - rect.left
    // procura o fiducial mais próximo dentro de ~9px e "gruda" o cursor nele
    let x = rawX, kind: FiducialKind | null = null
    if (snapOn && fiducials) {
      let best = 9
      for (const f of fiducials) {
        const fx = x0 + f.ms * pxPerMs
        const d = Math.abs(fx - rawX)
        if (d < best) { best = d; x = fx; kind = f.kind }
      }
    }
    setCaliper((c) => {
      if (c.x1 == null || c.x2 != null) return { active: true, x1: x, x2: null, k1: kind, k2: null }
      return { active: true, x1: c.x1, x2: x, k1: c.k1, k2: kind }
    })
  }, [calipers, snapOn, fiducials, x0, pxPerMs])

  return (
    <div ref={wrapRef} className="relative w-full overflow-hidden rounded-lg" style={{ touchAction: 'none' }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height, display: 'block', cursor: calipers ? 'crosshair' : 'default' }}
        onPointerDown={handlePointer}
      />
      {calipers && caliper.x1 != null && (
        <button
          onClick={() => setCaliper({ active: false, x1: null, x2: null, k1: null, k2: null })}
          className="absolute right-2 top-2 rounded-md bg-black/60 px-2 py-1 text-[10px] font-bold text-white hover:bg-black/80"
        >
          Limpar régua
        </button>
      )}
    </div>
  )
}

/**
 * Anatomia do ECG: ancorada nos PONTOS FIDUCIAIS reais (não numa heurística de
 * pico) e desenhada em modo estático — estável, sem tremulação. Rotula as ondas
 * (P, QRS, ST, T) acima do traçado, em duas fileiras alternadas para não se
 * sobreporem, e os intervalos (PR, QT) como colchetes abaixo da linha de base.
 */
function drawTeaching(
  ctx: CanvasRenderingContext2D,
  o: {
    x0: number; width: number; baselineY: number; height: number
    theme: { text: string }; dark: boolean; pxPerMs: number; fiducials?: Fiducial[]
  },
) {
  const { x0, width, baselineY, height, pxPerMs, dark, fiducials } = o
  if (!fiducials || fiducials.length === 0) return
  const toX = (ms: number) => x0 + ms * pxPerMs
  const visEndMs = width / pxPerMs

  // escolhe o primeiro batimento com espaço para rotular P antes e T depois
  const rList = fiducials.filter((f) => f.kind === 'R').map((f) => f.ms).sort((a, b) => a - b)
  let rms: number | null = null
  for (const r of rList) { if (r > 260 && toX(r) < x0 + width - 60) { rms = r; break } }
  if (rms == null) return
  const near = (kind: FiducialKind, lo: number, hi: number): number | null => {
    let best: number | null = null, bd = Infinity
    for (const f of fiducials) if (f.kind === kind) { const d = f.ms - rms!; if (d >= lo && d <= hi && Math.abs(d) < bd) { bd = Math.abs(d); best = f.ms } }
    return best
  }
  const pOn = near('Pon', -340, -40)
  const qOn = near('Qon', -90, 20) ?? rms - 40
  const j = near('J', -10, 160) ?? rms + 45
  const tEnd = near('Tend', 60, 560)

  // ── colchetes de intervalo abaixo da linha de base ──
  const bracket = (a: number | null, b: number | null, label: string, color: string, level: number) => {
    if (a == null || b == null) return
    const xa = toX(a), xb = toX(b)
    if (xb <= xa) return
    const y = Math.min(height - 4, baselineY + 16 + level * 15)
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 1.2; ctx.setLineDash([])
    ctx.beginPath()
    ctx.moveTo(xa, y - 4); ctx.lineTo(xa, y); ctx.lineTo(xb, y); ctx.lineTo(xb, y - 4); ctx.stroke()
    ctx.font = 'bold 10px ui-sans-serif, system-ui'
    const tw = ctx.measureText(label).width
    const mid = (xa + xb) / 2
    ctx.fillStyle = dark ? '#0a0f0d' : '#fff5f5'
    ctx.fillRect(mid - tw / 2 - 3, y + 1, tw + 6, 12)
    ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'top'
    ctx.fillText(label, mid, y + 2)
    ctx.textAlign = 'left'
  }
  bracket(pOn, qOn, 'PR', '#a78bfa', 0)
  bracket(qOn, tEnd, 'QT', '#34d399', 1)

  // ── rótulos das ondas acima do traçado (duas fileiras alternadas) ──
  // extensão aproximada da onda P (não temos Poff nos fiduciais): ~100 ms a partir de Pon
  const pEnd = pOn != null ? Math.min(pOn + 100, qOn) : null
  const waves: { label: string; a: number | null; b: number | null; color: string }[] = [
    { label: 'P', a: pOn, b: pEnd, color: '#38bdf8' },
    { label: 'QRS', a: qOn, b: j, color: '#f472b6' },
    { label: 'ST', a: j, b: tEnd != null ? (j + tEnd) / 2 : null, color: '#fbbf24' },
    { label: 'T', a: tEnd != null ? (j + tEnd) / 2 : null, b: tEnd, color: '#fb923c' },
  ]
  ctx.font = 'bold 10px ui-sans-serif, system-ui'
  waves.forEach((w, i) => {
    if (w.a == null || w.b == null) return
    const mid = toX((w.a + w.b) / 2)
    if (mid < x0 || mid > x0 + width) return
    const rowY = i % 2 === 0 ? 4 : 19
    const tw = ctx.measureText(w.label).width
    // linha-guia da etiqueta até o traçado
    ctx.strokeStyle = w.color; ctx.globalAlpha = 0.55; ctx.lineWidth = 1; ctx.setLineDash([2, 2])
    ctx.beginPath(); ctx.moveTo(mid, rowY + 13); ctx.lineTo(mid, baselineY - 4); ctx.stroke()
    ctx.setLineDash([]); ctx.globalAlpha = 1
    ctx.fillStyle = w.color
    ctx.fillRect(mid - tw / 2 - 4, rowY, tw + 8, 13)
    ctx.fillStyle = dark ? '#0a0f0d' : '#fff5f5'
    ctx.textAlign = 'center'; ctx.textBaseline = 'top'
    ctx.fillText(w.label, mid, rowY + 2)
    ctx.textAlign = 'left'
  })
}
