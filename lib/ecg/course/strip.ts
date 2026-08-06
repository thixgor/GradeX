/**
 * Helpers para desenhar traçados de ECG em SVG dentro da trilha de ensino.
 *
 * Os laboratórios didáticos usam SVG (e não o <canvas> do simulador) porque
 * precisam anotar o traçado: setas, colchetes de intervalo, faixas coloridas e
 * rótulos que acompanham o zoom da tela. Aqui ficam só as funções puras —
 * geração da forma de onda de um batimento didático e conversão de sinal em
 * atributo `d` de <path>.
 *
 * A morfologia sai de `lib/ecg/waveform`: cada onda tem começo e fim exatos, o
 * QRS tem limbos retos e ápice agudo e a T sobe devagar e desce rápido. Isso
 * não é preciosismo estético — é o que faz o colchete "onda P: 110 ms" do
 * laboratório de intervalos cair exatamente sobre a onda P desenhada.
 */
import { dome, plateau, smoothstep, spike, tWave } from '../waveform'
import { synthesizeLead, type EcgPattern, type LeadName } from '../engine'

/* ───────────────────────── batimento didático ───────────────────────── */

/**
 * Marcos temporais (ms) de um batimento normal a 60 bpm, usados pelo
 * construtor do traçado. O R fica em 240 ms para sobrar espaço à esquerda
 * para P e PR sem cortar o desenho.
 *
 * Os valores não são arbitrários: reproduzem um ECG normal de adulto em D2 —
 * P de 110 ms, PR de 160 ms, QRS de 90 ms, ST de 90 ms e QT de 400 ms (QTc 400
 * a 60 bpm). Quem medir com o paquímetro do laboratório encontra esses números.
 */
export const BEAT = {
  pOn: 40,
  pPeak: 95,
  pOff: 150,
  qOn: 200,
  qPeak: 212,
  rPeak: 240,
  sPeak: 268,
  j: 290,
  stEnd: 380,
  tPeak: 508,
  tOff: 600,
  uPeak: 660,
  uOff: 730,
  end: 1000,
} as const

/** Duração do QRS (ms) do batimento didático — âncora das proporções. */
const QRS_MS = 90
/** Duração total da onda T (ms). */
const T_MS = 220
/** Duração do segmento ST (ms), do ponto J ao início da T. */
const ST_MS = 90

/**
 * Proporções do QRS em relação à sua duração total. Vêm da geometria do
 * complexo em D2: a q ocupa o primeiro quinto, a R domina o meio e a S fecha
 * o complexo voltando à linha de base exatamente no ponto J.
 */
const Q_ON = 0.44, Q_PEAK = 0.31, R_UP = 0.22, R_DOWN = 0.20, S_PEAK = 0.31, J_PT = 0.56

export type TShape = 'normal' | 'symmetric' | 'peaked'

/**
 * Descrição completa de um batimento, com o pico da R ancorado em `r0` (ms).
 * É a forma canônica usada por todos os laboratórios da trilha — inclusive os
 * que precisam de ondas que o batimento normal não tem (delta, J de Osborn,
 * épsilon, R′).
 */
export interface BeatSpec {
  /** instante do pico da onda R (ms) */
  r0: number
  /** intervalo PR (ms): do início da P ao início do QRS */
  pr?: number
  /** amplitude da onda P (mV). 0 remove a onda. */
  p?: number
  /** duração da P (ms) — alarga na sobrecarga atrial esquerda */
  pWidth?: number
  /** P bífida (P mitrale) */
  pNotched?: boolean
  q?: number
  r?: number
  s?: number
  /** segunda deflexão positiva (rSR′ do bloqueio de ramo direito) */
  rPrime?: number
  /** duração total do QRS (ms) */
  qrsWidth?: number
  /** onda delta (pré-excitação): empastamento inicial, em mV */
  delta?: number
  /** onda J de Osborn (hipotermia, hipercalcemia), em mV */
  jWave?: number
  /** onda épsilon (displasia arritmogênica de VD), em mV */
  epsilon?: number
  /** desvio do segmento ST (mV): positivo = supra */
  st?: number
  /** supra convexo ("em abóbada") em vez de retificado */
  stCoved?: boolean
  /** duração do segmento ST (ms) */
  stWidth?: number
  /** amplitude da onda T (mV) */
  t?: number
  /** duração total da onda T (ms) */
  tWidth?: number
  /** morfologia da T: normal (assimétrica), simétrica (isquemia) ou apiculada (hipercalemia) */
  tShape?: TShape
  /** amplitude da onda U (mV) */
  u?: number
}

