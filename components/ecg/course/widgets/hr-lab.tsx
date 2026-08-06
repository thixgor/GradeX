'use client'

import React, { useMemo, useState } from 'react'
import { Dices, Check, X } from 'lucide-react'
import type { EcgPattern } from '@/lib/ecg/engine'
import { patternPath, type StripScale } from '@/lib/ecg/course/strip'
import { EcgGrid, LabButton, LabNote, LabShell, Metric, PaperFrame, ScrollRow, useEcgPaper } from './ui'

/**
 * Laboratório de frequência cardíaca.
 *
 * A tira tem exatamente 6 segundos e é desenhada a 25 mm/s com quadradinho de
 * 1 mm — de modo que contar quadradões na tela dá o mesmo número que contar no
 * papel. Os auxílios (marcação dos quadradões entre R, janela de 6 s) podem ser
 * ligados e desligados, para o aluno primeiro tentar e só depois conferir.
 */

const MM = 8
const W = 1200          // 150 mm = 6 segundos a 25 mm/s
const H = 160
const BASE = 110
const SC: StripScale = { width: W, height: H, durationMs: 6000, mvSpan: 1, baseline: BASE }

interface Case {
  rate: number
  irregular: boolean
  pattern: EcgPattern
  label: string
}

function makeCase(): Case {
  const irregular = Math.random() < 0.3
  const rate = irregular
    ? 60 + Math.round(Math.random() * 60)
    : [38, 44, 50, 55, 60, 68, 75, 88, 100, 115, 130, 150][Math.floor(Math.random() * 12)]

  const pattern: EcgPattern = irregular
    ? {
      id: 'hr-af', rate, rhythm: 'afib', fWaveAmp: 0.05, rrVariability: 0.35,
      p: { present: false, amp: 0, axis: 60, width: 100 },
      qrs: { axis: 60, rAmp: 1.2, qAmp: 0.06, sAmp: 0.25, width: 90 },
      t: { amp: 0.3, axis: 55, width: 160 },
    }
    : {
      id: 'hr-sinus', rate, rhythm: 'sinus', pr: 160,
      p: { present: true, amp: 0.15, axis: 60, width: 100 },
      qrs: { axis: 60, rAmp: 1.25, qAmp: 0.07, sAmp: 0.26, width: 90 },
      t: { amp: 0.32, axis: 55, width: 160 },
    }

  return { rate, irregular, pattern, label: irregular ? 'Fibrilação atrial (RR irregular)' : 'Ritmo regular' }
}

const METHODS = [
  { key: '300', name: 'Regra dos 300', how: 'Conte os QUADRADÕES entre duas R e recite: 300 – 150 – 100 – 75 – 60 – 50. Só para ritmo regular.' },
  { key: '1500', name: 'Regra dos 1500', how: 'FC = 1500 ÷ número de QUADRADINHOS entre duas R. É o método mais preciso para ritmo regular.' },
  { key: '6s', name: 'Regra dos 6 segundos', how: 'Conte os QRS dentro de 6 segundos (30 quadradões) e multiplique por 10. Obrigatório em ritmo irregular.' },
]

