/**
 * Laudo automático e leitura sistemática do ECG.
 *
 * A partir das MEDIDAS reais (motor `measureEcg`, detectadas nos pontos
 * fiduciais do traçado) e do conteúdo clínico do padrão, monta o laudo na ordem
 * do método do cardiologista: ritmo → frequência → eixo → intervalos →
 * morfologia → conclusão. Os limiares seguem AHA/ACC/ESC/SBC.
 *
 * Também expõe a "verdade" de cada etapa para o modo interativo
 * "Interprete este ECG" (correção passo a passo).
 */
import type { EcgMeasured } from './measure'
import type { EcgEntry } from './catalog'

export type ReportStatus = 'normal' | 'alterado' | 'atencao' | 'neutro'

export interface ReportSection {
  passo: string          // "1. Ritmo", "2. Frequência"…
  titulo: string
  achado: string
  detalhe?: string
  status: ReportStatus
}

export interface EcgReport {
  sections: ReportSection[]
  conclusao: string[]
  urgencia: EcgEntry['urgencia']
}

/* ── categorias "verdade" para o modo interativo ── */
export type RhythmClass = 'regular' | 'irregular'
export type RateClass = 'bradi' | 'normal' | 'taqui'
export type AxisClass = 'normal' | 'esquerdo' | 'direito' | 'extremo'
export type IntervalClass = 'curto' | 'normal' | 'prolongado' | 'largo'

export interface GradingTruth {
  ritmo: RhythmClass
  pSinusal: boolean
  fc: number | null
  fcClass: RateClass
  axisClass: AxisClass
  prClass: IntervalClass | null      // null = P/PR não mensurável
  qrsClass: 'estreito' | 'largo'
  qtClass: 'normal' | 'prolongado' | 'curto'
  diagnosticoId: string
}

const rateClass = (hr: number | null): RateClass =>
  hr == null ? 'normal' : hr < 60 ? 'bradi' : hr > 100 ? 'taqui' : 'normal'

function axisClass(axis: number | null): AxisClass {
  if (axis == null) return 'normal'
  // normaliza para -180..180
  let a = axis
  while (a > 180) a -= 360
  while (a < -180) a += 360
  if (a >= -30 && a <= 90) return 'normal'
  if (a > 90 && a <= 180) return 'direito'
  if (a < -30 && a >= -90) return 'esquerdo'
  return 'extremo' // -90..-180 (noroeste / "terra de ninguém")
}

const AXIS_LABEL: Record<AxisClass, string> = {
  normal: 'eixo normal (−30° a +90°)',
  esquerdo: 'desvio do eixo para a esquerda',
  direito: 'desvio do eixo para a direita',
  extremo: 'desvio extremo do eixo (noroeste)',
}

/** Limiar superior de QTc normal por sexo (Bazett); usamos o mais permissivo. */
const QTC_MAX = 470

export function gradingTruth(entry: EcgEntry, m: EcgMeasured): GradingTruth {
  const hr = m.hr
  const qrs = m.qrs ?? entry.pattern.qrs.width
  const qtc = m.qtc
  let prClass: IntervalClass | null = null
  if (m.pr != null) prClass = m.pr < 120 ? 'curto' : m.pr > 200 ? 'prolongado' : 'normal'
  return {
    ritmo: m.rhythmRegular ? 'regular' : 'irregular',
    pSinusal: m.pPresent && entry.pattern.rhythm === 'sinus',
    fc: hr,
    fcClass: rateClass(hr),
    axisClass: axisClass(m.axis ?? entry.pattern.qrs.axis),
    prClass,
    qrsClass: qrs >= 120 ? 'largo' : 'estreito',
    qtClass: qtc == null ? 'normal' : qtc > QTC_MAX ? 'prolongado' : qtc < 350 ? 'curto' : 'normal',
    diagnosticoId: entry.id,
  }
}

