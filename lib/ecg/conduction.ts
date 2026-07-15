/**
 * Modelo de propagação elétrica do coração para a animação (2D e 3D).
 *
 * Em vez de um simples liga/desliga, este módulo descreve o comportamento
 * eletrofisiológico de cada ritmo: onde o impulso nasce, por onde passa e —
 * nos bloqueios — exatamente onde ele para (nó AV vs infra-His), além dos
 * ritmos de escape dissociados dos átrios.
 *
 * O caminho de condução é parametrizado por u ∈ [0,1] com marcos fixos, para
 * que 2D e 3D posicionem o impulso de forma consistente:
 *   u:  0.00  SA · 0.30 átrios · 0.45 nó AV · 0.54 saída do AV ·
 *       0.60  His · 0.72 ramos · 0.88 Purkinje · 1.00 ventrículos
 */
import type { EcgPattern } from './engine'

export const U_BREAKS = [0, 0.3, 0.45, 0.54, 0.6, 0.72, 0.88, 1.0]
export const U = { sa: 0, atria: 0.3, av: 0.45, avExit: 0.54, his: 0.6, branch: 0.72, purk: 0.88, vent: 1.0 }
export const BLOCK_AV = 0.48    // travado dentro do nó AV
export const BLOCK_2_1 = 0.5    // junção AV/His (nível indeterminável no 2:1)
export const BLOCK_INFRA = 0.63 // travado no His/ramos (abaixo do nó AV)

export type ConductionKind =
  | 'normal' | 'av_delay' | 'wenckebach' | 'infra_drop' | 'alternating'
  | 'cht_junctional' | 'cht_ventricular' | 'junctional' | 'ventricular_focus'
  | 'atrial_ectopic' | 'afib' | 'flutter' | 'paced' | 'paced_dual' | 'chaotic' | 'none'

export interface ConductionSpec {
  kind: ConductionKind
  atrialRate: number
  ventRate: number
  conductPattern?: boolean[]
  blockU?: number
}

export interface Wavefront {
  u: number
  blocked: boolean
  viaMuscle?: boolean   // ativação ventricular por músculo (foco/escape ventricular), não pelo His-Purkinje
  atrial?: boolean      // frente atrial (SA→AV)
}

export interface ConductionState {
  fronts: Wavefront[]
  glow: { sa: number; atria: number; av: number; his: number; branch: number; purk: number; vent: number }
  avBlockFlash: boolean
  infraBlockFlash: boolean
  atriaChaos: number    // 0 normal · >0 fibrilação/flutter (tremor atrial)
  paceSpike: number     // 0..1 (marca-passo)
  escapeOrigin: 'junction' | 'ventricle' | null
}

const BASE = 0.24

function hash(n: number) { const s = Math.sin(n * 127.1 + 11.7) * 43758.5453; return s - Math.floor(s) }

/** Deriva a especificação de condução a partir do padrão do ECG. */
export function conductionFor(p: EcgPattern): ConductionSpec {
  const A = p.atrialRate || p.rate
  switch (p.id) {
    case 'av-block-1': return { kind: 'av_delay', atrialRate: p.rate, ventRate: p.rate }
    case 'mobitz-1': return { kind: 'wenckebach', atrialRate: A, ventRate: A, conductPattern: [true, true, true, false], blockU: BLOCK_AV }
    case 'mobitz-2': return { kind: 'infra_drop', atrialRate: A, ventRate: A, conductPattern: [true, true, false], blockU: BLOCK_INFRA }
    case 'av-2-1': return { kind: 'alternating', atrialRate: A, ventRate: A, conductPattern: [true, false], blockU: BLOCK_2_1 }
    case 'av-block-advanced': return { kind: 'infra_drop', atrialRate: A, ventRate: A, conductPattern: [true, false, false], blockU: BLOCK_INFRA }
    case 'av-block-3': return { kind: 'cht_junctional', atrialRate: A, ventRate: p.rate }
    case 'av-block-3-vent': return { kind: 'cht_ventricular', atrialRate: A, ventRate: p.rate }
  }
  switch (p.rhythm) {
    case 'complete_block': return { kind: p.qrs.width >= 120 ? 'cht_ventricular' : 'cht_junctional', atrialRate: A, ventRate: p.rate }
    case 'mobitz1': return { kind: 'wenckebach', atrialRate: A, ventRate: A, conductPattern: [true, true, true, false], blockU: BLOCK_AV }
    case 'mobitz2': return { kind: 'infra_drop', atrialRate: A, ventRate: A, conductPattern: [true, true, false], blockU: BLOCK_INFRA }
    case 'av_2_1': return { kind: 'alternating', atrialRate: A, ventRate: A, conductPattern: [true, false], blockU: BLOCK_2_1 }
    case 'vt': case 'torsades': return { kind: 'ventricular_focus', atrialRate: 0, ventRate: p.rate }
    case 'vfib': return { kind: 'chaotic', atrialRate: 0, ventRate: 0 }
    case 'asystole': return { kind: 'none', atrialRate: 0, ventRate: 0 }
    case 'paced': return { kind: p.p.present ? 'paced_dual' : 'paced', atrialRate: A, ventRate: p.rate }
    case 'afib': return { kind: 'afib', atrialRate: 380, ventRate: p.rate }
    case 'aflutter': return { kind: 'flutter', atrialRate: p.atrialRate || 300, ventRate: p.rate }
    case 'atrial_ectopic': return { kind: 'atrial_ectopic', atrialRate: p.rate, ventRate: p.rate }
  }
  if (['junctional-escape', 'accelerated-junctional', 'junctional-tachy'].includes(p.id))
    return { kind: 'junctional', atrialRate: 0, ventRate: p.rate }
  return { kind: 'normal', atrialRate: p.rate, ventRate: p.rate }
}

