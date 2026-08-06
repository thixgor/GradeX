'use client'

import React, { useMemo, useState } from 'react'
import { beatAt, type BeatSpec, type TShape } from '@/lib/ecg/course/strip'
import { EcgGrid, LabButton, LabChip, LabNote, LabShell, PaperFrame, ScrollRow, useEcgPaper } from './ui'

/**
 * "Consultório das ondas": catálogo interativo das deformidades de cada onda.
 *
 * Cada item redesenha o batimento com o parâmetro alterado e explica o
 * mecanismo — o objetivo é o aluno associar a FORMA à CAUSA, e não decorar
 * figuras soltas.
 */

const W = 420
const H = 210
const BASE = 150
const MVU = 84
const MM = 8.4          // 25 mm/s: 1200 ms em 50 mm
const DUR = 1200
const xOf = (t: number) => (t / DUR) * W
const yOf = (mv: number) => BASE - mv * MVU

interface Shape {
  p?: number
  pW?: number
  pNotched?: boolean
  q?: number
  r?: number
  s?: number
  rprime?: number
  /** fator de alargamento do QRS (1 = 90 ms) */
  qrsW?: number
  st?: number
  coved?: boolean
  t?: number
  tW?: number
  /** morfologia da T: simétrica (isquemia) ou apiculada (hipercalemia) */
  tShape?: TShape
  /** duração do segmento ST (ms) — encurta na hipercalcemia, alonga na hipocalcemia */
  stW?: number
  u?: number
  j?: number
  delta?: number
  epsilon?: number
}

/** Instante do pico da R dentro da janela de 1200 ms desenhada. */
const R0 = 420

/**
 * Todo batimento deste catálogo é desenhado pelo MESMO motor de morfologia da
 * trilha (`beatAt`) — só mudam os parâmetros. É o que garante que a "P
 * pulmonale" seja a P normal mais alta, e não outra figura desenhada à parte.
 */
function specOf(s: Shape): BeatSpec {
  return {
    r0: R0,
    pr: 160,
    p: s.p, pWidth: s.pW, pNotched: s.pNotched,
    q: s.q, r: s.r, s: s.s, rPrime: s.rprime,
    qrsWidth: 90 * (s.qrsW ?? 1),
    delta: s.delta, jWave: s.j, epsilon: s.epsilon,
    st: s.st, stCoved: s.coved, stWidth: s.stW,
    t: s.t, tWidth: s.tW, tShape: s.tShape,
    u: s.u,
  }
}

const value = (t: number, s: Shape) => beatAt(t, specOf(s))

interface Entry {
  group: Group
  name: string
  shape: Shape
  cause: string
  meaning: string
  tone: 'good' | 'warn' | 'bad' | 'info'
}

type Group = 'p' | 'qrs' | 'st' | 'especiais'

const GROUPS: { key: Group; label: string }[] = [
  { key: 'p', label: 'Onda P' },
  { key: 'qrs', label: 'QRS' },
  { key: 'st', label: 'ST e onda T' },
  { key: 'especiais', label: 'Ondas especiais' },
]

