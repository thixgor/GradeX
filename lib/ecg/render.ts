/**
 * Renderização em <canvas> do papel milimetrado e dos traçados.
 * Funções puras (sem React) para desenhar exatamente como um eletrocardiógrafo:
 *  - papel: quadrículos de 1 mm e blocos de 5 mm, com espessuras distintas;
 *  - calibração 10 mm = 1 mV; velocidades 25/50/100 mm/s; ganhos 5/10/20 mm/mV;
 *  - traçado desenhado ponto a ponto a partir do sinal sintetizado (mV).
 */
import type { LeadName } from './engine'
import { ECG_PAPER_GREEN, ECG_PAPER_LIGHT, type EcgPaperPalette } from './paper'

export interface GridTheme {
  bg: string
  fine: string
  bold: string
  trace: string
  text: string
}

/** Converte a paleta compartilhada no formato que o <canvas> consome. */
export function gridThemeOf(p: EcgPaperPalette): GridTheme {
  return { bg: p.bg, fine: p.gridFine, bold: p.gridBold, trace: p.trace, text: p.ink }
}

export const ECG_THEME_LIGHT: GridTheme = gridThemeOf(ECG_PAPER_LIGHT)
export const ECG_THEME_DARK: GridTheme = gridThemeOf(ECG_PAPER_GREEN)

export interface RenderConfig {
  pxPerMm: number       // pixels por milímetro (zoom base × zoom do usuário)
  speedMmS: number      // 25 | 50 | 100
  gainMmMv: number      // 5 | 10 | 20
  theme: GridTheme
}

/** Desenha o papel milimetrado do ECG. */
export function drawGrid(ctx: CanvasRenderingContext2D, w: number, h: number, cfg: RenderConfig) {
  const { pxPerMm, theme } = cfg
  ctx.fillStyle = theme.bg
  ctx.fillRect(0, 0, w, h)

  // linhas finas (1 mm)
  ctx.lineWidth = 1
  ctx.strokeStyle = theme.fine
  ctx.beginPath()
  for (let x = 0; x <= w; x += pxPerMm) {
    const px = Math.round(x) + 0.5
    ctx.moveTo(px, 0); ctx.lineTo(px, h)
  }
  for (let y = 0; y <= h; y += pxPerMm) {
    const py = Math.round(y) + 0.5
    ctx.moveTo(0, py); ctx.lineTo(w, py)
  }
  ctx.stroke()

  // linhas grossas (5 mm)
  ctx.lineWidth = 1.4
  ctx.strokeStyle = theme.bold
  ctx.beginPath()
  const big = pxPerMm * 5
  for (let x = 0; x <= w; x += big) {
    const px = Math.round(x) + 0.5
    ctx.moveTo(px, 0); ctx.lineTo(px, h)
  }
  for (let y = 0; y <= h; y += big) {
    const py = Math.round(y) + 0.5
    ctx.moveTo(0, py); ctx.lineTo(w, py)
  }
  ctx.stroke()
}

/** Pulso de calibração retangular (10 mm de altura por padrão de ganho). */
export function drawCalibration(ctx: CanvasRenderingContext2D, x: number, baselineY: number, cfg: RenderConfig) {
  const { pxPerMm, gainMmMv, theme } = cfg
  const height = gainMmMv * pxPerMm // 1 mV
  const width = pxPerMm * 5
  ctx.strokeStyle = theme.trace
  ctx.lineWidth = 1.6
  ctx.beginPath()
  ctx.moveTo(x, baselineY)
  ctx.lineTo(x + pxPerMm * 1.5, baselineY)
  ctx.lineTo(x + pxPerMm * 1.5, baselineY - height)
  ctx.lineTo(x + pxPerMm * 3.5, baselineY - height)
  ctx.lineTo(x + pxPerMm * 3.5, baselineY)
  ctx.lineTo(x + width, baselineY)
  ctx.stroke()
}

/**
 * Desenha um traçado a partir do sinal (mV) sob uma janela temporal.
 * `startMs` define o deslocamento (para o modo monitor).
 */
export function drawTrace(
  ctx: CanvasRenderingContext2D,
  signal: Float32Array,
  fs: number,
  cfg: RenderConfig,
  opts: { x0: number; width: number; baselineY: number; startMs: number; color?: string; lineWidth?: number },
) {
  const { pxPerMm, speedMmS, gainMmMv } = cfg
  const pxPerMs = (speedMmS * pxPerMm) / 1000
  const pxPerMv = gainMmMv * pxPerMm
  const totalMs = (signal.length / fs) * 1000
  ctx.strokeStyle = opts.color || cfg.theme.trace
  ctx.lineWidth = opts.lineWidth ?? 1.7
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.beginPath()

  const dt = 1000 / fs
  let first = true
  for (let px = 0; px <= opts.width; px += 1) {
    const tMs = opts.startMs + px / pxPerMs
    let idx = tMs / dt
    // wrap para monitor contínuo
    idx = ((idx % signal.length) + signal.length) % signal.length
    const i0 = Math.floor(idx)
    const i1 = (i0 + 1) % signal.length
    const frac = idx - i0
    const mv = signal[i0] * (1 - frac) + signal[i1] * frac
    const x = opts.x0 + px
    const y = opts.baselineY - mv * pxPerMv
    if (first) { ctx.moveTo(x, y); first = false } else ctx.lineTo(x, y)
  }
  ctx.stroke()
}

/** Rótulo da derivação no canto do quadro. */
export function drawLeadLabel(ctx: CanvasRenderingContext2D, label: string, x: number, y: number, theme: GridTheme) {
  ctx.fillStyle = theme.text
  ctx.font = 'bold 13px ui-monospace, Menlo, monospace'
  ctx.textBaseline = 'top'
  ctx.fillText(label, x, y)
}

/** Duração visível (ms) para uma largura em px. */
export function visibleDurationMs(width: number, cfg: RenderConfig) {
  const pxPerMs = (cfg.speedMmS * cfg.pxPerMm) / 1000
  return width / pxPerMs
}

export const STANDARD_12_LAYOUT: LeadName[][] = [
  ['I', 'aVR', 'V1', 'V4'],
  ['II', 'aVL', 'V2', 'V5'],
  ['III', 'aVF', 'V3', 'V6'],
]
