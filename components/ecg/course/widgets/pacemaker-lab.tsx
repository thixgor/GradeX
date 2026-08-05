'use client'

import React, { useMemo, useState } from 'react'
import { Zap, ShieldAlert } from 'lucide-react'
import type { EcgPattern } from '@/lib/ecg/engine'
import { patternPath, type StripScale } from '@/lib/ecg/course/strip'
import { CourseHeart, HEART_PARTS, type HeartPart } from './course-heart'
import { EcgGrid, LabButton, LabChip, LabNote, LabShell, Metric, ScrollRow } from './ui'

/**
 * Laboratório da hierarquia de marca-passos.
 *
 * Dois usos: explorar cada estrutura (frequência intrínseca, velocidade de
 * condução, o que ela comanda) e DERRUBAR um nível para ver quem assume, a que
 * frequência e com que morfologia de QRS — a fisiopatologia dos bloqueios
 * demonstrada no traçado, e não apenas descrita.
 */

interface PartInfo {
  key: HeartPart
  name: string
  rate: string | null
  velocity: string
  role: string
  detail: string
  fail: string
}

const INFO: Record<string, PartInfo> = {
  sa: {
    key: 'sa', name: 'Nó sinoatrial (Keith-Flack)',
    rate: '60–100 bpm', velocity: '~0,05 m/s',
    role: 'Marca-passo fisiológico — comanda o coração inteiro',
    detail: 'Na parede do átrio direito, junto à veia cava superior. Manda porque tem a corrente If mais rápida: atinge o limiar antes de todos e despolariza os demais antes que eles disparem sozinhos. Irrigado pela coronária direita em ~60% dos casos.',
    fail: 'Doença do nó sinusal, infarto inferior, hipertonia vagal, betabloqueador. A junção AV assume a 40–60 bpm — mas só depois que a supressão por overdrive se dissipa, o que produz a pausa.',
  },
  bachmann: {
    key: 'bachmann', name: 'Feixe de Bachmann',
    rate: null, velocity: '~1 m/s',
    role: 'Leva o impulso do átrio direito ao átrio esquerdo',
    detail: 'Ramo anterior do trato internodal que cruza o teto dos átrios pelo septo interatrial. É a principal via de condução interatrial — a SEGUNDA metade da onda P é obra dele.',
    fail: 'Bloqueio interatrial avançado (síndrome de Bayés): o átrio esquerdo passa a ser ativado de baixo para cima e a P fica ≥ 120 ms e bifásica ± em D2, D3 e aVF. Marcador forte de risco de fibrilação atrial e AVC.',
  },
  internodal: {
    key: 'internodal', name: 'Vias internodais',
    rate: null, velocity: '~1 m/s',
    role: 'Conduzem do nó SA ao nó AV pelo átrio direito',
    detail: 'Três tratos: anterior (de Bachmann), médio (de Wenckebach) e posterior (de Thorel). Não são cabos isolados como o His — são feixes de miocárdio atrial com orientação preferencial das fibras (condução anisotrópica).',
    fail: 'Fibrose atrial lentifica a condução, alarga a P e cria o substrato para reentrada — o terreno da fibrilação e do flutter atrial.',
  },
  av: {
    key: 'av', name: 'Nó atrioventricular (Aschoff-Tawara)',
    rate: '40–60 bpm', velocity: '0,02–0,05 m/s — o mais lento',
    role: 'Pedágio: atrasa, filtra e serve de reserva',
    detail: 'No triângulo de Koch. Fase 0 dependente de canais lentos de CÁLCIO e junções de baixa condutância (conexina 45): daí a lentidão. O atraso de 90–130 ms garante o enchimento ventricular; a refratariedade longa protege o ventrículo de frequências atriais altíssimas. Irrigado pela coronária direita em ~90%.',
    fail: 'Bloqueios AV. Se o bloqueio é NODAL, o escape juncional abaixo dele assume com QRS estreito a 40–60 bpm e responde a atropina. É o bloqueio do infarto inferior.',
  },
  his: {
    key: 'his', name: 'Feixe de His (fascículo atrioventricular)',
    rate: '40–60 bpm', velocity: '1–1,5 m/s',
    role: 'Único elo elétrico entre átrios e ventrículos',
    detail: 'Perfura o trígono fibroso direito e corre pela porção membranosa do septo. O esqueleto fibroso isola eletricamente átrios e ventrículos — qualquer outra conexão é via acessória (feixe de Kent).',
    fail: 'Bloqueio intra ou infra-hissiano: escape de 20–40 bpm com QRS largo, que NÃO responde a atropina e piora com exercício. Indicação de marca-passo.',
  },
  rbb: {
    key: 'rbb', name: 'Ramo direito',
    rate: '20–40 bpm', velocity: '2–4 m/s',
    role: 'Conduz para o ventrículo direito',
    detail: 'Fino, longo, com poucas colaterais, corre subendocárdico até a banda moderadora. Por ser fino e único, é o mais vulnerável de todo o sistema.',
    fail: 'Bloqueio de ramo direito: rSR′ em V1, S alargada em V6, QRS ≥ 120 ms. Frequentemente benigno em coração normal; investigar sobrecarga de VD, embolia pulmonar e cardiopatias congênitas.',
  },
  lbb: {
    key: 'lbb', name: 'Ramo esquerdo',
    rate: '20–40 bpm', velocity: '2–4 m/s',
    role: 'Conduz para o ventrículo esquerdo e para o septo',
    detail: 'Curto e largo, abre-se em leque ao atravessar o septo. Emite os primeiros ramos septais — responsáveis pela onda q septal normal de D1, aVL, V5 e V6.',
    fail: 'Bloqueio de ramo esquerdo: QS em V1, R alargada e entalhada em V6, SEM q septal. Quase sempre indica doença estrutural. BRE novo com dor torácica é tratado como equivalente de infarto com supra.',
  },
  laf: {
    key: 'laf', name: 'Fascículo anterossuperior esquerdo',
    rate: '20–40 bpm', velocity: '2–4 m/s',
    role: 'Ativa a parede anterolateral do ventrículo esquerdo',
    detail: 'Fino e longo, até o músculo papilar anterolateral. Irrigado APENAS pela descendente anterior — é o fascículo mais frágil de todos.',
    fail: 'Bloqueio divisional anterossuperior (BDAS): eixo entre −45° e −90°, qR em D1/aVL, rS em D2/D3/aVF, QRS < 120 ms. É o bloqueio fascicular mais comum.',
  },
  lpf: {
    key: 'lpf', name: 'Fascículo posteroinferior esquerdo',
    rate: '20–40 bpm', velocity: '2–4 m/s',
    role: 'Ativa a parede inferoposterior do ventrículo esquerdo',
    detail: 'Curto, espesso, em leque, até o músculo papilar posteromedial. Tem irrigação DUPLA (descendente anterior + coronária direita), por isso quase nunca bloqueia.',
    fail: 'Bloqueio divisional posteroinferior (BDPI): eixo entre +90° e +180°, rS em D1/aVL, qR em D2/D3/aVF, QRS < 120 ms. Raro e sempre indica dano extenso.',
  },
  septal: {
    key: 'septal', name: 'Fascículo septal (médio)',
    rate: '20–40 bpm', velocity: '2–4 m/s',
    role: 'Ativa a porção média do septo',
    detail: 'O terceiro fascículo do ramo esquerdo, presente na maioria dos corações. Responsável por boa parte da despolarização septal da esquerda para a direita.',
    fail: 'Bloqueio fascicular septal: R proeminente em V1–V2 com perda da q septal em V5–V6. Diferencial de infarto posterior e de hipertrofia de VD.',
  },
  purkinje: {
    key: 'purkinje', name: 'Rede de Purkinje',
    rate: '20–40 bpm', velocity: '2–4 m/s — o mais rápido',
    role: 'Distribui o impulso a todo o endocárdio quase ao mesmo tempo',
    detail: 'Fibras grossas, riquíssimas em conexina 40, com fase 0 rápida de sódio. É a autoestrada que mantém o QRS estreito apesar da enorme massa ventricular.',
    fail: 'Sem Purkinje, o impulso caminha músculo a músculo a 0,3–0,5 m/s — dez vezes mais devagar. O QRS alarga. É o que acontece em ritmos ventriculares, marca-passo e bloqueios de ramo.',
  },
}

