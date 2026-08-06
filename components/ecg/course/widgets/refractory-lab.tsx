'use client'

import React, { useMemo, useState } from 'react'
import { MousePointerClick } from 'lucide-react'
import { beatValue } from '@/lib/ecg/course/strip'
import { LabChip, LabNote, LabShell, PaperFrame, ScrollRow, useEcgPaper } from './ui'

/** Instantes de interesse, para quem está no celular e não quer mirar no pixel. */
const SHORTCUTS = [
  { label: 'No QRS', t: 20 },
  { label: 'No segmento ST', t: 150 },
  { label: 'No pico da T (R sobre T)', t: 292 },
  { label: 'No fim da T', t: 325 },
  { label: 'No segmento TP', t: 390 },
]

/**
 * Laboratório do potencial de ação e dos períodos refratários.
 *
 * O potencial de ação é desenhado alinhado no tempo com o batimento do ECG, de
 * modo que o aluno veja, no mesmo eixo, que o QRS coincide com a fase 0 e que a
 * onda T coincide com a fase 3 — que é onde mora o período refratário relativo,
 * a zona vulnerável.
 */

/* ── geometria ── */
const W = 620
const AP_TOP = 16
const AP_H = 150
const ECG_TOP = 186
const ECG_H = 74
const H = 272
const T0 = -70          // ms mostrados antes da fase 0
const T1 = 430
const xOf = (t: number) => ((t - T0) / (T1 - T0)) * W
const tOf = (x: number) => T0 + (x / W) * (T1 - T0)

/** Potencial de membrana (mV) no instante t (ms), com t = 0 no início da fase 0. */
function ap(t: number): number {
  if (t < 0) return -90
  if (t < 3) return -90 + 110 * (t / 3)
  if (t < 12) return 20 - 15 * ((t - 3) / 9)
  if (t < 200) return 5 - 15 * ((t - 12) / 188)
  if (t < 320) {
    const s = (t - 200) / 120
    return -10 - 80 * Math.pow(s, 1.25)
  }
  return -90
}
const mvY = (mv: number) => AP_TOP + AP_H - ((mv + 100) / 140) * AP_H

/* ── zonas ── */
type Zone = 'pra' | 'pre' | 'prr' | 'supra' | 'excitavel'

interface ZoneSpec {
  key: Zone
  from: number
  to: number
  label: string
  color: string
  tone: 'bad' | 'warn' | 'info' | 'good'
  result: string
  meaning: string
}

const ZONES: ZoneSpec[] = [
  {
    key: 'pra', from: 0, to: 260,
    label: 'Período refratário ABSOLUTO', color: 'rgba(251,113,133,0.22)', tone: 'bad',
    result: 'Nenhuma resposta. Nem o estímulo mais forte gera potencial de ação.',
    meaning: 'Todos os canais rápidos de sódio estão INATIVADOS — fechados por uma segunda comporta que só reabre com a repolarização. No ECG, esta janela cobre o QRS e quase todo o segmento ST. É a fase segura: um estímulo aqui não faz nada, e é por isso que a cardioversão sincronizada dispara o choque em cima do R.',
  },
  {
    key: 'pre', from: 260, to: 278,
    label: 'Fim do período refratário EFETIVO', color: 'rgba(251,146,60,0.22)', tone: 'warn',
    result: 'Resposta LOCAL, que não se propaga.',
    meaning: 'Uns poucos canais de sódio já se recuperaram: a célula gera uma despolarização local, mas fraca demais para excitar as vizinhas. É este o período que o estudo eletrofisiológico mede quando fala em "PRE do nó AV" ou "PRE da via acessória".',
  },
  {
    key: 'prr', from: 278, to: 315,
    label: 'Período refratário RELATIVO — zona vulnerável', color: 'rgba(250,204,21,0.22)', tone: 'warn',
    result: 'Resposta ANORMAL: potencial de ação de baixa amplitude, fase 0 lenta, condução lentificada.',
    meaning: 'Parte dos canais se recuperou, parte não — e de forma HETEROGÊNEA entre regiões vizinhas. A frente encontra caminhos que conduzem e caminhos bloqueados: nasce o bloqueio unidirecional, condição obrigatória para reentrada. É aqui que mora o fenômeno R sobre T, gatilho clássico de taquicardia ventricular polimórfica e fibrilação ventricular.',
  },
  {
    key: 'supra', from: 315, to: 336,
    label: 'Período SUPRANORMAL', color: 'rgba(56,189,248,0.22)', tone: 'info',
    result: 'Resposta com estímulo mais FRACO que o normal.',
    meaning: 'A membrana já está quase repolarizada, mas ainda não voltou aos −90 mV: está mais PERTO do limiar do que no repouso. Um estímulo sublimiar consegue capturar. Explica capturas inesperadas e falhas intermitentes de comando de marca-passo.',
  },
  {
    key: 'excitavel', from: 336, to: T1,
    label: 'Excitabilidade plena (fase 4)', color: 'rgba(52,211,153,0.16)', tone: 'good',
    result: 'Resposta NORMAL, idêntica à do batimento anterior.',
    meaning: 'Todos os canais de sódio recuperados, membrana em −90 mV. No ECG, corresponde ao segmento TP — a diástole elétrica. Uma extrassístole que cai aqui é bem tolerada e conduz normalmente.',
  },
]