const D: Required<Pick<BeatSpec, 'pr' | 'p' | 'pWidth' | 'q' | 'r' | 's' | 'qrsWidth' | 'st' | 'stWidth' | 't' | 'tWidth' | 'u'>> = {
  pr: 160, p: 0.15, pWidth: 110,
  q: -0.08, r: 1.25, s: -0.28, qrsWidth: QRS_MS,
  st: 0, stWidth: ST_MS,
  t: 0.35, tWidth: T_MS, u: 0.05,
}

/** Marcos temporais derivados de um `BeatSpec` — o "relógio" do batimento. */
export function beatMarks(spec: BeatSpec) {
  const w = spec.qrsWidth ?? D.qrsWidth
  const r0 = spec.r0
  const qOn = r0 - Q_ON * w
  const j = r0 + J_PT * w
  const pWidth = spec.pWidth ?? D.pWidth
  const pOn = qOn - (spec.pr ?? D.pr)
  const tOn = j + (spec.stWidth ?? D.stWidth)
  const tWidth = spec.tWidth ?? D.tWidth
  const tPeak = tOn + tWidth * (spec.tShape && spec.tShape !== 'normal' ? 0.5 : 0.58)
  const tOff = tOn + tWidth
  return {
    pOn, pPeak: pOn + pWidth * 0.5, pOff: pOn + pWidth,
    qOn, qPeak: r0 - Q_PEAK * w, rPeak: r0, sPeak: r0 + S_PEAK * w, j,
    tOn, tPeak, tOff,
    uPeak: tOff + 60, uOff: tOff + 130,
  }
}

/**
 * Valor (mV) de um batimento no instante `t` (ms).
 *
 * Analítico de propósito: permite recortar o traçado em qualquer ponto para
 * "construir" o complexo onda por onda, e permite que dois batimentos se
 * sobreponham (extrassístole precoce, fusão T-U) somando os valores.
 */
