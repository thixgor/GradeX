/**
 * Motor de MEDIÇÃO real do ECG.
 *
 * Ao contrário de `computeMeasurements` (que apenas informa os parâmetros do
 * padrão), aqui detectamos os pontos fiduciais — início/fim de P, início/fim do
 * QRS, pico e fim da T — diretamente no SINAL renderizado das 12 derivações, e
 * calculamos FC, PR, QRS, QT, QTc, eixo e amplitudes a partir deles.
 *
 * Método: sinal de magnitude vetorial (RMS das 12 derivações) — que tem humps
 * claros de P, QRS e T independentemente da polaridade de cada derivação —
 * combinado com detecção de QRS, limiares adaptativos e o método da tangente
 * para o fim da onda T.
 */
import { LEADS, classifyAxis, type LeadName } from './engine'

export interface Fiducials {
  pOn: number | null; pPeak: number | null; pOff: number | null
  qOn: number; rPeak: number; qOff: number
  tPeak: number | null; tOff: number | null
}

export interface EcgMeasured {
  hr: number | null
  rr: number | null
  pr: number | null
  qrs: number | null
  qt: number | null
  qtc: number | null
  axis: number | null
  axisLabel: string
  pAmp: number | null
  rAmp: number | null
  tAmp: number | null
  rhythmRegular: boolean
  pPresent: boolean
  rPeaks: number[]        // índices de amostra de todos os QRS
  beat: Fiducials | null  // batimento representativo (índices de amostra)
  fs: number
  /** derivação usada como referência do batimento representativo */
  refLead: LeadName
  quality: 'ok' | 'chaotic' | 'flat'
}

function percentile(arr: Float32Array | number[], p: number): number {
  const a = Array.from(arr).sort((x, y) => x - y)
  const i = Math.max(0, Math.min(a.length - 1, Math.floor(p * (a.length - 1))))
  return a[i]
}
function median(a: number[]) { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2 }
function smooth(x: Float32Array, w: number): Float32Array {
  const n = x.length, out = new Float32Array(n), half = w >> 1
  let acc = 0
  for (let i = 0; i < Math.min(w, n); i++) acc += x[i]
  for (let i = 0; i < n; i++) {
    const lo = Math.max(0, i - half), hi = Math.min(n - 1, i + half)
    let s = 0; for (let j = lo; j <= hi; j++) s += x[j]
    out[i] = s / (hi - lo + 1)
  }
  return out
}

/**
 * Período fundamental do batimento (em amostras) via autocorrelação do sinal
 * de energia. Robusto ao caso da T apiculada (hipercalemia), em que a T é mais
 * alta/íngreme que o QRS: a periodicidade dominante continua sendo o intervalo
 * R-R real. Usa estimador enviesado (÷n) para não favorecer harmônicos longos e
 * escolhe o PRIMEIRO máximo local forte (o fundamental, não seus múltiplos).
 */
function fundamentalPeriod(qe: Float32Array, fs: number): number | null {
  const n = qe.length
  let mean = 0; for (let i = 0; i < n; i++) mean += qe[i]; mean /= n
  const x = new Float32Array(n); for (let i = 0; i < n; i++) x[i] = qe[i] - mean
  let c0 = 0; for (let i = 0; i < n; i++) c0 += x[i] * x[i]; c0 /= n
  if (c0 <= 1e-12) return null
  const Lmin = Math.round(0.30 * fs), Lmax = Math.min(Math.round(1.7 * fs), n >> 1)
  if (Lmax <= Lmin + 2) return null
  const r = new Float64Array(Lmax + 1)
  let gmax = 0
  for (let lag = Lmin; lag <= Lmax; lag++) {
    let c = 0; for (let i = 0; i < n - lag; i++) c += x[i] * x[i + lag]
    r[lag] = (c / n) / c0
    if (lag > Lmin && r[lag] > gmax) gmax = r[lag]
  }
  if (gmax < 0.15) return null // sem periodicidade clara (fibrilação, ruído)
  for (let lag = Lmin + 1; lag < Lmax; lag++)
    if (r[lag] >= r[lag - 1] && r[lag] >= r[lag + 1] && r[lag] >= 0.6 * gmax) return lag
  return null
}

