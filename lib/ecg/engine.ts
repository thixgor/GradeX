/**
 * Motor de síntese de eletrocardiograma.
 *
 * Os traçados NÃO são imagens: cada amostra é calculada matematicamente a partir
 * de parâmetros eletrofisiológicos (amplitude, duração, eixo, morfologia). O modelo
 * usa soma de gaussianas por onda (P, Q, R, S, T, U) — a mesma família de modelos
 * dinâmicos de ECG descrita por McSharry & Clifford (IEEE TBME, 2003) — e projeção
 * vetorial no plano frontal para as derivações dos membros. As precordiais recebem
 * morfologia própria (progressão de R no plano horizontal).
 *
 * Convenções:
 *  - Amplitudes em mV (10 mm = 1 mV na calibração padrão).
 *  - Tempos em ms. R do QRS âncora em t = 0 dentro de cada batimento.
 *  - Eixos em graus, sistema hexaxial (I = 0°, aVF = +90°).
 */

export type LeadName =
  | 'I' | 'II' | 'III' | 'aVR' | 'aVL' | 'aVF'
  | 'V1' | 'V2' | 'V3' | 'V4' | 'V5' | 'V6'

export const LEADS: LeadName[] = ['I', 'II', 'III', 'aVR', 'aVL', 'aVF', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6']
export const LIMB_LEADS: LeadName[] = ['I', 'II', 'III', 'aVR', 'aVL', 'aVF']
export const PRECORDIAL_LEADS: LeadName[] = ['V1', 'V2', 'V3', 'V4', 'V5', 'V6']

/** Ângulos das derivações dos membros no plano frontal (sistema hexaxial de Cabrera). */
export const LIMB_ANGLE: Record<string, number> = {
  I: 0, II: 60, III: 120, aVR: -150, aVL: -30, aVF: 90,
}

/** Regiões anatômicas → derivações que as exploram. */
export const LEAD_REGIONS: Record<string, LeadName[]> = {
  septal: ['V1', 'V2'],
  anterior: ['V1', 'V2', 'V3', 'V4'],
  anteroseptal: ['V1', 'V2', 'V3', 'V4'],
  lateral: ['I', 'aVL', 'V5', 'V6'],
  highLateral: ['I', 'aVL'],
  inferior: ['II', 'III', 'aVF'],
  posterior: ['V1', 'V2', 'V3'], // recíproco (infra) — imagem em espelho
  rightVentricle: ['V1'],
  all: [...LEADS],
}

export interface PWaveSpec {
  present: boolean
  amp: number      // mV (vetor de P)
  axis: number     // graus
  width: number    // ms
  /** morfologia: 'normal' | 'peaked' (P pulmonale) | 'notched' (P mitrale) | 'inverted' */
  morphology?: 'normal' | 'peaked' | 'notched' | 'inverted'
  /** P bifásica em V1 (sobrecarga atrial): componente terminal negativa em V1 */
  biphasicV1?: number // profundidade do componente negativo terminal em V1 (mV, positivo = mais fundo)
}

export interface QRSSpec {
  axis: number        // eixo do QRS (graus)
  rAmp: number        // magnitude do vetor R (mV) no plano frontal
  qAmp: number        // magnitude de Q septal (mV)
  sAmp: number        // magnitude de S (mV)
  width: number       // duração do QRS (ms)
  /** entalhe/segundo pico (BRE/BRD): adiciona R' */
  rprime?: number     // amplitude do R' (mV) — usado nas precordiais direitas/esquerdas conforme block
  /** morfologia de ramo: molda V1-V6 e I/aVL/V5/V6 */
  block?: 'none' | 'rbbb' | 'lbbb' | 'ivcd' | 'rbbb_incomplete'
  /** onda delta (pré-excitação) em ms de encurtamento de PR / empastamento inicial */
  delta?: number      // 0 = ausente; >0 = amplitude da onda delta (mV)
  deltaPolarity?: number // ±1 conforme via acessória (padrão A/B)
}

export interface TWaveSpec {
  amp: number    // mV (vetor de T)
  axis: number   // graus
  width: number  // ms
}

export interface STSpec {
  /** desvio de ST por região em mV (positivo = supra, negativo = infra) */
  elevation?: Partial<Record<keyof typeof LEAD_REGIONS, number>>
  /** coving (convexidade superior tipo "tombstone") 0..1 */
  coving?: number
}

/** Inversão/alteração de T por região. */
export interface TRegionSpec {
  invert?: (keyof typeof LEAD_REGIONS)[]
  peak?: (keyof typeof LEAD_REGIONS)[]     // T apiculada (hipercalemia, hiperaguda)
  flatten?: (keyof typeof LEAD_REGIONS)[]
  biphasic?: (keyof typeof LEAD_REGIONS)[] // Wellens tipo A
}

export type RhythmKind =
  | 'sinus'
  | 'sinus_resp'        // arritmia sinusal respiratória
  | 'afib'
  | 'aflutter'
  | 'complete_block'    // dissociação AV
  | 'mobitz1'
  | 'mobitz2'
  | 'av_2_1'
  | 'pvc_pattern'       // extrassístoles/bigeminismo/trigeminismo
  | 'vt'                // TV monomórfica
  | 'torsades'          // TV polimórfica
  | 'vfib'
  | 'asystole'
  | 'paced'
  | 'atrial_ectopic'    // batimentos atriais prematuros isolados

export interface EcgPattern {
  id: string
  /** frequência ventricular alvo (bpm) */
  rate: number
  /** frequência atrial independente (bpm) — usado em BAVT/flutter */
  atrialRate?: number
  rhythm: RhythmKind
  /** intervalo PR em ms (para ritmos com condução) */
  pr?: number
  p: PWaveSpec
  qrs: QRSSpec
  t: TWaveSpec
  st?: STSpec
  tRegion?: TRegionSpec
  u?: { amp: number; width: number }
  /** overrides finos por derivação (ex.: onda J de Osborn, epsilon) */
  perLead?: Partial<Record<LeadName, Partial<GaussComp>[]>>
  /** ruído/artefato */
  artifact?: {
    baselineWander?: number  // mV
    muscleTremor?: number    // mV (alta frequência)
    mains?: number           // interferência 50/60 Hz (mV)
    mainsHz?: 50 | 60
  }
  /** amplitude das ondas de fibrilação atrial (mV) */
  fWaveAmp?: number
  /** irregularidade RR (0..1) para FA */
  rrVariability?: number
  /** parâmetros do padrão de EV */
  pvc?: { pattern: 'single' | 'bigeminy' | 'trigeminy' | 'quadrigeminy' | 'couplet' | 'multifocal' | 'ron_t'; count?: number }
  /** dextrocardia: inverte progressão precordial + I/aVL */
  dextrocardia?: boolean
  /** alternância elétrica (tamponamento): variação batimento a batimento da amplitude do QRS */
  electricalAlternans?: number // 0..1
}

export interface GaussComp {
  a: number   // amplitude (mV, com sinal)
  mu: number  // centro (ms, relativo ao R do batimento)
  sigma: number // desvio (ms)
}

/* ────────────────────────────── util ────────────────────────────── */

const deg2rad = (d: number) => (d * Math.PI) / 180
/** projeção de um vetor (magnitude, eixo) sobre uma derivação dos membros */
function project(mag: number, axisDeg: number, leadAngle: number) {
  return mag * Math.cos(deg2rad(axisDeg - leadAngle))
}

/** PRNG determinístico (mulberry32) — variações fisiológicas reprodutíveis */
function mulberry32(seed: number) {
  let a = seed >>> 0
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/* ─────────────────── morfologia precordial normal ─────────────────── */
// progressão de R fisiológica (rS em V1 → qR em V6), transição em V3-V4.
const PREC_R = { V1: 0.18, V2: 0.30, V3: 0.60, V4: 1.10, V5: 1.30, V6: 1.05 }
const PREC_S = { V1: 0.90, V2: 1.30, V3: 0.75, V4: 0.35, V5: 0.18, V6: 0.08 }
const PREC_Q = { V1: 0.00, V2: 0.00, V3: 0.00, V4: 0.00, V5: 0.08, V6: 0.10 }
// T precordial normal: negativa/baixa em V1, cresce até V2-V4
const PREC_T = { V1: -0.05, V2: 0.45, V3: 0.55, V4: 0.50, V5: 0.40, V6: 0.30 }

/**
 * Constrói os componentes gaussianos de UM batimento ventricular (QRS-T-U)
 * para uma derivação específica.
 */
function ventricularWaves(p: EcgPattern, lead: LeadName, opts?: { ampScale?: number }): GaussComp[] {
  const comps: GaussComp[] = []
  const ampScale = opts?.ampScale ?? 1
  const isLimb = LIMB_LEADS.includes(lead)
  const qrsW = p.qrs.width
  const sigmaR = Math.max(6, qrsW / 4.2)
  const dextro = p.dextrocardia

  // ── QRS ──
  let rAmp = 0, qAmp = 0, sAmp = 0, rPrime = 0
  if (isLimb) {
    let angle = LIMB_ANGLE[lead]
    if (dextro && (lead === 'I' || lead === 'aVL')) angle = angle + 180 // I/aVL invertem na dextrocardia
    const net = project(p.qrs.rAmp, p.qrs.axis, angle)
    if (net >= 0) {
      rAmp = net
      sAmp = project(p.qrs.sAmp, p.qrs.axis, angle) * 0.4
      sAmp = sAmp > 0 ? -0.05 : sAmp
    } else {
      // deflexão predominantemente negativa (ex.: aVR normal, QS)
      sAmp = net
      rAmp = Math.max(0, project(p.qrs.rAmp * 0.25, p.qrs.axis, angle))
    }
    qAmp = -Math.abs(project(p.qrs.qAmp, p.qrs.axis, angle))
  } else {
    // precordiais
    const key = lead as keyof typeof PREC_R
    let vList: LeadName[] = PRECORDIAL_LEADS
    let idx = vList.indexOf(lead)
    if (dextro) idx = vList.length - 1 - idx // dextrocardia: regressão de R
    const dl = vList[idx] as keyof typeof PREC_R
    rAmp = PREC_R[dl] * (0.6 + p.qrs.rAmp / 2.2)
    sAmp = -PREC_S[dl] * (0.6 + p.qrs.sAmp / 2.0)
    qAmp = -PREC_Q[dl]
    // bloqueios de ramo moldam as precordiais
    if (p.qrs.block === 'rbbb' || p.qrs.block === 'rbbb_incomplete') {
      if (lead === 'V1' || lead === 'V2') { rAmp = key === 'V1' ? 0.35 : 0.4; rPrime = 0.7 } // rSR'
      if (lead === 'V5' || lead === 'V6' || lead === 'I') sAmp = -0.35 // S empastada
    }
    if (p.qrs.block === 'lbbb') {
      if (lead === 'V1' || lead === 'V2') { rAmp = 0.05; sAmp = -1.6; qAmp = 0 } // QS amplo
      if (lead === 'V5' || lead === 'V6') { rAmp = 1.5; qAmp = 0; rPrime = 0.5; sAmp = 0 } // R entalhado, sem q
    }
  }

  rAmp *= ampScale; sAmp *= ampScale; qAmp *= ampScale; rPrime *= ampScale

  const qrsStart = -qrsW / 2
  if (Math.abs(qAmp) > 0.005) comps.push({ a: qAmp, mu: qrsStart + sigmaR * 0.6, sigma: sigmaR * 0.55 })

  // onda delta (pré-excitação): empastamento inicial do QRS
  if (p.qrs.delta && p.qrs.delta > 0) {
    const pol = (p.qrs.deltaPolarity ?? 1)
    // padrão B (delta neg em V1), padrão A (delta pos em V1)
    let dsign = pol
    if (lead === 'V1' || lead === 'V2') dsign = p.qrs.deltaPolarity ?? 1
    comps.push({ a: p.qrs.delta * dsign * 0.6, mu: qrsStart, sigma: sigmaR * 1.4 })
  }

  if (rAmp > 0.005) comps.push({ a: rAmp, mu: 0, sigma: sigmaR })
  if (rPrime > 0.005) comps.push({ a: rPrime, mu: sigmaR * 1.8, sigma: sigmaR * 0.9 })
  if (Math.abs(sAmp) > 0.005) comps.push({ a: sAmp, mu: qrsStart + qrsW * 0.72, sigma: sigmaR * 0.7 })

  // ── segmento ST ──
  const stShift = regionValue(p.st?.elevation, lead)
  if (Math.abs(stShift) > 0.005) {
    const coving = p.st?.coving ?? 0
    // supra: gaussiana larga do ponto J até a T (coving desloca o centro p/ frente)
    comps.push({ a: stShift, mu: qrsW * 0.5 + 40 + coving * 60, sigma: 55 + coving * 30 })
    if (coving > 0) comps.push({ a: stShift * 0.6, mu: qrsW * 0.5 + 20, sigma: 22 })
  }

  // ── onda T ──
  let tAmp: number
  if (isLimb) {
    tAmp = project(p.t.amp, p.t.axis, LIMB_ANGLE[lead])
  } else {
    const dl = lead as keyof typeof PREC_T
    tAmp = PREC_T[dl] * (0.5 + p.t.amp / 0.6)
  }
  // alterações regionais de T
  if (inRegions(p.tRegion?.invert, lead)) tAmp = -Math.abs(tAmp || 0.3) - 0.15
  if (inRegions(p.tRegion?.flatten, lead)) tAmp *= 0.15
  if (inRegions(p.tRegion?.peak, lead)) tAmp = Math.abs(tAmp) + 0.5
  const tPeaked = inRegions(p.tRegion?.peak, lead)
  const tSigma = tPeaked ? Math.max(30, p.t.width / 4.5) : p.t.width / 3.2
  const tCenter = qrsW * 0.5 + (p.st ? 200 : 190) + (tPeaked ? -20 : 0)
  if (Math.abs(tAmp) > 0.005) {
    comps.push({ a: tAmp, mu: tCenter, sigma: tSigma })
    if (inRegions(p.tRegion?.biphasic, lead)) {
      comps.push({ a: -Math.abs(tAmp) * 1.3, mu: tCenter + tSigma * 1.6, sigma: tSigma * 0.7 })
    }
  }

  // ── onda U ──
  if (p.u && p.u.amp > 0.005) {
    comps.push({ a: p.u.amp * (isLimb ? 0.6 : 1), mu: tCenter + p.t.width * 0.9, sigma: p.u.width / 3 })
  }

  // overrides finos por derivação (onda J de Osborn, epsilon, etc.)
  const overrides = p.perLead?.[lead]
  if (overrides) for (const o of overrides) comps.push({ a: o.a ?? 0, mu: o.mu ?? 0, sigma: o.sigma ?? 15 })

  return comps
}

function regionValue(map: STSpec['elevation'] | undefined, lead: LeadName): number {
  if (!map) return 0
  let val = 0
  for (const region in map) {
    const leads = LEAD_REGIONS[region as keyof typeof LEAD_REGIONS]
    if (leads && leads.includes(lead)) {
      const v = (map as any)[region] as number
      // posterior é imagem-espelho: infra de ST em V1-V3
      val += region === 'posterior' ? -Math.abs(v) : v
    }
  }
  return val
}

function inRegions(regions: (keyof typeof LEAD_REGIONS)[] | undefined, lead: LeadName): boolean {
  if (!regions) return false
  return regions.some(r => (LEAD_REGIONS[r] || []).includes(lead))
}

/** Componentes da onda P para uma derivação. */
function pWaves(p: EcgPattern, lead: LeadName, muOffset: number): GaussComp[] {
  if (!p.p.present || p.p.amp <= 0) return []
  const comps: GaussComp[] = []
  const isLimb = LIMB_LEADS.includes(lead)
  let amp = isLimb
    ? project(p.p.amp, p.p.axis, LIMB_ANGLE[lead])
    : (lead === 'V1' ? p.p.amp * 0.5 : p.p.amp * 0.7)
  if (p.p.morphology === 'inverted') amp = -Math.abs(amp)
  const sigma = p.p.width / 3.2
  if (p.p.morphology === 'notched' && isLimb) {
    // P mitrale: bífida (dois corcovos) em derivações inferiores/I
    comps.push({ a: amp * 0.9, mu: muOffset - sigma * 0.8, sigma: sigma * 0.8 })
    comps.push({ a: amp * 0.9, mu: muOffset + sigma * 0.9, sigma: sigma * 0.8 })
  } else if (p.p.morphology === 'peaked') {
    comps.push({ a: amp * 1.4, mu: muOffset, sigma: sigma * 0.75 })
  } else {
    comps.push({ a: amp, mu: muOffset, sigma })
  }
  // componente terminal negativo em V1 (sobrecarga atrial esquerda)
  if (p.p.biphasicV1 && (lead === 'V1' || lead === 'V2')) {
    comps.push({ a: p.p.biphasicV1 * 0.35, mu: muOffset + sigma * 1.6, sigma: sigma * 0.9 })
    comps.push({ a: -p.p.biphasicV1, mu: muOffset + sigma * 2.4, sigma: sigma * 0.9 })
  }
  return comps
}

function evalGauss(comps: GaussComp[], t: number): number {
  let v = 0
  for (const c of comps) {
    const d = t - c.mu
    v += c.a * Math.exp(-(d * d) / (2 * c.sigma * c.sigma))
  }
  return v
}

/* ───────────────────── geração de tempos de eventos ───────────────────── */

export interface BeatEvent {
  t: number          // ms (posição do R)
  kind: 'normal' | 'pvc' | 'escape' | 'paced' | 'aberrant'
  ampScale?: number
  widthScale?: number
  axisOverride?: number
}
export interface AtrialEvent { t: number; conducted: boolean }

export interface Timeline { beats: BeatEvent[]; atria: AtrialEvent[] }

/**
 * Gera a sequência de eventos (batimentos ventriculares e ondas atriais)
 * ao longo de `durationMs`, conforme o tipo de ritmo.
 */
export function buildTimeline(p: EcgPattern, durationMs: number, seed = 7): Timeline {
  const rand = mulberry32(seed)
  const beats: BeatEvent[] = []
  const atria: AtrialEvent[] = []
  const rr = 60000 / Math.max(20, p.rate)
  const pr = p.pr ?? 160

  const pushSinusP = (beatT: number) => atria.push({ t: beatT - pr, conducted: true })

  switch (p.rhythm) {
    case 'sinus':
    case 'atrial_ectopic': {
      let t = 200
      let i = 0
      while (t < durationMs) {
        const isEctopic = p.rhythm === 'atrial_ectopic' && i > 0 && i % 5 === 0
        if (isEctopic) {
          // batimento atrial prematuro: P precoce e diferente, QRS normal (estreito)
          const early = t - rr * 0.32
          atria.push({ t: early - pr * 0.7, conducted: true })
          beats.push({ t: early, kind: 'normal' })
          t = early + rr * 1.05 // pausa não compensatória
        } else {
          pushSinusP(t)
          beats.push({ t, kind: 'normal' })
          t += rr
        }
        i++
      }
      break
    }
    case 'sinus_resp': {
      let t = 200
      let phase = 0
      while (t < durationMs) {
        pushSinusP(t)
        beats.push({ t, kind: 'normal' })
        const mod = 1 + 0.18 * Math.sin(phase) // variação respiratória
        t += rr * mod
        phase += 0.6
      }
      break
    }
    case 'afib': {
      const varib = p.rrVariability ?? 0.35
      let t = 300
      while (t < durationMs) {
        beats.push({ t, kind: 'normal' })
        const jitter = 1 + (rand() - 0.5) * 2 * varib
        t += rr * Math.max(0.45, jitter)
      }
      // sem ondas P organizadas
      break
    }
    case 'aflutter': {
      // flutter atrial ~300/min contínuo (gerado no baseline); QRS na razão de condução
      const aRate = p.atrialRate ?? 300
      const fRR = 60000 / aRate
      for (let ft = 0; ft < durationMs; ft += fRR) atria.push({ t: ft, conducted: false })
      let t = 300
      while (t < durationMs) {
        beats.push({ t, kind: 'normal' })
        t += rr
      }
      break
    }
    case 'av_2_1':
    case 'mobitz2': {
      const aRate = p.atrialRate ?? p.rate * (p.rhythm === 'av_2_1' ? 2 : 1.4)
      const aRR = 60000 / aRate
      let n = 0
      const dropEvery = p.rhythm === 'av_2_1' ? 2 : 3
      for (let at = 200; at < durationMs; at += aRR) {
        const conducted = (n % dropEvery !== dropEvery - 1)
        atria.push({ t: at, conducted })
        if (conducted) beats.push({ t: at + pr, kind: 'normal' })
        n++
      }
      break
    }
    case 'mobitz1': {
      // Wenckebach: PR alonga progressivamente até bloquear (ciclo 4:3)
      const aRR = 60000 / (p.atrialRate ?? p.rate * 1.25)
      let n = 0
      let at = 200
      const prSteps = [pr, pr + 60, pr + 110, NaN] // 4º P bloqueado
      while (at < durationMs) {
        const step = prSteps[n % prSteps.length]
        const conducted = !Number.isNaN(step)
        atria.push({ t: at, conducted })
        if (conducted) beats.push({ t: at + step, kind: 'normal' })
        at += aRR
        n++
      }
      break
    }
    case 'complete_block': {
      // dissociação AV: átrios e ventrículos independentes
      const aRR = 60000 / (p.atrialRate ?? 80)
      for (let at = 100; at < durationMs; at += aRR) atria.push({ t: at, conducted: false })
      const vRR = 60000 / Math.max(20, p.rate)
      for (let vt = 500; vt < durationMs; vt += vRR) beats.push({ t: vt, kind: 'escape' })
      break
    }
    case 'pvc_pattern': {
      const pat = p.pvc?.pattern ?? 'single'
      let t = 250
      let i = 0
      while (t < durationMs) {
        let isPVC = false
        if (pat === 'bigeminy') isPVC = i % 2 === 1
        else if (pat === 'trigeminy') isPVC = i % 3 === 2
        else if (pat === 'quadrigeminy') isPVC = i % 4 === 3
        else if (pat === 'single') isPVC = i === 4 || i === 9
        else if (pat === 'couplet') isPVC = i === 4 || i === 5
        else if (pat === 'multifocal') isPVC = i === 3 || i === 6 || i === 9
        else if (pat === 'ron_t') isPVC = i === 5
        if (isPVC) {
          const early = pat === 'ron_t' ? t - rr * 0.55 : t - rr * 0.25
          beats.push({
            t: early, kind: 'pvc', ampScale: 1.6, widthScale: 2.4,
            axisOverride: pat === 'multifocal' && i % 2 === 0 ? -60 : 150,
          })
          t = early + rr * (pat === 'single' || pat === 'couplet' ? 1.6 : 1.15) // pausa compensatória
        } else {
          pushSinusP(t)
          beats.push({ t, kind: 'normal' })
          t += rr
        }
        i++
      }
      break
    }
    case 'vt': {
      const vRR = 60000 / Math.max(120, p.rate)
      for (let t = 200; t < durationMs; t += vRR) beats.push({ t, kind: 'pvc', ampScale: 1.5, widthScale: 2.6 })
      break
    }
    case 'torsades': {
      // TV polimórfica: eixo/amplitude oscilam (twisting) — tratado na síntese
      const vRR = 60000 / Math.max(180, p.rate)
      let i = 0
      for (let t = 200; t < durationMs; t += vRR * (0.85 + 0.3 * Math.random())) {
        beats.push({ t, kind: 'pvc', ampScale: 1, widthScale: 2.6 })
        i++
      }
      break
    }
    case 'paced': {
      const vRR = 60000 / Math.max(50, p.rate)
      for (let t = 200; t < durationMs; t += vRR) beats.push({ t, kind: 'paced', ampScale: 1.2, widthScale: 2.3 })
      break
    }
    case 'vfib':
    case 'asystole':
      break
  }

  return { beats, atria }
}

/* ───────────────────────── síntese do sinal ───────────────────────── */

export interface SynthOptions {
  durationMs: number
  fs: number          // amostras por segundo
  seed?: number
}

/**
 * Sintetiza o sinal (mV) de uma derivação ao longo do tempo.
 * Retorna um Float32Array de `durationMs * fs / 1000` amostras.
 */
export function synthesizeLead(p: EcgPattern, lead: LeadName, opts: SynthOptions): Float32Array {
  const n = Math.floor((opts.durationMs * opts.fs) / 1000)
  const out = new Float32Array(n)
  const dt = 1000 / opts.fs
  const rand = mulberry32((opts.seed ?? 7) + lead.charCodeAt(0))

  // Fibrilação ventricular: onda caótica senoidal com frequência/amplitude variáveis
  if (p.rhythm === 'vfib') {
    let phase = 0
    for (let i = 0; i < n; i++) {
      const t = i * dt
      const f = 5 + 2.5 * Math.sin(t / 900) + (rand() - 0.5)
      phase += (2 * Math.PI * f) / opts.fs
      out[i] = (0.35 + 0.15 * Math.sin(t / 500)) * Math.sin(phase) + (rand() - 0.5) * 0.05
    }
    return applyArtifacts(out, p, opts, rand)
  }
  if (p.rhythm === 'asystole') {
    for (let i = 0; i < n; i++) out[i] = (rand() - 0.5) * 0.02
    return applyArtifacts(out, p, opts, rand)
  }

  const tl = buildTimeline(p, opts.durationMs, opts.seed ?? 7)

  // pré-computa componentes ventriculares base para esta derivação
  const baseVent = ventricularWaves(p, lead)

  // onda P associada (offset relativo ao R = -pr)
  const prOffset = -(p.pr ?? 160)

  for (let i = 0; i < n; i++) {
    const t = i * dt
    let v = 0

    // batimentos ventriculares
    for (const b of tl.beats) {
      const rel = t - b.t
      if (rel < -260 || rel > 520) continue // janela do batimento
      if (b.kind === 'normal' && b.ampScale == null && b.widthScale == null) {
        v += evalGauss(baseVent, rel)
      } else {
        // batimento modificado (EV, escape, marcapasso): recomputa
        const comps = beatComps(p, lead, b, i)
        // spike de marcapasso
        if (b.kind === 'paced' && Math.abs(rel + p.qrs.width * 0.9) < dt) v += 1.4
        v += evalGauss(comps, rel)
      }
    }

    // ondas atriais associadas (P do ritmo sinusal / condução)
    if (p.p.present) {
      for (const b of tl.beats) {
        if (b.kind === 'pvc' || b.kind === 'escape' || b.kind === 'paced') continue
        const rel = t - (b.t + prOffset)
        if (rel < -120 || rel > 120) continue
        v += evalGauss(pWaves(p, lead, 0), rel)
      }
    }
    // P dissociadas (BAVT) / P de condução explícita
    for (const a of tl.atria) {
      if (a.conducted && p.rhythm !== 'mobitz1' && p.rhythm !== 'mobitz2' && p.rhythm !== 'av_2_1' && p.rhythm !== 'complete_block') continue
      const rel = t - a.t
      if (rel < -120 || rel > 120) continue
      if (p.rhythm === 'complete_block' || p.rhythm === 'mobitz1' || p.rhythm === 'mobitz2' || p.rhythm === 'av_2_1') {
        v += evalGauss(pWaves(p, lead, 0), rel)
      }
    }

    out[i] = v
  }

  // ondas de flutter (sawtooth contínuo, negativo em II/III/aVF)
  if (p.rhythm === 'aflutter') addFlutter(out, p, opts, lead)
  // ondas f de fibrilação atrial (baseline irregular fino)
  if (p.rhythm === 'afib' && (p.fWaveAmp ?? 0) > 0) addFibrillatory(out, p, opts, lead, rand)
  // twisting de torsades
  if (p.rhythm === 'torsades') applyTorsadesEnvelope(out, opts)

  return applyArtifacts(out, p, opts, rand)
}

function beatComps(p: EcgPattern, lead: LeadName, b: BeatEvent, seed: number): GaussComp[] {
  if (b.kind === 'normal') return ventricularWaves(p, lead, { ampScale: b.ampScale })
  // Escape (dissociação AV): a morfologia já está declarada no próprio padrão —
  // juncional = QRS estreito e normal (His-Purkinje intacto);
  // ventricular = QRS largo/bizarro (padrão traz width≥120, ivcd, eixo e T discordante).
  // Renderizar o padrão como está faz a medida bater com o declarado.
  if (b.kind === 'escape') return ventricularWaves(p, lead, { ampScale: b.ampScale })
  // TV/marca-passo/AIVR/torsades: o padrão-base JÁ é a morfologia ectópica larga
  // (width≥120). Aplicar outro alargamento duplicaria a largura → medida irreal.
  if ((b.kind === 'pvc' || b.kind === 'paced') && (p.qrs.width ?? 0) >= 120)
    return ventricularWaves(p, lead, { ampScale: b.ampScale })
  // EV isolada sobre base sinusal estreita: QRS largo e bizarro, T discordante.
  const widthScale = b.widthScale ?? 2.4
  const wideP: EcgPattern = {
    ...p,
    qrs: {
      ...p.qrs,
      axis: b.axisOverride ?? (p.qrs.axis + 160),
      width: p.qrs.width * widthScale,
      qAmp: 0,
      block: 'ivcd',
    },
    // T discordante (oposta ao QRS)
    t: { ...p.t, amp: -Math.abs(p.t.amp) - 0.2, axis: (b.axisOverride ?? p.qrs.axis) + 180 },
    st: undefined, tRegion: undefined, u: undefined,
  }
  const comps = ventricularWaves(wideP, lead, { ampScale: (b.ampScale ?? 1.4) })
  return comps
}

function addFlutter(out: Float32Array, p: EcgPattern, opts: SynthOptions, lead: LeadName) {
  const n = out.length
  const dt = 1000 / opts.fs
  const aRate = p.atrialRate ?? 300
  const period = 60000 / aRate
  const amp = lead === 'II' || lead === 'III' || lead === 'aVF' ? -0.18
    : lead === 'V1' ? 0.12 : lead === 'I' ? -0.05 : -0.08
  for (let i = 0; i < n; i++) {
    const t = i * dt
    const phase = (t % period) / period
    // dente-de-serra: subida lenta, descida rápida
    const saw = phase < 0.7 ? phase / 0.7 : 1 - (phase - 0.7) / 0.3
    out[i] += amp * (saw - 0.5) * 1.4
  }
}

function addFibrillatory(out: Float32Array, p: EcgPattern, opts: SynthOptions, lead: LeadName, rand: () => number) {
  const n = out.length
  const dt = 1000 / opts.fs
  const amp = (p.fWaveAmp ?? 0.05) * (lead === 'V1' ? 1.4 : 1)
  let s = 0
  for (let i = 0; i < n; i++) {
    const t = i * dt
    s = 0.85 * s + 0.15 * (rand() - 0.5)
    out[i] += amp * (Math.sin(t / 22) * 0.4 + s * 3)
  }
}

function applyTorsadesEnvelope(out: Float32Array, opts: SynthOptions) {
  const n = out.length
  const dt = 1000 / opts.fs
  for (let i = 0; i < n; i++) {
    const t = i * dt
    const env = Math.sin((2 * Math.PI * t) / 2400) // eixo gira (~2.4 s por torção)
    out[i] *= env
  }
}

function applyArtifacts(out: Float32Array, p: EcgPattern, opts: SynthOptions, rand: () => number): Float32Array {
  const a = p.artifact
  if (!a) return out
  const n = out.length
  const dt = 1000 / opts.fs
  let wander = 0
  for (let i = 0; i < n; i++) {
    const t = i * dt
    if (a.baselineWander) {
      wander = 0.995 * wander + 0.005 * (rand() - 0.5)
      out[i] += a.baselineWander * (Math.sin(t / 700) * 0.5 + wander * 8)
    }
    if (a.muscleTremor) out[i] += a.muscleTremor * (rand() - 0.5) * 2
    if (a.mains) out[i] += a.mains * Math.sin((2 * Math.PI * (a.mainsHz ?? 60) * t) / 1000)
  }
  return out
}

/* ─────────────────── medidas automáticas do padrão ─────────────────── */

export interface EcgMeasurements {
  hr: number
  pr: number | null
  qrs: number
  qt: number
  qtc: number
  axis: number
  rr: number
  pAmp: number
  rAmp: number
  tAmp: number
  axisLabel: string
  interpretation: string[]
}

/** Bazett: QTc = QT / sqrt(RR[s]) */
export function computeMeasurements(p: EcgPattern): EcgMeasurements {
  const rr = 60000 / Math.max(20, p.rate)
  // QT aproximado: do início do QRS ao fim da T, coerente com a morfologia sintetizada
  // (início ~ metade do QRS antes do R; T termina ~ centro da T + caudas).
  const qt = Math.round(p.qrs.width * 0.5 + 200 + p.t.width * 0.8 + (p.st?.elevation ? 20 : 0))
  const qtc = Math.round(qt / Math.sqrt(rr / 1000))
  const axisLabel = classifyAxis(p.qrs.axis)
  const interp: string[] = []
  if (p.rate < 60) interp.push('Bradicardia (FC < 60 bpm)')
  else if (p.rate > 100) interp.push('Taquicardia (FC > 100 bpm)')
  if ((p.pr ?? 160) > 200 && p.rhythm !== 'complete_block') interp.push('PR prolongado (> 200 ms)')
  if (p.qrs.width >= 120) interp.push('QRS alargado (≥ 120 ms)')
  if (qtc > 460) interp.push('QTc prolongado')
  if (qtc < 350) interp.push('QTc curto')

  return {
    hr: Math.round(p.rate),
    pr: p.p.present && p.pr && p.rhythm !== 'complete_block' && p.rhythm !== 'afib' ? p.pr : null,
    qrs: Math.round(p.qrs.width),
    qt,
    qtc,
    axis: Math.round(p.qrs.axis),
    rr: Math.round(rr),
    pAmp: +(p.p.amp).toFixed(2),
    rAmp: +(p.qrs.rAmp).toFixed(2),
    tAmp: +(p.t.amp).toFixed(2),
    axisLabel,
    interpretation: interp,
  }
}

export function classifyAxis(axis: number): string {
  let a = axis
  while (a > 180) a -= 360
  while (a < -180) a += 360
  if (a >= -30 && a <= 90) return 'Eixo normal'
  if (a > 90 && a <= 180) return 'Desvio do eixo para a direita'
  if (a >= -90 && a < -30) return 'Desvio do eixo para a esquerda'
  return 'Desvio extremo do eixo (noroeste)'
}
