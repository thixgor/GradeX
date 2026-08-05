/**
 * Helpers para desenhar traçados de ECG em SVG dentro da trilha de ensino.
 *
 * Os laboratórios didáticos usam SVG (e não o <canvas> do simulador) porque
 * precisam anotar o traçado: setas, colchetes de intervalo, faixas coloridas e
 * rótulos que acompanham o zoom da tela. Aqui ficam só as funções puras —
 * geração da forma de onda de um batimento didático e conversão de sinal em
 * atributo `d` de <path>.
 */
import { synthesizeLead, type EcgPattern, type LeadName } from '../engine'

/* ───────────────────────── batimento didático ───────────────────────── */

/**
 * Marcos temporais (ms) de um batimento normal a 60 bpm, usados pelo
 * construtor do traçado. O R fica em 240 ms para sobrar espaço à esquerda
 * para P e PR sem cortar o desenho.
 */
export const BEAT = {
  pOn: 40,
  pPeak: 95,
  pOff: 150,
  qOn: 200,
  qPeak: 214,
  rPeak: 240,
  sPeak: 266,
  j: 290,
  stEnd: 360,
  tPeak: 450,
  tOff: 540,
  uPeak: 610,
  uOff: 680,
  end: 1000,
} as const

export interface BeatShape {
  /** Amplitude da onda P (mV). 0 remove a onda. */
  p?: number
  /** Largura da P (ms) — alarga em sobrecarga atrial esquerda. */
  pWidth?: number
  /** Duplo pico da P (P mitrale). */
  pNotched?: boolean
  q?: number
  r?: number
  s?: number
  /** Desvio do ponto J / segmento ST (mV). */
  st?: number
  t?: number
  /** Largura da T (ms) — estreita e alta na hipercalemia. */
  tWidth?: number
  u?: number
  /** Fator de alargamento do QRS (1 = normal ~90 ms). */
  qrsWide?: number
}

const DEFAULT_SHAPE: Required<BeatShape> = {
  p: 0.15, pWidth: 100, pNotched: false,
  q: -0.08, r: 1.25, s: -0.28,
  st: 0, t: 0.35, tWidth: 160, u: 0.05, qrsWide: 1,
}

function gauss(t: number, a: number, mu: number, sigma: number) {
  if (a === 0) return 0
  const z = (t - mu) / sigma
  return a * Math.exp(-0.5 * z * z)
}

/**
 * Valor (mV) do batimento didático no instante `t` (ms).
 * Analítico de propósito: permite recortar o traçado em qualquer ponto para
 * "construir" o complexo onda por onda.
 */
export function beatValue(t: number, shape: BeatShape = {}): number {
  const s = { ...DEFAULT_SHAPE, ...shape }
  const w = s.qrsWide
  let v = 0

  // Onda P — despolarização atrial
  if (s.p !== 0) {
    const sigma = s.pWidth / 4.2
    if (s.pNotched) {
      v += gauss(t, s.p * 0.85, BEAT.pPeak - 22, sigma * 0.62)
      v += gauss(t, s.p * 0.85, BEAT.pPeak + 26, sigma * 0.62)
    } else {
      v += gauss(t, s.p, BEAT.pPeak, sigma)
    }
  }

  // QRS — três deflexões gaussianas estreitas
  v += gauss(t, s.q, BEAT.rPeak - (BEAT.rPeak - BEAT.qPeak) * w, 7 * w)
  v += gauss(t, s.r, BEAT.rPeak, 10 * w)
  v += gauss(t, s.s, BEAT.rPeak + (BEAT.sPeak - BEAT.rPeak) * w, 11 * w)

  // Segmento ST — platô deslocado entre o ponto J e o início da T
  if (s.st !== 0) {
    const j = BEAT.rPeak + (BEAT.j - BEAT.rPeak) * w
    if (t > j - 12) {
      const ramp = Math.min(1, (t - (j - 12)) / 24)
      const decay = t > BEAT.tPeak ? Math.max(0, 1 - (t - BEAT.tPeak) / 120) : 1
      v += s.st * ramp * decay
    }
  }

  // Onda T — repolarização ventricular
  v += gauss(t, s.t, BEAT.tPeak, s.tWidth / 4.2)

  // Onda U
  v += gauss(t, s.u, BEAT.uPeak, 34)

  return v
}

/** Amostra o batimento didático de `from` a `to` (ms) no passo indicado. */
export function sampleBeat(from: number, to: number, stepMs = 2, shape: BeatShape = {}) {
  const out: { t: number; mv: number }[] = []
  for (let t = from; t <= to; t += stepMs) out.push({ t, mv: beatValue(t, shape) })
  return out
}

/* ───────────────────────── conversão para <path> ───────────────────────── */

export interface StripScale {
  /** Largura do viewBox em unidades SVG. */
  width: number
  /** Altura do viewBox. */
  height: number
  /** Janela temporal desenhada (ms). */
  durationMs: number
  /** Milivolts representados por metade da altura. */
  mvSpan: number
  /** Linha de base em unidades SVG (padrão: meio da altura). */
  baseline?: number
}

/** Converte tempo (ms) em coordenada x do viewBox. */
export function xOf(tMs: number, sc: StripScale) {
  return (tMs / sc.durationMs) * sc.width
}

/** Converte amplitude (mV) em coordenada y do viewBox. */
export function yOf(mv: number, sc: StripScale) {
  const base = sc.baseline ?? sc.height / 2
  return base - (mv / sc.mvSpan) * (sc.height / 2)
}

/** Path do batimento didático entre dois instantes. */
export function beatPath(from: number, to: number, sc: StripScale, shape: BeatShape = {}, stepMs = 2) {
  const pts = sampleBeat(from, to, stepMs, shape)
  if (!pts.length) return ''
  return pts
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${xOf(p.t, sc).toFixed(2)} ${yOf(p.mv, sc).toFixed(2)}`)
    .join(' ')
}

/** Path de um sinal sintetizado pelo motor do simulador. */
export function signalPath(signal: Float32Array, fs: number, sc: StripScale) {
  const n = Math.min(signal.length, Math.round((sc.durationMs / 1000) * fs))
  if (n < 2) return ''
  const stride = Math.max(1, Math.floor(n / sc.width / 2))
  let d = ''
  for (let i = 0; i < n; i += stride) {
    const t = (i / fs) * 1000
    d += `${i === 0 ? 'M' : 'L'}${xOf(t, sc).toFixed(2)} ${yOf(signal[i], sc).toFixed(2)} `
  }
  return d.trim()
}

/** Sintetiza uma derivação e já devolve o path pronto. */
export function patternPath(pattern: EcgPattern, lead: LeadName, sc: StripScale, fs = 250) {
  const signal = synthesizeLead(pattern, lead, { durationMs: sc.durationMs, fs, seed: 7 })
  return signalPath(signal, fs, sc)
}

/* ───────────────────────── papel milimetrado ───────────────────────── */

/**
 * Tamanho do quadradinho de 1 mm em unidades do viewBox, dado que o traçado é
 * desenhado a 25 mm/s e 10 mm/mV. Mantém o papel coerente com as medidas:
 * 1 quadradinho = 40 ms na horizontal e 0,1 mV na vertical.
 */
export function mmGrid(sc: StripScale) {
  const pxPerMmX = sc.width / ((sc.durationMs / 1000) * 25)
  const pxPerMmY = (sc.height / 2) / (sc.mvSpan * 10)
  return { x: pxPerMmX, y: pxPerMmY }
}
