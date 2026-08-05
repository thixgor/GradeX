'use client'

import React, { useMemo, useState } from 'react'
import { LabButton, LabNote, LabShell, LabSlider, Metric } from './ui'

/**
 * Laboratório do eixo elétrico.
 *
 * Gire o vetor e veja, ao vivo, o QRS de cada uma das seis derivações dos
 * membros mudar de polaridade. A projeção é literalmente o cosseno do ângulo
 * entre o vetor e a derivação — a regra "vem em minha direção = positivo"
 * mostrada como matemática.
 */

const LIMB: { key: string; angle: number }[] = [
  { key: 'D1', angle: 0 },
  { key: 'D2', angle: 60 },
  { key: 'D3', angle: 120 },
  { key: 'aVR', angle: -150 },
  { key: 'aVL', angle: -30 },
  { key: 'aVF', angle: 90 },
]

const PRESETS = [
  { label: 'Normal', axis: 60, why: 'Eixo típico do adulto: para baixo e para a esquerda, acompanhando a massa do ventrículo esquerdo.' },
  { label: 'Desvio à esquerda', axis: -50, why: 'Bloqueio divisional anterossuperior, hipertrofia de VE, infarto inferior, obesidade, gestação.' },
  { label: 'Desvio à direita', axis: 120, why: 'Bloqueio divisional posteroinferior, hipertrofia de VD, DPOC, embolia pulmonar, infarto lateral, criança normal.' },
  { label: 'Desvio extremo', axis: -120, why: 'Terra de ninguém ("noroeste"): taquicardia ventricular, hipercalemia, ritmo de marca-passo ou eletrodos trocados.' },
]

function classify(axis: number) {
  if (axis >= -30 && axis <= 90) return { label: 'Eixo normal', tone: 'good' as const }
  if (axis > -90 && axis < -30) return { label: 'Desvio para a esquerda', tone: 'warn' as const }
  if (axis > 90 && axis <= 180) return { label: 'Desvio para a direita', tone: 'warn' as const }
  return { label: 'Desvio extremo ("noroeste")', tone: 'bad' as const }
}

const toRad = (deg: number) => (deg * Math.PI) / 180
const gauss = (t: number, a: number, mu: number, sigma: number) => a * Math.exp(-0.5 * ((t - mu) / sigma) ** 2)

/**
 * QRS de uma derivação, projetado a partir de DOIS vetores: o principal
 * (massa ventricular) e o terminal (regiões basais). Modelar os dois é o que
 * faz a derivação perpendicular ao eixo sair ISODIFÁSICA — e não achatada,
 * como aconteceria projetando um vetor só.
 */