/** Sweep monotônico te→u com marco/atraso no nó AV e um teto (bloqueio). */
function sweep(te: number, Ds: number, avDwell: number, capU: number) {
  if (te <= 0) return { u: 0, atBlock: false }
  const preT = Ds * 0.3, avT = Ds * (0.08 + avDwell * 0.6), postT = Ds * 0.55
  let u: number
  if (te < preT) u = (te / preT) * U.av
  else if (te < preT + avT) u = U.av + ((te - preT) / avT) * (U.avExit - U.av)
  else u = U.avExit + Math.min(1, (te - preT - avT) / postT) * (1 - U.avExit)
  const capped = Math.min(u, capU)
  return { u: capped, atBlock: capU < 1 && u >= capU - 1e-3 }
}

function glowAt(fronts: Wavefront[], a: number, b: number, onlyConduction = false) {
  let g = BASE
  for (const f of fronts) {
    if (onlyConduction && f.viaMuscle) continue
    if (f.u >= a - 0.03) {
      const d = f.u - b
      if (d <= 0.02) g = Math.max(g, 1)
      else if (d < 0.16) g = Math.max(g, 1 - (d - 0.02) / 0.14)
    }
  }
  return g
}

/** Estado da propagação no instante t (segundos). Puro e O(1). */
export function conductionState(spec: ConductionSpec, t: number): ConductionState {
  const fronts: Wavefront[] = []
  let atriaChaos = 0, paceSpike = 0
  let escapeOrigin: 'junction' | 'ventricle' | null = null
  const k = spec.kind

  if (k === 'none') {
    return { fronts, glow: zeroGlow(), avBlockFlash: false, infraBlockFlash: false, atriaChaos: 0, paceSpike: 0, escapeOrigin: null }
  }

  if (k === 'chaotic') {
    const flick = () => 0.4 + 0.6 * hash(Math.floor(t * 12) + Math.random())
    return { fronts, glow: { sa: 0.2, atria: flick(), av: 0.2, his: flick(), branch: flick(), purk: flick(), vent: flick() }, avBlockFlash: false, infraBlockFlash: false, atriaChaos: 1, paceSpike: 0, escapeOrigin: 'ventricle' }
  }

  // ── ritmos com dissociação AV (BAVT / foco / escape) ──
  if (k === 'cht_junctional' || k === 'cht_ventricular' || k === 'junctional' || k === 'ventricular_focus') {
    // frente atrial independente (bloqueada no AV) — exceto foco ventricular puro
    if (spec.atrialRate > 0) {
      const Tpa = 60 / spec.atrialRate, tea = t % Tpa, Dsa = Math.min(0.4, Tpa * 0.7)
      const sa = sweep(tea, Dsa, 0.12, BLOCK_AV)
      fronts.push({ u: sa.u, blocked: sa.atBlock, atrial: true })
    }
    // frente ventricular (escape/foco) independente
    const Tpv = 60 / Math.max(20, spec.ventRate), tev = t % Tpv, Dsv = Math.min(0.5, Tpv * 0.5)
    const viaMuscle = k === 'cht_ventricular' || k === 'ventricular_focus'
    const start = viaMuscle ? U.purk : U.avExit
    escapeOrigin = viaMuscle ? 'ventricle' : 'junction'
    const uv = start + Math.min(1, tev / Dsv) * (1 - start)
    fronts.push({ u: uv, blocked: false, viaMuscle })
    return finish(fronts, atriaChaos, paceSpike, escapeOrigin, spec.atrialRate > 0)
  }

  // ── marca-passo ──
  if (k === 'paced' || k === 'paced_dual') {
    const Tpv = 60 / Math.max(30, spec.ventRate), tev = t % Tpv, Dsv = Math.min(0.45, Tpv * 0.5)
    if (tev < 0.06) paceSpike = 1
    if (k === 'paced_dual') {
      // espícula atrial → átrios, depois espícula ventricular
      const ua = Math.min(U.avExit, (tev / (Dsv * 0.4)) * U.avExit)
      if (tev < Dsv * 0.45) fronts.push({ u: ua, blocked: false, atrial: true })
    }
    const uv = U.purk + Math.min(1, tev / Dsv) * (1 - U.purk)
    fronts.push({ u: uv, blocked: false, viaMuscle: true })
    escapeOrigin = 'ventricle'
    return finish(fronts, 0, paceSpike, escapeOrigin, k === 'paced_dual')
  }

  // ── fibrilação/flutter atrial ──
  if (k === 'afib' || k === 'flutter') {
    atriaChaos = k === 'afib' ? 1 : 0.6
    const Tpv = 60 / Math.max(30, spec.ventRate)
    const n = Math.floor(t / Tpv)
    const jitter = k === 'afib' ? (hash(n) - 0.5) * 0.6 * Tpv : 0
    const tev = t - (n * Tpv + jitter)
    const Dsv = Math.min(0.4, Tpv * 0.6)
    if (tev >= 0 && tev < Tpv) {
      const uv = U.av + Math.min(1, tev / Dsv) * (1 - U.av) // conduz a partir do nó AV
      fronts.push({ u: uv, blocked: false })
    }
    const st = finish(fronts, atriaChaos, 0, null, false)
    return st
  }

  // ── ritmos conduzidos por trem atrial (normal, atrasos, bloqueios de 2º grau) ──
  const Tp = 60 / Math.max(20, spec.atrialRate)
  const n = Math.floor(t / Tp)
  const te = t % Tp
  const Ds = Math.min(0.55, Tp * 0.82)
  let capU = 1, avDwell = 0.12
  if (k === 'av_delay') avDwell = 0.8
  else if (k === 'wenckebach') {
    const cp = spec.conductPattern!, idx = n % cp.length
    avDwell = 0.12 + idx * 0.24
    if (!cp[idx]) capU = spec.blockU!
  } else if (k === 'infra_drop' || k === 'alternating') {
    const cp = spec.conductPattern!, idx = n % cp.length
    if (!cp[idx]) capU = spec.blockU!
  }
  const sw = sweep(te, Ds, avDwell, capU)
  fronts.push({ u: sw.u, blocked: sw.atBlock, atrial: capU < 1 })
  return finish(fronts, 0, 0, null, false)
}

