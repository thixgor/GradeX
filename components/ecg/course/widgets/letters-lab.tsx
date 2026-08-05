'use client'

import React, { useState } from 'react'
import { LabNote, LabShell } from './ui'

/**
 * Por que as ondas se chamam P, Q, R, S e T.
 *
 * Duas peças: a régua do alfabeto (mostrando o espaço que Einthoven deixou de
 * propósito antes e depois) e a linha do tempo de quem fez o quê.
 */

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

const ROLE: Record<string, { kind: 'waller' | 'usada' | 'reserva' | 'depois'; note: string }> = {
  A: { kind: 'waller', note: 'Uma das quatro letras usadas por Waller em 1887, no traçado distorcido pelo eletrômetro capilar.' },
  B: { kind: 'waller', note: 'Idem: nomenclatura A-B-C-D do registro original de Waller.' },
  C: { kind: 'waller', note: 'Idem: nomenclatura A-B-C-D do registro original de Waller.' },
  D: { kind: 'waller', note: 'Idem: nomenclatura A-B-C-D do registro original de Waller.' },
  M: { kind: 'reserva', note: 'Deixada livre de propósito: espaço para nomear qualquer deflexão descoberta ANTES da onda P.' },
  N: { kind: 'reserva', note: 'Deixada livre de propósito, à esquerda do P.' },
  O: { kind: 'reserva', note: 'Deixada livre de propósito, à esquerda do P.' },
  P: { kind: 'usada', note: 'Início da sequência. Na convenção cartesiana da época, pontos sobre uma curva eram rotulados a partir de P — de "ponto".' },
  Q: { kind: 'usada', note: 'Primeira deflexão negativa do complexo ventricular, quando vem antes de qualquer positiva.' },
  R: { kind: 'usada', note: 'Qualquer deflexão positiva do complexo ventricular. A segunda ganha linha: R′.' },
  S: { kind: 'usada', note: 'Deflexão negativa que vem DEPOIS de uma positiva.' },
  T: { kind: 'usada', note: 'Repolarização ventricular.' },
  U: { kind: 'depois', note: 'Descoberta depois — e como Einthoven tinha deixado espaço à direita, bastou seguir o alfabeto.' },
}

const KIND_STYLE = {
  waller: 'border-slate-400/40 bg-slate-400/10 text-slate-400',
  usada: 'border-emerald-500/50 bg-emerald-500/20 text-emerald-500',
  reserva: 'border-sky-500/40 bg-sky-500/10 text-sky-500',
  depois: 'border-amber-500/50 bg-amber-500/20 text-amber-500',
  none: 'border-border bg-muted/30 text-muted-foreground/50',
} as const

const TIMELINE = [
  { year: '1887', who: 'Augustus Waller', what: 'Registra o primeiro eletrocardiograma humano com um eletrômetro capilar de mercúrio e chama as deflexões de A, B, C e D. O aparelho tinha inércia mecânica e distorcia as curvas.' },
  { year: '1895', who: 'Willem Einthoven', what: 'Aplica uma correção matemática às curvas distorcidas de Waller. Precisando distinguir a curva CORRIGIDA da original, adota letras a partir de P — a convenção cartesiana para pontos de curva — e deixa letras livres nos dois lados.' },
  { year: '1901', who: 'Willem Einthoven', what: 'Cria o galvanômetro de corda, com fidelidade real. As letras P-Q-R-S-T ficam definitivas, junto com as derivações D1, D2 e D3 e o triângulo que leva seu nome.' },
  { year: '1924', who: 'Willem Einthoven', what: 'Recebe o Prêmio Nobel de Medicina pela invenção do eletrocardiógrafo.' },
  { year: '1934', who: 'Frank Wilson', what: 'Cria o terminal central (referência virtual) e as derivações precordiais unipolares V1 a V6.' },
  { year: '1942', who: 'Emanuel Goldberger', what: 'Aumenta em ~50% a voltagem das unipolares dos membros removendo o membro explorado da referência: nascem aVR, aVL e aVF.' },
]

export function LettersLab() {
  const [sel, setSel] = useState('P')
  const info = ROLE[sel]

  return (
    <LabShell>
      <p className="mb-2 text-xs font-black uppercase tracking-wider text-muted-foreground">
        A régua do alfabeto — toque nas letras coloridas
      </p>
      <div className="flex flex-wrap gap-1.5">
        {ALPHABET.map((l) => {
          const r = ROLE[l]
          const style = r ? KIND_STYLE[r.kind] : KIND_STYLE.none
          return (
            <button
              key={l}
              type="button"
              disabled={!r}
              onClick={() => setSel(l)}
              className={`h-10 w-10 rounded-lg border text-sm font-black transition active:scale-95 disabled:cursor-default ${style} ${
                sel === l ? 'ring-2 ring-primary ring-offset-1 ring-offset-background' : ''
              }`}
            >
              {l}
            </button>
          )
        })}
      </div>

      <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-semibold">
        <span className="text-slate-400">■ Waller (1887)</span>
        <span className="text-sky-500">■ Reservadas à esquerda</span>
        <span className="text-emerald-500">■ Ondas de Einthoven</span>
        <span className="text-amber-500">■ Descoberta depois</span>
      </div>

      {info && (
        <div className="mt-3">
          <LabNote title={`Letra ${sel}`} tone={info.kind === 'usada' ? 'good' : info.kind === 'reserva' ? 'info' : 'warn'}>
            {info.note}
          </LabNote>
        </div>
      )}

      <p className="mb-2 mt-4 text-xs font-black uppercase tracking-wider text-muted-foreground">Linha do tempo</p>
      <ol className="space-y-2">
        {TIMELINE.map((t) => (
          <li key={t.year} className="flex gap-3 rounded-xl border border-border bg-muted/25 p-3">
            <span className="shrink-0 font-mono text-sm font-black text-primary">{t.year}</span>
            <span className="min-w-0">
              <strong className="block text-[13px]">{t.who}</strong>
              <span className="text-[12px] leading-relaxed text-muted-foreground">{t.what}</span>
            </span>
          </li>
        ))}
      </ol>
    </LabShell>
  )
}
