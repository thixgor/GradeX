'use client'

import { useEffect, useId, useRef } from 'react'
import { animate } from 'framer-motion'
import { LIGAS, type Liga } from '@/lib/xp/regras'
import './xp.css'

/** As cores da liga como variáveis CSS — o anel, o selo e o menu leem daqui. */
export function estiloDaLiga(liga: Pick<Liga, 'cor' | 'brilho'>): React.CSSProperties {
  return { '--liga': liga.cor, '--liga-brilho': liga.brilho } as React.CSSProperties
}

export function ligaPorId(id: string | null | undefined): Liga {
  return LIGAS.find((l) => l.id === id) || LIGAS[0]
}

/** Anel de progresso do nível, com o número no meio. */
export function AnelDeNivel({
  nivel,
  progresso,
  liga,
  tamanho = 44,
  espessura = 4,
  className = '',
}: {
  nivel: number
  progresso: number
  liga: Liga
  tamanho?: number
  espessura?: number
  className?: string
}) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const raio = (tamanho - espessura) / 2
  const volta = 2 * Math.PI * raio
  const p = Math.max(0, Math.min(1, progresso))
  return (
    <span
      className={`xp-anel ${className}`}
      style={{ width: tamanho, height: tamanho, ...estiloDaLiga(liga) }}
      role="img"
      aria-label={`Nível ${nivel}, ${Math.round(p * 100)}% para o próximo`}
    >
      <svg width={tamanho} height={tamanho} viewBox={`0 0 ${tamanho} ${tamanho}`} aria-hidden>
        <defs>
          <linearGradient id={`g${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={liga.brilho} />
            <stop offset="100%" stopColor={liga.cor} />
          </linearGradient>
        </defs>
        <circle className="xp-anel-trilho" cx={tamanho / 2} cy={tamanho / 2} r={raio} fill="none" strokeWidth={espessura} />
        <circle
          className="xp-anel-arco"
          cx={tamanho / 2}
          cy={tamanho / 2}
          r={raio}
          fill="none"
          strokeWidth={espessura}
          stroke={`url(#g${id})`}
          strokeDasharray={volta}
          strokeDashoffset={volta * (1 - p)}
        />
      </svg>
      <span className="xp-anel-numero" style={{ fontSize: Math.round(tamanho * 0.36) }}>{nivel}</span>
    </span>
  )
}

/**
 * O emblema da liga: um escudo em degradê com o brilho que atravessa. Cada
 * liga tem um desenho a mais (uma, duas, três estrelas…), para não depender só
 * da cor — quem não distingue cores ainda reconhece a liga.
 */
export function SeloDaLiga({ liga, tamanho = 40, className = '' }: { liga: Liga; tamanho?: number; className?: string }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const ordem = LIGAS.findIndex((l) => l.id === liga.id)
  const estrelas = Math.min(3, ordem % 3 + 1)
  const coroa = ordem >= 6
  return (
    <span className={`xp-selo ${className}`} style={{ width: tamanho, height: tamanho }} role="img" aria-label={`Liga ${liga.nome}`}>
      <svg viewBox="0 0 40 44" aria-hidden>
        <defs>
          <linearGradient id={`s${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={liga.brilho} />
            <stop offset="100%" stopColor={liga.cor} />
          </linearGradient>
          <clipPath id={`c${id}`}>
            <path d="M20 2 L36 8 V22 C36 32 29 39 20 42 C11 39 4 32 4 22 V8 Z" />
          </clipPath>
        </defs>
        <path d="M20 2 L36 8 V22 C36 32 29 39 20 42 C11 39 4 32 4 22 V8 Z" fill={`url(#s${id})`} />
        <path d="M20 6 L32.5 10.6 V22 C32.5 30 27 35.6 20 38.2 C13 35.6 7.5 30 7.5 22 V10.6 Z" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.2" />
        <g clipPath={`url(#c${id})`}>
          <rect className="xp-selo-brilho" x="-10" y="0" width="14" height="44" fill="rgba(255,255,255,0.45)" />
        </g>
        {coroa ? (
          <path d="M12 26 L14 17 L18 22 L20 15 L22 22 L26 17 L28 26 Z" fill="#fff" opacity="0.95" />
        ) : (
          Array.from({ length: estrelas }, (_, i) => {
            const x = 20 + (i - (estrelas - 1) / 2) * 8
            return (
              <path
                key={i}
                transform={`translate(${x} 22) scale(0.42)`}
                d="M0 -9 L2.6 -2.8 L9 -2.8 L3.8 1.2 L5.8 8 L0 4 L-5.8 8 L-3.8 1.2 L-9 -2.8 L-2.6 -2.8 Z"
                fill="#fff"
                opacity="0.95"
              />
            )
          })
        )}
      </svg>
    </span>
  )
}

/** Número que corre até o valor novo, em vez de pular. */
export function NumeroQueCorre({ valor, formato = (v: number) => Math.round(v).toLocaleString('pt-BR') }: { valor: number; formato?: (v: number) => string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const anterior = useRef<number | null>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const de = anterior.current ?? 0
    anterior.current = valor
    const controle = animate(de, valor, {
      duration: Math.min(1.6, 0.5 + Math.log10(Math.abs(valor - de) + 1) * 0.3),
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => { el.textContent = formato(v) },
    })
    return () => controle.stop()
    // `formato` é estável na prática; refazer a animação a cada render seria pior.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valor])
  return <span ref={ref}>{formato(valor)}</span>
}