const ENTRIES: Entry[] = [
  /* ── P ── */
  {
    group: 'p', name: 'P normal', shape: {}, tone: 'good',
    cause: 'Despolarização atrial normal: átrio direito na primeira metade, átrio esquerdo na segunda (via feixe de Bachmann).',
    meaning: 'Arredondada, positiva em D2, negativa em aVR, com menos de 120 ms e menos de 2,5 mm.',
  },
  {
    group: 'p', name: 'P pulmonale (alta)', shape: { p: 0.32, pW: 96 }, tone: 'warn',
    cause: 'Sobrecarga atrial DIREITA: o vetor do átrio direito cresce, mas os dois átrios continuam despolarizando em sequência.',
    meaning: '≥ 2,5 mm em D2, D3 ou aVF, apiculada. A P fica mais ALTA, não mais larga. Causas: DPOC, hipertensão pulmonar, estenose tricúspide, cardiopatia congênita.',
  },
  {
    group: 'p', name: 'P mitrale (larga e entalhada)', shape: { p: 0.14, pW: 160, pNotched: true }, tone: 'warn',
    cause: 'Sobrecarga atrial ESQUERDA: o átrio esquerdo dilatado leva mais tempo para despolarizar, e ele é o SEGUNDO a ser ativado.',
    meaning: '≥ 120 ms com entalhe de ≥ 40 ms entre os picos em D2, e componente negativo terminal em V1 (índice de Morrow ≥ 1 mm × 40 ms). Causas: valvopatia mitral, hipertensão, disfunção diastólica.',
  },
  {
    group: 'p', name: 'P invertida (ritmo juncional)', shape: { p: -0.12 }, tone: 'warn',
    cause: 'A despolarização atrial vem de BAIXO para cima — foco atrial baixo ou condução retrógrada a partir da junção AV.',
    meaning: 'P negativa em D2, D3 e aVF, com PR frequentemente < 120 ms. A P pode vir antes, dentro ou depois do QRS, conforme a velocidade de condução retrógrada.',
  },
  {
    group: 'p', name: 'P ausente', shape: { p: 0 }, tone: 'bad',
    cause: 'Não há despolarização atrial organizada, ou ela não é transmitida.',
    meaning: 'Fibrilação atrial (linha ondulante com RR irregular), ritmo juncional (RR regular, QRS estreito), parada sinusal, bloqueio sinoatrial ou paralisia atrial da hipercalemia grave.',
  },

  /* ── QRS ── */
  {
    group: 'qrs', name: 'QRS normal', shape: {}, tone: 'good',
    cause: 'Ativação simultânea dos dois ventrículos pela rede de Purkinje, a 2–4 m/s.',
    meaning: 'Duração de 60 a 100 ms, com q septal pequena em D1, aVL, V5 e V6.',
  },
  {
    group: 'qrs', name: 'QRS largo (bloqueio de ramo)', shape: { qrsW: 1.7, s: -0.5, rprime: 0.55, t: -0.3 }, tone: 'bad',
    cause: 'Um dos ramos não conduz: o ventrículo correspondente é ativado tardiamente, célula a célula, a 0,3–0,5 m/s.',
    meaning: '≥ 120 ms. O FIM do complexo aponta para o lado bloqueado — rSR′ em V1 no BRD; R alargada e entalhada em V6 no BRE. A T discordante é esperada e não significa isquemia.',
  },
  {
    group: 'qrs', name: 'Q patológica', shape: { q: -0.42, r: 0.6 }, tone: 'bad',
    cause: 'Tecido eletricamente morto: a região necrosada não gera vetor, e o eletrodo passa a enxergar a parede oposta se afastando.',
    meaning: '≥ 40 ms de duração OU ≥ 25% da amplitude da R, em duas derivações contíguas. Localize pelo grupo de derivações e você localiza o infarto.',
  },
  {
    group: 'qrs', name: 'Baixa voltagem', shape: { r: 0.35, s: -0.1, q: -0.02, t: 0.12 }, tone: 'warn',
    cause: 'Algo se interpôs entre o coração e o eletrodo, ou a massa miocárdica diminuiu.',
    meaning: '< 5 mm nos membros e < 10 mm nas precordiais. Derrame pericárdico, obesidade, DPOC, mixedema, amiloidose, pneumotórax, anasarca. Com taquicardia e alternância elétrica: tamponamento.',
  },
  {
    group: 'qrs', name: 'Alta voltagem (hipertrofia de VE)', shape: { r: 2.1, s: -0.5, st: -0.09, t: -0.3 }, tone: 'warn',
    cause: 'Massa ventricular aumentada gera vetor maior; a sobrecarga altera a repolarização das camadas subendocárdicas.',
    meaning: 'Sokolow-Lyon: S em V1 + R em V5/V6 ≥ 35 mm. Cornell: R em aVL + S em V3 > 28 mm (H) / > 20 mm (M). O infra de ST com T assimétrica e negativa em V5–V6 é o padrão de "strain".',
  },

  /* ── ST e T ── */
  {
    group: 'st', name: 'ST e T normais', shape: {}, tone: 'good',
    cause: 'Fase 2 (platô) uniforme e repolarização do epicárdio para o endocárdio.',
    meaning: 'ST isoelétrico (± 1 mm em relação ao segmento TP) e T concordante com o QRS, assimétrica — sobe devagar e desce rápido.',
  },
  {
    group: 'st', name: 'Supra de ST convexo (infarto)', shape: { st: 0.42, coved: true, t: 0.45, q: -0.2 }, tone: 'bad',
    cause: 'Lesão SUBEPICÁRDICA por oclusão total: o vetor de lesão aponta para fora, em direção ao eletrodo.',
    meaning: 'Convexo ("em abóbada"/tombstone), em derivações contíguas, com imagem em espelho. ≥ 1 mm em duas contíguas; em V2–V3, ≥ 2 mm (H > 40a), ≥ 2,5 mm (H < 40a) ou ≥ 1,5 mm (M). Reperfusão IMEDIATA.',
  },
  {
    group: 'st', name: 'Supra côncavo (pericardite)', shape: { st: 0.22, t: 0.4 }, tone: 'warn',
    cause: 'Inflamação difusa do epicárdio subjacente ao pericárdio — não respeita território coronariano.',
    meaning: 'Côncavo ("carinha feliz"), DIFUSO, sem imagem em espelho (exceto aVR) e com INFRA DE PR, que é o achado mais específico. Relação ST/T em V6 > 0,25 apoia o diagnóstico.',
  },
  {
    group: 'st', name: 'Infra de ST', shape: { st: -0.22, t: 0.2 }, tone: 'bad',
    cause: 'Lesão SUBENDOCÁRDICA: o vetor aponta para dentro, afastando-se do eletrodo.',
    meaning: 'Horizontal ou descendente ≥ 0,5 mm é isquemia até prova em contrário. Ao contrário do supra, geralmente NÃO localiza a artéria. Infra difuso com supra em aVR: lesão de tronco ou triarterial.',
  },
  {
    group: 'st', name: 'T apiculada (hipercalemia)', shape: { t: 1.15, tW: 120, tShape: 'peaked' }, tone: 'bad',
    cause: 'A hipercalemia aumenta a condutância de IKr e acelera a fase 3.',
    meaning: 'Alta, ESTREITA, simétrica e de base estreita ("em tenda"). Diferencie da T hiperaguda da isquemia, que é alta mas LARGA e de base larga.',
  },
  {
    group: 'st', name: 'T invertida simétrica (isquemia)', shape: { t: -0.55, tShape: 'symmetric' }, tone: 'bad',
    cause: 'A isquemia subepicárdica inverte o gradiente de repolarização: o epicárdio deixa de repolarizar primeiro.',
    meaning: 'Profunda e SIMÉTRICA. Diferencie do "strain" da sobrecarga, que é assimétrico e vem com infra de ST. T bifásica ou profundamente invertida em V2–V3 sem dor = Wellens: descendente anterior proximal crítica.',
  },
  {
    group: 'st', name: 'T achatada com U proeminente (hipocalemia)', shape: { t: 0.1, u: 0.28, st: -0.06 }, tone: 'warn',
    cause: 'A repolarização se arrasta e a repolarização tardia (Purkinje / células M) fica exposta.',
    meaning: 'T achatada, infra de ST discreto e onda U crescida. Em hipocalemia grave, T e U se fundem — cuidado ao medir o QT, o que se mede acaba sendo o QU.',
  },

  /* ── especiais ── */
  {
    group: 'especiais', name: 'Onda U proeminente', shape: { u: 0.3 }, tone: 'warn',
    cause: 'Repolarização tardia das fibras de Purkinje ou das células M do meio da parede.',
    meaning: 'Normal se < 25% da altura da T. Cresce na hipocalemia, hipercalcemia, bradicardia, hipertrofia de VE e com quinidina/amiodarona. U INVERTIDA é achado sutil e específico de isquemia de tronco ou de descendente anterior.',
  },
  {
    group: 'especiais', name: 'Onda J de Osborn (hipotermia)', shape: { j: 0.45, stW: 150 }, tone: 'bad',
    cause: 'O frio acentua a corrente Ito da fase 1 no epicárdio, mas não no endocárdio, criando um gradiente transmural no fim do QRS.',
    meaning: 'Entalhe positivo no ponto J, que surge abaixo de 32 °C e cresce conforme a temperatura cai. Vem com bradicardia, prolongamento de PR/QRS/QT e tremor no traçado. Também ocorre em hipercalcemia, lesão de SNC e repolarização precoce.',
  },
  {
    group: 'especiais', name: 'Onda delta (pré-excitação / WPW)', shape: { delta: 0.5, qrsW: 1.3 }, tone: 'bad',
    cause: 'Uma via acessória (feixe de Kent) fura o pedágio do nó AV e despolariza parte do ventrículo antes da hora.',
    meaning: 'PR < 120 ms, empastamento inicial do QRS e QRS alargado. Em fibrilação atrial com WPW, JAMAIS use bloqueador do nó AV (adenosina, verapamil, diltiazem, betabloqueador, digoxina): a condução se desvia toda para a via acessória e pode degenerar em fibrilação ventricular. Use procainamida ou cardioversão elétrica.',
  },
  {
    group: 'especiais', name: 'Onda épsilon', shape: { epsilon: 0.16, qrsW: 1.15, t: -0.25 }, tone: 'bad',
    cause: 'Condução muito lenta pelo tecido fibrogorduroso que substitui o miocárdio do ventrículo direito.',
    meaning: 'Pequena deflexão logo APÓS o QRS em V1–V2. Critério maior da displasia arritmogênica do ventrículo direito — causa importante de morte súbita em jovens e atletas.',
  },
  {
    group: 'especiais', name: 'Infra "em colher" (digital)', shape: { st: -0.16, t: 0.1, tW: 190, stW: 55 }, tone: 'warn',
    cause: 'A digoxina inibe a bomba Na⁺/K⁺-ATPase e encurta a repolarização ventricular.',
    meaning: 'Infra côncavo com descida suave, QT curto e T achatada. É EFEITO terapêutico, não intoxicação. A intoxicação digitálica se manifesta por arritmias — a mais típica é a taquicardia atrial com bloqueio.',
  },
]

