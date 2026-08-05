'use client'

import React, { useMemo, useRef, useState } from 'react'
import { Ruler } from 'lucide-react'
import { BEAT, beatValue } from '@/lib/ecg/course/strip'
import { EcgGrid, LabButton, LabChip, LabNote, LabShell, Metric, ScrollRow } from './ui'

/**
 * Laboratório de intervalos e segmentos.
 *
 * Duas camadas: (1) selecionar a medida e ver exatamente onde ela começa e
 * termina no traçado, com o valor normal e o significado de aumentar/diminuir;
 * (2) o paquímetro — arrastar dois cursores e medir de verdade, comparando com
 * o valor real.
 */

const MM = 10
const W = 700
const H = 260
const BASE = 200
const DUR = 1400
const xOf = (t: number) => t * 0.5
const tOf = (x: number) => x * 2
const yOf = (mv: number) => BASE - mv * 100

interface MeasureSpec {
  key: string
  label: string
  from: number
  to: number
  kind: 'intervalo' | 'segmento' | 'onda'
  normal: string
  color: string
  what: string
  longer: string
  shorter: string
}

const MEASURES: MeasureSpec[] = [
  {
    key: 'p', label: 'Onda P', from: BEAT.pOn, to: BEAT.pOff, kind: 'onda',
    normal: '< 120 ms e < 2,5 mm', color: '#38bdf8',
    what: 'Despolarização dos dois átrios: a primeira metade é o átrio direito, a segunda é o esquerdo (via feixe de Bachmann).',
    longer: 'Larga e entalhada (≥ 120 ms com entalhe ≥ 40 ms): sobrecarga atrial esquerda ou bloqueio interatrial (síndrome de Bayés), com risco aumentado de fibrilação atrial. Alta (≥ 2,5 mm): sobrecarga atrial direita.',
    shorter: 'Ausente: fibrilação atrial, ritmo juncional, parada sinusal, paralisia atrial da hipercalemia. Invertida em D2: despolarização de baixo para cima (foco atrial baixo ou juncional).',
  },
  {
    key: 'pr', label: 'Intervalo PR', from: BEAT.pOn, to: BEAT.qOn, kind: 'intervalo',
    normal: '120–200 ms', color: '#facc15',
    what: 'Do início da onda P ao início do QRS. Inclui a despolarização atrial mais o atraso no nó AV e a passagem pelo His.',
    longer: '> 200 ms: bloqueio AV de 1º grau. Causas: hipertonia vagal (atleta, sono), isquemia inferior, betabloqueador, bloqueador de cálcio não di-hidropiridínico, digoxina, amiodarona, doença de Lyme, febre reumática, miocardite.',
    shorter: '< 120 ms COM onda delta e QRS largo: pré-excitação (WPW) — existe um atalho pelo feixe de Kent. < 120 ms SEM delta: ritmo juncional ou atrial baixo, ou síndrome de Lown-Ganong-Levine.',
  },
  {
    key: 'prseg', label: 'Segmento PR', from: BEAT.pOff, to: BEAT.qOn, kind: 'segmento',
    normal: 'Isoelétrico', color: '#fbbf24',
    what: 'Do FIM da onda P ao início do QRS — só a linha, sem onda. É o tempo em que o impulso está no nó AV, cuja massa é pequena demais para gerar sinal na superfície.',
    longer: 'Prolongado junto com o intervalo PR — mesmas causas de bloqueio AV de 1º grau.',
    shorter: 'Infradesnivelado: pericardite (é o achado mais específico dela, reflete a corrente de lesão atrial). Em aVR ocorre o inverso, supra de PR.',
  },
  {
    key: 'qrs', label: 'Complexo QRS', from: BEAT.qOn, to: BEAT.j, kind: 'onda',
    normal: '< 120 ms (habitual 60–100 ms)', color: '#34d399',
    what: 'Despolarização ventricular inteira: septo (q), massa principal (R) e regiões basais (S). É a fase 0 do conjunto dos ventrículos.',
    longer: '≥ 120 ms: bloqueio de ramo, ritmo ventricular, marca-passo, hipercalemia, drogas bloqueadoras de canal de sódio (classe I, antidepressivo tricíclico), WPW. Regra: ou o estímulo nasceu fora do sistema de condução, ou o sistema está quebrado.',
    shorter: 'Não existe QRS "curto demais". O que existe é QRS de baixa AMPLITUDE (< 5 mm nos membros): derrame pericárdico, obesidade, DPOC, mixedema, amiloidose.',
  },
  {
    key: 'st', label: 'Segmento ST', from: BEAT.j, to: BEAT.stEnd, kind: 'segmento',
    normal: 'Isoelétrico (± 1 mm)', color: '#fb923c',
    what: 'Do ponto J ao início da onda T. Corresponde à fase 2 (platô de cálcio): todo o ventrículo despolarizado ao mesmo tempo, sem gradiente e por isso sem deflexão.',
    longer: 'Alongado com onda T normal: HIPOcalcemia — o platô se prolonga porque falta cálcio extracelular. Resultado: QT longo à custa do ST.',
    shorter: 'Encurtado ou ausente (T colada no QRS): HIPERcalcemia, efeito digitálico. Desnivelado: supra = lesão subepicárdica (infarto, pericardite, repolarização precoce); infra = lesão subendocárdica, sobrecarga, digital, hipocalemia.',
  },
  {
    key: 'qt', label: 'Intervalo QT', from: BEAT.qOn, to: BEAT.tOff, kind: 'intervalo',
    normal: 'QTc ≤ 450 ms (H) / ≤ 460 ms (M)', color: '#f87171',
    what: 'Do início do QRS ao fim da onda T: a sístole elétrica ventricular inteira (fases 0 a 3). Depende da frequência — por isso se corrige (QTc).',
    longer: '> 500 ms = risco alto de torsades de pointes. Causas: hipocalemia, hipomagnesemia, hipocalcemia, antiarrítmicos classe IA e III, antipsicóticos, macrolídeos, antifúngicos azólicos, metadona, QT longo congênito, hipotermia, bradicardia, isquemia, hemorragia subaracnóidea.',
    shorter: '< 340–360 ms: hipercalcemia, efeito digitálico, hipertermia, acidose e síndrome do QT curto congênita (risco de fibrilação ventricular e morte súbita).',
  },
  {
    key: 'rr', label: 'Intervalo RR', from: BEAT.rPeak, to: BEAT.rPeak + 1000, kind: 'intervalo',
    normal: 'Regular, com variação < 10%', color: '#a78bfa',
    what: 'De um pico de R ao próximo — o ciclo cardíaco. É a base de todo cálculo de frequência: FC = 1500 ÷ quadradinhos, ou 300 ÷ quadradões.',
    longer: 'RR longo = bradicardia. Pausas: bloqueio sinoatrial, parada sinusal, bloqueio AV, extrassístole atrial bloqueada.',
    shorter: 'RR curto = taquicardia. Irregularmente irregular, sem padrão: fibrilação atrial. Irregular com padrão repetido: Wenckebach, extrassístoles em bigeminismo.',
  },
  {
    key: 'tp', label: 'Segmento TP', from: BEAT.uOff, to: BEAT.end, kind: 'segmento',
    normal: 'Isoelétrico — a referência zero', color: '#94a3b8',
    what: 'Do fim da onda T ao início da P seguinte: a diástole elétrica. É a única porção do traçado com zero absoluto de voltagem.',
    longer: 'Alongado em bradicardia — sem significado próprio.',
    shorter: 'Some em taquicardia (a P chega antes de a T acabar). Aí é preciso usar o segmento PR como linha de base, sabendo que a repolarização atrial pode empurrá-lo para baixo e criar falso infra de ST.',
  },
]

