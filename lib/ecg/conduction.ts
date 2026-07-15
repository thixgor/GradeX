/**
 * Modelo de propagação elétrica do coração para a animação (2D e 3D).
 *
 * Descreve o comportamento eletrofisiológico de cada ritmo: onde o impulso
 * nasce, por onde passa e — nos bloqueios — exatamente onde para (nó AV vs
 * infra-His), os escapes dissociados dos átrios e os bloqueios de ramo/
 * fasciculares (ramo apagado + ventrículo dependente ativado tardiamente).
 *
 * Caminho de condução parametrizado por u ∈ [0,1] com marcos fixos:
 *   u:  0.00 SA · 0.30 átrios · 0.45 nó AV · 0.54 saída do AV ·
 *       0.60 His · 0.72 ramos · 0.88 Purkinje · 1.00 ventrículos
 */
import type { EcgPattern } from './engine'

export const U_BREAKS = [0, 0.3, 0.45, 0.54, 0.6, 0.72, 0.88, 1.0]
export const U = { sa: 0, atria: 0.3, av: 0.45, avExit: 0.54, his: 0.6, branch: 0.72, purk: 0.88, vent: 1.0 }
export const BLOCK_AV = 0.48
export const BLOCK_2_1 = 0.5
export const BLOCK_INFRA = 0.63

export type ConductionKind =
  | 'normal' | 'av_delay' | 'wenckebach' | 'infra_drop' | 'alternating'
  | 'cht_junctional' | 'cht_ventricular' | 'junctional' | 'ventricular_focus'
  | 'atrial_ectopic' | 'afib' | 'flutter' | 'paced' | 'paced_dual' | 'chaotic' | 'none'

/** Bloqueio no componente ventricular (ramos). */
export interface VentBlock {
  rbb?: 'block' | 'delay'  // ramo direito: bloqueado (BRD) ou apenas retardado (BRD incompleto)
  lbb?: 'block'            // ramo esquerdo: bloqueado (BRE)
}

export interface ConductionSpec {
  kind: ConductionKind
  atrialRate: number
  ventRate: number
  conductPattern?: boolean[]
  blockU?: number
  vent?: VentBlock
}

export interface Wavefront { u: number; blocked: boolean; viaMuscle?: boolean; atrial?: boolean }

export interface ConductionGlow { sa: number; atria: number; av: number; his: number; lbb: number; rbb: number; purk: number; lv: number; rv: number }

export interface ConductionState {
  fronts: Wavefront[]
  glow: ConductionGlow
  avBlockFlash: boolean
  infraBlockFlash: boolean
  atriaChaos: number
  paceSpike: number
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
    // bloqueios de ramo / fasciculares
    case 'trifascicular': return { kind: 'av_delay', atrialRate: p.rate, ventRate: p.rate, vent: { rbb: 'block' } } // BRD+HBAE + PR longo
    case 'bifascicular': case 'bifascicular-hpe': return { kind: 'normal', atrialRate: p.rate, ventRate: p.rate, vent: { rbb: 'block' } }
    case 'lafb': case 'lpfb': return { kind: 'normal', atrialRate: p.rate, ventRate: p.rate } // hemibloqueio: eixo (vetor) conta a história
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
  // bloqueios de ramo detectados pela morfologia do QRS
  if (p.qrs.block === 'rbbb_incomplete') return { kind: 'normal', atrialRate: p.rate, ventRate: p.rate, vent: { rbb: 'delay' } }
  if (p.qrs.block === 'rbbb') return { kind: 'normal', atrialRate: p.rate, ventRate: p.rate, vent: { rbb: 'block' } }
  if (p.qrs.block === 'lbbb') return { kind: 'normal', atrialRate: p.rate, ventRate: p.rate, vent: { lbb: 'block' } }
  return { kind: 'normal', atrialRate: p.rate, ventRate: p.rate }
}