/* ───────────────────── cenários de bloqueio ───────────────────── */

type BlockLevel = 'none' | 'sa' | 'av' | 'his'

interface Scenario {
  key: BlockLevel
  label: string
  pattern: EcgPattern
  driver: string
  rate: string
  qrs: string
  note: string
  tone: 'good' | 'warn' | 'bad'
  blocked: HeartPart[]
  active: HeartPart[]
}

const basePattern = (over: Partial<EcgPattern>): EcgPattern => ({
  id: 'lab',
  rate: 70,
  rhythm: 'sinus',
  pr: 160,
  p: { present: true, amp: 0.15, axis: 60, width: 100 },
  qrs: { axis: 60, rAmp: 1.2, qAmp: 0.08, sAmp: 0.25, width: 90 },
  t: { amp: 0.3, axis: 55, width: 160 },
  ...over,
})

const SCENARIOS: Scenario[] = [
  {
    key: 'none', label: 'Tudo funcionando',
    pattern: basePattern({}),
    driver: 'Nó sinoatrial', rate: '70 bpm', qrs: '90 ms (estreito)',
    note: 'Ritmo sinusal: cada P é seguida de QRS com PR fixo dentro de 120–200 ms. O nó SA suprime todos os outros marca-passos por overdrive.',
    tone: 'good', blocked: [], active: ['sa', 'internodal', 'bachmann', 'av', 'his', 'rbb', 'lbb', 'purkinje'],
  },
  {
    key: 'sa', label: 'Nó SA parado',
    pattern: basePattern({
      rate: 45,
      p: { present: false, amp: 0, axis: 60, width: 100 },
      qrs: { axis: 60, rAmp: 1.1, qAmp: 0.05, sAmp: 0.22, width: 92 },
    }),
    driver: 'Junção AV (escape juncional)', rate: '45 bpm', qrs: '92 ms (estreito)',
    note: 'Sem P sinusal, a junção AV assume a 40–60 bpm. O QRS permanece ESTREITO porque o impulso ainda usa o His-Purkinje. Pode haver P retrógrada invertida em D2, antes, dentro ou depois do QRS. A pausa até o escape aparecer é a supressão por overdrive se dissipando — e é ela que causa síncope.',
    tone: 'warn', blocked: ['sa'], active: ['av', 'his', 'rbb', 'lbb', 'purkinje'],
  },
  {
    key: 'av', label: 'Nó AV bloqueado',
    pattern: basePattern({
      rate: 42, atrialRate: 88, rhythm: 'complete_block',
      qrs: { axis: 60, rAmp: 1.05, qAmp: 0.04, sAmp: 0.2, width: 100 },
    }),
    driver: 'Junção AV abaixo do bloqueio', rate: '42 bpm (átrios a 88)', qrs: '100 ms (estreito)',
    note: 'Bloqueio AV total NODAL: átrios e ventrículos marcham independentes (dissociação AV). O escape nasce ABAIXO do bloqueio, ainda dentro da junção, então o QRS é estreito e a frequência fica em 40–60 bpm. Responde a atropina e costuma ser reversível — é o bloqueio do infarto inferior.',
    tone: 'warn', blocked: ['av'], active: ['sa', 'internodal', 'bachmann', 'his', 'rbb', 'lbb', 'purkinje'],
  },
  {
    key: 'his', label: 'His-Purkinje bloqueado',
    pattern: basePattern({
      rate: 28, atrialRate: 84, rhythm: 'complete_block',
      qrs: { axis: -60, rAmp: 1.4, qAmp: 0, sAmp: 0.6, width: 160, block: 'ivcd' },
      t: { amp: -0.4, axis: 120, width: 190 },
    }),
    driver: 'Miocárdio ventricular (escape ventricular)', rate: '28 bpm (átrios a 84)', qrs: '160 ms (largo)',
    note: 'Bloqueio INFRANODAL. O escape nasce fora do sistema de condução e caminha músculo a músculo a 0,3–0,5 m/s: QRS largo, bizarro, com T em sentido oposto. Frequência de 20–40 bpm, instável, NÃO responde a atropina (que pode piorar) e piora com exercício. Indicação de marca-passo.',
    tone: 'bad', blocked: ['av', 'his'], active: ['sa', 'internodal', 'bachmann'],
  },
]