export function IntervalLab() {
  const [sel, setSel] = useState('pr')
  const [caliper, setCaliper] = useState(false)
  const [a, setA] = useState<number>(BEAT.pOn)
  const [b, setB] = useState<number>(BEAT.qOn)
  const [drag, setDrag] = useState<'a' | 'b' | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const spec = MEASURES.find((m) => m.key === sel) || MEASURES[0]

  const path = useMemo(() => {
    let d = ''
    for (let t = 0; t <= DUR; t += 2) {
      const mv = beatValue(t < BEAT.end ? t : t - BEAT.end)
      d += `${t === 0 ? 'M' : 'L'}${xOf(t).toFixed(1)} ${yOf(mv).toFixed(1)} `
    }
    return d.trim()
  }, [])

  function pointerT(e: React.PointerEvent) {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return 0
    const x = ((e.clientX - rect.left) / rect.width) * W
    return Math.max(0, Math.min(DUR, Math.round(tOf(x))))
  }

  const measured = Math.abs(b - a)
  const target = spec.to - spec.from
  const diff = Math.abs(measured - target)
  const accuracy = diff <= 20 ? 'good' : diff <= 50 ? 'warn' : 'bad'

  return (
    <LabShell>
      <ScrollRow className="mb-2" label="O que medir">
        {MEASURES.map((m) => (
          <LabChip
            key={m.key}
            active={sel === m.key}
            onClick={() => { setSel(m.key); setA(m.from); setB(m.to) }}
          >
            {m.label}
          </LabChip>
        ))}
      </ScrollRow>
      <div className="mb-2">
        <LabButton active={caliper} onClick={() => setCaliper((v) => !v)}>
          <Ruler className="h-3.5 w-3.5" /> {caliper ? 'Paquímetro ligado' : 'Medir com o paquímetro'}
        </LabButton>
      </div>

      <div className="overflow-hidden rounded-xl border border-emerald-500/20 bg-[#07100c]">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className={`block h-auto w-full text-emerald-400 ${caliper ? 'touch-none' : ''}`}
          role="img"
          aria-label={`Traçado com ${spec.label} destacado`}
          onPointerMove={(e) => {
            if (!drag) return
            const t = pointerT(e)
            if (drag === 'a') setA(t); else setB(t)
          }}
          onPointerUp={() => setDrag(null)}
          onPointerLeave={() => setDrag(null)}
        >
          <EcgGrid mm={MM} id="int-grid" />

          {/* faixa da medida selecionada */}
          <rect x={xOf(spec.from)} y={0} width={xOf(spec.to) - xOf(spec.from)} height={H} fill={spec.color} opacity="0.16" />
          <line x1={xOf(spec.from)} y1={0} x2={xOf(spec.from)} y2={H} stroke={spec.color} strokeWidth="1.6" />
          <line x1={xOf(spec.to)} y1={0} x2={xOf(spec.to)} y2={H} stroke={spec.color} strokeWidth="1.6" />
          <g>
            <line x1={xOf(spec.from)} y1={26} x2={xOf(spec.to)} y2={26} stroke={spec.color} strokeWidth="1.8" />
            <text
              x={Math.min(W - 92, Math.max(92, (xOf(spec.from) + xOf(spec.to)) / 2))}
              y={19} textAnchor="middle" fontSize="13" fontWeight="900"
              fill={spec.color} fontFamily="ui-monospace, monospace"
            >
              {spec.label} · {target} ms
            </text>
          </g>

          <line x1={0} y1={BASE} x2={W} y2={BASE} stroke="rgba(148,163,184,0.3)" strokeWidth="1" strokeDasharray="4 5" />
          <path d={path} fill="none" stroke="#3ff08a" strokeWidth="2.4" strokeLinejoin="round" />

          {/* paquímetro */}
          {caliper && (
            <g>
              {[{ t: a, k: 'a' as const }, { t: b, k: 'b' as const }].map(({ t, k }) => (
                <g
                  key={k}
                  onPointerDown={(e) => { e.preventDefault(); (e.target as Element).releasePointerCapture?.(e.pointerId); setDrag(k) }}
                  className="cursor-ew-resize"
                >
                  {/* faixa invisível de arraste: ~30 px de largura real no celular */}
                  <rect x={xOf(t) - 28} y={0} width={56} height={H} fill="transparent" pointerEvents="all" />
                  <line x1={xOf(t)} y1={0} x2={xOf(t)} y2={H} stroke="#f472b6" strokeWidth="2.4" />
                  <rect x={xOf(t) - 17} y={H - 40} width="34" height="36" rx="8" fill="#f472b6" />
                  <text x={xOf(t)} y={H - 16} textAnchor="middle" fontSize="17" fontWeight="900" fill="#1a1020">{k.toUpperCase()}</text>
                </g>
              ))}
              <line x1={xOf(Math.min(a, b))} y1={48} x2={xOf(Math.max(a, b))} y2={48} stroke="#f472b6" strokeWidth="2" />
              <text x={(xOf(a) + xOf(b)) / 2} y={42} textAnchor="middle" fontSize="13" fontWeight="900" fill="#f472b6" fontFamily="ui-monospace, monospace">
                {measured} ms
              </text>
            </g>
          )}
        </svg>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4 [&>*]:min-w-0">
        <Metric label="Tipo" value={spec.kind} />
        <Metric label="Duração no traçado" value={target} unit="ms" />
        <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
          <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Valor normal</p>
          <p className="text-[13px] font-black leading-snug text-emerald-600 dark:text-emerald-400">{spec.normal}</p>
        </div>
        {caliper && <Metric label="Você mediu" value={measured} unit="ms" tone={accuracy} />}
      </div>

      {caliper && (
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          Arraste os cursores A e B. Diferença de até 20 ms é excelente — no papel real, um quadradinho inteiro vale 40 ms.
        </p>
      )}

      <div className="mt-3 space-y-2">
        <LabNote title={`O que é o ${spec.label.toLowerCase()}`}>{spec.what}</LabNote>
        <LabNote title="Quando está AUMENTADO" tone="bad">{spec.longer}</LabNote>
        <LabNote title="Quando está DIMINUÍDO / alterado" tone="warn">{spec.shorter}</LabNote>
      </div>
    </LabShell>
  )
}
