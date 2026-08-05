'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Play, Pause, RotateCcw } from 'lucide-react'
import { BEAT, beatPath, xOf, yOf, type StripScale } from '@/lib/ecg/course/strip'
import { CourseHeart, type HeartPart } from './course-heart'
import { EcgGrid, LabButton, LabNote, LabShell } from './ui'

/**
 * O construtor do traçado — o laboratório central da trilha.
 *
 * O batimento é desenhado ANALITICAMENTE (não é imagem), o que permite recortar
 * o traçado em qualquer instante e mostrar a onda nascendo exatamente enquanto o
 * texto explica o evento elétrico que a produz. À direita, o coração acende a
 * estrutura que está despolarizando naquele momento.
 */

/* Escala: 50 mm/s e 10 mm/mV, 14 unidades de viewBox por milímetro.
   Assim x = t(ms) × 0,7 e y = 196 − mV × 140. */
const MM = 14
const SC: StripScale = { width: 560, height: 280, durationMs: 800, mvSpan: 1, baseline: 196 }

interface BuildStep {
  id: string
  chip: string
  title: string
  /** Instante final do traçado desenhado neste passo (ms). */
  tEnd: number
  /** Faixa destacada no papel. */
  span: [number, number] | null
  heart: HeartPart[]
  what: string
  why: string
  /** Medida exibida ao lado. */
  measure?: { label: string; value: string }
  fail?: string
}