function zeroGlow() { return { sa: 0.1, atria: 0.1, av: 0.1, his: 0.1, branch: 0.1, purk: 0.1, vent: 0.1 } }

function finish(fronts: Wavefront[], atriaChaos: number, paceSpike: number, escapeOrigin: 'junction' | 'ventricle' | null, _dual: boolean): ConductionState {
  const glow = {
    sa: glowAt(fronts, U.sa, 0.04, true),
    atria: Math.max(glowAt(fronts, 0.05, U.atria, true), atriaChaos > 0 ? 0.4 + 0.5 * Math.abs(Math.sin(performance.now() / 60)) : 0),
    av: glowAt(fronts, U.av - 0.03, U.avExit, true),
    his: glowAt(fronts, U.his - 0.02, U.his + 0.04, true),
    branch: glowAt(fronts, U.branch - 0.03, U.branch + 0.03, true),
    purk: glowAt(fronts, U.purk - 0.03, U.purk + 0.03, true),
    vent: glowAt(fronts, 0.86, 1.0, false),
  }
  const avBlockFlash = fronts.some((f) => f.blocked && f.u >= U.av - 0.03 && f.u < U.his - 0.02)
  const infraBlockFlash = fronts.some((f) => f.blocked && f.u >= U.his - 0.02)
  return { fronts, glow, avBlockFlash, infraBlockFlash, atriaChaos, paceSpike, escapeOrigin }
}

/** Interpola uma posição ao longo dos marcos (pontos nas quebras U_BREAKS). */
export function sampleAtU<T>(points: T[], u: number, lerp: (a: T, b: T, s: number) => T): T {
  const uu = Math.max(0, Math.min(1, u))
  for (let i = 0; i < U_BREAKS.length - 1; i++) {
    if (uu <= U_BREAKS[i + 1]) {
      const s = (uu - U_BREAKS[i]) / (U_BREAKS[i + 1] - U_BREAKS[i] || 1)
      return lerp(points[i], points[i + 1], s)
    }
  }
  return points[points.length - 1]
}
