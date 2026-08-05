'use client'

import React from 'react'

/**
 * Esquema didático do coração e do sistema de condução, em SVG.
 *
 * Diferente do `ConductionSystem` do simulador (que anima a propagação em tempo
 * real), este é um mapa ESTÁTICO e clicável: cada estrutura é uma peça
 * identificável, que acende quando a lição fala dela. É a mesma figura usada
 * pelo construtor do traçado e pelo laboratório de marca-passos, para que o
 * aluno reconheça sempre o mesmo desenho.
 */

export type HeartPart =
  | 'ra' | 'la' | 'rv' | 'lv' | 'septum'
  | 'sa' | 'bachmann' | 'internodal' | 'av' | 'his'
  | 'rbb' | 'lbb' | 'laf' | 'lpf' | 'septal' | 'purkinje'

export interface HeartPartInfo {
  key: HeartPart
  label: string
  short: string
}

export const HEART_PARTS: HeartPartInfo[] = [
  { key: 'sa', label: 'Nó sinoatrial (Keith-Flack)', short: 'Nó SA' },
  { key: 'bachmann', label: 'Feixe de Bachmann', short: 'Bachmann' },
  { key: 'internodal', label: 'Vias internodais (Bachmann, Wenckebach, Thorel)', short: 'Internodais' },
  { key: 'av', label: 'Nó atrioventricular (Aschoff-Tawara)', short: 'Nó AV' },
  { key: 'his', label: 'Feixe de His (fascículo atrioventricular)', short: 'His' },
  { key: 'rbb', label: 'Ramo direito', short: 'Ramo D' },
  { key: 'lbb', label: 'Ramo esquerdo', short: 'Ramo E' },
  { key: 'laf', label: 'Fascículo anterossuperior esquerdo', short: 'Anterossuperior' },
  { key: 'lpf', label: 'Fascículo posteroinferior esquerdo', short: 'Posteroinferior' },
  { key: 'septal', label: 'Fascículo septal (médio)', short: 'Septal' },
  { key: 'purkinje', label: 'Rede de Purkinje', short: 'Purkinje' },
]

interface Props {
  /** Estruturas acesas. */
  active?: HeartPart[]
  /** Estruturas marcadas como bloqueadas (vermelho, tracejado). */
  blocked?: HeartPart[]
  /** Torna as estruturas de condução clicáveis. */
  onPick?: (part: HeartPart) => void
  /** Estrutura destacada por seleção. */
  selected?: HeartPart | null
  className?: string
  /** Exibe os rótulos fixos das câmaras. */
  showChambers?: boolean
}

const ON = '#34d399'
const OFF = 'rgba(148,163,184,0.35)'
const BAD = '#fb7185'

/**
 * Traçado de cada via. Guardar o `d` aqui permite desenhar DUAS vezes: a linha
 * visível (fina, bonita) e, por cima, uma faixa transparente de 18 unidades que
 * é o alvo real do dedo. Sem ela, acertar um traço de 2 px num celular é sorte.
 */
const PATHS: Partial<Record<HeartPart, string>> = {
  bachmann: 'M80 62 C118 42 168 44 200 60',
  internodal: 'M76 74 C92 104 118 126 145 137',
  his: 'M150 150 L150 182',
  rbb: 'M150 182 C140 216 124 250 114 282',
  lbb: 'M150 182 C162 192 172 200 180 208',
  laf: 'M180 208 C200 216 214 230 222 246',
  lpf: 'M180 208 C182 238 180 264 174 288',
  septal: 'M168 198 C160 222 157 244 156 262',
  purkinje: 'M114 282 C106 290 100 296 96 300',
}

