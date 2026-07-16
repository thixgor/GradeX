/**
 * Laboratório vivo do ECG — "sliders ao vivo".
 *
 * Cada cenário expõe controles deslizantes cujos valores são mapeados, de forma
 * fisiologicamente fiel, para mutações do `EcgPattern`. Ao arrastar o controle,
 * o traçado é re-sintetizado na hora (o motor `synthesizeLead` é puro/rápido).
 *
 * As progressões seguem a evolução eletrocardiográfica clássica descrita na
 * literatura (Braunwald; Surawicz; Goldberger). Nada é inventado: são as mesmas
 * alterações que aparecem no catálogo, agora como um contínuo.
 */
import type { EcgPattern, LeadName, PWaveSpec, QRSSpec, TWaveSpec } from './engine'

export type Tone = 'normal' | 'info' | 'warn' | 'danger'

export interface PlaygroundPreset {
  label: string
  /** valores a aplicar (por id de controle) */
  set: Record<string, number>
  hint?: string
  tone?: Tone
}

export interface PlaygroundControl {
  id: string
  label: string
  unit?: string
  min: number
  max: number
  step: number
  default: number
  format?: (v: number) => string
  /** faixas clínicas ao longo do trajeto (fundo colorido sob o slider) */
  zones?: { from: number; to: number; label: string; tone: Tone }[]
}

export interface PlaygroundFinding { text: string; tone: Tone }

export interface PlaygroundScenario {
  id: string
  title: string
  emoji: string
  blurb: string
  controls: PlaygroundControl[]
  /** botões de atalho (drogas, manobras) que definem valores */
  presets?: PlaygroundPreset[]
  build: (v: Record<string, number>) => EcgPattern
  findings: (v: Record<string, number>) => PlaygroundFinding[]
  /** derivações mais didáticas para o cenário */
  leads?: LeadName[]
}

/* ─────────────────────────── utilidades ─────────────────────────── */
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))
/** interpolação linear com saturação fora de [x0,x1] */
function ramp(x: number, x0: number, x1: number, y0: number, y1: number) {
  if (x1 === x0) return x <= x0 ? y0 : y1
  const t = clamp((x - x0) / (x1 - x0), 0, 1)
  return y0 + (y1 - y0) * t
}

const P0: PWaveSpec = { present: true, amp: 0.15, axis: 55, width: 100, morphology: 'normal' }
const QRS0: QRSSpec = { axis: 60, rAmp: 1.0, qAmp: 0.08, sAmp: 0.9, width: 90, block: 'none' }
const T0: TWaveSpec = { amp: 0.3, axis: 45, width: 160 }
function base(id: string): EcgPattern {
  return { id, rate: 72, rhythm: 'sinus', pr: 160, p: { ...P0 }, qrs: { ...QRS0 }, t: { ...T0 } }
}

/* ─────────────────────────── cenários ─────────────────────────── */

// 1) HIPERCALEMIA — potássio sérico
const potassio: PlaygroundScenario = {
  id: 'potassio',
  title: 'Hipercalemia',
  emoji: '🧂',
  blurb: 'Arraste o potássio sérico e veja a progressão: T apiculada → achatamento da P e PR longo → QRS largo → padrão sinusoidal pré-parada.',
  leads: ['II', 'V2', 'V4', 'V5'],
  controls: [{
    id: 'k', label: 'Potássio sérico', unit: 'mEq/L', min: 3, max: 9.5, step: 0.1, default: 4.2,
    format: (v) => v.toFixed(1),
    zones: [
      { from: 3, to: 5.5, label: 'Normal', tone: 'normal' },
      { from: 5.5, to: 6.5, label: 'T apiculada', tone: 'warn' },
      { from: 6.5, to: 7.5, label: 'P achatada / PR longo', tone: 'warn' },
      { from: 7.5, to: 8.5, label: 'QRS largo', tone: 'danger' },
      { from: 8.5, to: 9.5, label: 'Sinusoidal', tone: 'danger' },
    ],
  }],
  build: (v) => {
    const k = v.k
    const p = base('pg-hipercalemia')
    // T apiculada: sobe de 0,3 (K 5) até ~1,4 (K 7), simétrica e estreita
    p.t.amp = ramp(k, 5.0, 7.0, 0.3, 1.4)
    p.t.width = ramp(k, 5.5, 8.0, 160, 105)
    if (k >= 5.5) p.tRegion = { peak: ['all'] }
    // onda P: achata de 6,0 a 7,5 e desaparece depois
    p.p.amp = ramp(k, 6.0, 7.5, 0.15, 0)
    p.p.present = k < 7.5
    // PR alarga de 6,0 a 7,5 (antes de a P sumir)
    p.pr = Math.round(ramp(k, 6.0, 7.5, 160, 280))
    // QRS alarga progressivamente a partir de 6,5
    p.qrs.width = Math.round(ramp(k, 6.5, 8.5, 90, 200))
    if (p.qrs.width >= 118) p.qrs.block = 'ivcd'
    // padrão sinusoidal: QRS e T muito largos e fundidos, bradicardia
    if (k >= 8.0) { p.t.width = ramp(k, 8.0, 9.5, 130, 280); p.t.amp = ramp(k, 8.0, 9.5, 1.4, 1.8) }
    p.rate = Math.round(ramp(k, 8.0, 9.5, 72, 40))
    return p
  },
  findings: (v) => {
    const k = v.k, f: PlaygroundFinding[] = []
    if (k < 5.5) f.push({ text: 'ECG dentro da normalidade', tone: 'normal' })
    if (k >= 5.5) f.push({ text: 'Ondas T apiculadas, altas, simétricas e de base estreita', tone: 'warn' })
    if (k >= 6.5) f.push({ text: 'Achatamento da onda P e prolongamento do PR', tone: 'warn' })
    if (k >= 6.8) f.push({ text: 'Alargamento progressivo do QRS', tone: 'danger' })
    if (k >= 7.5) f.push({ text: 'Desaparecimento das ondas P (paralisia atrial)', tone: 'danger' })
    if (k >= 8.5) f.push({ text: 'Padrão sinusoidal (fusão QRS-T) — parada iminente', tone: 'danger' })
    return f
  },
}

