'use client'

import React, { useMemo, useState } from 'react'
import type { EcgPattern } from '@/lib/ecg/engine'
import { patternPath, type StripScale } from '@/lib/ecg/course/strip'
import { EcgGrid, LabButton, LabNote, LabShell, Metric } from './ui'

/**
 * Laboratório do papel milimetrado: mostra na prática o que muda quando alguém
 * troca a velocidade ou o ganho do eletrocardiógrafo. O traçado é o MESMO
 * batimento — o que muda é só a régua com que ele é impresso.
 */

const MM = 16
const W = 640
const H = 320
const BASELINE = 224

const PATTERN: EcgPattern = {
  id: 'paper', rate: 68, rhythm: 'sinus', pr: 160,
  p: { present: true, amp: 0.15, axis: 60, width: 100 },
  qrs: { axis: 60, rAmp: 1.3, qAmp: 0.08, sAmp: 0.28, width: 92 },
  t: { amp: 0.32, axis: 55, width: 165 },
}

const SPEEDS = [25, 50, 100]
const GAINS = [5, 10, 20]

export function PaperLab() {
  const [speed, setSpeed] = useState(25)
  const [gain, setGain] = useState(10)

  const sc: StripScale = useMemo(() => ({
    width: W,
    height: H,
    durationMs: (W / MM / speed) * 1000,
    mvSpan: (H / 2) / (gain * MM),
    baseline: BASELINE,
  }), [speed, gain])

  const path = useMemo(() => patternPath(PATTERN, 'II', sc), [sc])

  const msPerSmall = Math.round(1000 / speed)
  const mvPerSmall = Math.round((1 / gain) * 1000) / 1000
  const standard = speed === 25 && gain === 10

  // Pulso de calibração: 1 mV de altura, 200 ms de largura
  const calH = gain * MM
  const calW = (200 / 1000) * speed * MM

  return (
    <LabShell>
      <div className="mb-2 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <span className="mr-1 text-[11px] font-black uppercase tracking-wider text-muted-foreground">mm/s</span>
          {SPEEDS.map((s) => (
            <LabButton key={s} active={speed === s} onClick={() => setSpeed(s)}>{s}</LabButton>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <span className="mr-1 text-[11px] font-black uppercase tracking-wider text-muted-foreground">mm/mV</span>
          {GAINS.map((g) => (
            <LabButton key={g} active={gain === g} onClick={() => setGain(g)}>{g}</LabButton>
          ))}
        </div>
        {!standard && (
          <LabButton tone="primary" active onClick={() => { setSpeed(25); setGain(10) }} className="ml-auto">
            Voltar ao padrão
          </LabButton>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-emerald-500/20 bg-[#07100c]">
        <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full text-emerald-400" role="img"
          aria-label={`Traçado a ${speed} mm/s e ${gain} mm/mV`}>
          <EcgGrid mm={MM} id="paper-grid" />
          {/* pulso de calibração */}
          <path
            d={`M6 ${BASELINE} L${6 + MM} ${BASELINE} L${6 + MM} ${BASELINE - calH} L${6 + MM + calW} ${BASELINE - calH} L${6 + MM + calW} ${BASELINE} L${6 + MM + calW + MM} ${BASELINE}`}
            fill="none" stroke="#fbbf24" strokeWidth="2.2" strokeLinejoin="round"
          />
          <text x={8 + MM} y={BASELINE - calH - 6} fontSize="11" fontWeight="800" fill="#fbbf24" fontFamily="ui-monospace, monospace">
            1 mV
          </text>
          <path d={path} fill="none" stroke="#3ff08a" strokeWidth="2.4" strokeLinejoin="round" transform={`translate(${MM * 4},0)`} />
        </svg>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Metric label="Quadradinho (tempo)" value={msPerSmall} unit="ms" tone={standard ? 'good' : 'warn'} />
        <Metric label="Quadradinho (voltagem)" value={mvPerSmall.toFixed(3).replace('.', ',')} unit="mV" tone={standard ? 'good' : 'warn'} />
        <Metric label="Quadradão (tempo)" value={msPerSmall * 5} unit="ms" />
        <Metric label="Janela visível" value={Math.round(sc.durationMs)} unit="ms" />
      </div>

      <LabNote title={standard ? 'Calibração padrão' : 'Atenção: fora do padrão'} tone={standard ? 'good' : 'warn'}>
        {standard ? (
          <>
            25 mm/s e 10 mm/mV. Quadradinho = 40 ms e 0,1 mV; quadradão = 200 ms e 0,5 mV. O pulso de calibração em
            amarelo tem exatamente 10 mm de altura — é ele que prova que o aparelho está configurado corretamente.
          </>
        ) : (
          <>
            A {speed} mm/s, cada quadradinho vale {msPerSmall} ms — {speed > 25 ? 'os intervalos parecem MAIORES do que são' : 'os intervalos parecem MENORES do que são'}.
            A {gain} mm/mV, cada quadradinho vale {mvPerSmall.toFixed(3).replace('.', ',')} mV — as amplitudes parecem{' '}
            {gain > 10 ? 'MAIORES' : 'MENORES'}, e critérios de hipertrofia podem ser{' '}
            {gain > 10 ? 'falsamente positivos' : 'perdidos'}. Repare que o pulso de calibração muda de altura junto: é o seu aviso.
          </>
        )}
      </LabNote>
    </LabShell>
  )
}
