'use client'

import React, { useMemo, useState } from 'react'
import { buildTimeline, type EcgPattern } from '@/lib/ecg/engine'
import { patternPath, type StripScale } from '@/lib/ecg/course/strip'
import { EcgGrid, LabButton, LabNote, LabShell, ScrollRow } from './ui'

/**
 * Laboratório dos bloqueios atrioventriculares.
 *
 * Cada padrão vem com traçado sintetizado E diagrama em escada (Lewis): a
 * linha de cima são os átrios, a faixa do meio é o nó AV e a de baixo são os
 * ventrículos. É no diagrama que se enxerga o que o traçado esconde — onde
 * exatamente o impulso morreu.
 */

const MM = 8
const W = 1000
const STRIP_H = 150
const SC: StripScale = { width: W, height: STRIP_H, durationMs: 5000, mvSpan: 1, baseline: 104 }
const xOf = (ms: number) => (ms / SC.durationMs) * W

interface LadderBeat {
  /** Instante da onda P (ms). */
  p: number
  /** Intervalo PR em ms, ou null se a P não conduziu. */
  pr: number | null
}

interface BlockCase {
  key: string
  name: string
  pattern: EcgPattern
  criteria: string[]
  site: string
  conduct: string
  tone: 'good' | 'warn' | 'bad'
  trick: string
}

const base = (over: Partial<EcgPattern>): EcgPattern => ({
  id: 'blk', rate: 75, rhythm: 'sinus', pr: 160,
  p: { present: true, amp: 0.16, axis: 60, width: 100 },
  qrs: { axis: 60, rAmp: 1.2, qAmp: 0.07, sAmp: 0.25, width: 90 },
  t: { amp: 0.3, axis: 55, width: 160 },
  ...over,
})

/**
 * Deriva o diagrama em escada da MESMA linha do tempo que gera o traçado
 * sintetizado — assim as marcas do diagrama caem exatamente sob as ondas
 * correspondentes, em vez de serem um desenho aproximado.
 */
function ladderFrom(pattern: EcgPattern) {
  const tl = buildTimeline(pattern, SC.durationMs)
  const beats = [...tl.beats].sort((a, b) => a.t - b.t)
  const used = new Set<number>()
  const rungs: LadderBeat[] = []

  for (const a of tl.atria) {
    if (!a.conducted) { rungs.push({ p: a.t, pr: null }); continue }
    const idx = beats.findIndex((b, i) => !used.has(i) && b.t >= a.t - 10 && b.t - a.t < 600)
    if (idx < 0) { rungs.push({ p: a.t, pr: null }); continue }
    used.add(idx)
    rungs.push({ p: a.t, pr: Math.round(beats[idx].t - a.t) })
  }

  const escapes = beats.filter((_, i) => !used.has(i)).map((b) => b.t)
  return { rungs, escapes }
}

