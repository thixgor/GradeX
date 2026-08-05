'use client'

import React, { useState } from 'react'
import { LabButton, LabNote, LabShell } from './ui'

/**
 * Explorador das 12 derivações.
 *
 * Plano frontal desenhado como sistema hexaxial (as seis derivações dos membros
 * transladadas para o centro do coração) e plano horizontal como corte
 * transversal do tórax. Clicar em uma derivação mostra o eletrodo, o ângulo, a
 * parede vista, a artéria correspondente e o que costuma aparecer ali.
 */

interface LeadInfo {
  key: string
  plane: 'frontal' | 'horizontal'
  /** Ângulo no sistema hexaxial (graus). */
  angle?: number
  type: string
  wall: string
  artery: string
  sees: string
  findings: string
  color: string
}

const LEADS: LeadInfo[] = [
  {
    key: 'D1', plane: 'frontal', angle: 0, type: 'Bipolar — braço direito (−) → braço esquerdo (+)',
    wall: 'Lateral alta', artery: 'Circunflexa (ramo marginal) / diagonal da DA', color: '#38bdf8',
    sees: 'O coração da esquerda para a direita, na horizontal. Junto com aVL forma o par lateral alto.',
    findings: 'D1 inteiramente invertida com aVR positivo: eletrodos de braço trocados ou dextrocardia. S profunda em D1 com Q em D3 e T invertida em D3 = padrão S1Q3T3 da embolia pulmonar.',
  },
  {
    key: 'D2', plane: 'frontal', angle: 60, type: 'Bipolar — braço direito (−) → perna esquerda (+)',
    wall: 'Inferior', artery: 'Coronária direita (ou circunflexa, se dominante à esquerda)', color: '#34d399',
    sees: 'É a derivação mais paralela ao eixo elétrico normal do coração — por isso as ondas são as maiores e mais bem definidas. É a derivação de escolha para analisar RITMO e onda P, e a padrão do monitor.',
    findings: 'Onda P mais visível de todo o ECG. Vale a lei de Einthoven: D2 = D1 + D3, útil para conferir eletrodos.',
  },
  {
    key: 'D3', plane: 'frontal', angle: 120, type: 'Bipolar — braço esquerdo (−) → perna esquerda (+)',
    wall: 'Inferior', artery: 'Coronária direita', color: '#4ade80',
    sees: 'A parede inferior, do lado mais direito. Quando o supra em D3 é MAIOR que em D2 e há infra em D1/aVL, a culpada é a coronária direita.',
    findings: 'Onda Q isolada em D3 pode ser posicional — costuma desaparecer na inspiração profunda. T invertida isolada em D3 pode ser normal.',
  },
  {
    key: 'aVR', plane: 'frontal', angle: -150, type: 'Unipolar aumentada — braço direito',
    wall: 'Cavidade ventricular / via de saída', artery: 'Tronco da coronária esquerda (indireto)', color: '#fb7185',
    sees: 'Olha o coração de cima e da direita, praticamente de dentro da cavidade. Todo o vetor principal se afasta dela.',
    findings: 'P, QRS e T são NEGATIVOS no ECG normal. aVR positivo em ritmo sinusal significa eletrodos trocados, dextrocardia ou ritmo ectópico. Supra de ST em aVR ≥ 1 mm com infra difuso: lesão de tronco ou doença triarterial.',
  },
  {
    key: 'aVL', plane: 'frontal', angle: -30, type: 'Unipolar aumentada — braço esquerdo',
    wall: 'Lateral alta', artery: 'Primeira diagonal da descendente anterior / circunflexa', color: '#60a5fa',
    sees: 'A parede lateral alta, junto com D1.',
    findings: 'Supra isolado em D1 e aVL com infra em D3: oclusão da primeira diagonal ("infarto lateral alto"). R em aVL ≥ 11 mm é critério de hipertrofia ventricular esquerda.',
  },
  {
    key: 'aVF', plane: 'frontal', angle: 90, type: 'Unipolar aumentada — perna esquerda',
    wall: 'Inferior', artery: 'Coronária direita / descendente posterior', color: '#a3e635',
    sees: 'A parede inferior de baixo para cima. Junto com D1, define o quadrante do eixo elétrico.',
    findings: 'D1 e aVF positivos = eixo normal. Supra em D2, D3 e aVF = infarto inferior: peça V3R/V4R antes de dar nitrato.',
  },
  {
    key: 'V1', plane: 'horizontal', type: '4º espaço intercostal, borda esternal DIREITA',
    wall: 'Septal / ventrículo direito', artery: 'Descendente anterior (ramos septais)', color: '#f472b6',
    sees: 'Está mais próxima do ventrículo direito e do septo. O vetor principal (esquerdo) se AFASTA dela — por isso o QRS é predominantemente negativo (rS).',
    findings: 'rSR′ com QRS ≥ 120 ms = bloqueio de ramo direito. QS = possível infarto anterosseptal. R alta em V1: infarto posterior, hipertrofia de VD, BRD ou WPW tipo A. Supra em V1–V2 com padrão em "aleta de tubarão": Brugada — confira se o eletrodo não está alto demais.',
  },
  {
    key: 'V2', plane: 'horizontal', type: '4º espaço intercostal, borda esternal ESQUERDA',
    wall: 'Septal', artery: 'Descendente anterior (ramos septais)', color: '#e879f9',
    sees: 'O septo interventricular, com a maior amplitude de todo o ECG normal.',
    findings: 'Critério de supra mais rigoroso: ≥ 2 mm em homens > 40 anos, ≥ 2,5 mm em homens < 40 e ≥ 1,5 mm em mulheres. Melhor derivação para ver a onda U.',
  },
  {
    key: 'V3', plane: 'horizontal', type: 'No meio do caminho entre V2 e V4 (coloque V4 primeiro)',
    wall: 'Anterior', artery: 'Descendente anterior', color: '#c084fc',
    sees: 'A parede anterior. Costuma ser a zona de transição, onde R e S têm o mesmo tamanho.',
    findings: 'R ≤ 3 mm em V3 = má progressão de R (infarto anterior antigo, hipertrofia de VE, DPOC, posicionamento errado). T bifásica em V2–V3 sem dor = padrão de Wellens: descendente anterior proximal crítica.',
  },
  {
    key: 'V4', plane: 'horizontal', type: '5º espaço intercostal, linha hemiclavicular esquerda',
    wall: 'Anterior / apical', artery: 'Descendente anterior', color: '#a78bfa',
    sees: 'A ponta do coração. É o ponto de referência: V5 e V6 seguem a HORIZONTAL de V4, e não o espaço intercostal.',
    findings: 'V4R (imagem espelhada, no hemitórax direito) é obrigatória em infarto inferior: supra ≥ 1 mm confirma infarto de ventrículo direito e contraindica nitrato.',
  },
  {
    key: 'V5', plane: 'horizontal', type: 'Linha axilar ANTERIOR, na horizontal de V4',
    wall: 'Lateral baixa', artery: 'Circunflexa / diagonal', color: '#818cf8',
    sees: 'A parede lateral do ventrículo esquerdo, já bem próxima do miocárdio.',
    findings: 'Entra no critério de Sokolow-Lyon (S em V1 + R em V5 ou V6 ≥ 35 mm). É também a derivação preferida para medir o QT junto com D2.',
  },
  {
    key: 'V6', plane: 'horizontal', type: 'Linha axilar MÉDIA, na horizontal de V4',
    wall: 'Lateral baixa / apical', artery: 'Circunflexa', color: '#6366f1',
    sees: 'A parede lateral, no ponto mais à esquerda. O vetor principal vem em direção a ela: QRS francamente positivo, com q septal pequena.',
    findings: 'Ausência da q septal em V5–V6: bloqueio de ramo esquerdo, bloqueio fascicular septal ou fibrose. S alargada em V6 com rSR′ em V1: bloqueio de ramo direito. R alargada e entalhada em V6: bloqueio de ramo esquerdo.',
  },
]