export function HeartRateLab({ mode = 'practice' }: { mode?: 'demo' | 'practice' }) {
  const [c, setC] = useState<Case>(() => makeCase())
  const [guess, setGuess] = useState('')
  const [checked, setChecked] = useState(false)
  const [helpers, setHelpers] = useState(mode === 'demo')
  const [method, setMethod] = useState('300')
  const { palette } = useEcgPaper()

  const path = useMemo(() => patternPath(c.pattern, 'II', SC), [c])
  const rrMs = 60000 / c.rate
  const bigSquares = rrMs / 200
  const smallSquares = rrMs / 40
  const beatsIn6s = (c.rate * 6) / 60

  const value = Number(guess.replace(',', '.'))
  const error = Number.isFinite(value) ? Math.abs(value - c.rate) : Infinity
  const ok = error <= Math.max(5, c.rate * 0.08)

  function newCase() {
    setC(makeCase())
    setGuess('')
    setChecked(false)
  }

  return (
    <LabShell>
      <PaperFrame
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Tira de ritmo de 6 segundos para cálculo da frequência"
        caption="Tira de 6 segundos · 25 mm/s · quadradinho = 40 ms, quadradão = 200 ms"
      >
        <EcgGrid mm={MM} id="hr-grid" />

        {/* janela de 6 segundos */}
        {helpers && method === '6s' && (
          <>
            <rect x={0} y={0} width={W} height={H} fill={palette.annot.sky} opacity="0.1" />
            <line x1={W - 1} y1={0} x2={W - 1} y2={H} stroke={palette.annot.sky} strokeWidth="2" />
            <text x={W / 2} y={14} textAnchor="middle" fontSize="12" fontWeight="900" fill={palette.annot.sky} fontFamily="ui-monospace, monospace">
              janela de 6 segundos = 30 quadradões
            </text>
          </>
        )}

        {/* marcação dos quadradões entre as duas primeiras R (só ritmo regular) */}
        {helpers && !c.irregular && method !== '6s' && (
          <g>
            <rect
              x={(500 / SC.durationMs) * W}
              y={0}
              width={(rrMs / SC.durationMs) * W}
              height={H}
              fill={palette.annot.amber}
              opacity="0.12"
            />
            <text
              x={(500 / SC.durationMs) * W + ((rrMs / SC.durationMs) * W) / 2}
              y={16} textAnchor="middle" fontSize="12" fontWeight="900" fill={palette.annot.amber} fontFamily="ui-monospace, monospace"
            >
              1 ciclo RR = {bigSquares.toFixed(1).replace('.', ',')} quadradões
            </text>
          </g>
        )}

        <path d={path} fill="none" stroke={palette.trace} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      </PaperFrame>

      <ScrollRow className="mt-3" label="Método">
        {METHODS.map((m) => (
          <LabButton key={m.key} active={method === m.key} onClick={() => setMethod(m.key)}>{m.name}</LabButton>
        ))}
      </ScrollRow>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <LabButton active={helpers} onClick={() => setHelpers((v) => !v)}>
          {helpers ? 'Ocultar auxílio' : 'Mostrar auxílio'}
        </LabButton>
        <LabButton onClick={newCase}><Dices className="h-3.5 w-3.5" /> Novo traçado</LabButton>
      </div>

      <LabNote title={METHODS.find((m) => m.key === method)!.name} tone="info">
        {METHODS.find((m) => m.key === method)!.how}
      </LabNote>

      {mode === 'practice' && (
        <form
          className="mt-3 flex items-end gap-2"
          onSubmit={(e) => { e.preventDefault(); if (guess) setChecked(true) }}
        >
          <label className="block flex-1 sm:max-w-[180px]">
            <span className="text-xs font-bold">Sua resposta (bpm)</span>
            <input
              type="number"
              inputMode="numeric"
              enterKeyHint="done"
              value={guess}
              onChange={(e) => { setGuess(e.target.value); setChecked(false) }}
              placeholder="ex.: 75"
              className="mt-1 h-12 w-full rounded-xl border border-border bg-muted/30 px-3 font-mono text-base font-bold outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/25"
            />
          </label>
          <button
            type="submit"
            disabled={!guess}
            className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-5 text-sm font-black text-primary-foreground transition active:scale-[0.97] disabled:opacity-40"
          >
            Conferir
          </button>
        </form>
      )}

      {(checked || mode === 'demo') && (
        <div className="mt-3 space-y-2">
          {mode === 'practice' && (
            <LabNote title={ok ? 'Acertou' : 'Ainda não'} tone={ok ? 'good' : 'bad'}>
              <span className="inline-flex items-center gap-1.5">
                {ok ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                Você respondeu {value || '—'} bpm; a frequência real é <strong>{c.rate} bpm</strong>
                {c.irregular && ' (média, ritmo irregular)'}. Diferenças de até 5 bpm não têm significado clínico —
                o que importa é acertar a faixa.
              </span>
            </LabNote>
          )}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 [&>*]:min-w-0">
            <Metric label="Frequência real" value={c.rate} unit="bpm" tone={c.rate < 60 ? 'warn' : c.rate > 100 ? 'warn' : 'good'} />
            <Metric label="Intervalo RR" value={Math.round(rrMs)} unit="ms" />
            <Metric label="Quadradões entre R" value={bigSquares.toFixed(1).replace('.', ',')} />
            <Metric label="QRS em 6 s" value={beatsIn6s.toFixed(1).replace('.', ',')} />
          </div>
          <LabNote title="Conferindo pelos três métodos">
            <strong>300 ÷ {bigSquares.toFixed(1).replace('.', ',')} quadradões = {Math.round(300 / bigSquares)} bpm.</strong>{' '}
            <strong>1500 ÷ {smallSquares.toFixed(0)} quadradinhos = {Math.round(1500 / smallSquares)} bpm.</strong>{' '}
            <strong>{beatsIn6s.toFixed(1).replace('.', ',')} QRS em 6 s × 10 = {Math.round(beatsIn6s * 10)} bpm.</strong>{' '}
            {c.irregular
              ? 'Como o ritmo é irregular (fibrilação atrial), só o método dos 6 segundos é válido: os outros dois medem um ciclo isolado, que não representa a média.'
              : 'Em ritmo regular, os três métodos convergem. O dos 1500 é o mais preciso; o dos 300 é o mais rápido.'}
          </LabNote>
          <p className="text-[11px] text-muted-foreground">{c.label}</p>
        </div>
      )}
    </LabShell>
  )
}
