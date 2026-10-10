'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { Lightbulb, TrendingUp } from 'lucide-react'
import type { ForcaDoAnuncio } from '@/lib/monitorias/forca-anuncio'
import { cn } from '@/lib/utils'

const COR = { fraco: 'text-rose-500', bom: 'text-amber-500', excelente: 'text-primary' } as const
const ROTULO = { fraco: 'Precisa de atenção', bom: 'Bom, dá para melhorar', excelente: 'Excelente' } as const

/** Anel animado com a nota. */
export function AnelForca({ forca, tamanho = 64 }: { forca: Pick<ForcaDoAnuncio, 'pontos' | 'nivel'>; tamanho?: number }) {
  const reduzir = useReducedMotion()
  const r = tamanho / 2 - 5
  const volta = 2 * Math.PI * r
  return (
    <div className="relative shrink-0" style={{ width: tamanho, height: tamanho }} aria-label={`Força do anúncio: ${forca.pontos} de 100`}>
      <svg width={tamanho} height={tamanho} className="-rotate-90">
        <circle cx={tamanho / 2} cy={tamanho / 2} r={r} strokeWidth={6} className="fill-none stroke-muted" />
        <motion.circle
          cx={tamanho / 2}
          cy={tamanho / 2}
          r={r}
          strokeWidth={6}
          strokeLinecap="round"
          className={cn('fill-none stroke-current', COR[forca.nivel])}
          strokeDasharray={volta}
          initial={reduzir ? false : { strokeDashoffset: volta }}
          animate={{ strokeDashoffset: volta * (1 - forca.pontos / 100) }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-heading text-sm font-bold tabular-nums">{forca.pontos}</span>
    </div>
  )
}

/** Cartão completo: nota + as dicas que mais somam pontos. */
export function CartaoForca({ forca }: { forca: ForcaDoAnuncio }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-4">
        <AnelForca forca={forca} />
        <div>
          <p className="flex items-center gap-1.5 text-sm font-semibold"><TrendingUp className="h-4 w-4 text-primary" /> Força do anúncio</p>
          <p className={cn('text-xs font-semibold', COR[forca.nivel])}>{ROTULO[forca.nivel]}</p>
          <p className="text-xs text-muted-foreground">Anúncios mais completos aparecem melhor e recebem mais pedidos.</p>
        </div>
      </div>
      {forca.dicas.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {forca.dicas.slice(0, 4).map((d) => (
            <li key={d.texto} className="flex items-start gap-2 text-xs">
              <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
              <span className="flex-1">{d.texto}</span>
              <span className="shrink-0 rounded-md bg-primary/10 px-1.5 font-semibold text-primary">+{d.ganho}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