export function buildReport(entry: EcgEntry, m: EcgMeasured): EcgReport {
  const sections: ReportSection[] = []
  const push = (s: ReportSection) => sections.push(s)
  const p = entry.pattern

  // ── 1. RITMO ──
  if (m.quality === 'flat') {
    push({ passo: '1. Ritmo', titulo: 'Ritmo', achado: 'Ausência de atividade elétrica ventricular organizada (linha isoelétrica).', status: 'alterado' })
    return { sections, conclusao: [entry.nome, entry.clinical.resumo], urgencia: entry.urgencia }
  }
  if (m.quality === 'chaotic') {
    push({ passo: '1. Ritmo', titulo: 'Ritmo', achado: 'Atividade totalmente desorganizada, sem complexos QRS identificáveis.', detalhe: `Frequência estimada ~${m.hr ?? '—'} bpm (inclassificável).`, status: 'alterado' })
    return { sections, conclusao: [entry.nome, entry.clinical.resumo], urgencia: entry.urgencia }
  }

  const regular = m.rhythmRegular
  const pInfo = m.pPresent
    ? (p.rhythm === 'sinus' ? 'ondas P sinusais precedendo cada QRS' : 'atividade atrial presente')
    : 'sem ondas P sinusais identificáveis'
  push({
    passo: '1. Ritmo',
    titulo: 'Ritmo',
    achado: `${regular ? 'Regular' : 'Irregular'} — ${pInfo}.`,
    status: (m.pPresent && p.rhythm === 'sinus') ? 'normal' : 'atencao',
  })

  // ── 2. FREQUÊNCIA ──
  const rc = rateClass(m.hr)
  push({
    passo: '2. Frequência',
    titulo: 'Frequência cardíaca',
    achado: m.hr != null ? `${m.hr} bpm — ${rc === 'bradi' ? 'bradicardia' : rc === 'taqui' ? 'taquicardia' : 'normocardia'}.` : 'não mensurável.',
    detalhe: m.rr != null ? `Intervalo R-R ≈ ${m.rr} ms.` : undefined,
    status: rc === 'normal' ? 'normal' : 'atencao',
  })

  // ── 3. EIXO ──
  const ac = axisClass(m.axis ?? p.qrs.axis)
  push({
    passo: '3. Eixo',
    titulo: 'Eixo elétrico do QRS',
    achado: `${m.axis ?? p.qrs.axis}° — ${AXIS_LABEL[ac]}.`,
    status: ac === 'normal' ? 'normal' : 'atencao',
  })

  // ── 4. INTERVALOS ──
  // PR
  if (m.pr != null) {
    const prSt: ReportStatus = m.pr > 200 ? 'alterado' : m.pr < 120 ? 'atencao' : 'normal'
    push({
      passo: '4. Intervalos', titulo: 'Intervalo PR',
      achado: `${m.pr} ms — ${m.pr > 200 ? 'prolongado (≥ 200 ms)' : m.pr < 120 ? 'curto (< 120 ms)' : 'normal (120–200 ms)'}.`,
      status: prSt,
    })
  } else {
    push({ passo: '4. Intervalos', titulo: 'Intervalo PR', achado: 'não mensurável (P ausente, dissociada ou fundida).', status: 'neutro' })
  }
  // QRS
  const qrs = m.qrs ?? p.qrs.width
  push({
    passo: '4. Intervalos', titulo: 'Duração do QRS',
    achado: `${qrs} ms — ${qrs >= 120 ? 'alargado (≥ 120 ms)' : qrs >= 110 ? 'limítrofe' : 'estreito (< 120 ms)'}.`,
    status: qrs >= 120 ? 'alterado' : 'normal',
  })
  // QT/QTc
  if (m.qt != null && m.qtc != null) {
    const qtSt: ReportStatus = m.qtc > QTC_MAX ? 'alterado' : m.qtc < 350 ? 'atencao' : 'normal'
    push({
      passo: '4. Intervalos', titulo: 'QT / QTc',
      achado: `QT ${m.qt} ms · QTc ${m.qtc} ms (Bazett) — ${m.qtc > QTC_MAX ? 'prolongado' : m.qtc < 350 ? 'curto' : 'normal'}.`,
      status: qtSt,
    })
  }

  // ── 5. MORFOLOGIA ── (derivada do conteúdo do padrão)
  const morf: string[] = []
  if (p.qrs.block && p.qrs.block !== 'none') morf.push(`padrão de ${p.qrs.block.toUpperCase()}`)
  if ((p.qrs.delta ?? 0) > 0) morf.push('onda delta (pré-excitação)')
  if (p.st?.elevation) {
    const vals = Object.values(p.st.elevation) as number[]
    if (vals.some((v) => v > 0.05)) morf.push('supradesnível de ST')
    if (vals.some((v) => v < -0.05)) morf.push('infradesnível de ST')
  }
  if (p.qrs.qAmp && p.qrs.qAmp > 0.3) morf.push('ondas Q patológicas')
  if (entry.clinical.paredeAfetada?.length) morf.push(`alterações em parede ${entry.clinical.paredeAfetada.join(', ')}`)
  push({
    passo: '5. Morfologia', titulo: 'Morfologia (P–QRS–ST–T)',
    achado: morf.length ? morf.join('; ') + '.' : 'sem alterações morfológicas grosseiras de ST-T ou de despolarização.',
    status: morf.length ? 'atencao' : 'normal',
  })

  // ── CONCLUSÃO ──
  const conclusao: string[] = [entry.nome]
  if (entry.clinical.resumo) conclusao.push(entry.clinical.resumo)
  if (entry.clinical.quandoEmergencia && entry.urgencia === 'emergencia')
    conclusao.push(`⚠ ${entry.clinical.quandoEmergencia}`)

  return { sections, conclusao, urgencia: entry.urgencia }
}
