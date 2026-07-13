'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import {
  drawGrid, drawTrace, drawLeadLabel, drawCalibration,
  ECG_THEME_DARK, ECG_THEME_LIGHT, STANDARD_12_LAYOUT, type RenderConfig,
} from '@/lib/ecg/render'
import { LEADS, type LeadName } from '@/lib/ecg/engine'

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
}

const BASE_PX_PER_MM = 4

/**
 * Layout hospitalar padrão de 12 derivações: 3 linhas × 4 colunas
 * (I,aVR,V1,V4 / II,aVL,V2,V5 / III,aVF,V3,V6) + tira de ritmo (DII) embaixo.
 * Cada célula mostra ~2,5 s. Papel milimetrado contínuo por trás.
 */
export function Ecg12Lead({ signals, fs, speedMmS, gainMmMv, zoom, dark, live, rhythmLead = 'II', compareSignals }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>(0)
  const startRef = useRef<number>(0)
  const [width, setWidth] = useState(760)

  const theme = dark ? ECG_THEME_DARK : ECG_THEME_LIGHT
  const pxPerMm = BASE_PX_PER_MM * zoom
  const cfg: RenderConfig = { pxPerMm, speedMmS, gainMmMv, theme }

  const rows = STANDARD_12_LAYOUT.length
  const cols = STANDARD_12_LAYOUT[0].length
  const rowH = 96 * Math.max(1, zoom * 0.9)
  const rhythmH = 96 * Math.max(1, zoom * 0.9)
  const totalH = rows * rowH + rhythmH + 12

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
      const pxPerMs = (speedMmS * pxPerMm) / 1000
      const rW = width - pxPerMm * 6 - 4
      const visMs = rW / pxPerMs
      const sweepX = pxPerMm * 6 + ((offsetMs % visMs) / visMs) * rW
      ctx.fillStyle = dark ? 'rgba(63,240,138,0.10)' : 'rgba(0,0,0,0.05)'
      ctx.fillRect(sweepX, rhythmY, 22, rhythmH)
    }
  }, [width, totalH, cfg, signals, fs, cols, rows, rowH, rhythmH, live, rhythmLead, pxPerMm, theme, dark, speedMmS, compareSignals, zoom])

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

  return (
    <div ref={wrapRef} className="w-full overflow-hidden rounded-lg">
      <canvas ref={canvasRef} style={{ width: '100%', height: totalH, display: 'block' }} />
    </div>
  )
}

export { LEADS }
