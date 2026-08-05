'use client'

import React, { useMemo, useState } from 'react'
import { LabNote, LabShell, LabSlider, Metric } from './ui'

/**
 * Comparação músculo esquelético × músculo cardíaco em frequência crescente.
 *
 * O esquelético soma os abalos (refratariedade de poucos milissegundos) e
 * chega ao tétano; o cardíaco recusa qualquer estímulo que chegue dentro do
 * período refratário — e por isso nunca tetaniza. Aumentar a frequência mostra
 * o contraste na hora.
 */

const W = 560
const H = 120
const WINDOW_MS = 1600
const xOf = (t: number) => (t / WINDOW_MS) * W

/** Abalo do músculo esquelético: sobe rápido, relaxa em ~110 ms. */
function skeletalTwitch(dt: number) {
  if (dt < 0) return 0
  if (dt > 160) return 0
  const rise = 1 - Math.exp(-dt / 12)
  const fall = Math.exp(-dt / 55)
  return rise * fall * 1.9
}

/** Contração cardíaca: sobe e relaxa em ~300 ms, praticamente sem cauda. */
function cardiacTwitch(dt: number) {
  if (dt < 0 || dt > 340) return 0
  const rise = 1 - Math.exp(-dt / 30)
  const fall = Math.exp(-dt / 130)
  return rise * fall * 1.75
}

const SKELETAL_REFRACTORY = 4     // ms
const CARDIAC_REFRACTORY = 260    // ms

export function TetanyLab() {
  const [hz, setHz] = useState(3)

  const period = 1000 / hz
  const stimuli = useMemo(() => {
    const out: number[] = []
    for (let t = 60; t < WINDOW_MS; t += period) out.push(t)
    return out
  }, [period])

  /** Estímulos que efetivamente geram contração, respeitando a refratariedade. */
  const effective = (refractory: number) => {
    const out: number[] = []
    let last = -Infinity
    for (const t of stimuli) {
      if (t - last >= refractory) { out.push(t); last = t }
    }
    return out
  }

  const skelFires = useMemo(() => effective(SKELETAL_REFRACTORY), [stimuli])
  const cardFires = useMemo(() => effective(CARDIAC_REFRACTORY), [stimuli])

  const curve = (fires: number[], twitch: (dt: number) => number, summate: boolean) => {
    let d = ''
    let peak = 0
    for (let t = 0; t <= WINDOW_MS; t += 4) {
      let f = 0
      if (summate) {
        for (const s of fires) f += twitch(t - s)
      } else {
        for (const s of fires) f = Math.max(f, twitch(t - s))
      }
      f = Math.min(f, 4)
      peak = Math.max(peak, f)
      const y = H - 8 - (f / 4) * (H - 22)
      d += `${t === 0 ? 'M' : 'L'}${xOf(t).toFixed(1)} ${y.toFixed(1)} `
    }
    return { d: d.trim(), peak }
  }

  const skel = useMemo(() => curve(skelFires, skeletalTwitch, true), [skelFires])
  const card = useMemo(() => curve(cardFires, cardiacTwitch, false), [cardFires])

  const blocked = stimuli.length - cardFires.length
  const maxCardiacHz = Math.floor(1000 / CARDIAC_REFRACTORY * 10) / 10

  const regime =
    hz < 2 ? 'abalos isolados'
      : hz < 6 ? 'somação temporal (tétano incompleto)'
        : 'tétano completo'

  return (
    <LabShell>
      <div className="mb-3 max-w-sm">
        <LabSlider
          label="Frequência de estimulação" value={hz} min={1} max={30} unit="Hz"
          onChange={setHz}
          hint={`${stimuli.length} estímulos na janela de 1,6 s · intervalo de ${Math.round(period)} ms entre eles`}
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-2 [&>*]:min-w-0">
        {/* Esquelético */}
        <div>
          <p className="mb-1 text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Músculo esquelético
          </p>
          <div className="overflow-hidden rounded-xl border border-amber-500/25 bg-[#12100a]">
            <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label="Curva de força do músculo esquelético">
              <line x1={0} y1={H - 8} x2={W} y2={H - 8} stroke="rgba(148,163,184,0.3)" strokeWidth="1" />
              {stimuli.map((t, i) => (
                <line key={i} x1={xOf(t)} y1={H - 8} x2={xOf(t)} y2={H - 2} stroke="#fbbf24" strokeWidth="1.6" />
              ))}
              <path d={skel.d} fill="none" stroke="#fbbf24" strokeWidth="2.4" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="mt-1.5 grid grid-cols-2 gap-2 [&>*]:min-w-0">
            <Metric label="Período refratário" value="1–5" unit="ms" />
            <Metric label="Regime" value={regime.split(' ')[0]} tone={hz >= 6 ? 'bad' : 'warn'} />
          </div>
        </div>

        {/* Cardíaco */}
        <div>
          <p className="mb-1 text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Músculo cardíaco
          </p>
          <div className="overflow-hidden rounded-xl border border-emerald-500/25 bg-[#07100c]">
            <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label="Curva de força do músculo cardíaco">
              <line x1={0} y1={H - 8} x2={W} y2={H - 8} stroke="rgba(148,163,184,0.3)" strokeWidth="1" />
              {stimuli.map((t, i) => {
                const fired = cardFires.includes(t)
                return (
                  <line key={i} x1={xOf(t)} y1={H - 8} x2={xOf(t)} y2={H - 2}
                    stroke={fired ? '#34d399' : '#fb7185'} strokeWidth="1.6" strokeDasharray={fired ? undefined : '2 2'} />
                )
              })}
              <path d={card.d} fill="none" stroke="#34d399" strokeWidth="2.4" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="mt-1.5 grid grid-cols-2 gap-2 [&>*]:min-w-0">
            <Metric label="Período refratário" value="200–300" unit="ms" />
            <Metric label="Estímulos ignorados" value={blocked} tone={blocked > 0 ? 'bad' : 'good'} />
          </div>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <LabNote title="O que você está vendo" tone="info">
          No esquelético, o período refratário (1–5 ms) acaba MUITO antes de o abalo relaxar (50–100 ms). Um novo
          estímulo pega a fibra ainda contraída e a força se SOMA. Acima de ~6 Hz os abalos se fundem e vira tétano
          completo — é assim que você segura um copo.
        </LabNote>
        <LabNote title="Por que o coração recusa" tone="good">
          No miocárdio, o potencial de ação dura 200–300 ms graças ao platô de cálcio da fase 2 — praticamente o mesmo
          tempo da contração. Quando a célula volta a ser excitável, ela JÁ RELAXOU: não há janela para somação. Os
          estímulos em vermelho acima caíram dentro do período refratário e simplesmente não geraram contração. O teto
          fisiológico é de cerca de {String(maxCardiacHz).replace('.', ',')} Hz (≈ {Math.round(maxCardiacHz * 60)} bpm) para uma célula isolada.
        </LabNote>
        <LabNote title="Por que isso importa" tone="warn">
          Um coração capaz de tetanizar entraria em contração sustentada, não relaxaria, não encheria — e não bombearia
          nada. Tétano cardíaco seria sinônimo de parada. O coração aumenta força por outros caminhos: Frank-Starling,
          inotropismo simpático e efeito escada de Bowditch.
        </LabNote>
      </div>
    </LabShell>
  )
}