// 2) CRONOTROPISMO — frequência cardíaca, drogas e manobras
const cronotropismo: PlaygroundScenario = {
  id: 'cronotropismo',
  title: 'Frequência / cronotropismo',
  emoji: '💓',
  blurb: 'Frequência sinusal sob efeito de drogas e manobras. Infunda adrenalina/atropina e veja a FC subir; faça manobra vagal e veja cair.',
  leads: ['II', 'V1', 'V5'],
  controls: [{
    id: 'fc', label: 'Frequência cardíaca', unit: 'bpm', min: 30, max: 190, step: 1, default: 72,
    format: (v) => `${Math.round(v)}`,
    zones: [
      { from: 30, to: 60, label: 'Bradicardia', tone: 'info' },
      { from: 60, to: 100, label: 'Normal', tone: 'normal' },
      { from: 100, to: 190, label: 'Taquicardia', tone: 'warn' },
    ],
  }],
  presets: [
    { label: 'Adrenalina', set: { fc: 150 }, hint: 'agonista β1', tone: 'warn' },
    { label: 'Isoproterenol', set: { fc: 165 }, hint: 'β1/β2 potente', tone: 'warn' },
    { label: 'Atropina', set: { fc: 115 }, hint: 'bloqueio vagal', tone: 'warn' },
    { label: 'Dobutamina', set: { fc: 118 }, hint: 'β1', tone: 'warn' },
    { label: 'Repouso', set: { fc: 72 }, hint: 'basal', tone: 'normal' },
    { label: 'Manobra vagal', set: { fc: 50 }, hint: '↑ tônus vagal', tone: 'info' },
    { label: 'Massagem carotídea', set: { fc: 46 }, hint: 'reflexo vagal', tone: 'info' },
    { label: 'β-bloqueador', set: { fc: 52 }, hint: 'metoprolol', tone: 'info' },
    { label: 'Verapamil/Diltiazem', set: { fc: 55 }, hint: 'BCC não-diidro', tone: 'info' },
    { label: 'Digoxina', set: { fc: 50 }, hint: '↑ tônus vagal', tone: 'info' },
  ],
  build: (v) => {
    const p = base('pg-cronotropismo')
    p.rate = v.fc
    // taquicardia encurta levemente o PR; bradicardia acentuada o alonga um pouco
    if (v.fc > 100) p.pr = Math.round(ramp(v.fc, 100, 190, 160, 118))
    else if (v.fc < 55) p.pr = Math.round(ramp(v.fc, 55, 30, 165, 205))
    return p
  },
  findings: (v) => {
    const fc = v.fc, f: PlaygroundFinding[] = []
    if (fc < 60) f.push({ text: `Bradicardia sinusal (${Math.round(fc)} bpm)`, tone: 'info' })
    else if (fc > 100) f.push({ text: `Taquicardia sinusal (${Math.round(fc)} bpm)`, tone: 'warn' })
    else f.push({ text: `Ritmo sinusal normocárdico (${Math.round(fc)} bpm)`, tone: 'normal' })
    if (fc > 150) f.push({ text: 'Onda P pode se fundir à T precedente em FC muito altas', tone: 'warn' })
    if (fc < 40) f.push({ text: 'Bradicardia grave — considerar escape juncional/marca-passo', tone: 'danger' })
    return f
  },
}