const CASES: BlockCase[] = [
  {
    key: 'normal', name: 'Condução normal', tone: 'good',
    pattern: base({}),
    site: 'Sem bloqueio',
    criteria: ['Cada P é seguida de um QRS', 'PR fixo entre 120 e 200 ms', 'RR regular'],
    conduct: 'Nada a fazer. Guarde esta imagem como referência: é contra ela que você vai comparar os demais.',
    trick: 'No diagrama, todas as linhas do nó AV têm a MESMA inclinação e nenhuma se interrompe.',
  },
  {
    key: 'bav1', name: 'BAV de 1º grau', tone: 'good',
    pattern: base({ pr: 290 }),
    site: 'Nodal na grande maioria',
    criteria: ['PR > 200 ms', 'PR FIXO', 'TODA P conduz — nenhum batimento é perdido'],
    conduct: 'Isolado e assintomático, é benigno. Investigue causa: hipertonia vagal (atleta, sono), isquemia inferior, betabloqueador, bloqueador de cálcio, digoxina, amiodarona, doença de Lyme, febre reumática, miocardite.',
    trick: 'Não é "bloqueio" de verdade: nada é bloqueado, tudo passa — só passa devagar. No diagrama, as linhas ficam mais DEITADAS, mas nenhuma se interrompe.',
  },
  {
    key: 'mobitz1', name: 'BAV 2º grau Mobitz I (Wenckebach)', tone: 'warn',
    pattern: base({ rhythm: 'mobitz1', rate: 62, pr: 180 }),
    site: 'Nodal',
    criteria: [
      'PR alonga PROGRESSIVAMENTE até uma P bloquear',
      'O INCREMENTO do PR diminui a cada batimento — por isso o RR vai ENCURTANDO antes da pausa',
      'A pausa é MENOR que o dobro do RR anterior',
      'QRS geralmente estreito',
    ],
    conduct: 'Costuma ser benigno; comum em atletas, durante o sono e no infarto inferior. Tratar apenas se sintomático: atropina responde bem, porque o sítio é nodal.',
    trick: 'No diagrama, as linhas do nó AV vão ficando cada vez mais deitadas até uma delas não chegar do outro lado. É a "escada de Wenckebach".',
  },
  {
    key: 'mobitz2', name: 'BAV 2º grau Mobitz II', tone: 'bad',
    pattern: base({ rhythm: 'mobitz2', rate: 55, pr: 180, qrs: { axis: 60, rAmp: 1.2, qAmp: 0, sAmp: 0.4, width: 130, block: 'rbbb' } }),
    site: 'Infranodal (His-Purkinje)',
    criteria: [
      'PR FIXO nos batimentos conduzidos',
      'Falha SÚBITA e imprevisível de uma P',
      'QRS frequentemente largo (indica doença do sistema His-Purkinje)',
      'A pausa é múltiplo exato do intervalo P-P',
    ],
    conduct: 'NUNCA é benigno. Alto risco de progressão para bloqueio AV total, com escape ventricular instável. Indicação de MARCA-PASSO. Atropina não ajuda e pode piorar — ao acelerar o nó SA, chegam mais P que o His-Purkinje doente não consegue conduzir.',
    trick: 'Todas as linhas têm a MESMA inclinação — e de repente uma simplesmente não existe. Sem aviso prévio: essa é a assinatura.',
  },
  {
    key: 'av21', name: 'BAV 2:1', tone: 'bad',
    pattern: base({ rhythm: 'av_2_1', rate: 40, atrialRate: 80, pr: 190 }),
    site: 'Indeterminado sem informação adicional',
    criteria: [
      'Uma P conduz, uma P bloqueia, alternadamente',
      'Impossível ver o PR alongando: nunca há duas conduzidas seguidas',
      'A frequência ventricular é exatamente metade da atrial',
    ],
    conduct: 'Investigue o sítio: QRS estreito, PR longo e melhora com atropina ou exercício = nodal (comportamento de Mobitz I). QRS largo, PR normal e piora com exercício = infranodal (comportamento de Mobitz II) e indica marca-passo.',
    trick: 'A manobra de cabeceira: peça para o paciente exercitar-se ou dê atropina. Se o bloqueio MELHORAR, é nodal. Se PIORAR, é infranodal — e é grave.',
  },
  {
    key: 'bavt', name: 'BAV total (3º grau)', tone: 'bad',
    pattern: base({
      rhythm: 'complete_block', rate: 34, atrialRate: 82,
      qrs: { axis: -60, rAmp: 1.35, qAmp: 0, sAmp: 0.55, width: 150, block: 'ivcd' },
      t: { amp: -0.35, axis: 120, width: 190 },
    }),
    site: 'Nodal (escape estreito 40–60) ou infranodal (escape largo 20–40)',
    criteria: [
      'Dissociação AV completa: nenhuma P conduz',
      'P-P regular e R-R regular, mas SEM relação entre si',
      'Frequência atrial MAIOR que a ventricular',
      'A morfologia do escape diz o sítio: estreito = juncional; largo = ventricular',
    ],
    conduct: 'MARCA-PASSO. Transcutâneo imediato se instável, transvenoso em seguida, definitivo na maioria. Escape ventricular largo a 20–40 bpm é particularmente instável e pode evoluir para assistolia.',
    trick: 'Pegue um compasso (ou a borda de um papel) e marque dois P consecutivos: se essa distância "anda" pelo traçado inteiro encontrando P escondidas dentro do QRS e da T, a atividade atrial é independente. Isso fecha dissociação AV.',
  },
]