const STRIP: StripScale = { width: 640, height: 120, durationMs: 5000, mvSpan: 1.4, baseline: 78 }

export function PacemakerLab({ mode = 'explore' }: { mode?: 'explore' | 'blocks' }) {
  const [selected, setSelected] = useState<HeartPart>('sa')
  const [block, setBlock] = useState<BlockLevel>(mode === 'blocks' ? 'none' : 'none')
  const scenario = SCENARIOS.find((s) => s.key === block) || SCENARIOS[0]
  const info = INFO[selected]

  const path = useMemo(() => patternPath(scenario.pattern, 'II', STRIP), [scenario])

  const showBlocks = mode === 'blocks'

  return (
    <LabShell>
      <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr] [&>*]:min-w-0">
        {/* ── Coração ── */}
        <div>
          <div className="rounded-xl border border-border bg-muted/20 p-2">
            <CourseHeart
              active={showBlocks ? scenario.active : [selected]}
              blocked={showBlocks ? scenario.blocked : []}
              selected={showBlocks ? null : selected}
              onPick={showBlocks ? undefined : setSelected}
            />
          </div>
          {!showBlocks && (
            <>
              <p className="mt-2 text-center text-[11px] font-semibold text-muted-foreground">
                Toque em uma estrutura do desenho ou escolha abaixo
              </p>
              <ScrollRow className="mt-2" label="Estruturas">
                {HEART_PARTS.map((p) => (
                  <LabChip key={p.key} active={selected === p.key} onClick={() => setSelected(p.key)}>
                    {p.short}
                  </LabChip>
                ))}
              </ScrollRow>
            </>
          )}
          {showBlocks && (
            <div className="mt-2 grid grid-cols-2 gap-1.5 [&>*]:min-w-0">
              {SCENARIOS.map((s) => (
                <LabButton
                  key={s.key}
                  active={block === s.key}
                  tone={s.key === 'none' ? 'primary' : 'danger'}
                  onClick={() => setBlock(s.key)}
                  className="text-center"
                >
                  {s.key === 'none' ? <Zap className="h-3.5 w-3.5" /> : <ShieldAlert className="h-3.5 w-3.5" />}
                  {s.label}
                </LabButton>
              ))}
            </div>
          )}
        </div>

        {/* ── Painel ── */}
        <div className="space-y-3">
          {showBlocks ? (
            <>
              <div className="overflow-hidden rounded-xl border border-emerald-500/20 bg-[#07100c]">
                <svg viewBox={`0 0 ${STRIP.width} ${STRIP.height}`} className="block h-auto w-full text-emerald-400" role="img"
                  aria-label={`Traçado resultante: ${scenario.driver}`}>
                  <EcgGrid mm={16} id="pm-grid" />
                  <path d={path} fill="none" stroke={scenario.tone === 'bad' ? '#fb7185' : '#3ff08a'} strokeWidth="2.2" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="grid grid-cols-3 gap-2 [&>*]:min-w-0">
                <Metric label="Comando" value={scenario.driver.split(' ')[0]} />
                <Metric label="Frequência" value={scenario.rate.split(' ')[0]} unit="bpm" tone={scenario.tone === 'bad' ? 'bad' : scenario.tone === 'warn' ? 'warn' : 'good'} />
                <Metric label="QRS" value={scenario.qrs.split(' ')[0]} unit="ms" tone={scenario.qrs.includes('largo') ? 'bad' : 'good'} />
              </div>
              <LabNote title={scenario.driver} tone={scenario.tone}>{scenario.note}</LabNote>
            </>
          ) : (
            <>
              <div>
                <h4 className="font-heading text-base font-black leading-tight tracking-tight">{info.name}</h4>
                <p className="mt-0.5 text-[13px] text-muted-foreground">{info.role}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 [&>*]:min-w-0">
                <Metric label="Frequência intrínseca" value={info.rate ?? '—'} tone={info.rate ? 'good' : 'neutral'} />
                <Metric label="Velocidade de condução" value={info.velocity.split(' ')[0]} unit="m/s" />
              </div>
              <LabNote title="Como funciona">{info.detail}</LabNote>
              <LabNote title="Quando falha" tone="bad">{info.fail}</LabNote>
              {!info.rate && (
                <p className="text-[11px] leading-snug text-muted-foreground">
                  Esta estrutura conduz, mas não tem automatismo próprio relevante — por isso não há frequência intrínseca.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </LabShell>
  )
}