// 3) EIXO ELÉTRICO
const eixo: PlaygroundScenario = {
  id: 'eixo',
  title: 'Eixo elétrico',
  emoji: '🧭',
  blurb: 'Gire o eixo do QRS no plano frontal e acompanhe a mudança de polaridade em DI, DII, DIII e aVF.',
  leads: ['I', 'II', 'III', 'aVF'],
  controls: [{
    id: 'axis', label: 'Eixo do QRS', unit: '°', min: -120, max: 180, step: 1, default: 60,
    format: (v) => `${Math.round(v)}°`,
    zones: [
      { from: -120, to: -30, label: 'Desvio à esquerda / extremo', tone: 'warn' },
      { from: -30, to: 90, label: 'Normal', tone: 'normal' },
      { from: 90, to: 180, label: 'Desvio à direita', tone: 'warn' },
    ],
  }],
  build: (v) => { const p = base('pg-eixo'); p.qrs.axis = v.axis; p.t.axis = v.axis * 0.7; return p },
  findings: (v) => {
    const a = v.axis, f: PlaygroundFinding[] = []
    if (a >= -30 && a <= 90) f.push({ text: 'Eixo normal (−30° a +90°)', tone: 'normal' })
    else if (a < -30 && a >= -90) f.push({ text: 'Desvio do eixo para a esquerda — QRS negativo em DII/aVF, positivo em DI', tone: 'warn' })
    else if (a > 90) f.push({ text: 'Desvio do eixo para a direita — QRS negativo em DI, positivo em aVF', tone: 'warn' })
    else f.push({ text: 'Desvio extremo do eixo (noroeste) — negativo em DI e aVF', tone: 'danger' })
    return f
  },
}

// 4) INTERVALO PR / BAV de 1º grau
const conducaoAV: PlaygroundScenario = {
  id: 'conducaoAV',
  title: 'Condução AV (intervalo PR)',
  emoji: '🚦',
  blurb: 'Prolongue a condução pelo nó AV. Acima de 200 ms surge o BAV de 1º grau; PR muito longo indica risco de progressão.',
  leads: ['II', 'V1'],
  controls: [{
    id: 'pr', label: 'Intervalo PR', unit: 'ms', min: 120, max: 400, step: 2, default: 160,
    format: (v) => `${Math.round(v)}`,
    zones: [
      { from: 120, to: 200, label: 'Normal', tone: 'normal' },
      { from: 200, to: 300, label: 'BAV 1º grau', tone: 'warn' },
      { from: 300, to: 400, label: 'BAV 1º grau acentuado', tone: 'danger' },
    ],
  }],
  build: (v) => { const p = base('pg-pr'); p.pr = Math.round(v.pr); return p },
  findings: (v) => {
    const pr = v.pr, f: PlaygroundFinding[] = []
    if (pr <= 200) f.push({ text: 'Intervalo PR normal (120–200 ms)', tone: 'normal' })
    else if (pr <= 300) f.push({ text: 'BAV de 1º grau (PR > 200 ms, constante, todas as P conduzidas)', tone: 'warn' })
    else f.push({ text: 'BAV de 1º grau acentuado — vigiar progressão para 2º grau', tone: 'danger' })
    return f
  },
}

// 5) CONDUÇÃO INTRAVENTRICULAR — largura do QRS
const conducaoIV: PlaygroundScenario = {
  id: 'conducaoIV',
  title: 'Largura do QRS',
  emoji: '📏',
  blurb: 'Aumente a duração do QRS: entre 110–120 ms é bloqueio incompleto; ≥ 120 ms, bloqueio de ramo completo.',
  leads: ['V1', 'V6', 'I'],
  controls: [{
    id: 'w', label: 'Duração do QRS', unit: 'ms', min: 80, max: 180, step: 2, default: 90,
    format: (v) => `${Math.round(v)}`,
    zones: [
      { from: 80, to: 110, label: 'Estreito', tone: 'normal' },
      { from: 110, to: 120, label: 'Incompleto', tone: 'warn' },
      { from: 120, to: 180, label: 'Bloqueio completo', tone: 'danger' },
    ],
  }],
  build: (v) => {
    const p = base('pg-qrs'); p.qrs.width = Math.round(v.w)
    if (v.w >= 120) { p.qrs.block = 'ivcd'; p.t.amp = -0.3; p.t.axis = 240 } // T discordante
    else if (v.w >= 110) p.qrs.block = 'rbbb_incomplete'
    return p
  },
  findings: (v) => {
    const w = v.w, f: PlaygroundFinding[] = []
    if (w < 110) f.push({ text: 'QRS estreito — condução intraventricular normal', tone: 'normal' })
    else if (w < 120) f.push({ text: 'Distúrbio de condução / bloqueio incompleto (110–119 ms)', tone: 'warn' })
    else f.push({ text: 'Bloqueio de ramo completo (≥ 120 ms) — repolarização discordante', tone: 'danger' })
    return f
  },
}

