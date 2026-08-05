'use client'

import React, { useMemo, useState } from 'react'
import type { EcgPattern, LeadName } from '@/lib/ecg/engine'
import { patternPath, type StripScale } from '@/lib/ecg/course/strip'
import { CourseHeart, type HeartPart } from './course-heart'
import { EcgGrid, LabButton, LabNote, LabShell } from './ui'

/**
 * Laboratório dos bloqueios de ramo e fasciculares.
 *
 * Mostra lado a lado as derivações que fecham o diagnóstico (V1 e V6 para os
 * ramos; D1, aVL e as inferiores para os fascículos), com o ramo interrompido
 * desenhado em vermelho no esquema do coração — para o aluno ligar a morfologia
 * ao caminho que o impulso foi obrigado a tomar.
 */

const MM = 10
const W = 320
const H = 190
const SC: StripScale = { width: W, height: H, durationMs: 1280, mvSpan: 1.5, baseline: 118 }

interface Case {
  key: string
  name: string
  leads: LeadName[]
  pattern: EcgPattern
  blocked: HeartPart[]
  qrs: string
  criteria: string[]
  macete: string
  clinical: string
  tone: 'good' | 'warn' | 'bad'
}

const base = (over: Partial<EcgPattern>): EcgPattern => ({
  id: 'bbb', rate: 70, rhythm: 'sinus', pr: 160,
  p: { present: true, amp: 0.15, axis: 60, width: 100 },
  qrs: { axis: 60, rAmp: 1.2, qAmp: 0.07, sAmp: 0.25, width: 90 },
  t: { amp: 0.3, axis: 55, width: 160 },
  ...over,
})

const CASES: Case[] = [
  {
    key: 'normal', name: 'Condução normal', leads: ['V1', 'V6'], tone: 'good',
    pattern: base({}), blocked: [], qrs: '90 ms',
    criteria: [
      'QRS < 120 ms',
      'V1: rS — o vetor principal se afasta da derivação',
      'V6: qR — q septal pequena seguida de R alta',
      'Onda T concordante com o QRS',
    ],
    macete: 'Guarde este par como referência. Em V1 o QRS é negativo; em V6, positivo. Toda alteração de ramo mexe no FIM do complexo.',
    clinical: 'Os dois ventrículos são ativados praticamente ao mesmo tempo, porque o Purkinje distribui o impulso a 2–4 m/s.',
  },
  {
    key: 'rbbb', name: 'Bloqueio de ramo direito', leads: ['V1', 'V6'], tone: 'warn',
    pattern: base({ qrs: { axis: 70, rAmp: 1.0, qAmp: 0.06, sAmp: 0.5, width: 145, block: 'rbbb', rprime: 0.7 } }),
    blocked: ['rbb'], qrs: '≥ 120 ms',
    criteria: [
      'QRS ≥ 120 ms (110–119 ms = BRD incompleto)',
      'V1–V2: rsR′ ou rSR′ — as "orelhas de coelho", o M',
      'V5–V6 e D1: onda S alargada e empastada (≥ 40 ms)',
      'Repolarização discordante: T invertida em V1–V3 (esperado, não é isquemia)',
    ],
    macete: 'Ma-RR-ow: M em V1, W em V6. O ventrículo direito despolariza por ÚLTIMO, célula a célula, vindo do esquerdo — e é esse atraso final, apontando para a direita e para frente, que cria o R′ em V1.',
    clinical: 'Frequente em corações normais (até 3% dos adultos). Investigar sobrecarga de VD, embolia pulmonar, cardiopatia congênita (CIA), displasia arritmogênica. BRD não impede o diagnóstico de infarto — em V1–V3 a análise fica limitada, mas as demais derivações permanecem interpretáveis.',
  },
  {
    key: 'lbbb', name: 'Bloqueio de ramo esquerdo', leads: ['V1', 'V6'], tone: 'bad',
    pattern: base({ qrs: { axis: -20, rAmp: 1.5, qAmp: 0, sAmp: 1.1, width: 155, block: 'lbbb' }, t: { amp: -0.35, axis: 150, width: 190 } }),
    blocked: ['lbb', 'laf', 'lpf'], qrs: '≥ 120 ms',
    criteria: [
      'QRS ≥ 120 ms',
      'V1–V2: QS ou rS profundo e alargado (o W)',
      'D1, V5, V6: onda R alargada, com entalhe ou platô no ápice (o M)',
      'AUSÊNCIA da onda q septal em D1, V5 e V6',
      'Repolarização discordante: T invertida em D1, aVL, V5–V6',
    ],
    macete: 'Wi-LL-iam: W em V1, M em V6. E o detalhe que quase ninguém cobra mas cai: some a q septal, porque é o ramo esquerdo que despolariza o septo da esquerda para a direita.',
    clinical: 'Quase sempre indica doença estrutural: hipertensão, doença coronariana, cardiomiopatia, estenose aórtica. BRE presumidamente novo com dor típica é tratado como equivalente de infarto com supra. Para diagnosticar infarto na vigência de BRE, use os critérios de Sgarbossa modificados (Smith): supra concordante ≥ 1 mm, infra concordante ≥ 1 mm em V1–V3 ou razão ST/S ≤ −0,25.',
  },
  {
    key: 'lafb', name: 'Bloqueio divisional anterossuperior', leads: ['aVL', 'aVF'], tone: 'warn',
    pattern: base({ qrs: { axis: -60, rAmp: 1.1, qAmp: 0.1, sAmp: 0.55, width: 100 } }),
    blocked: ['laf'], qrs: '< 120 ms',
    criteria: [
      'Eixo entre −45° e −90°',
      'qR em D1 e aVL',
      'rS em D2, D3 e aVF',
      'QRS < 120 ms — bloqueio fascicular NÃO alarga o complexo',
      'Deflexão intrinsecoide em aVL ≥ 45 ms',
    ],
    macete: 'O eixo vai para o LADO DO FASCÍCULO BLOQUEADO, porque aquela região despolariza por último. Anterossuperior bloqueado → o vetor final sobe e vai para a esquerda → eixo desviado à esquerda. "Bloqueou em cima, eixo pra cima."',
    clinical: 'O bloqueio fascicular mais comum, porque o fascículo é fino, longo e irrigado apenas pela descendente anterior. Isolado costuma ser benigno; associado a BRD forma bloqueio bifascicular.',
  },
  {
    key: 'lpfb', name: 'Bloqueio divisional posteroinferior', leads: ['aVL', 'aVF'], tone: 'bad',
    pattern: base({ qrs: { axis: 120, rAmp: 1.15, qAmp: 0.12, sAmp: 0.5, width: 100 } }),
    blocked: ['lpf'], qrs: '< 120 ms',
    criteria: [
      'Eixo entre +90° e +180°',
      'rS em D1 e aVL',
      'qR em D2, D3 e aVF',
      'QRS < 120 ms',
      'Diagnóstico de EXCLUSÃO: afastar hipertrofia de VD, biotipo longilíneo, DPOC e infarto lateral',
    ],
    macete: 'Espelho do anterossuperior: "bloqueou embaixo, eixo pra baixo (e pra direita)". O padrão qR aponta o fascículo bloqueado.',
    clinical: 'Raro isoladamente, porque o fascículo é curto, espesso e tem irrigação dupla (descendente anterior + coronária direita). Quando aparece, o dano costuma ser extenso — e o prognóstico, pior que o do anterossuperior.',
  },
]