/** Sweep monotônico te→u com atraso no nó AV, teto (bloqueio) e alongamento
 * do trecho ventricular (QRS largo). */
function sweep(te: number, Ds: number, avDwell: number, capU: number, ventStretch = 1) {
  if (te <= 0) return { u: 0, atBlock: false }
  const preT = Ds * 0.3, avT = Ds * (0.08 + avDwell * 0.6), postT = Ds * 0.55 * ventStretch
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

/** Estado da propagação no instante t (segundos). Puro. */
export function conductionState(spec: ConductionSpec, t: number): ConductionState {
  const fronts: Wavefront[] = []
  let atriaChaos = 0, paceSpike = 0
  let escapeOrigin: 'junction' | 'ventricle' | null = null
  const k = spec.kind

  if (k === 'none') return finish(fronts, 0, 0, null)

  if (k === 'chaotic') {
    const f = () => 0.4 + 0.6 * hash(Math.floor(t * 12) + Math.random())
    return { fronts, glow: { sa: 0.2, atria: f(), av: 0.2, his: f(), lbb: f(), rbb: f(), purk: f(), lv: f(), rv: f() }, avBlockFlash: false, infraBlockFlash: false, atriaChaos: 1, paceSpike: 0, escapeOrigin: 'ventricle' }
  }

  // ── dissociação AV (BAVT / foco / escape) ──
  if (k === 'cht_junctional' || k === 'cht_ventricular' || k === 'junctional' || k === 'ventricular_focus') {
    if (spec.atrialRate > 0) {
      const Tpa = 60 / spec.atrialRate, tea = t % Tpa, Dsa = Math.min(0.4, Tpa * 0.7)
      const sa = sweep(tea, Dsa, 0.12, BLOCK_AV)
      fronts.push({ u: sa.u, blocked: sa.atBlock, atrial: true })
    }
    const Tpv = 60 / Math.max(20, spec.ventRate), tev = t % Tpv, Dsv = Math.min(0.5, Tpv * 0.5)
    const viaMuscle = k === 'cht_ventricular' || k === 'ventricular_focus'
    const start = viaMuscle ? U.purk : U.avExit
    escapeOrigin = viaMuscle ? 'ventricle' : 'junction'
    fronts.push({ u: start + Math.min(1, tev / Dsv) * (1 - start), blocked: false, viaMuscle })
    return finish(fronts, 0, 0, escapeOrigin)
  }

  // ── marca-passo ──
  if (k === 'paced' || k === 'paced_dual') {
    const Tpv = 60 / Math.max(30, spec.ventRate), tev = t % Tpv, Dsv = Math.min(0.45, Tpv * 0.5)
    if (tev < 0.06) paceSpike = 1
    if (k === 'paced_dual' && tev < Dsv * 0.45) fronts.push({ u: Math.min(U.avExit, (tev / (Dsv * 0.4)) * U.avExit), blocked: false, atrial: true })
    fronts.push({ u: U.purk + Math.min(1, tev / Dsv) * (1 - U.purk), blocked: false, viaMuscle: true })
    return finish(fronts, 0, paceSpike, 'ventricle')
  }

  // ── fibrilação/flutter atrial ──
  if (k === 'afib' || k === 'flutter') {
    atriaChaos = k === 'afib' ? 1 : 0.6
    const Tpv = 60 / Math.max(30, spec.ventRate), n = Math.floor(t / Tpv)
    const jitter = k === 'afib' ? (hash(n) - 0.5) * 0.6 * Tpv : 0
    const tev = t - (n * Tpv + jitter), Dsv = Math.min(0.4, Tpv * 0.6)
    if (tev >= 0 && tev < Tpv) fronts.push({ u: U.av + Math.min(1, tev / Dsv) * (1 - U.av), blocked: false })
    return finish(fronts, atriaChaos, 0, null)
  }

  // ── trem atrial conduzido (normal, atrasos, bloqueios de 2º grau, bloqueios de ramo) ──
  const Tp = 60 / Math.max(20, spec.atrialRate), n = Math.floor(t / Tp), te = t % Tp
  const Ds = Math.min(0.55, Tp * 0.82)
  let capU = 1, avDwell = 0.12
  if (k === 'av_delay') avDwell = 0.8
  else if (k === 'wenckebach') { const cp = spec.conductPattern!, idx = n % cp.length; avDwell = 0.12 + idx * 0.24; if (!cp[idx]) capU = spec.blockU! }
  else if (k === 'infra_drop' || k === 'alternating') { const cp = spec.conductPattern!, idx = n % cp.length; if (!cp[idx]) capU = spec.blockU! }

  const v = spec.vent
  const stretch = v?.lbb === 'block' ? 2.2 : (v?.rbb === 'block' ? 1.35 : v?.rbb === 'delay' ? 1.12 : 1)
  const sw = sweep(te, Ds, avDwell, capU, stretch)
  fronts.push({ u: sw.u, blocked: sw.atBlock, atrial: capU < 1 })

  // componente ventricular com bloqueio de ramo
  let override: Partial<ConductionGlow> | undefined
  if (capU >= 1 && v) {
    const preT = Ds * 0.3, avT = Ds * (0.08 + avDwell * 0.6), postT = Ds * 0.55
    const tHis = preT + avT + ((U.his - U.avExit) / (1 - U.avExit)) * postT
    const vTrig = te - tHis
    const ramp = (delay: number) => vTrig < delay ? BASE : Math.min(1, BASE + (vTrig - delay) / 0.05)
    const lbbBlk = v.lbb === 'block', rbbBlk = v.rbb === 'block', rbbDly = v.rbb === 'delay'
    override = {
      lbb: lbbBlk ? BASE : ramp(0),
      rbb: rbbBlk ? BASE : (rbbDly ? ramp(0.03) : ramp(0)),
      lv: ramp(lbbBlk ? 0.07 : 0),       // BRE: VE tardio (via músculo)
      rv: ramp(rbbBlk ? 0.08 : (rbbDly ? 0.03 : 0)), // BRD: VD tardio (via músculo)
      purk: Math.max(ramp(lbbBlk ? 0.07 : 0), ramp(rbbBlk ? 0.08 : 0)),
    }
  }
  return finish(fronts, 0, 0, null, override)
}

function finish(fronts: Wavefront[], atriaChaos: number, paceSpike: number, escapeOrigin: 'junction' | 'ventricle' | null, override?: Partial<ConductionGlow>): ConductionState {
  const branch = glowAt(fronts, U.branch - 0.03, U.branch + 0.03, true)
  const vent = glowAt(fronts, 0.86, 1.0, false)
  const glow: ConductionGlow = {
    sa: glowAt(fronts, U.sa, 0.04, true),
    atria: Math.max(glowAt(fronts, 0.05, U.atria, true), atriaChaos > 0 ? 0.4 + 0.5 * Math.abs(Math.sin(nowMs() / 60)) : 0),
    av: glowAt(fronts, U.av - 0.03, U.avExit, true),
    his: glowAt(fronts, U.his - 0.02, U.his + 0.04, true),
    lbb: override?.lbb ?? branch, rbb: override?.rbb ?? branch,
    purk: override?.purk ?? glowAt(fronts, U.purk - 0.03, U.purk + 0.03, true),
    lv: override?.lv ?? vent, rv: override?.rv ?? vent,
  }
  const avBlockFlash = fronts.some((f) => f.blocked && f.u >= U.av - 0.03 && f.u < U.his - 0.02)
  const infraBlockFlash = fronts.some((f) => f.blocked && f.u >= U.his - 0.02)
  return { fronts, glow, avBlockFlash, infraBlockFlash, atriaChaos, paceSpike, escapeOrigin }
}

function nowMs() { return typeof performance !== 'undefined' ? performance.now() : Date.now() }

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
