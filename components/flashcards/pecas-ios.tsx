'use client'

import { useEffect, useState, type ReactNode } from 'react'

/**
 * Anel de progresso (meta do dia, acerto da sessão). Começa vazio e enche na
 * primeira pintura — é o pequeno momento de "cheguei lá" da tela.
 * Estilo em `.ios-anel` (vidro-ios.css); fica âmbar quando completa.
 */
export function AnelProgresso({
  valor,
  total,
  tamanho = 64,
  espessura = 7,
  children,
  rotulo,
}: {
  valor: number
  total: number
  tamanho?: number
  espessura?: number
  children?: ReactNode
  rotulo: string
}) {
  const [montado, setMontado] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setMontado(true))
    return () => cancelAnimationFrame(id)
  }, [])
  const raio = (tamanho - espessura) / 2
  const circunferencia = 2 * Math.PI * raio
  const fracao = total > 0 ? Math.min(1, Math.max(0, valor / total)) : 0
  const completo = total > 0 && valor >= total
  return (
    <div
      className="ios-anel relative shrink-0"
      style={{ width: tamanho, height: tamanho }}
      data-completo={completo ? 'true' : 'false'}
      role="img"
      aria-label={rotulo}
    >
      <svg width={tamanho} height={tamanho} viewBox={`0 0 ${tamanho} ${tamanho}`} className="-rotate-90">
        <circle className="trilho" cx={tamanho / 2} cy={tamanho / 2} r={raio} strokeWidth={espessura} />
        <circle
          className="traco"
          cx={tamanho / 2}
          cy={tamanho / 2}
          r={raio}
          strokeWidth={espessura}
          strokeDasharray={circunferencia}
          strokeDashoffset={montado ? circunferencia * (1 - fracao) : circunferencia}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  )
}

const CORES_CONFETE = ['#2f8a4f', '#5fb072', '#e2a43e', '#f4c66d', '#e5484d', '#7fd093']

/**
 * Confete do fim de sessão. Peças com posição e atraso fixos por índice (nada
 * de `Math.random` no render: a hidratação e o re-render ficariam diferentes).
 */
export function Confete({ pecas = 28 }: { pecas?: number }) {
  return (
    <div aria-hidden className="ios-confete">
      {Array.from({ length: pecas }).map((_, i) => {
        const x = (i * 37) % 100
        const dx = ((i * 53) % 160) - 80
        const r = ((i * 97) % 720) - 360
        const d = (i % 7) * 70
        return (
          <i
            key={i}
            style={{
              ['--x' as string]: `${x}%`,
              ['--dx' as string]: `${dx}px`,
              ['--r' as string]: `${r}deg`,
              ['--d' as string]: `${d}ms`,
              ['--c' as string]: CORES_CONFETE[i % CORES_CONFETE.length],
            }}
          />
        )
      })}
    </div>
  )
}