function LeadPanel({ lead, pattern, label }: { lead: LeadName; pattern: EcgPattern; label: string }) {
  const path = useMemo(() => patternPath(pattern, lead, SC), [pattern, lead])
  return (
    <div className="overflow-hidden rounded-xl border border-emerald-500/20 bg-[#07100c]">
      <div className="flex items-center justify-between border-b border-emerald-500/15 px-2 py-1">
        <span className="font-mono text-xs font-black text-emerald-400">{lead}</span>
        <span className="text-[10px] font-bold text-muted-foreground">{label}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full text-emerald-400" role="img" aria-label={`Derivação ${lead}`}>
        <EcgGrid mm={MM} id={`bbb-${lead}`} />
        <path d={path} fill="none" stroke="#3ff08a" strokeWidth="2.2" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

export function BbbLab() {
  const [key, setKey] = useState('normal')
  const c = CASES.find((x) => x.key === key) || CASES[0]

  return (
    <LabShell>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {CASES.map((x) => (
          <LabButton key={x.key} active={key === x.key} tone={x.tone === 'bad' ? 'danger' : 'primary'} onClick={() => setKey(x.key)}>
            {x.name}
          </LabButton>
        ))}
      </div>

      <div className="grid items-start gap-3 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="grid items-start gap-2 sm:grid-cols-2">
          {c.leads.map((l) => (
            <LeadPanel key={l} lead={l} pattern={c.pattern} label={`QRS ${c.qrs}`} />
          ))}
        </div>
        <div className="rounded-xl border border-border bg-muted/20 p-2">
          <CourseHeart blocked={c.blocked} active={c.blocked.length ? [] : ['rbb', 'lbb', 'laf', 'lpf', 'purkinje']} showChambers={false} />
          <p className="mt-1 text-center text-[11px] font-semibold text-muted-foreground">
            {c.blocked.length ? 'Em vermelho: o caminho interrompido' : 'Todos os ramos conduzindo'}
          </p>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <LabNote title="Critérios diagnósticos">
          <ul className="ml-4 list-disc space-y-0.5">
            {c.criteria.map((x) => <li key={x}>{x}</li>)}
          </ul>
        </LabNote>
        <LabNote title="Macete" tone="warn">{c.macete}</LabNote>
        <LabNote title="O que significa clinicamente" tone={c.tone}>{c.clinical}</LabNote>
      </div>
    </LabShell>
  )
}
