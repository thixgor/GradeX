'use client'

import React, { useMemo, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { beatAt, type BeatSpec, type TShape } from '@/lib/ecg/course/strip'
import { Chip, EcgGrid, LabButton, LabNote, LabShell, LabSlider, Metric, PaperFrame, ScrollRow, useEcgPaper } from './ui'

/**
 * Laboratório de eletrólitos e temperatura.
 *
 * O traçado é recalculado a partir dos valores dos controles: cada íon age na
 * fase do potencial de ação que ele governa, e a forma da onda sai disso. O
 * objetivo não é decorar figuras, e sim ver o mecanismo produzir o desenho.
 */

const W = 800
const H = 330
const BASE = 250
const MVU = 133.333          // unidades de viewBox por mV (10 mm/mV × 13,33 u/mm)
const MM = 13.333            // 25 mm/s → 2400 ms em 60 mm
const DUR = 2400
const xOf = (t: number) => (t / DUR) * W
const yOf = (mv: number) => BASE - mv * MVU

interface Shape {
  hr: number
  pAmp: number
  pr: number
  qrsW: number
  stOffset: number
  /** posição do PICO da onda T, em ms após a R — é o que o cálcio move */
  tPos: number
  tAmp: number
  tW: number
  uAmp: number
  jAmp: number
  tShape: TShape
}

/**
 * Um batimento, com o R ancorado em `r0` (ms).
 *
 * A forma sai do mesmo motor da trilha: aqui só traduzimos os efeitos dos íons
 * (que o laboratório calcula em `derive`) para os parâmetros do batimento.
 * O segmento ST é derivado da posição da T — é exatamente assim que o cálcio
 * age: ele não mexe na onda T, mexe na duração do platô que vem antes dela.
 */
function specOf(r0: number, s: Shape): BeatSpec {
  const qrsWidth = 90 * s.qrsW
  const stWidth = Math.max(12, s.tPos - 0.56 * qrsWidth - s.tW * (s.tShape === 'normal' ? 0.58 : 0.5))
  return {
    r0,
    pr: s.pr,
    p: s.pAmp,
    q: -0.08, r: 1.25, s: -0.3,
    qrsWidth,
    jWave: s.jAmp,
    st: s.stOffset, stWidth,
    t: s.tAmp, tWidth: s.tW, tShape: s.tShape,
    u: s.uAmp,
  }
}

const beat = (t: number, r0: number, s: Shape) => beatAt(t, specOf(r0, s))

interface Finding { text: string; tone: 'good' | 'warn' | 'bad' | 'info' }

function derive(k: number, ca: number, temp: number) {
  const findings: Finding[] = []
  const s: Shape = {
    hr: 70, pAmp: 0.15, pr: 160, qrsW: 1, stOffset: 0,
    tPos: 205, tAmp: 0.35, tW: 165, uAmp: 0.05, jAmp: 0, tShape: 'normal',
  }

  /* ── Potássio ── */
  if (k >= 5.5) {
    s.tAmp = 0.35 + (k - 5.5) * 0.42
    s.tW = Math.max(58, 165 - (k - 5.5) * 26)
    // a T da hipercalemia deixa de ser assimétrica: vira "tenda" simétrica
    s.tShape = 'peaked'
    findings.push({ text: `Onda T apiculada, estreita e simétrica ("em tenda") — a hipercalemia aumenta a condutância de IKr e ACELERA a repolarização.`, tone: 'warn' })
  }
  if (k >= 6.5) {
    s.pAmp = Math.max(0, 0.15 * (1 - (k - 6.5) / 1.1))
    s.pr = 160 + (k - 6.5) * 60
    findings.push({ text: 'Onda P achatando e PR prolongando: o átrio é o tecido mais sensível ao potássio. Em níveis altos a P desaparece — é a paralisia atrial.', tone: 'bad' })
  }
  if (k >= 7.2) {
    s.qrsW = 1 + (k - 7.2) * 0.75
    findings.push({ text: 'QRS alargando: o potencial de repouso menos negativo mantém os canais rápidos de sódio INATIVADOS, deixando a fase 0 lenta.', tone: 'bad' })
  }
  if (k >= 8.5) {
    findings.push({ text: 'Padrão SINUSOIDAL — o QRS alargado se funde à onda T. É pré-parada: gluconato de cálcio IMEDIATO.', tone: 'bad' })
    s.hr -= 22
  }
  if (k < 3.5) {
    s.tAmp = Math.max(0.05, 0.35 * ((k - 1.8) / 1.7))
    s.uAmp = 0.05 + (3.5 - k) * 0.11
    s.stOffset = -0.03 * (3.5 - k)
    findings.push({ text: 'Onda T achatando e onda U crescendo: a repolarização se arrasta e a repolarização tardia (Purkinje / células M) fica exposta. Cuidado ao medir o QT — a T e a U se fundem.', tone: 'warn' })
  }
  if (k < 2.5) {
    findings.push({ text: 'Hipocalemia grave: infra de ST, fusão T-U, extrassístoles e risco de torsades de pointes. Reponha magnésio junto — sem Mg²⁺, o K⁺ não sobe.', tone: 'bad' })
  }

  /* ── Cálcio ── */
  if (ca < 8.5) {
    s.tPos = 205 + (8.5 - ca) * 26
    findings.push({ text: 'Segmento ST ALONGADO com onda T de morfologia normal: falta cálcio extracelular, a corrente ICaL demora a se completar e o platô da fase 2 se estica. QT longo à custa do ST — a assinatura da hipocalcemia.', tone: 'warn' })
  }
  if (ca < 6.5) {
    findings.push({ text: 'Hipocalcemia grave: risco de torsades. Pense em hipoparatireoidismo pós-tireoidectomia, pancreatite, sepse, rabdomiólise e transfusão maciça (citrato).', tone: 'bad' })
  }
  if (ca > 10.5) {
    s.tPos = Math.max(120, 205 - (ca - 10.5) * 20)
    findings.push({ text: 'Segmento ST curto ou ausente — a onda T "nasce colada" no QRS. O excesso de cálcio encurta a fase 2, e o QT encurta junto.', tone: 'warn' })
  }
  if (ca > 13.5) {
    s.jAmp = Math.max(s.jAmp, (ca - 13.5) * 0.12)
    findings.push({ text: 'Hipercalcemia grave: pode surgir onda J e bradiarritmias. Causas: hiperparatireoidismo, neoplasia, imobilização, intoxicação por vitamina D.', tone: 'bad' })
  }

  /* ── Temperatura ── */
  if (temp < 35) {
    s.hr -= (35 - temp) * 4.2
    s.pr += (35 - temp) * 12
    s.qrsW += (35 - temp) * 0.035
    s.tPos += (35 - temp) * 9
    findings.push({ text: 'Bradicardia com PR, QRS e QT prolongados: o frio desacelera todos os processos dependentes de canais iônicos.', tone: 'warn' })
  }
  if (temp < 32) {
    s.jAmp = Math.max(s.jAmp, (32 - temp) * 0.085)
    findings.push({ text: 'Onda J de OSBORN — entalhe no ponto J, proporcional à queda de temperatura. Surge abaixo de 32 °C. Mecanismo: o frio acentua a corrente Ito da fase 1 no epicárdio, mas não no endocárdio, criando gradiente transmural no fim do QRS.', tone: 'bad' })
  }
  if (temp < 30) {
    findings.push({ text: 'Abaixo de 30 °C o miocárdio fica irritável: manipulação brusca pode deflagrar fibrilação ventricular, que costuma ser refratária à desfibrilação até o reaquecimento. "Ninguém está morto até estar quente e morto."', tone: 'bad' })
  }
  if (temp > 38) {
    s.hr += (temp - 37) * 10
    s.tPos -= (temp - 37) * 8
    findings.push({ text: 'Taquicardia sinusal (cerca de +10 bpm por grau acima de 37 °C) com encurtamento de PR e QT. Febre alta SEM taquicardia proporcional é o sinal de Faget.', tone: 'warn' })
  }
  if (temp >= 39) {
    findings.push({ text: 'Atenção: a febre é gatilho clássico do padrão de Brugada tipo 1. Em quem tem a síndrome, tratar a febre agressivamente é conduta antiarrítmica.', tone: 'bad' })
  }

  if (!findings.length) findings.push({ text: 'Eletrólitos e temperatura normais — traçado de referência. Mexa nos controles e observe qual parte do batimento cada variável governa.', tone: 'good' })

  s.hr = Math.max(28, Math.min(170, Math.round(s.hr)))
  return { shape: s, findings }
}

const PRESETS = [
  { label: 'Normal', k: 4.2, ca: 9.5, temp: 36.8 },
  { label: 'Hipercalemia grave', k: 8.2, ca: 9.5, temp: 36.8 },
  { label: 'Hipocalemia', k: 2.4, ca: 9.5, temp: 36.8 },
  { label: 'Hipocalcemia', k: 4.2, ca: 6.2, temp: 36.8 },
  { label: 'Hipercalcemia', k: 4.2, ca: 14.5, temp: 36.8 },
  { label: 'Hipotermia 29 °C', k: 4.2, ca: 9.5, temp: 29 },
  { label: 'Febre 40 °C', k: 4.2, ca: 9.5, temp: 40 },
]

type Scenario = 'potassio' | 'calcio' | 'temperatura' | 'todos'

export function ElectrolyteLab({ scenario = 'todos' }: { scenario?: Scenario }) {
  const [k, setK] = useState(4.2)
  const [ca, setCa] = useState(9.5)
  const [temp, setTemp] = useState(36.8)

  const { shape, findings } = useMemo(() => derive(k, ca, temp), [k, ca, temp])
  const { palette } = useEcgPaper()

  const path = useMemo(() => {
    const rr = 60000 / shape.hr
    let d = ''
    for (let t = 0; t <= DUR; t += 3) {
      let mv = 0
      for (let n = -1; n < 5; n++) {
        const r0 = 260 + n * rr
        if (Math.abs(t - r0) < rr) mv += beat(t, r0, shape)
      }
      d += `${t === 0 ? 'M' : 'L'}${xOf(t).toFixed(1)} ${yOf(mv).toFixed(1)} `
    }
    return d.trim()
  }, [shape])

  const showK = scenario === 'potassio' || scenario === 'todos'
  const showCa = scenario === 'calcio' || scenario === 'todos'
  const showT = scenario === 'temperatura' || scenario === 'todos'

  const kTone = k > 5.4 || k < 3.5 ? (k > 6.9 || k < 2.6 ? 'bad' : 'warn') : 'good'
  const caTone = ca > 10.5 || ca < 8.5 ? (ca > 13 || ca < 7 ? 'bad' : 'warn') : 'good'
  const tTone = temp < 35 || temp > 38 ? (temp < 32 || temp > 39.5 ? 'bad' : 'warn') : 'good'

  return (
    <LabShell>
      <ScrollRow className="mb-2" label="Cenários prontos">
        {PRESETS.map((p) => (
          <LabButton
            key={p.label}
            active={k === p.k && ca === p.ca && temp === p.temp}
            onClick={() => { setK(p.k); setCa(p.ca); setTemp(p.temp) }}
          >
            {p.label}
          </LabButton>
        ))}
        <LabButton onClick={() => { setK(4.2); setCa(9.5); setTemp(36.8) }}>
          <RotateCcw className="h-3.5 w-3.5" /> Zerar
        </LabButton>
      </ScrollRow>

      <PaperFrame viewBox={`0 0 ${W} ${H}`} role="img"
        aria-label="Traçado alterado por eletrólitos e temperatura"
        caption="25 mm/s · 10 mm/mV · quadradinho = 40 ms e 0,1 mV">
        <EcgGrid mm={MM} id="elec-grid" />
        <line x1={0} y1={BASE} x2={W} y2={BASE} stroke={palette.baseline} strokeWidth="1" strokeDasharray="4 6" />
        <path d={path} fill="none" stroke={palette.trace} strokeWidth="2.3" strokeLinejoin="round" strokeLinecap="round" />
      </PaperFrame>

      <div className="mt-3 grid gap-3 sm:grid-cols-3 [&>*]:min-w-0">
        {showK && (
          <LabSlider label="Potássio (K⁺)" value={k} min={1.5} max={9} step={0.1} unit=" mEq/L" onChange={setK}
            hint="Normal 3,5–5,0 · governa o potencial de REPOUSO e a onda T" />
        )}
        {showCa && (
          <LabSlider label="Cálcio total" value={ca} min={5} max={16} step={0.1} unit=" mg/dL" onChange={setCa}
            hint="Normal 8,5–10,5 · governa o PLATÔ (fase 2) e o segmento ST" />
        )}
        {showT && (
          <LabSlider label="Temperatura central" value={temp} min={26} max={42} step={0.2} unit=" °C" onChange={setTemp}
            hint="Normal 36–37,5 · frio desacelera tudo e cria a onda J" />
        )}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 [&>*]:min-w-0">
        <Metric label="Frequência" value={shape.hr} unit="bpm" tone={shape.hr < 60 || shape.hr > 100 ? 'warn' : 'good'} />
        <Metric label="PR estimado" value={Math.round(shape.pr)} unit="ms" tone={shape.pr > 200 ? 'bad' : 'good'} />
        <Metric label="QRS estimado" value={Math.round(90 * shape.qrsW)} unit="ms" tone={90 * shape.qrsW >= 120 ? 'bad' : 'good'} />
        <Metric label="Amplitude da T" value={shape.tAmp.toFixed(2).replace('.', ',')} unit="mV" tone={shape.tAmp > 0.7 ? 'bad' : shape.tAmp < 0.15 ? 'warn' : 'good'} />
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        <Chip tone={kTone === 'good' ? 'good' : kTone === 'warn' ? 'warn' : 'bad'}>K⁺ {k.toFixed(1).replace('.', ',')}</Chip>
        <Chip tone={caTone === 'good' ? 'good' : caTone === 'warn' ? 'warn' : 'bad'}>Ca²⁺ {ca.toFixed(1).replace('.', ',')}</Chip>
        <Chip tone={tTone === 'good' ? 'good' : tTone === 'warn' ? 'warn' : 'bad'}>{temp.toFixed(1).replace('.', ',')} °C</Chip>
      </div>

      <div className="mt-3 space-y-2">
        {findings.map((f, i) => (
          <LabNote key={i} tone={f.tone}>{f.text}</LabNote>
        ))}
      </div>
    </LabShell>
  )
}