function Ladder({ c }: { c: BlockCase }) {
  const H = 118
  const A_Y = 24
  const AV_TOP = 36
  const AV_BOT = 84
  const V_Y = 96
  const AV_MID = (AV_TOP + AV_BOT) / 2

  const { rungs, escapes } = useMemo(() => ladderFrom(c.pattern), [c])

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label={`Diagrama em escada: ${c.name}`}>
      <rect x={0} y={AV_TOP} width={W} height={AV_BOT - AV_TOP} fill="rgba(148,163,184,0.09)" />
      {[A_Y, AV_TOP, AV_BOT, V_Y].map((y, i) => (
        <line key={i} x1={0} y1={y} x2={W} y2={y} stroke="rgba(148,163,184,0.3)" strokeWidth="1" />
      ))}
      <g fontSize="10" fontWeight="900" fill="#64748b" fontFamily="ui-monospace, monospace">
        <text x={4} y={A_Y - 5}>A</text>
        <text x={4} y={AV_MID + 3}>AV</text>
        <text x={4} y={V_Y + 13}>V</text>
      </g>

      {rungs.map((b, i) => {
        if (b.p < 0 || b.p > SC.durationMs) return null
        const x1 = xOf(b.p)
        const conducted = b.pr != null
        const x2 = conducted ? xOf(b.p + (b.pr as number)) : xOf(b.p + 130)
        return (
          <g key={i}>
            <line x1={x1} y1={A_Y - 11} x2={x1} y2={A_Y} stroke="#0ea5e9" strokeWidth="2.6" />
            <line
              x1={x1} y1={AV_TOP} x2={x2} y2={conducted ? AV_BOT : AV_MID}
              stroke={conducted ? '#10b981' : '#f43f5e'} strokeWidth="2.2"
            />
            {!conducted && (
              <g stroke="#f43f5e" strokeWidth="2.6">
                <line x1={x2 - 5} y1={AV_MID - 5} x2={x2 + 5} y2={AV_MID + 5} />
                <line x1={x2 - 5} y1={AV_MID + 5} x2={x2 + 5} y2={AV_MID - 5} />
              </g>
            )}
            {conducted && <line x1={x2} y1={V_Y} x2={x2} y2={V_Y + 13} stroke="#10b981" strokeWidth="2.6" />}
            {conducted && (
              <text x={(x1 + x2) / 2} y={AV_MID - 4} textAnchor="middle" fontSize="9.5" fontWeight="900"
                fill="#0f766e" fontFamily="ui-monospace, monospace">
                {b.pr}
              </text>
            )}
          </g>
        )
      })}

      {escapes.map((t, i) => (
        <g key={`e${i}`}>
          <line x1={xOf(t)} y1={AV_BOT} x2={xOf(t)} y2={V_Y} stroke="#8b5cf6" strokeWidth="2.2" strokeDasharray="3 3" />
          <line x1={xOf(t)} y1={V_Y} x2={xOf(t)} y2={V_Y + 13} stroke="#8b5cf6" strokeWidth="2.8" />
          <text x={xOf(t)} y={V_Y - 4} textAnchor="middle" fontSize="8.5" fontWeight="900" fill="#8b5cf6">escape</text>
        </g>
      ))}
    </svg>
  )
}

export function BlockLab() {
  const [key, setKey] = useState('normal')
  const c = CASES.find((x) => x.key === key) || CASES[0]
  const path = useMemo(() => patternPath(c.pattern, 'II', SC), [c])

  return (
    <LabShell>
      <ScrollRow className="mb-2" label="Tipo de bloqueio">
        {CASES.map((x) => (
          <LabButton key={x.key} active={key === x.key} tone={x.tone === 'bad' ? 'danger' : 'primary'} onClick={() => setKey(x.key)}>
            {x.name}
          </LabButton>
        ))}
      </ScrollRow>

      <div className="overflow-hidden rounded-xl border border-emerald-500/20 bg-[#07100c]">
        <svg viewBox={`0 0 ${W} ${STRIP_H}`} className="block h-auto w-full text-emerald-400" role="img" aria-label={`Traçado: ${c.name}`}>
          <EcgGrid mm={MM} id="blk-grid" />
          <path d={path} fill="none" stroke="#3ff08a" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      </div>

      <div className="mt-2 overflow-hidden rounded-xl border border-border bg-muted/20 p-1">
        <Ladder c={c} />
        <p className="px-2 pb-1 text-center text-[10px] text-muted-foreground">
          Diagrama em escada (Lewis) · A = átrios · AV = nó atrioventricular · V = ventrículos · números = PR em ms
        </p>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2 [&>*]:min-w-0">
        <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
          <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Padrão</p>
          <p className="text-[13.5px] font-bold leading-snug">{c.name}</p>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
          <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Sítio provável</p>
          <p className={`text-[13.5px] font-bold leading-snug ${
            c.tone === 'bad' ? 'text-rose-600 dark:text-rose-400'
              : c.tone === 'warn' ? 'text-amber-600 dark:text-amber-400'
                : 'text-emerald-600 dark:text-emerald-400'
          }`}>{c.site}</p>
        </div>
      </div>

      <div className="mt-2 space-y-2">
        <LabNote title="Critérios">
          <ul className="ml-4 list-disc space-y-0.5">
            {c.criteria.map((x) => <li key={x}>{x}</li>)}
          </ul>
        </LabNote>
        <LabNote title="Como reconhecer no diagrama" tone="info">{c.trick}</LabNote>
        <LabNote title="Conduta" tone={c.tone}>{c.conduct}</LabNote>
      </div>
    </LabShell>
  )
}