const STEPS: BuildStep[] = [
  {
    id: 'base',
    chip: 'Linha de base',
    title: 'Antes de tudo: a linha isoelétrica',
    tEnd: BEAT.pOn,
    span: null,
    heart: [],
    what: 'O coração está em repouso elétrico. Todas as células ventriculares estão polarizadas do mesmo jeito (−90 mV por dentro), então não existe diferença de potencial entre regiões — e sem diferença de potencial, não há deflexão.',
    why: 'Essa linha é a referência de tudo. É contra ela que se mede supra e infra de ST. O trecho realmente confiável para isso é o segmento TP, entre o fim de uma onda T e o início da P seguinte: é a única diástole elétrica verdadeira do traçado.',
  },
  {
    id: 'p',
    chip: 'Onda P',
    title: 'Onda P — os átrios despolarizam',
    tEnd: BEAT.pOff,
    span: [BEAT.pOn, BEAT.pOff],
    heart: ['sa', 'ra', 'internodal', 'bachmann', 'la'],
    what: 'O nó sinoatrial dispara. A frente percorre o átrio direito pelas vias internodais e cruza para o átrio esquerdo pelo feixe de Bachmann. A soma dos dois vetores, apontando para baixo e para a esquerda, produz uma onda arredondada e positiva em D2.',
    why: 'A PRIMEIRA metade da P é átrio direito e a SEGUNDA é átrio esquerdo. É por isso que sobrecarga direita deixa a P mais ALTA (o vetor inicial cresce) e sobrecarga esquerda deixa a P mais LARGA e entalhada (o componente final atrasa).',
    measure: { label: 'Duração da P', value: '< 120 ms · altura < 2,5 mm' },
    fail: 'P ausente: fibrilação atrial, ritmo juncional, parada sinusal ou paralisia atrial da hipercalemia. P invertida em D2: o átrio despolarizou de baixo para cima (foco atrial baixo ou juncional). P alta: sobrecarga direita. P larga e entalhada: sobrecarga esquerda ou bloqueio interatrial.',
  },
  {
    id: 'pr',
    chip: 'Segmento PR',
    title: 'Segmento PR — o pedágio do nó AV',
    tEnd: BEAT.qOn,
    span: [BEAT.pOff, BEAT.qOn],
    heart: ['av', 'his'],
    what: 'A linha volta ao isoelétrico, mas o coração não está parado: o impulso está atravessando o nó AV a 0,05 m/s — o trecho mais lento de todo o sistema. Depois percorre o feixe de His.',
    why: 'Não há deflexão porque a massa do nó AV é pequena demais para gerar voltagem detectável na superfície do corpo. Há atividade, mas não há sinal. Esse atraso de 90–130 ms é o que permite o enchimento ventricular pela contração atrial — 20 a 30% do volume diastólico final.',
    measure: { label: 'Intervalo PR (do início da P ao início do QRS)', value: '120–200 ms' },
    fail: 'PR > 200 ms: bloqueio AV de 1º grau. PR < 120 ms COM onda delta: pré-excitação (WPW) — existe um atalho, o feixe de Kent, que fura o pedágio. PR < 120 ms SEM delta: ritmo juncional ou atrial baixo. Infra de PR: pericardite.',
  },
  {
    id: 'q',
    chip: 'Onda Q',
    title: 'Onda Q — o septo, da esquerda para a direita',
    tEnd: BEAT.qPeak + 8,
    span: [BEAT.qOn, BEAT.qPeak + 8],
    heart: ['his', 'septal', 'septum'],
    what: 'A primeira porção ventricular a despolarizar é o septo interventricular, e ele o faz da ESQUERDA para a DIREITA — porque o ramo esquerdo emite os primeiros ramos septais. Esse vetor aponta para a direita e para cima, ou seja, contrário ao vetor principal.',
    why: 'É por isso que existe uma q pequena e estreita em D1, aVL, V5 e V6 no ECG absolutamente normal. Ela não é doença: a AUSÊNCIA dela é que chama atenção (bloqueio de ramo esquerdo, bloqueio do fascículo septal, fibrose septal).',
    measure: { label: 'q septal normal', value: '< 40 ms e < 25% da altura do R' },
    fail: 'Q patológica (≥ 40 ms ou ≥ 25% do R, em duas derivações contíguas) significa tecido eletricamente morto: a região necrosada não gera vetor e o eletrodo passa a "enxergar" a parede oposta se afastando.',
  },
  {
    id: 'r',
    chip: 'Onda R',
    title: 'Onda R — a massa ventricular inteira',
    tEnd: BEAT.rPeak + 6,
    span: [BEAT.qPeak + 8, BEAT.rPeak + 6],
    heart: ['rbb', 'lbb', 'laf', 'lpf', 'purkinje', 'lv', 'rv'],
    what: 'A rede de Purkinje entrega o impulso simultaneamente a toda a superfície endocárdica, e a despolarização caminha do ENDOCÁRDIO para o EPICÁRDIO, do ápice para a base. Como o ventrículo esquerdo tem três vezes mais massa que o direito, o vetor resultante aponta para baixo e para a esquerda: deflexão alta e positiva.',
    why: 'A velocidade do Purkinje (2–4 m/s) é o que mantém o QRS estreito apesar da enorme massa. Se o estímulo nascesse no músculo, caminharia a 0,3–0,5 m/s e o complexo alargaria. Toda vez que o QRS passa de 120 ms, ou o estímulo nasceu fora do sistema de condução, ou o sistema está quebrado.',
    measure: { label: 'Duração total do QRS', value: '< 120 ms (habitual: 60–100 ms)' },
    fail: 'QRS largo: bloqueio de ramo, ritmo ventricular, marca-passo, hipercalemia, drogas classe I, WPW. QRS de baixa amplitude: derrame pericárdico, obesidade, DPOC, mixedema, amiloidose. QRS de amplitude alta: hipertrofia ventricular esquerda.',
  },
  {
    id: 's',
    chip: 'Onda S',
    title: 'Onda S — as últimas porções, basais e posteriores',
    tEnd: BEAT.j,
    span: [BEAT.rPeak + 6, BEAT.j],
    heart: ['lv', 'rv'],
    what: 'Por último despolarizam as regiões basais e posterobasais dos ventrículos e a porção alta do septo. Esse vetor final aponta para cima e para a direita — de volta, afastando-se do eletrodo de D2 — e produz a pequena deflexão negativa que fecha o complexo.',
    why: 'O FIM do QRS é o que denuncia bloqueio de ramo: nele está registrado quem despolarizou por último. Se o final aponta para a direita (R′ em V1, S alargada em V6), o ramo bloqueado é o direito. Se aponta para a esquerda (R alargada e entalhada em V6), é o esquerdo.',
    measure: { label: 'Ponto J', value: 'Fim do QRS = início do segmento ST' },
    fail: 'Padrão rSR′ em V1 (orelhas de coelho) = bloqueio de ramo direito. QS em V1 com R alargada em V6 = bloqueio de ramo esquerdo.',
  },
  {
    id: 'st',
    chip: 'Segmento ST',
    title: 'Segmento ST — o platô, todo mundo despolarizado',
    tEnd: BEAT.stEnd,
    span: [BEAT.j, BEAT.stEnd],
    heart: ['lv', 'rv', 'septum'],
    what: 'Todo o ventrículo está despolarizado ao mesmo tempo, na fase 2 do potencial de ação — o platô sustentado pela entrada de cálcio. Sem diferença de potencial entre regiões, não há dipolo, e a linha volta ao isoelétrico.',
    why: 'Se uma região não consegue fazer o platô como as vizinhas (isquemia, lesão), nasce um gradiente entre elas e a linha se desloca. Supra e infra de ST são, na essência, defeito da fase 2. Lesão subepicárdica → vetor aponta para fora → SUPRA. Lesão subendocárdica → vetor aponta para dentro → INFRA.',
    measure: { label: 'Desvio aceitável', value: 'Isoelétrico, ± 1 mm (medido a partir do TP)' },
    fail: 'Supra convexo em derivações contíguas com imagem em espelho: infarto. Supra côncavo difuso com infra de PR: pericardite. Infra horizontal ou descendente ≥ 0,5 mm: isquemia subendocárdica. Infra em colher com QT curto: efeito digitálico.',
  },
  {
    id: 't',
    chip: 'Onda T',
    title: 'Onda T — a repolarização ventricular',
    tEnd: BEAT.tOff,
    span: [BEAT.stEnd, BEAT.tOff],
    heart: ['lv', 'rv'],
    what: 'Os ventrículos voltam ao estado polarizado, na fase 3. Mas a repolarização caminha ao contrário da despolarização: começa no EPICÁRDIO e vai para o ENDOCÁRDIO, porque a célula epicárdica tem potencial de ação mais curto (está menos comprimida e mais bem perfundida).',
    why: 'Duas inversões que se anulam. A repolarização gera vetor de sinal oposto ao da despolarização, e caminha em sentido oposto. Resultado: a T é POSITIVA, concordante com o QRS. É por isso que a onda T normal é assimétrica — sobe devagar e desce rápido.',
    measure: { label: 'Intervalo QT (início do QRS ao fim da T)', value: 'QTc ≤ 450 ms (H) / 460 ms (M)' },
    fail: 'T apiculada, estreita e simétrica: hipercalemia. T alta, larga e assimétrica: isquemia hiperaguda. T invertida simétrica e profunda: isquemia. T achatada: hipocalemia, hipotireoidismo. QT longo: risco de torsades de pointes.',
  },
  {
    id: 'u',
    chip: 'Onda U',
    title: 'Onda U — a repolarização tardia',
    tEnd: BEAT.uOff,
    span: [BEAT.tOff, BEAT.uOff],
    heart: ['purkinje'],
    what: 'Pequena deflexão após a T, melhor vista em V2 e V3. A explicação mais aceita é a repolarização tardia das fibras de Purkinje ou das células M do meio da parede ventricular, que têm o potencial de ação mais longo.',
    why: 'Normal se for menor que 25% da altura da T e tiver a mesma polaridade dela. Vira sinal de doença quando cresce (hipocalemia, hipercalcemia, bradicardia, hipertrofia) ou quando INVERTE — uma onda U negativa é achado sutil, mas bastante específico, de isquemia de tronco ou de descendente anterior.',
    measure: { label: 'Amplitude normal', value: '< 25% da onda T, mesma polaridade' },
    fail: 'U proeminente: hipocalemia (o achado clássico), hipercalcemia, bradicardia, quinidina/amiodarona. U invertida: isquemia, hipertensão. Fusão T-U em hipocalemia grave é armadilha na medida do QT.',
  },
  {
    id: 'tp',
    chip: 'Segmento TP',
    title: 'Segmento TP — a diástole elétrica',
    tEnd: BEAT.end,
    span: [BEAT.uOff, BEAT.end],
    heart: [],
    what: 'Silêncio elétrico verdadeiro. Todo o coração está repolarizado, aguardando o próximo disparo do nó sinusal. É a diástole elétrica — e a única porção do traçado que representa o zero absoluto de voltagem.',
    why: 'Use SEMPRE o TP como linha de base para medir desnível de ST. Em taquicardia, o TP some (a P chega antes de a T acabar) e é preciso usar o PR — sabendo que a onda de repolarização atrial pode empurrá-lo para baixo e criar falso infra. É a "pseudo-isquemia" do teste ergométrico.',
    measure: { label: 'Intervalo RR', value: 'De um pico de R ao próximo — é o ciclo cardíaco' },
  },
]

