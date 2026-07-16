'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import {
  drawGrid, drawTrace, drawLeadLabel, drawCalibration,
  ECG_THEME_DARK, ECG_THEME_LIGHT, STANDARD_12_LAYOUT, type RenderConfig,
} from '@/lib/ecg/render'
import { LEADS, type LeadName } from '@/lib/ecg/engine'
import { INTERVAL_NAMES, KIND_COLOR, type Fiducial, type FiducialKind } from './ecg-lead-canvas'

interface Props {
  signals: Record<LeadName, Float32Array>
  fs: number
  speedMmS: number
  gainMmMv: number
  zoom: number
  dark: boolean
  live: boolean
  rhythmLead?: LeadName
  compareSignals?: Record<LeadName, Float32Array> | null
  calipers?: boolean
  fiducials?: Fiducial[]
}

interface Caliper { x1: number | null; x2: number | null; k1: FiducialKind | null; k2: FiducialKind | null }

const BASE_PX_PER_MM = 4

/**
 * Layout hospitalar padrão de 12 derivações: 3 linhas × 4 colunas
 * (I,aVR,V1,V4 / II,aVL,V2,V5 / III,aVF,V3,V6) + tira de ritmo (DII) embaixo.
 * Cada célula mostra ~2,5 s. Papel milimetrado contínuo por trás.
 */