export function CourseHeart({
  active = [], blocked = [], onPick, selected = null, className = '', showChambers = true,
}: Props) {
  const isOn = (p: HeartPart) => active.includes(p)
  const isBad = (p: HeartPart) => blocked.includes(p)

  const stroke = (p: HeartPart) => (isBad(p) ? BAD : isOn(p) || selected === p ? ON : OFF)
  const width = (p: HeartPart) => (isOn(p) || selected === p ? 4 : 2.4)
  const dash = (p: HeartPart) => (isBad(p) ? '5 4' : undefined)
  const glow = (p: HeartPart) => (isOn(p) ? 'url(#heart-glow)' : undefined)

  const chamberFill = (p: HeartPart) => (isOn(p) ? 'rgba(52,211,153,0.22)' : 'rgba(148,163,184,0.07)')

  const pick = (p: HeartPart) => (onPick ? () => onPick(p) : undefined)
  const interactive = onPick ? 'cursor-pointer' : ''

  return (
    <svg viewBox="0 0 300 330" className={`block h-auto w-full ${className}`} role="img" aria-label="Esquema do sistema de condução cardíaco">
      <defs>
        <filter id="heart-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── Câmaras ── */}
      <ellipse cx="104" cy="92" rx="52" ry="44" fill={chamberFill('ra')} stroke="rgba(148,163,184,0.45)" strokeWidth="1.6" />
      <ellipse cx="202" cy="88" rx="48" ry="42" fill={chamberFill('la')} stroke="rgba(148,163,184,0.45)" strokeWidth="1.6" />
      <path d="M150 142 L62 142 C48 218 110 300 150 312 Z" fill={chamberFill('rv')} stroke="rgba(148,163,184,0.45)" strokeWidth="1.6" />
      <path d="M150 142 L240 142 C254 218 192 300 150 312 Z" fill={chamberFill('lv')} stroke="rgba(148,163,184,0.45)" strokeWidth="1.6" />
      <path d="M150 142 L150 312" stroke={isOn('septum') ? ON : 'rgba(148,163,184,0.5)'} strokeWidth={isOn('septum') ? 5 : 2} filter={glow('septum')} />

      {/* anel fibroso — o isolante elétrico entre átrios e ventrículos */}
      <path d="M56 140 L244 140" stroke="rgba(251,191,36,0.55)" strokeWidth="3" strokeLinecap="round" />

      {showChambers && (
        <g fontSize="11" fontWeight="700" fill="rgba(148,163,184,0.9)" fontFamily="ui-sans-serif, system-ui">
          <text x="104" y="96" textAnchor="middle">AD</text>
          <text x="202" y="92" textAnchor="middle">AE</text>
          <text x="108" y="230" textAnchor="middle">VD</text>
          <text x="196" y="230" textAnchor="middle">VE</text>
        </g>
      )}

      {/* ── Vias de condução ── */}
      {/* Bachmann: cruza para o átrio esquerdo */}
      <path
        d="M80 62 C118 42 168 44 200 60"
        fill="none" stroke={stroke('bachmann')} strokeWidth={width('bachmann')} strokeDasharray={dash('bachmann')}
        strokeLinecap="round" filter={glow('bachmann')} onClick={pick('bachmann')} className={interactive}
      />
      {/* Internodais: descem pelo átrio direito até o nó AV */}
      <path
        d="M76 74 C92 104 118 126 145 137"
        fill="none" stroke={stroke('internodal')} strokeWidth={width('internodal')} strokeDasharray={dash('internodal')}
        strokeLinecap="round" filter={glow('internodal')} onClick={pick('internodal')} className={interactive}
      />
      <path
        d="M70 78 C78 110 104 130 143 140"
        fill="none" stroke={stroke('internodal')} strokeWidth={width('internodal') * 0.7} strokeOpacity="0.6"
        strokeLinecap="round" onClick={pick('internodal')} className={interactive}
      />

      {/* His */}
      <path
        d="M150 150 L150 182"
        fill="none" stroke={stroke('his')} strokeWidth={width('his') + 0.6} strokeDasharray={dash('his')}
        strokeLinecap="round" filter={glow('his')} onClick={pick('his')} className={interactive}
      />

      {/* Ramo direito — fino, longo, subendocárdico */}
      <path
        d="M150 182 C140 216 124 250 114 282"
        fill="none" stroke={stroke('rbb')} strokeWidth={width('rbb')} strokeDasharray={dash('rbb')}
        strokeLinecap="round" filter={glow('rbb')} onClick={pick('rbb')} className={interactive}
      />
      {/* Ramo esquerdo — curto e largo */}
      <path
        d="M150 182 C162 192 172 200 180 208"
        fill="none" stroke={stroke('lbb')} strokeWidth={width('lbb') + 1.4} strokeDasharray={dash('lbb')}
        strokeLinecap="round" filter={glow('lbb')} onClick={pick('lbb')} className={interactive}
      />
      {/* Fascículo anterossuperior */}
      <path
        d="M180 208 C200 216 214 230 222 246"
        fill="none" stroke={stroke('laf')} strokeWidth={width('laf')} strokeDasharray={dash('laf')}
        strokeLinecap="round" filter={glow('laf')} onClick={pick('laf')} className={interactive}
      />
      {/* Fascículo posteroinferior */}
      <path
        d="M180 208 C182 238 180 264 174 288"
        fill="none" stroke={stroke('lpf')} strokeWidth={width('lpf') + 0.8} strokeDasharray={dash('lpf')}
        strokeLinecap="round" filter={glow('lpf')} onClick={pick('lpf')} className={interactive}
      />
      {/* Fascículo septal */}
      <path
        d="M168 198 C160 222 157 244 156 262"
        fill="none" stroke={stroke('septal')} strokeWidth={width('septal') * 0.85} strokeDasharray={dash('septal')}
        strokeLinecap="round" filter={glow('septal')} onClick={pick('septal')} className={interactive}
      />

      {/* Purkinje — arborização subendocárdica */}
      <g
        stroke={stroke('purkinje')} strokeWidth={width('purkinje') * 0.7} fill="none" strokeLinecap="round"
        filter={glow('purkinje')} onClick={pick('purkinje')} className={interactive} opacity={isOn('purkinje') ? 1 : 0.75}
      >
        <path d="M114 282 C106 290 100 296 96 300" />
        <path d="M114 282 C120 292 126 298 132 304" />
        <path d="M174 288 C182 294 190 298 196 300" />
        <path d="M174 288 C168 296 162 302 158 306" />
        <path d="M222 246 C230 254 234 262 236 270" />
        <path d="M156 262 C150 274 148 286 148 296" />
      </g>

      {/* ── Nós ── */}
      <g onClick={pick('sa')} className={interactive}>
        <circle cx="74" cy="66" r={isOn('sa') ? 11 : 8} fill={isBad('sa') ? BAD : isOn('sa') || selected === 'sa' ? ON : 'rgba(148,163,184,0.55)'} filter={glow('sa')} />
        <circle cx="74" cy="66" r="14" fill="none" stroke={isOn('sa') ? ON : 'transparent'} strokeWidth="1.5" opacity="0.5" />
      </g>
      <g onClick={pick('av')} className={interactive}>
        <ellipse cx="150" cy="144" rx="12" ry="8" fill={isBad('av') ? BAD : isOn('av') || selected === 'av' ? ON : 'rgba(148,163,184,0.55)'} filter={glow('av')} />
      </g>

      {/* Áreas de toque: invisíveis, largas e focáveis pelo teclado. */}
      {onPick && (Object.keys(PATHS) as HeartPart[]).map((k) => (
        <path
          key={`hit-${k}`}
          d={PATHS[k]}
          fill="none"
          stroke="transparent"
          strokeWidth={18}
          strokeLinecap="round"
          pointerEvents="stroke"
          role="button"
          tabIndex={0}
          aria-label={HEART_PARTS.find((h) => h.key === k)?.label || k}
          onClick={() => onPick(k)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPick(k) } }}
          className="cursor-pointer focus:outline-none"
        />
      ))}
      {onPick && ([['sa', 74, 66], ['av', 150, 144]] as const).map(([k, cx, cy]) => (
        <circle
          key={`hit-${k}`}
          cx={cx} cy={cy} r={20}
          fill="transparent"
          pointerEvents="all"
          role="button"
          tabIndex={0}
          aria-label={HEART_PARTS.find((h) => h.key === k)?.label || k}
          onClick={() => onPick(k as HeartPart)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPick(k as HeartPart) } }}
          className="cursor-pointer focus:outline-none"
        />
      ))}

      <g fontSize="9.5" fontWeight="700" fill="rgba(148,163,184,0.85)" fontFamily="ui-monospace, monospace">
        <text x="46" y="52">SA</text>
        <text x="166" y="140">AV</text>
      </g>
    </svg>
  )
}