export function beatAt(t: number, spec: BeatSpec): number {
  const w = spec.qrsWidth ?? D.qrsWidth
  const m = beatMarks(spec)
  const r0 = spec.r0
  let v = 0

  /* ── onda P ── */
  const pAmp = spec.p ?? D.p
  if (pAmp) {
    if (spec.pNotched) {
      // P mitrale: dois corcovos, o segundo (átrio esquerdo) atrasado
      const half = (m.pOff - m.pOn) * 0.58
      v += dome(t, pAmp * 0.92, m.pOn, m.pOn + half * 0.5, m.pOn + half)
      v += dome(t, pAmp * 0.92, m.pOff - half, m.pOff - half * 0.5, m.pOff)
    } else {
      v += dome(t, pAmp, m.pOn, m.pPeak, m.pOff)
    }
  }

  /* ── onda delta: empastamento que come o fim do segmento PR ── */
  if (spec.delta) {
    const start = m.qOn - 42
    if (t > start && t < m.j) {
      const up = smoothstep((t - start) / (r0 - R_UP * w - start))
      const off = t > r0 ? Math.max(0, 1 - (t - r0) / (J_PT * w)) : 1
      v += spec.delta * up * off
    }
  }

  /* ── QRS: três deflexões de limbos retos, emendadas na linha de base ── */
  const q = spec.q ?? D.q
  const r = spec.r ?? D.r
  const s = spec.s ?? D.s
  if (q) v += spike(t, q, m.qPeak, (Q_ON - Q_PEAK) * w, (Q_PEAK - R_UP) * w, 0.22)
  if (r) v += spike(t, r, r0, R_UP * w, R_DOWN * w, 0.14)
  if (s) v += spike(t, s, m.sPeak, (S_PEAK - R_DOWN) * w, (J_PT - S_PEAK) * w, 0.2)
  if (spec.rPrime) {
    // R′ nasce sobre a S, logo antes do ponto J — as "orelhas de coelho"
    v += spike(t, spec.rPrime, m.j - 0.06 * w, 0.16 * w, 0.2 * w, 0.2)
  }

  /* ── ondas do ponto J ── */
  if (spec.jWave) v += dome(t, spec.jWave, m.j - 0.16 * w, m.j + 16, m.j + 62)
  if (spec.epsilon) v += spike(t, spec.epsilon, m.j + 20, 14, 18, 0.3)

  /* ── segmento ST ── */
  const st = spec.st ?? D.st
  if (st) {
    v += plateau(t, st, m.j, m.tPeak, 26)
    if (spec.stCoved) {
      // convexidade superior: o supra "empurra" o meio do segmento para cima
      const span = m.tPeak - m.j
      if (t > m.j && t < m.tPeak) {
        v += Math.sign(st) * Math.abs(st) * 0.34 * Math.sin(Math.PI * ((t - m.j) / span))
      }
    }
  }

  /* ── onda T ── */
  const tAmp = spec.t ?? D.t
  if (tAmp) {
    const shape: TShape = spec.tShape ?? 'normal'
    if (shape === 'peaked') {
      // "em tenda" da hipercalemia: base estreita, limbos retos, ápice agudo
      const half = (m.tOff - m.tOn) / 2
      v += spike(t, tAmp, m.tPeak, half, half, 0.3)
    } else if (shape === 'symmetric') {
      v += dome(t, tAmp, m.tOn, m.tPeak, m.tOff)
    } else {
      v += tWave(t, tAmp, m.tOn, m.tPeak, m.tOff)
    }
  }

  /* ── onda U ── */
  const uAmp = spec.u ?? D.u
  if (uAmp) v += dome(t, uAmp, m.tOff + 25, m.uPeak, m.uOff)

  return v
}

/* ──────────────── batimento padrão da trilha (âncora em BEAT) ──────────────── */

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
  /** Morfologia da T. */
  tShape?: TShape
  u?: number
  /** Fator de alargamento do QRS (1 = normal ~90 ms). */
  qrsWide?: number
}

/** Converte a forma didática (relativa) na descrição completa do batimento. */
function toSpec(shape: BeatShape, r0 = BEAT.rPeak): BeatSpec {
  return {
    r0,
    pr: BEAT.qOn - BEAT.pOn,
    p: shape.p, pWidth: shape.pWidth, pNotched: shape.pNotched,
    q: shape.q, r: shape.r, s: shape.s,
    qrsWidth: QRS_MS * (shape.qrsWide ?? 1),
    st: shape.st,
    t: shape.t, tWidth: shape.tWidth, tShape: shape.tShape,
    u: shape.u,
  }
}

/**
 * Valor (mV) do batimento didático no instante `t` (ms), com o R em BEAT.rPeak.
 */
export function beatValue(t: number, shape: BeatShape = {}): number {
  return beatAt(t, toSpec(shape))
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
  // 500 Hz nas tiras curtas: a 25 mm/s um quadradinho tem 40 ms, e amostrar a
  // 250 Hz deixaria só 10 pontos nele — o suficiente para achatar o ápice da R.
  const rate = sc.durationMs <= 3000 ? Math.max(fs, 500) : fs
  const signal = synthesizeLead(pattern, lead, { durationMs: sc.durationMs, fs: rate, seed: 7 })
  return signalPath(signal, rate, sc)
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
