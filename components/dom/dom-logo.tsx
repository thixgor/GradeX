'use client'

import { useEffect, useId, useState } from 'react'
import { carregarDesenho, type Desenho } from './desenhos'

/**
 * A marca DomineAqui AI, animada: o selo hexagonal entra girando e flutua, a
 * rede (um nó laranja e três verdes) pulsa e o fluxo corre pelas ligações, a
 * cruz acende, um brilho de vidro atravessa o selo e o letreiro se revela da
 * esquerda para a direita. `pensando` acelera a rede — a "cabeça" da IA
 * trabalhando enquanto o Dom procura a resposta.
 *
 * Coordenadas do desenho original (viewBox `298 312 905 350`).
 */

const VIEWBOX = '298 312 905 350'
const VIEWBOX_DO_SELO = '298 312 340 350'
const NOS = [
  { x: 470, y: 485, r: 26, cor: '#ffb066' },
  { x: 385, y: 532, r: 24, cor: '#9ff0c8' },
  { x: 467, y: 575, r: 26, cor: '#9ff0c8' },
  { x: 545, y: 555, r: 25, cor: '#9ff0c8' },
]
const LIGACOES: Array<[number, number]> = [
  [0, 1],
  [0, 3],
  [1, 2],
  [2, 3],
]
// Contorno aproximado do selo, para o brilho não vazar para fora do vidro.
const SELO = 'M312 414 L468 328 L620 412 L620 596 L470 652 L314 598 Z'

export function DomLogo({
  pensando = false,
  className,
  soSelo = false,
}: {
  pensando?: boolean
  className?: string
  /** Só o selo hexagonal (cabeçalhos pequenos, onde o letreiro prateado some no fundo claro). */
  soSelo?: boolean
}) {
  const [d, setD] = useState<Desenho | null>(null)
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  useEffect(() => {
    let vivo = true
    carregarDesenho('domineaqui-ai')
      .then((x) => vivo && setD(x))
      .catch(() => {})
    return () => {
      vivo = false
    }
  }, [])

  return (
    <div
      className={`dom-logo ${className || ''}`}
      data-pensando={pensando ? '1' : '0'}
      data-so-selo={soSelo || undefined}
      role="img"
      aria-label="DomineAqui AI"
    >
      {d && (
        <>
          {!soSelo && (
          <div className="dom-logo__letreiro">
            <svg viewBox={VIEWBOX} aria-hidden dangerouslySetInnerHTML={{ __html: d.partes.resto || '' }} />
          </div>
          )}
          <div className="dom-logo__selo">
            <svg viewBox={soSelo ? VIEWBOX_DO_SELO : VIEWBOX} aria-hidden>
              <defs>
                <clipPath id={`selo-${uid}`}>
                  <path d={SELO} />
                </clipPath>
                <linearGradient id={`brilho-${uid}`} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0" stopColor="#fff" stopOpacity="0" />
                  <stop offset="0.5" stopColor="#fff" stopOpacity="0.55" />
                  <stop offset="1" stopColor="#fff" stopOpacity="0" />
                </linearGradient>
                <radialGradient id={`no-${uid}`}>
                  <stop offset="0" stopColor="#fff" stopOpacity="0.9" />
                  <stop offset="1" stopColor="#fff" stopOpacity="0" />
                </radialGradient>
              </defs>
              <g dangerouslySetInnerHTML={{ __html: d.partes.selo || '' }} />
              {/* Cruz acendendo */}
              <path
                className="dom-logo__cruz"
                d="M444 361h40v31h32v40h-32v33h-40v-33h-32v-40h32z"
                fill="#c8ffe4"
                style={{ mixBlendMode: 'screen' }}
              />
              {/* Fluxo nas ligações */}
              <g stroke="#ffe2b8" strokeWidth="5" strokeLinecap="round" fill="none" style={{ mixBlendMode: 'screen' }}>
                {LIGACOES.map(([a, b], i) => {
                  // De borda a borda: o traço não atravessa os nós.
                  const [p, q] = [NOS[a], NOS[b]]
                  const dist = Math.hypot(q.x - p.x, q.y - p.y)
                  const ux = (q.x - p.x) / dist
                  const uy = (q.y - p.y) / dist
                  return (
                    <line
                      key={i}
                      className="dom-logo__fluxo"
                      x1={p.x + ux * (p.r + 4)}
                      y1={p.y + uy * (p.r + 4)}
                      x2={q.x - ux * (q.r + 4)}
                      y2={q.y - uy * (q.r + 4)}
                    />
                  )
                })}
              </g>
              {/* Nós pulsando */}
              <g style={{ mixBlendMode: 'screen' }}>
                {NOS.map((n, i) => (
                  <circle key={i} className="dom-logo__no" cx={n.x} cy={n.y} r={n.r * 1.5} fill={`url(#no-${uid})`} />
                ))}
              </g>
              {/* Brilho de vidro atravessando o selo */}
              <g clipPath={`url(#selo-${uid})`}>
                <rect className="dom-logo__brilho" x="300" y="300" width="70" height="400" fill={`url(#brilho-${uid})`} />
              </g>
            </svg>
          </div>
        </>
      )}
    </div>
  )
}