// 6) ISQUEMIA / SUPRADESNÍVEL DE ST
const isquemia: PlaygroundScenario = {
  id: 'isquemia',
  title: 'Isquemia / supra de ST',
  emoji: '🧱',
  blurb: 'Evolua a lesão de parede anterior: T hiperaguda → supradesnível de ST → onda monofásica em "lápide" (tombstone).',
  leads: ['V2', 'V3', 'V4', 'II'],
  controls: [{
    id: 'st', label: 'Supradesnível de ST', unit: 'mm', min: 0, max: 8, step: 0.5, default: 0,
    format: (v) => v.toFixed(1),
    zones: [
      { from: 0, to: 1, label: 'Normal', tone: 'normal' },
      { from: 1, to: 3, label: 'Supra significativo', tone: 'warn' },
      { from: 3, to: 8, label: 'Tombstone', tone: 'danger' },
    ],
  }],
  build: (v) => {
    const mm = v.st, mv = mm / 10 // 1 mm = 0,1 mV
    const p = base('pg-isquemia')
    p.st = { elevation: { anterior: mv, septal: mv * 0.8, inferior: -mv * 0.4 }, coving: ramp(mm, 1, 5, 0, 0.95) }
    // T hiperaguda acompanha o supra inicial
    p.t.amp = ramp(mm, 0, 3, 0.3, 1.0)
    return p
  },
  findings: (v) => {
    const mm = v.st, f: PlaygroundFinding[] = []
    if (mm < 1) f.push({ text: 'Sem supradesnível significativo', tone: 'normal' })
    if (mm >= 0.5 && mm < 2) f.push({ text: 'Ondas T hiperagudas (amplas, simétricas)', tone: 'warn' })
    if (mm >= 1) f.push({ text: 'Supradesnível de ST anterosseptal com infra recíproco inferior', tone: 'danger' })
    if (mm >= 3) f.push({ text: 'Onda monofásica em "lápide" (tombstone) — IAMCSST extenso', tone: 'danger' })
    return f
  },
}

// 7) INTERVALO QT
const qt: PlaygroundScenario = {
  id: 'qt',
  title: 'Intervalo QT',
  emoji: '⏱️',
  blurb: 'Alongue a repolarização (drogas que prolongam o QT, hipocalemia). QTc alto aumenta o risco de torsades de pointes.',
  leads: ['II', 'V4', 'V5'],
  controls: [{
    id: 'qt', label: 'Intervalo QT', unit: 'ms', min: 300, max: 620, step: 5, default: 380,
    format: (v) => `${Math.round(v)}`,
    zones: [
      { from: 300, to: 350, label: 'Curto', tone: 'info' },
      { from: 350, to: 460, label: 'Normal', tone: 'normal' },
      { from: 460, to: 500, label: 'Prolongado', tone: 'warn' },
      { from: 500, to: 620, label: 'Risco de torsades', tone: 'danger' },
    ],
  }],
  build: (v) => {
    const p = base('pg-qt')
    // QT ≈ qrs*0,5 + 200 + t.width*0,8 → resolve t.width para o QT alvo
    p.t.width = clamp((v.qt - p.qrs.width * 0.5 - 200) / 0.8, 80, 460)
    if (v.qt >= 500) p.u = { amp: 0.12, width: 160 } // onda U (hipocalemia)
    return p
  },
  findings: (v) => {
    const q = v.qt, qtc = Math.round(q / Math.sqrt((60000 / 72) / 1000)), f: PlaygroundFinding[] = []
    if (qtc < 350) f.push({ text: `QT curto (QTc ≈ ${qtc} ms) — hipercalcemia, digoxina`, tone: 'info' })
    else if (qtc <= 460) f.push({ text: `QT normal (QTc ≈ ${qtc} ms)`, tone: 'normal' })
    else if (qtc <= 500) f.push({ text: `QT prolongado (QTc ≈ ${qtc} ms)`, tone: 'warn' })
    else f.push({ text: `QT muito prolongado (QTc ≈ ${qtc} ms) — risco de torsades de pointes`, tone: 'danger' })
    return f
  },
}

export const PLAYGROUND_SCENARIOS: PlaygroundScenario[] = [
  potassio, cronotropismo, eixo, conducaoAV, conducaoIV, isquemia, qt,
]

/** valores default de um cenário */
export function defaultValues(s: PlaygroundScenario): Record<string, number> {
  const v: Record<string, number> = {}
  for (const c of s.controls) v[c.id] = c.default
  return v
}