export function WaveDoctor({ focus = 'p' }: { focus?: Group }) {
  const [group, setGroup] = useState<Group>(focus)
  const list = ENTRIES.filter((e) => e.group === group)
  const [name, setName] = useState(list[0]?.name ?? '')
  const entry = list.find((e) => e.name === name) ?? list[0]
  const { palette } = useEcgPaper()

  const normalPath = useMemo(() => {
    let d = ''
    for (let t = 0; t <= DUR; t += 2.5) d += `${t === 0 ? 'M' : 'L'}${xOf(t).toFixed(1)} ${yOf(value(t, {})).toFixed(1)} `
    return d.trim()
  }, [])

  const path = useMemo(() => {
    if (!entry) return ''
    let d = ''
    for (let t = 0; t <= DUR; t += 2.5) d += `${t === 0 ? 'M' : 'L'}${xOf(t).toFixed(1)} ${yOf(value(t, entry.shape)).toFixed(1)} `
    return d.trim()
  }, [entry])

  if (!entry) return null

  return (
    <LabShell>
      <ScrollRow className="mb-2" label="Onda">
        {GROUPS.map((g) => (
          <LabButton
            key={g.key}
            active={group === g.key}
            onClick={() => {
              setGroup(g.key)
              const first = ENTRIES.find((e) => e.group === g.key)
              if (first) setName(first.name)
            }}
          >
            {g.label}
          </LabButton>
        ))}
      </ScrollRow>

      <div className="grid gap-3 lg:grid-cols-[0.85fr_1.15fr] [&>*]:min-w-0">
        <div>
          <PaperFrame
            viewBox={`0 0 ${W} ${H}`}
            role="img"
            aria-label={entry.name}
            caption="Tracejado = batimento normal, para comparação"
          >
            <EcgGrid mm={MM} id="wd-grid" />
            <line x1={0} y1={BASE} x2={W} y2={BASE} stroke={palette.baseline} strokeWidth="1" strokeDasharray="4 6" />
            <path d={normalPath} fill="none" stroke={palette.ghost} strokeWidth="1.6" strokeDasharray="4 4" />
            <path d={path} fill="none" stroke={palette.trace} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
          </PaperFrame>
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {list.map((e) => (
              <LabChip key={e.name} active={entry.name === e.name} onClick={() => setName(e.name)}>
                {e.name}
              </LabChip>
            ))}
          </div>
          <h4 className="font-heading text-base font-black leading-tight tracking-tight">{entry.name}</h4>
          <LabNote title="Mecanismo" tone="info">{entry.cause}</LabNote>
          <LabNote title="Como reconhecer e o que significa" tone={entry.tone}>{entry.meaning}</LabNote>
        </div>
      </div>
    </LabShell>
  )
}