const PHASES = [
  { n: '0', from: 0, to: 3, label: 'Despolarização — entra Na⁺' },
  { n: '1', from: 3, to: 12, label: 'Repolarização inicial — sai K⁺ (Ito)' },
  { n: '2', from: 12, to: 200, label: 'Platô — entra Ca²⁺ (fase que sustenta o ST)' },
  { n: '3', from: 200, to: 320, label: 'Repolarização rápida — sai K⁺ (onda T)' },
  { n: '4', from: 320, to: T1, label: 'Repouso — −90 mV mantido por IK1 e Na⁺/K⁺-ATPase' },
]

function zoneAt(t: number): ZoneSpec {
  if (t < 0) return ZONES[4]
  return ZONES.find((z) => t >= z.from && t < z.to) ?? ZONES[4]
}

export function RefractoryLab({ focus = 'stimulate' }: { focus?: 'phases' | 'refractory' | 'stimulate' }) {
  const { palette } = useEcgPaper()
  const [stim, setStim] = useState<number | null>(null)
  const [hoverPhase, setHoverPhase] = useState<string | null>(null)

  const apPath = useMemo(() => {
    let d = ''
    for (let t = T0; t <= T1; t += 1.5) {
      d += `${t === T0 ? 'M' : 'L'}${xOf(t).toFixed(1)} ${mvY(ap(t)).toFixed(1)} `
    }
    return d.trim()
  }, [])

  // batimento do ECG alinhado: o QRS do batimento didático começa em 200 ms
  const ecgPath = useMemo(() => {
    let d = ''
    for (let t = T0; t <= T1; t += 1.5) {
      const mv = beatValue(t + 200)
      const y = ECG_TOP + ECG_H * 0.72 - mv * 40
      d += `${t === T0 ? 'M' : 'L'}${xOf(t).toFixed(1)} ${y.toFixed(1)} `
    }
    return d.trim()
  }, [])

  const showZones = focus !== 'phases'
  const zone = stim != null ? zoneAt(stim) : null

  function handleClick(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * W
    setStim(Math.round(tOf(x)))
  }

  return (
    <LabShell>
      <div className="mb-2">
        <p className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-muted-foreground">
          <MousePointerClick className="h-3.5 w-3.5" />
          {focus === 'phases' ? 'As cinco fases do potencial de ação' : 'Toque no gráfico ou use os atalhos abaixo'}
        </p>
      </div>

      <PaperFrame
        viewBox={`0 0 ${W} ${H}`}
        className="cursor-crosshair"
        onClick={handleClick}
        role="img"
        aria-label="Potencial de ação cardíaco alinhado ao eletrocardiograma"
      >
        {/* zonas refratárias */}
        {showZones && ZONES.map((z) => (
          <rect key={z.key} x={xOf(z.from)} y={AP_TOP - 6} width={xOf(z.to) - xOf(z.from)} height={AP_H + 12} fill={z.color} />
        ))}

        {/* eixos */}
        {[-100, -50, 0, 20].map((mv) => (
          <g key={mv}>
            <line x1={0} y1={mvY(mv)} x2={W} y2={mvY(mv)} stroke={palette.baseline} strokeOpacity="0.6" strokeWidth="1" strokeDasharray="3 5" />
            <text x={4} y={mvY(mv) - 3} fontSize="9" fill={palette.inkSoft} fontFamily="ui-monospace, monospace">{mv} mV</text>
          </g>
        ))}

        {/* curva do potencial de ação */}
        <path d={apPath} fill="none" stroke={palette.annot.sky} strokeWidth="2.6" strokeLinejoin="round" />

        {/* rótulos das fases */}
        {PHASES.map((p) => (
          <g key={p.n} onMouseEnter={() => setHoverPhase(p.n)} onMouseLeave={() => setHoverPhase(null)}>
            <rect x={xOf(p.from)} y={AP_TOP - 6} width={Math.max(6, xOf(p.to) - xOf(p.from))} height={AP_H + 12} fill="transparent" />
            <text
              x={xOf((p.from + p.to) / 2)} y={AP_TOP + AP_H + 10} textAnchor="middle"
              fontSize="12" fontWeight="900" fill={hoverPhase === p.n ? palette.annot.sky : palette.inkSoft}
              fontFamily="ui-monospace, monospace"
            >
              {p.n}
            </text>
          </g>
        ))}

        {/* zonas rotuladas */}
        {showZones && (
          <g fontSize="9.5" fontWeight="800" fontFamily="ui-sans-serif, system-ui">
            <text x={xOf(130)} y={AP_TOP + 12} textAnchor="middle" fill={palette.annot.rose}>ABSOLUTO</text>
            <text x={xOf(296)} y={AP_TOP + 12} textAnchor="middle" fill={palette.annot.amber}>RELATIVO</text>
            <text x={xOf(326)} y={AP_TOP + 26} textAnchor="middle" fill={palette.annot.sky}>SN</text>
          </g>
        )}

        {/* separador */}
        <line x1={0} y1={ECG_TOP - 10} x2={W} y2={ECG_TOP - 10} stroke={palette.baseline} strokeWidth="1" />

        {/* ECG alinhado */}
        <path d={ecgPath} fill="none" stroke={palette.trace} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
        <g fontSize="10" fontWeight="800" fill={palette.inkSoft} fontFamily="ui-monospace, monospace">
          <text x={xOf(20)} y={ECG_TOP + 6}>QRS</text>
          <text x={xOf(140)} y={ECG_TOP + 6}>ST</text>
          <text x={xOf(250)} y={ECG_TOP + 6}>T</text>
          <text x={xOf(380)} y={ECG_TOP + 6}>TP</text>
        </g>

        {/* estímulo aplicado */}
        {stim != null && (
          <g>
            <line x1={xOf(stim)} y1={AP_TOP - 8} x2={xOf(stim)} y2={H - 4} stroke={palette.annot.pink} strokeWidth="2" strokeDasharray="5 4" />
            <circle cx={xOf(stim)} cy={mvY(ap(stim))} r="5" fill={palette.annot.pink} />
            <text x={xOf(stim)} y={H - 6} textAnchor="middle" fontSize="10" fontWeight="900" fill={palette.annot.pink} fontFamily="ui-monospace, monospace">
              {stim} ms
            </text>
          </g>
        )}
      </PaperFrame>

      {focus !== 'phases' && (
        <ScrollRow className="mt-2" label="Disparar um estímulo em">
          {SHORTCUTS.map((s) => (
            <LabChip key={s.label} active={stim === s.t} onClick={() => setStim(s.t)}>{s.label}</LabChip>
          ))}
          {stim != null && <LabChip onClick={() => setStim(null)}>Limpar</LabChip>}
        </ScrollRow>
      )}

      {focus === 'phases' && (
        <div className="mt-2 grid gap-1.5 sm:grid-cols-2 [&>*]:min-w-0">
          {PHASES.map((p) => (
            <div key={p.n} className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 px-2.5 py-1.5">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-sky-500/20 font-mono text-[11px] font-black text-sky-500">
                {p.n}
              </span>
              <span className="text-[12px] leading-snug">{p.label}</span>
            </div>
          ))}
        </div>
      )}

      {zone ? (
        <div className="mt-3 space-y-2">
          <LabNote title={zone.label} tone={zone.tone}>
            <strong className="block">{zone.result}</strong>
            <span className="mt-1 block">{zone.meaning}</span>
          </LabNote>
        </div>
      ) : (
        focus !== 'phases' && (
          <p className="mt-3 text-[12px] leading-relaxed text-muted-foreground">
            Experimente três pontos: em cima do QRS (nada acontece), em cima da onda T (resposta anormal — é o
            fenômeno R sobre T) e no segmento TP (resposta normal). A onda T é a única parte do batimento em que um
            estímulo extra é perigoso.
          </p>
        )
      )}
    </LabShell>
  )
}