const SPAN_COLORS: Record<string, string> = {
  p: 'rgba(56,189,248,0.20)',
  pr: 'rgba(250,204,21,0.18)',
  q: 'rgba(244,114,182,0.20)',
  r: 'rgba(52,211,153,0.20)',
  s: 'rgba(167,139,250,0.20)',
  st: 'rgba(251,146,60,0.20)',
  t: 'rgba(248,113,113,0.20)',
  u: 'rgba(226,232,240,0.16)',
  tp: 'rgba(148,163,184,0.14)',
  base: 'transparent',
}

export function WaveBuilder() {
  const [i, setI] = useState(0)
  const [playing, setPlaying] = useState(false)
  const step = STEPS[i]
  const isLast = i === STEPS.length - 1

  const go = useCallback((d: number) => {
    setI((v) => Math.min(STEPS.length - 1, Math.max(0, v + d)))
  }, [])

  useEffect(() => {
    if (!playing) return
    const t = setTimeout(() => {
      setI((v) => {
        if (v >= STEPS.length - 1) { setPlaying(false); return v }
        return v + 1
      })
    }, 5200)
    return () => clearTimeout(t)
  }, [playing, i])

  // Traçado já construído (sólido) e o restante do batimento (fantasma, pontilhado)
  const drawn = useMemo(() => beatPath(0, step.tEnd, SC), [step.tEnd])
  const ghost = useMemo(() => beatPath(step.tEnd, BEAT.end, SC), [step.tEnd])

  const span = step.span
  const spanX = span ? xOf(span[0], SC) : 0
  const spanW = span ? xOf(span[1], SC) - xOf(span[0], SC) : 0

  return (
    <LabShell>
      {/* Trilho de etapas */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {STEPS.map((s, idx) => (
          <button
            key={s.id}
            type="button"
            onClick={() => { setPlaying(false); setI(idx) }}
            className={`rounded-md px-2 py-1 text-[11px] font-bold transition ${
              idx === i
                ? 'bg-primary text-primary-foreground'
                : idx < i
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                  : 'bg-muted/50 text-muted-foreground hover:text-foreground'
            }`}
          >
            {s.chip}
          </button>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.55fr_1fr]">
        {/* ── Papel ── */}
        <div>
          <div className="overflow-hidden rounded-xl border border-emerald-500/20 bg-[#07100c]">
            <svg viewBox={`0 0 ${SC.width} ${SC.height}`} className="block h-auto w-full text-emerald-400" role="img"
              aria-label={`Construção do eletrocardiograma: ${step.title}`}>
              <EcgGrid mm={MM} id="wb-grid" />

              {/* faixa do trecho atual */}
              {span && (
                <rect x={spanX} y={0} width={spanW} height={SC.height} fill={SPAN_COLORS[step.id] || 'rgba(255,255,255,0.08)'} />
              )}

              {/* linha isoelétrica */}
              <line x1={0} y1={SC.baseline} x2={SC.width} y2={SC.baseline} stroke="rgba(148,163,184,0.35)" strokeWidth="1" strokeDasharray="4 5" />

              {/* restante do batimento, ainda não explicado */}
              {step.tEnd < BEAT.end && (
                <path d={ghost} fill="none" stroke="rgba(148,163,184,0.22)" strokeWidth="2" strokeDasharray="3 5" strokeLinejoin="round" />
              )}

              {/* traçado construído */}
              <path d={drawn} fill="none" stroke="#3ff08a" strokeWidth="2.8" strokeLinejoin="round" strokeLinecap="round" />

              {/* linha vertical marcando até onde o traçado já foi construído */}
              {step.tEnd < BEAT.end && (
                <line
                  x1={xOf(step.tEnd, SC)} y1={0} x2={xOf(step.tEnd, SC)} y2={SC.height}
                  stroke="#3ff08a" strokeWidth="1.2" strokeOpacity="0.5" strokeDasharray="2 4"
                />
              )}

              {/* colchete de medida do trecho */}
              {span && (
                <g>
                  <line x1={spanX} y1={30} x2={spanX + spanW} y2={30} stroke="#e2e8f0" strokeWidth="1.4" />
                  <line x1={spanX} y1={24} x2={spanX} y2={36} stroke="#e2e8f0" strokeWidth="1.4" />
                  <line x1={spanX + spanW} y1={24} x2={spanX + spanW} y2={36} stroke="#e2e8f0" strokeWidth="1.4" />
                  <text
                    x={spanX + spanW / 2} y={20} textAnchor="middle"
                    fontSize="14" fontWeight="800" fill="#e2e8f0" fontFamily="ui-monospace, monospace"
                  >
                    {Math.round(span[1] - span[0])} ms
                  </text>
                </g>
              )}

              {/* rótulos das ondas já desenhadas */}
              <g fontSize="16" fontWeight="900" fontFamily="ui-monospace, monospace" fill="#7dd3fc">
                {step.tEnd >= BEAT.pOff && <text x={xOf(BEAT.pPeak, SC)} y={yOf(0.16, SC) - 12} textAnchor="middle">P</text>}
                {step.tEnd >= BEAT.qPeak + 8 && <text x={xOf(BEAT.qPeak, SC) - 8} y={yOf(-0.1, SC) + 22} textAnchor="middle" fill="#f9a8d4">Q</text>}
                {step.tEnd >= BEAT.rPeak + 6 && <text x={xOf(BEAT.rPeak, SC)} y={yOf(1.25, SC) - 10} textAnchor="middle" fill="#6ee7b7">R</text>}
                {step.tEnd >= BEAT.j && <text x={xOf(BEAT.sPeak, SC) + 10} y={yOf(-0.3, SC) + 22} textAnchor="middle" fill="#c4b5fd">S</text>}
                {step.tEnd >= BEAT.tOff && <text x={xOf(BEAT.tPeak, SC)} y={yOf(0.36, SC) - 12} textAnchor="middle" fill="#fca5a5">T</text>}
                {step.tEnd >= BEAT.uOff && <text x={xOf(BEAT.uPeak, SC)} y={yOf(0.06, SC) - 10} textAnchor="middle" fill="#e2e8f0">U</text>}
              </g>
            </svg>
          </div>

          <p className="mt-1.5 text-center text-[11px] text-muted-foreground">
            Traçado ampliado a 50 mm/s e 10 mm/mV · quadradinho = 20 ms e 0,1 mV
          </p>

          {/* Navegação */}
          <div className="mt-3 flex items-center gap-2">
            <LabButton onClick={() => { setPlaying(false); go(-1) }} disabled={i === 0}>
              <ChevronLeft className="h-4 w-4" /> Voltar
            </LabButton>
            <LabButton onClick={() => setPlaying((p) => !p)} active={playing} tone="primary">
              {playing ? <><Pause className="h-4 w-4" /> Pausar</> : <><Play className="h-4 w-4" /> Automático</>}
            </LabButton>
            <LabButton onClick={() => { setPlaying(false); setI(0) }} title="Recomeçar">
              <RotateCcw className="h-4 w-4" />
            </LabButton>
            <LabButton onClick={() => { setPlaying(false); go(1) }} disabled={isLast} active tone="primary" className="ml-auto">
              Próxima onda <ChevronRight className="h-4 w-4" />
            </LabButton>
          </div>
        </div>

        {/* ── Coração + explicação ── */}
        <div className="space-y-3">
          <div className="rounded-xl border border-border bg-muted/20 p-2">
            <CourseHeart active={step.heart} />
            <p className="mt-1 text-center text-[11px] font-semibold text-muted-foreground">
              {step.heart.length ? 'Estruturas ativas neste instante' : 'Nenhuma estrutura despolarizando'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Texto do passo ── */}
      <div className="mt-3 space-y-2.5">
        <h4 className="font-heading text-base font-black tracking-tight">{step.title}</h4>
        <LabNote title="O que está acontecendo">{step.what}</LabNote>
        <LabNote title="Por que a onda tem essa forma" tone="info">{step.why}</LabNote>
        {step.measure && (
          <div className="flex flex-wrap items-baseline gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] px-3 py-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              {step.measure.label}
            </span>
            <span className="font-mono text-sm font-black">{step.measure.value}</span>
          </div>
        )}
        {step.fail && <LabNote title="Quando dá errado" tone="bad">{step.fail}</LabNote>}
      </div>
    </LabShell>
  )
}