/** Mede o ECG a partir do sinal das 12 derivações. */
export function measureEcg(signals: Record<LeadName, Float32Array>, fs: number): EcgMeasured {
  const n = signals.II.length
  const msToS = (samples: number) => samples / fs
  const toMs = (samples: number) => Math.round((samples / fs) * 1000)

  // ── magnitude vetorial (RMS das 12 derivações) ──
  const rmsRaw = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    let s = 0
    for (const l of LEADS) { const v = signals[l][i]; s += v * v }
    rmsRaw[i] = Math.sqrt(s)
  }
  const rms = smooth(rmsRaw, Math.max(3, Math.round(fs * 0.008)))
  const rmsBase = percentile(rms, 0.2)
  const rmsMax = percentile(rms, 0.999)
  const span = Math.max(1e-3, rmsMax - rmsBase)

  // ── detecção de QRS por energia (derivada² integrada — estilo Pan-Tompkins) ──
  // O QRS é nítido (alta frequência); P e T são lentas → a derivada realça o QRS.
  const deriv = new Float32Array(n)
  for (let k = 1; k < n - 1; k++) { let s = 0; for (const l of LEADS) { const d = signals[l][k + 1] - signals[l][k - 1]; s += d * d } deriv[k] = s }
  const qe = smooth(deriv, Math.max(5, Math.round(fs * 0.09)))
  const qeB = smooth(deriv, Math.max(3, Math.round(fs * 0.012)))  // pouco suavizada, p/ delimitar o QRS
  const qeMax = percentile(qe, 0.999)
  const qThr = 0.22 * qeMax
  // Refratário adaptativo ancorado no período fundamental (R-R real via ACF).
  // Garante um único complexo aceito por ciclo — impede que a onda T apiculada
  // (mais alta que o QRS na hipercalemia) seja contada como um segundo QRS —
  // sem prejudicar taquicardias (o próximo QRS fica a ~1×RR, além do refratário).
  const rr0 = fundamentalPeriod(qe, fs)
  const refractory = rr0
    ? Math.min(Math.round(0.62 * rr0), Math.max(Math.round(fs * 0.20), Math.round(0.45 * rr0)))
    : Math.round(fs * 0.22)
  const rPeaks: number[] = []
  let i = 1, lastAccepted = -1e9, lastQe = 0
  while (i < n - 1) {
    if (qe[i] > qThr && qe[i] >= qe[i - 1] && qe[i] > qe[i + 1]) {
      const pkQe = qe[i]
      let pk = i, win = Math.round(fs * 0.05)
      for (let j = Math.max(0, i - win); j <= Math.min(n - 1, i + win); j++) if (rms[j] > rms[pk]) pk = j
      // discriminação de onda T (Pan-Tompkins): pico próximo e menos "íngreme" que o QRS anterior → é T
      const d = (pk - lastAccepted) / fs
      if (lastAccepted >= 0 && d < 0.36 && pkQe < 0.5 * lastQe) { i = i + Math.round(fs * 0.05); continue }
      rPeaks.push(pk); lastAccepted = pk; lastQe = pkQe
      i = pk + refractory
    } else i++
  }

  const rr = rPeaks.length >= 2 ? rPeaks.slice(1).map((p, k) => p - rPeaks[k]) : []
  const rrMed = rr.length ? median(rr) : null
  const hr = rrMed ? Math.round(60 / msToS(rrMed)) : null
  const rhythmRegular = rr.length >= 2 ? (Math.max(...rr) - Math.min(...rr)) / (rrMed || 1) < 0.12 : true

  // qualidade: caótico (FV) ou plano (assistolia)
  let quality: EcgMeasured['quality'] = 'ok'
  if (span < 0.05 || rPeaks.length < 2) quality = 'flat'
  const chaotic = rr.length >= 3 && (Math.max(...rr) - Math.min(...rr)) / (rrMed || 1) > 0.9 && rmsMax > 0.15 && rPeaks.length > 6
  if (chaotic && rPeaks.length > 10) quality = 'chaotic'

  if (quality === 'flat') {
    return { hr: null, rr: null, pr: null, qrs: null, qt: null, qtc: null, axis: null, axisLabel: '—', pAmp: null, rAmp: null, tAmp: null, rhythmRegular, pPresent: false, rPeaks, beat: null, fs, refLead: 'II', quality }
  }
  if (quality === 'chaotic') {
    // fibrilação: sem complexos organizados — reporta apenas uma estimativa de frequência
    return { hr, rr: rrMed ? toMs(rrMed) : null, pr: null, qrs: null, qt: null, qtc: null, axis: null, axisLabel: '—', pAmp: null, rAmp: null, tAmp: null, rhythmRegular: false, pPresent: false, rPeaks, beat: null, fs, refLead: 'II', quality }
  }

  // ── batimento representativo: o de RR mais próximo da mediana (evitando bordas) ──
  let repIdx = Math.min(rPeaks.length - 1, Math.max(1, Math.floor(rPeaks.length / 2)))
  if (rr.length) {
    let best = Infinity
    for (let k = 1; k < rPeaks.length - 1; k++) {
      const d = Math.abs((rPeaks[k] - rPeaks[k - 1]) - (rrMed || 0))
      if (d < best) { best = d; repIdx = k }
    }
  }
  const rPeak = rPeaks[repIdx]

  // ── início/fim do QRS pela ENERGIA (qeB) — isola o QRS mesmo com supra de ST
  //    ou onda P dissociada próxima (que têm energia de alta frequência baixa) ──
  let qLocalPk = qeB[rPeak]
  for (let j = Math.max(0, rPeak - Math.round(fs * 0.08)); j <= Math.min(n - 1, rPeak + Math.round(fs * 0.08)); j++) qLocalPk = Math.max(qLocalPk, qeB[j])
  const bThr = 0.07 * qLocalPk
  let qOn = rPeak, qOff = rPeak
  for (let j = rPeak; j > Math.max(0, rPeak - Math.round(fs * 0.11)); j--) { if (qeB[j] < bThr) { qOn = j; break } qOn = j }
  for (let j = rPeak; j < Math.min(n - 1, rPeak + Math.round(fs * 0.13)); j++) { if (qeB[j] < bThr) { qOff = j; break } qOff = j }

  // ── onda P: maior hump da RMS na janela pré-QRS (limitada por RR p/ não pegar a T anterior) ──
  const pBack = Math.min(Math.round(fs * 0.24), Math.round(0.4 * (rrMed || fs)))
  const pWinStart = Math.max(0, qOn - pBack)
  const pWinEnd = Math.max(0, qOn - Math.round(fs * 0.02))
  // pega o hump MAIS PRÓXIMO do QRS (a P verdadeira), não a T do batimento anterior
  const pThrDet = rmsBase + Math.max(0.05 * span, 0.02)
  let pPeak: number | null = null, pPeakVal = 0
  for (let j = pWinEnd - 2; j > pWinStart; j--) {
    if (rms[j] > pThrDet && rms[j] >= rms[j - 1] && rms[j] >= rms[j + 1]) { pPeak = j; pPeakVal = rms[j]; break }
  }
  const pPresent = pPeak != null
  let pOn: number | null = null, pOff: number | null = null
  if (pPresent && pPeak != null) {
    const pThr = rmsBase + 0.28 * (pPeakVal - rmsBase)
    pOn = pPeak; for (let j = pPeak; j > pWinStart; j--) { pOn = j; if (rms[j] <= pThr) break }
    pOff = pPeak; for (let j = pPeak; j < qOn; j++) { pOff = j; if (rms[j] <= pThr) break }
  }

  // ── onda T: hump após o QRS + método da tangente (limitada pelo próximo QRS) ──
  const nextR = repIdx + 1 < rPeaks.length ? rPeaks[repIdx + 1] : n - 1
  const tWinStart = Math.min(n - 1, qOff + Math.round(fs * 0.04))
  const tWinEnd = Math.min(n - 1, qOff + Math.round(fs * 0.42), qOff + Math.round(0.6 * (rrMed || fs)), nextR - Math.round(fs * 0.06))
  let tPeak: number | null = null, tPeakVal = 0
  for (let j = tWinStart; j < tWinEnd; j++) if (rms[j] > tPeakVal) { tPeakVal = rms[j]; tPeak = j }
  let tOff: number | null = null
  if (tPeak != null && (tPeakVal - rmsBase) > 0.05 * span) {
    // ramo descendente mais íngreme após o pico → extrapola tangente até a linha de base
    let steepest = tPeak, minSlope = 0
    for (let j = tPeak; j < tWinEnd - 1; j++) { const sl = rms[j + 1] - rms[j]; if (sl < minSlope) { minSlope = sl; steepest = j } }
    if (minSlope < -1e-5) {
      const cross = steepest + (rms[steepest] - rmsBase) / (-minSlope)
      tOff = Math.round(Math.max(steepest, Math.min(tWinEnd, cross)))
    } else {
      tOff = tPeak; for (let j = tPeak; j < tWinEnd; j++) { tOff = j; if (rms[j] <= rmsBase + 0.1 * span) break }
    }
  }

  // ── intervalos ──
  const pr = pPresent && pOn != null ? toMs(qOn - pOn) : null
  const qrs = toMs(qOff - qOn)
  const qt = tOff != null ? toMs(tOff - qOn) : null
  const qtc = qt != null && rrMed ? Math.round(qt / Math.sqrt(msToS(rrMed))) : null

  // ── eixo elétrico: área líquida do QRS em DI e aVF ──
  const netArea = (lead: LeadName) => { let s = 0; for (let j = qOn; j <= qOff; j++) s += signals[lead][j]; return s }
  const netI = netArea('I'), netF = netArea('aVF')
  let axis: number | null = Math.round((Math.atan2(netF, netI) * 180) / Math.PI)
  if (Math.abs(netI) < 1e-3 && Math.abs(netF) < 1e-3) axis = null
  const axisLabel = axis != null ? classifyAxis(axis) : '—'

  // ── amplitudes (pico-a-pico na janela, na derivação de referência) ──
  const ampIn = (lead: LeadName, a: number | null, b: number | null) => {
    if (a == null || b == null) return null
    let mx = -Infinity, mn = Infinity
    for (let j = Math.max(0, a); j <= Math.min(n - 1, b); j++) { const v = signals[lead][j]; if (v > mx) mx = v; if (v < mn) mn = v }
    return +(mx).toFixed(2)
  }
  const pAmp = pPresent ? ampIn('II', pOn, pOff) : null
  const rAmp = ampIn('II', qOn, qOff)
  // T mais expressiva costuma estar em V2–V4
  let tLead: LeadName = 'V3', tBest = 0
  for (const l of ['V2', 'V3', 'V4', 'II'] as LeadName[]) { const a = ampIn(l, qOff, tOff ?? qOff); if (a != null && Math.abs(a) > tBest) { tBest = Math.abs(a); tLead = l } }
  const tAmp = tOff != null ? ampIn(tLead, tPeak != null ? tPeak - Math.round(fs * 0.06) : qOff, tOff) : null

  return {
    hr, rr: rrMed ? toMs(rrMed) : null, pr, qrs, qt, qtc, axis, axisLabel,
    pAmp, rAmp: rAmp != null ? +Math.abs(rAmp).toFixed(2) : null, tAmp,
    rhythmRegular, pPresent, rPeaks,
    beat: { pOn, pPeak, pOff, qOn, rPeak, qOff, tPeak, tOff },
    fs, refLead: 'II', quality,
  }
}