function MiniLead({ name, axis, leadAngle }: { name: string; axis: number; leadAngle: number }) {
  const W = 96, H = 58, base = 30
  const main = Math.cos(toRad(axis - leadAngle))
  const term = Math.cos(toRad(axis + 155 - leadAngle))

  const d = useMemo(() => {
    let out = ''
    for (let t = 0; t <= 120; t += 1.5) {
      const mv =
        main * gauss(t, 1.2, 46, 9) +
        main * gauss(t, -0.09, 24, 6) +
        term * gauss(t, 0.5, 70, 10)
      const x = (t / 120) * W
      const y = base - mv * 18
      out += `${t === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)} `
    }
    return out.trim()
  }, [main, term])

  // Balanço da área: é ele que define se a derivação é positiva ou negativa
  const net = main * 1.2 - term * 0.5
  const positive = net > 0.25
  const negative = net < -0.25
  const tone = positive ? '#34d399' : negative ? '#fb7185' : '#facc15'

  return (
    <div className="rounded-lg border border-border bg-[#07100c] p-1">
      <div className="flex items-center justify-between px-1">
        <span className="font-mono text-[10px] font-black text-muted-foreground">{name}</span>
        <span className="font-mono text-[10px] font-black" style={{ color: tone }}>
          {positive ? '+' : negative ? '−' : '±'}
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full">
        <line x1={0} y1={base} x2={W} y2={base} stroke="rgba(148,163,184,0.25)" strokeWidth="0.8" />
        <path d={d} fill="none" stroke={tone} strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

export function AxisLab() {
  const [axis, setAxis] = useState(60)
  const cls = classify(axis)
  const cx = 150, cy = 150, R = 110
  const axisRad = toRad(axis)

  const d1 = Math.cos(((axis - 0) * Math.PI) / 180)
  const avf = Math.cos(((axis - 90) * Math.PI) / 180)

  const quadrant =
    d1 >= 0 && avf >= 0 ? 'D1 positivo e aVF positivo → eixo NORMAL'
      : d1 >= 0 && avf < 0 ? 'D1 positivo e aVF negativo → desvio à ESQUERDA (confirme em D2)'
        : d1 < 0 && avf >= 0 ? 'D1 negativo e aVF positivo → desvio à DIREITA'
          : 'D1 negativo e aVF negativo → desvio EXTREMO'

  return (
    <LabShell>
      <div className="grid gap-3 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-xl border border-border bg-muted/20 p-2">
          <svg viewBox="0 0 300 316" className="block h-auto w-full" role="img" aria-label={`Eixo elétrico a ${axis} graus`}>
            <path
              d={`M${cx} ${cy} L${cx + R * Math.cos((-30 * Math.PI) / 180)} ${cy + R * Math.sin((-30 * Math.PI) / 180)} A${R} ${R} 0 0 1 ${cx + R * Math.cos((90 * Math.PI) / 180)} ${cy + R * Math.sin((90 * Math.PI) / 180)} Z`}
              fill="rgba(52,211,153,0.12)"
            />
            <circle cx={cx} cy={cy} r={R} fill="none" stroke="rgba(148,163,184,0.25)" strokeWidth="1.2" />
            {LIMB.map((l) => {
              const r = (l.angle * Math.PI) / 180
              return (
                <g key={l.key}>
                  <line
                    x1={cx - R * Math.cos(r)} y1={cy - R * Math.sin(r)}
                    x2={cx + R * Math.cos(r)} y2={cy + R * Math.sin(r)}
                    stroke="rgba(148,163,184,0.25)" strokeWidth="1"
                  />
                  <text
                    x={cx + (R + 18) * Math.cos(r)} y={cy + (R + 18) * Math.sin(r) + 4}
                    textAnchor="middle" fontSize="11" fontWeight="900"
                    fill="rgba(148,163,184,0.85)" fontFamily="ui-monospace, monospace"
                  >
                    {l.key}
                  </text>
                </g>
              )
            })}
            {/* vetor */}
            <defs>
              <marker id="axis-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                <path d="M0 0 L8 4 L0 8 Z" fill="#f472b6" />
              </marker>
            </defs>
            <line
              x1={cx} y1={cy} x2={cx + R * 0.9 * Math.cos(axisRad)} y2={cy + R * 0.9 * Math.sin(axisRad)}
              stroke="#f472b6" strokeWidth="4" markerEnd="url(#axis-arrow)" strokeLinecap="round"
            />
            <circle cx={cx} cy={cy} r="5" fill="rgba(148,163,184,0.9)" />
            <text x={cx} y={311} textAnchor="middle" fontSize="13" fontWeight="900" fill="#f472b6" fontFamily="ui-monospace, monospace">
              {axis}°
            </text>
          </svg>
        </div>

        <div className="space-y-3">
          <LabSlider label="Eixo elétrico" value={axis} min={-180} max={180} step={5} unit="°" onChange={setAxis} />

          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <LabButton key={p.label} active={axis === p.axis} onClick={() => setAxis(p.axis)}>{p.label}</LabButton>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Classificação</p>
              <p className={`text-[13px] font-black leading-snug ${
                cls.tone === 'good' ? 'text-emerald-600 dark:text-emerald-400'
                  : cls.tone === 'warn' ? 'text-amber-600 dark:text-amber-400'
                    : 'text-rose-600 dark:text-rose-400'
              }`}>{cls.label}</p>
            </div>
            <Metric label="Projeção em D1" value={d1.toFixed(2).replace('.', ',')} tone={d1 >= 0 ? 'good' : 'bad'} />
            <Metric label="Projeção em aVF" value={avf.toFixed(2).replace('.', ',')} tone={avf >= 0 ? 'good' : 'bad'} />
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {LIMB.map((l) => (
              <MiniLead key={l.key} name={l.key} axis={axis} leadAngle={l.angle} />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <LabNote title="Método dos quadrantes" tone={cls.tone}>{quadrant}</LabNote>
        <LabNote title="Por que funciona" tone="info">
          A altura do QRS em cada derivação é a PROJEÇÃO do vetor sobre ela — matematicamente, o cosseno do ângulo
          entre os dois. Quando o ângulo é menor que 90°, o cosseno é positivo e a onda é positiva. Quando passa de
          90°, o cosseno vira negativo e a onda inverte. E quando é exatamente 90°, o cosseno é zero: a derivação fica
          ISODIFÁSICA. Daí o segundo método — ache a isodifásica e o eixo é perpendicular a ela.
        </LabNote>
        {PRESETS.find((p) => p.axis === axis) && (
          <LabNote title="Causas mais comuns" tone="warn">{PRESETS.find((p) => p.axis === axis)!.why}</LabNote>
        )}
      </div>
    </LabShell>
  )
}
