'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import {
  drawGrid, drawTrace, drawLeadLabel, drawCalibration, visibleDurationMs,
  ECG_THEME_DARK, ECG_THEME_LIGHT, type RenderConfig,
} from '@/lib/ecg/render'
import type { LeadName } from '@/lib/ecg/engine'

interface Caliper {
  active: boolean
  x1: number | null
  x2: number | null
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
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>(0)
  const startRef = useRef<number>(0)
  const [width, setWidth] = useState(600)
  const [caliper, setCaliper] = useState<Caliper>({ active: false, x1: null, x2: null })

  const theme = dark ? ECG_THEME_DARK : ECG_THEME_LIGHT
  const pxPerMm = BASE_PX_PER_MM * zoom
  const cfg: RenderConfig = { pxPerMm, speedMmS, gainMmMv, theme }

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

    // régua
    if (caliper.x1 != null) {
      ctx.strokeStyle = '#22d3ee'
      ctx.lineWidth = 1.2
      ctx.setLineDash([4, 3])
      ctx.beginPath(); ctx.moveTo(caliper.x1, 0); ctx.lineTo(caliper.x1, height); ctx.stroke()
      if (caliper.x2 != null) {
        ctx.beginPath(); ctx.moveTo(caliper.x2, 0); ctx.lineTo(caliper.x2, height); ctx.stroke()
        ctx.setLineDash([])
        const pxPerMs = (speedMmS * pxPerMm) / 1000
        const dtMs = Math.abs(caliper.x2 - caliper.x1) / pxPerMs
        const midX = (caliper.x1 + caliper.x2) / 2
        ctx.fillStyle = '#22d3ee'
        ctx.fillRect(midX - 34, 2, 68, 18)
        ctx.fillStyle = '#00131a'
        ctx.font = 'bold 11px ui-monospace, monospace'
        ctx.textAlign = 'center'
        ctx.fillText(`${Math.round(dtMs)} ms`, midX, 15)
        ctx.textAlign = 'left'
      }
      ctx.setLineDash([])
    }
  }, [width, height, cfg, signal, fs, label, live, showCalibration, pxPerMm, theme, zoom, teaching, caliper, speedMmS, dark])

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

  // interação da régua
  const handlePointer = useCallback((e: React.PointerEvent) => {
    if (!calipers) return
    const rect = canvasRef.current!.getBoundingClientRect()
    const x = e.clientX - rect.left
    setCaliper((c) => {
      if (c.x1 == null || c.x2 != null) return { active: true, x1: x, x2: null }
      return { active: true, x1: c.x1, x2: x }
    })
  }, [calipers])

  return (
    <div ref={wrapRef} className="relative w-full overflow-hidden rounded-lg" style={{ touchAction: 'none' }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height, display: 'block', cursor: calipers ? 'crosshair' : 'default' }}
        onPointerDown={handlePointer}
      />
      {calipers && caliper.x1 != null && (
        <button
          onClick={() => setCaliper({ active: false, x1: null, x2: null })}
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