export function Ecg12Lead({ signals, fs, speedMmS, gainMmMv, zoom, dark, live, rhythmLead = 'II', compareSignals, calipers = false, fiducials }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>(0)
  const startRef = useRef<number>(0)
  const [width, setWidth] = useState(760)
  const [caliper, setCaliper] = useState<Caliper>({ x1: null, x2: null, k1: null, k2: null })

  const theme = dark ? ECG_THEME_DARK : ECG_THEME_LIGHT
  const pxPerMm = BASE_PX_PER_MM * zoom
  const cfg: RenderConfig = { pxPerMm, speedMmS, gainMmMv, theme }

  const rows = STANDARD_12_LAYOUT.length
  const cols = STANDARD_12_LAYOUT[0].length
  const rowH = 96 * Math.max(1, zoom * 0.9)
  const rhythmH = 96 * Math.max(1, zoom * 0.9)
  const totalH = rows * rowH + rhythmH + 12

  // geometria da tira de ritmo (onde a régua opera — traçado contínuo de DII)
  const pxPerMs = (speedMmS * pxPerMm) / 1000
  const stripX0 = pxPerMm * 6
  const stripY = rows * rowH + 12
  // régua só no modo estático (a tira corre no modo monitor)
  const snapOn = calipers && !live && !!fiducials && fiducials.length > 0

  useEffect(() => {
    if (!wrapRef.current) return
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) setWidth(Math.max(320, Math.floor(e.contentRect.width)))
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
    if (canvas.width !== width * dpr || canvas.height !== totalH * dpr) {
      canvas.width = width * dpr
      canvas.height = totalH * dpr
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    drawGrid(ctx, width, totalH, cfg)

    const colW = width / cols
    // cada coluna mostra uma janela temporal sequencial (como no ECG real)
    const winMs = 2500

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const lead = STANDARD_12_LAYOUT[r][c]
        const baselineY = r * rowH + rowH * 0.5
        const x0 = c * colW + (c === 0 ? 4 : 2)
        const cellW = colW - 4
        const startMs = live ? offsetMs + c * winMs : c * winMs
        // separador vertical entre colunas
        if (c > 0) {
          ctx.strokeStyle = theme.text
          ctx.globalAlpha = 0.35
          ctx.lineWidth = 1
          ctx.beginPath(); ctx.moveTo(c * colW, r * rowH + 8); ctx.lineTo(c * colW, r * rowH + rowH - 8); ctx.stroke()
          ctx.globalAlpha = 1
        }
        if (compareSignals) {
          drawTrace(ctx, compareSignals[lead], fs, cfg, { x0, width: cellW, baselineY, startMs, color: dark ? 'rgba(120,160,255,0.5)' : 'rgba(60,90,200,0.4)', lineWidth: 1.3 })
        }
        drawTrace(ctx, signals[lead], fs, cfg, { x0, width: cellW, baselineY, startMs, lineWidth: 1.6 + zoom * 0.1 })
        drawLeadLabel(ctx, lead, x0 + 3, r * rowH + 5, theme)
      }
    }

    // tira de ritmo (DII) — largura total, janela longa
    const rhythmY = rows * rowH + 12
    const rBaseline = rhythmY + rhythmH * 0.5
    drawCalibration(ctx, 4, rBaseline, cfg)
    drawTrace(ctx, signals[rhythmLead], fs, cfg, {
      x0: pxPerMm * 6, width: width - pxPerMm * 6 - 4, baselineY: rBaseline, startMs: live ? offsetMs : 0, lineWidth: 1.7 + zoom * 0.1,
    })
    drawLeadLabel(ctx, `${rhythmLead} (ritmo)`, pxPerMm * 6 + 4, rhythmY + 4, theme)

    if (live) {
      // varredura na tira de ritmo
      const rW = width - pxPerMm * 6 - 4
      const visMs = rW / pxPerMs
      const sweepX = pxPerMm * 6 + ((offsetMs % visMs) / visMs) * rW
      ctx.fillStyle = dark ? 'rgba(63,240,138,0.10)' : 'rgba(0,0,0,0.05)'
      ctx.fillRect(sweepX, rhythmY, 22, rhythmH)
    }

    // ── régua na tira de ritmo (modo estático) ──
    if (snapOn && fiducials) {
      for (const f of fiducials) {
        const fx = stripX0 + f.ms * pxPerMs
        if (fx < stripX0 || fx > width - 4) continue
        ctx.strokeStyle = KIND_COLOR[f.kind]; ctx.globalAlpha = 0.4; ctx.lineWidth = 1; ctx.setLineDash([1, 3])
        ctx.beginPath(); ctx.moveTo(fx, rhythmY); ctx.lineTo(fx, rhythmY + rhythmH); ctx.stroke()
        ctx.globalAlpha = 1; ctx.setLineDash([])
      }
    }
    if (calipers && caliper.x1 != null) {
      const yTop = rhythmY, yBot = rhythmY + rhythmH
      ctx.strokeStyle = '#22d3ee'; ctx.lineWidth = 1.2; ctx.setLineDash([4, 3])
      ctx.beginPath(); ctx.moveTo(caliper.x1, yTop); ctx.lineTo(caliper.x1, yBot); ctx.stroke()
      if (caliper.x2 != null) {
        ctx.beginPath(); ctx.moveTo(caliper.x2, yTop); ctx.lineTo(caliper.x2, yBot); ctx.stroke()
        ctx.setLineDash([])
        const dtMs = Math.abs(caliper.x2 - caliper.x1) / pxPerMs
        const midX = (caliper.x1 + caliper.x2) / 2
        const name = caliper.k1 && caliper.k2 ? INTERVAL_NAMES[`${caliper.k1}>${caliper.k2}`] : undefined
        const bpm = name === 'RR' && dtMs > 0 ? ` · ${Math.round(60000 / dtMs)} bpm` : ''
        const txt = `${name ? name + ' ' : ''}${Math.round(dtMs)} ms${bpm}`
        ctx.font = 'bold 11px ui-monospace, monospace'
        const w = ctx.measureText(txt).width + 14
        ctx.fillStyle = '#22d3ee'; ctx.fillRect(midX - w / 2, yTop + 2, w, 18)
        ctx.fillStyle = '#00131a'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'
        ctx.fillText(txt, midX, yTop + 15); ctx.textAlign = 'left'
      }
      ctx.setLineDash([])
    }
  }, [width, totalH, cfg, signals, fs, cols, rows, rowH, rhythmH, live, rhythmLead, pxPerMm, pxPerMs, theme, dark, speedMmS, compareSignals, zoom, calipers, snapOn, fiducials, caliper, stripX0])

  useEffect(() => {
    if (live) {
      startRef.current = performance.now()
      const loop = () => {
        render(performance.now() - startRef.current)
        rafRef.current = requestAnimationFrame(loop)
      }
      rafRef.current = requestAnimationFrame(loop)
      return () => cancelAnimationFrame(rafRef.current)
    }
    render(0)
  }, [live, render])

  // régua: só ativa na tira de ritmo (traçado contínuo de DII), em modo estático
  const handlePointer = useCallback((e: React.PointerEvent) => {
    if (!calipers || live) return
    const rect = canvasRef.current!.getBoundingClientRect()
    const scale = rect.width / width
    const rawX = (e.clientX - rect.left) / scale
    const y = (e.clientY - rect.top) / scale
    if (y < stripY || y > stripY + rhythmH) return // clique fora da tira de ritmo
    let x = rawX, kind: FiducialKind | null = null
    if (snapOn && fiducials) {
      let best = 9
      for (const f of fiducials) {
        const fx = stripX0 + f.ms * pxPerMs
        const d = Math.abs(fx - rawX)
        if (d < best) { best = d; x = fx; kind = f.kind }
      }
    }
    setCaliper((c) => {
      if (c.x1 == null || c.x2 != null) return { x1: x, x2: null, k1: kind, k2: null }
      return { x1: c.x1, x2: x, k1: c.k1, k2: kind }
    })
  }, [calipers, live, snapOn, fiducials, width, stripY, rhythmH, stripX0, pxPerMs])

  return (
    <div ref={wrapRef} className="relative w-full overflow-hidden rounded-lg" style={{ touchAction: 'none' }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: totalH, display: 'block', cursor: calipers && !live ? 'crosshair' : 'default' }}
        onPointerDown={handlePointer}
      />
      {calipers && !live && (
        <div className="pointer-events-none absolute left-2 top-2 rounded-md bg-black/55 px-2 py-1 text-[10px] font-bold text-cyan-200">
          Régua na tira de ritmo (DII) ↓
        </div>
      )}
      {calipers && caliper.x1 != null && (
        <button
          onClick={() => setCaliper({ x1: null, x2: null, k1: null, k2: null })}
          className="absolute right-2 top-2 rounded-md bg-black/60 px-2 py-1 text-[10px] font-bold text-white hover:bg-black/80"
        >
          Limpar régua
        </button>
      )}
    </div>
  )
}

export { LEADS }