const FRONTAL = LEADS.filter((l) => l.plane === 'frontal')
const HORIZONTAL = LEADS.filter((l) => l.plane === 'horizontal')

/** Posição no corte transversal do tórax (viewBox 0 0 300 220). */
const CHEST_POS: Record<string, { x: number; y: number }> = {
  V1: { x: 128, y: 176 }, V2: { x: 160, y: 180 }, V3: { x: 192, y: 172 },
  V4: { x: 218, y: 156 }, V5: { x: 240, y: 132 }, V6: { x: 252, y: 104 },
}

export function LeadsExplorer({ plane: initial = 'frontal' }: { plane?: 'frontal' | 'horizontal' }) {
  const [plane, setPlane] = useState<'frontal' | 'horizontal'>(initial)
  const [sel, setSel] = useState(initial === 'frontal' ? 'D2' : 'V1')
  const info = LEADS.find((l) => l.key === sel) || LEADS[0]
  const list = plane === 'frontal' ? FRONTAL : HORIZONTAL

  const cx = 150, cy = 150, R = 118

  return (
    <LabShell>
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <LabButton active={plane === 'frontal'} onClick={() => { setPlane('frontal'); setSel('D2') }}>
          Plano frontal (membros)
        </LabButton>
        <LabButton active={plane === 'horizontal'} onClick={() => { setPlane('horizontal'); setSel('V1') }}>
          Plano horizontal (precordiais)
        </LabButton>
      </div>

      <div className="grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-xl border border-border bg-muted/20 p-2">
          {plane === 'frontal' ? (
            <svg viewBox="0 0 300 314" className="block h-auto w-full" role="img" aria-label="Sistema hexaxial das derivações dos membros">
              <circle cx={cx} cy={cy} r={R} fill="none" stroke="rgba(148,163,184,0.25)" strokeWidth="1.4" />
              <circle cx={cx} cy={cy} r={R * 0.62} fill="none" stroke="rgba(148,163,184,0.14)" strokeWidth="1" strokeDasharray="3 5" />

              {/* setor do eixo normal: −30° a +90° */}
              <path
                d={`M${cx} ${cy} L${cx + R * Math.cos((-30 * Math.PI) / 180)} ${cy + R * Math.sin((-30 * Math.PI) / 180)} A${R} ${R} 0 0 1 ${cx + R * Math.cos((90 * Math.PI) / 180)} ${cy + R * Math.sin((90 * Math.PI) / 180)} Z`}
                fill="rgba(52,211,153,0.10)"
              />

              {FRONTAL.map((l) => {
                const rad = ((l.angle ?? 0) * Math.PI) / 180
                const x = cx + R * Math.cos(rad)
                const y = cy + R * Math.sin(rad)
                const nx = cx - R * Math.cos(rad)
                const ny = cy - R * Math.sin(rad)
                const on = sel === l.key
                return (
                  <g key={l.key} onClick={() => setSel(l.key)} className="cursor-pointer">
                    <line x1={nx} y1={ny} x2={x} y2={y} stroke={on ? l.color : 'rgba(148,163,184,0.3)'} strokeWidth={on ? 3 : 1.6} />
                    <circle cx={x} cy={y} r={on ? 15 : 12} fill={on ? l.color : 'rgba(15,23,42,0.85)'} stroke={l.color} strokeWidth="1.6" />
                    <text x={x} y={y + 4} textAnchor="middle" fontSize="11" fontWeight="900"
                      fill={on ? '#0b1220' : l.color} fontFamily="ui-monospace, monospace">
                      {l.key}
                    </text>
                    <text x={cx + (R + 22) * Math.cos(rad)} y={cy + (R + 22) * Math.sin(rad) + 3} textAnchor="middle"
                      fontSize="9.5" fontWeight="700" fill="rgba(148,163,184,0.8)" fontFamily="ui-monospace, monospace">
                      {l.angle}°
                    </text>
                  </g>
                )
              })}
              <circle cx={cx} cy={cy} r="5" fill="rgba(148,163,184,0.9)" />
              <text x={cx} y={cy - 12} textAnchor="middle" fontSize="9" fontWeight="800" fill="rgba(148,163,184,0.8)">coração</text>
              <text x={cx} y={309} textAnchor="middle" fontSize="10" fontWeight="700" fill="rgba(52,211,153,0.9)">
                área verde = faixa do eixo normal (−30° a +90°)
              </text>
            </svg>
          ) : (
            <svg viewBox="0 0 300 220" className="block h-auto w-full" role="img" aria-label="Corte transversal do tórax com as derivações precordiais">
              {/* tórax */}
              <ellipse cx="160" cy="120" rx="128" ry="80" fill="rgba(148,163,184,0.07)" stroke="rgba(148,163,184,0.35)" strokeWidth="1.6" />
              {/* coluna e esterno */}
              <circle cx="160" cy="52" r="14" fill="rgba(148,163,184,0.15)" stroke="rgba(148,163,184,0.3)" />
              <rect x="140" y="180" width="40" height="8" rx="3" fill="rgba(148,163,184,0.18)" />
              {/* coração */}
              <ellipse cx="140" cy="118" rx="46" ry="38" fill="rgba(52,211,153,0.14)" stroke="rgba(52,211,153,0.45)" strokeWidth="1.6" />
              <path d="M140 82 L140 156" stroke="rgba(52,211,153,0.45)" strokeWidth="1.4" />
              <text x="118" y="122" textAnchor="middle" fontSize="10" fontWeight="800" fill="rgba(148,163,184,0.85)">VD</text>
              <text x="164" y="122" textAnchor="middle" fontSize="10" fontWeight="800" fill="rgba(148,163,184,0.85)">VE</text>

              {HORIZONTAL.map((l) => {
                const p = CHEST_POS[l.key]
                const on = sel === l.key
                return (
                  <g key={l.key} onClick={() => setSel(l.key)} className="cursor-pointer">
                    <line x1={p.x} y1={p.y} x2={140} y2={118} stroke={on ? l.color : 'rgba(148,163,184,0.22)'} strokeWidth={on ? 2.4 : 1} strokeDasharray={on ? undefined : '3 4'} />
                    <circle cx={p.x} cy={p.y} r={on ? 14 : 11} fill={on ? l.color : 'rgba(15,23,42,0.85)'} stroke={l.color} strokeWidth="1.6" />
                    <text x={p.x} y={p.y + 4} textAnchor="middle" fontSize="10" fontWeight="900"
                      fill={on ? '#0b1220' : l.color} fontFamily="ui-monospace, monospace">
                      {l.key}
                    </text>
                  </g>
                )
              })}
              <text x="150" y="212" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="rgba(148,163,184,0.75)">
                corte transversal do tórax, visto de baixo
              </text>
            </svg>
          )}
        </div>

        <div className="space-y-2.5">
          <div className="flex flex-wrap gap-1.5">
            {list.map((l) => (
              <button
                key={l.key}
                type="button"
                onClick={() => setSel(l.key)}
                className={`rounded-md px-2.5 py-1 text-[11px] font-black transition ${
                  sel === l.key ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:text-foreground'
                }`}
              >
                {l.key}
              </button>
            ))}
          </div>

          <div>
            <h4 className="font-heading text-lg font-black leading-none tracking-tight" style={{ color: info.color }}>{info.key}</h4>
            <p className="mt-1 text-[12px] text-muted-foreground">{info.type}</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Parede</p>
              <p className="text-[13px] font-bold">{info.wall}</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Artéria</p>
              <p className="text-[13px] font-bold leading-tight">{info.artery}</p>
            </div>
          </div>

          <LabNote title="O que ela enxerga">{info.sees}</LabNote>
          <LabNote title="Achados típicos" tone="info">{info.findings}</LabNote>
        </div>
      </div>
    </LabShell>
  )
}
