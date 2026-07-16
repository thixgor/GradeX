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
const INTERVAL_NAMES: Record<string, string> = {
  'Pon>Qon': 'PR', 'Qon>Pon': 'PR',
  'Qon>J': 'QRS', 'J>Qon': 'QRS',
  'Qon>Tend': 'QT', 'Tend>Qon': 'QT',
  'R>R': 'RR',
  'Pon>Poff': 'onda P', 'Poff>Pon': 'onda P',
}
const KIND_COLOR: Record<FiducialKind, string> = {
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
  fiducials,
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
  const snapOn = calipers && !live && !!fiducials && fiducials.length > 0
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
    drawTrace(ctx, signal, fs, cfg, {
      x0, width: width - x0, baselineY, startMs: offsetMs, lineWidth: 1.7 + zoom * 0.15,
    })
    if (label) drawLeadLabel(ctx, label, x0 + 4, 6, theme)

    // linha de varredura no modo monitor
    if (live) {
      const visMs = visibleDurationMs(width - x0, cfg)
      const sweepX = x0 + ((offsetMs % visMs) / visMs) * (width - x0)
      ctx.fillStyle = dark ? 'rgba(63,240,138,0.10)' : 'rgba(0,0,0,0.05)'
      ctx.fillRect(sweepX, 0, 22, height)
    }

    // overlay didático (anatomia do ECG)
    if (teaching) drawTeaching(ctx, signal, fs, cfg, { x0, width: width - x0, baselineY, startMs: offsetMs })

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
  }, [width, height, cfg, signal, fs, label, live, showCalibration, pxPerMm, pxPerMs, x0, theme, zoom, teaching, caliper, snapOn, fiducials, dark])

  // loop de animação (monitor) ou render único (estático)
  useEffect(() => {
    if (live) {
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
  }, [live, render])

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

/** Sobrepõe setas/legendas apontando P, PR, QRS, ST, ponto J, QT e T no primeiro batimento visível. */
function drawTeaching(
  ctx: CanvasRenderingContext2D,
  signal: Float32Array,
  fs: number,
  cfg: RenderConfig,
  o: { x0: number; width: number; baselineY: number; startMs: number },
) {
  const pxPerMs = (cfg.speedMmS * cfg.pxPerMm) / 1000
  // detecta o R mais proeminente na janela para ancorar as legendas
  const dt = 1000 / fs
  let rIdxPx = -1, rVal = -Infinity
  for (let px = 0; px < o.width; px++) {
    const tMs = o.startMs + px / pxPerMs
    let idx = Math.floor(tMs / dt)
    idx = ((idx % signal.length) + signal.length) % signal.length
    if (signal[idx] > rVal) { rVal = signal[idx]; rIdxPx = px }
  }
  if (rIdxPx < 0) return
  const rx = o.x0 + rIdxPx
  const items: { label: string; dxMs: number; color: string }[] = [
    { label: 'P', dxMs: -170, color: '#38bdf8' },
    { label: 'PR', dxMs: -110, color: '#a78bfa' },
    { label: 'QRS', dxMs: 0, color: '#f472b6' },
    { label: 'ponto J', dxMs: 55, color: '#fbbf24' },
    { label: 'ST', dxMs: 110, color: '#34d399' },
    { label: 'T', dxMs: 250, color: '#fb923c' },
  ]
  ctx.font = 'bold 10px ui-sans-serif, system-ui'
  for (const it of items) {
    const x = rx + it.dxMs * pxPerMs
    if (x < o.x0 || x > o.x0 + o.width) continue
    ctx.strokeStyle = it.color
    ctx.fillStyle = it.color
    ctx.lineWidth = 1.2
    ctx.setLineDash([2, 2])
    ctx.beginPath(); ctx.moveTo(x, 22); ctx.lineTo(x, o.baselineY - 6); ctx.stroke()
    ctx.setLineDash([])
    ctx.fillRect(x - 14, 8, 28, 13)
    ctx.fillStyle = '#000'
    ctx.textAlign = 'center'
    ctx.fillText(it.label, x, 18)
    ctx.fillStyle = it.color
    ctx.textAlign = 'left'
  }
}
