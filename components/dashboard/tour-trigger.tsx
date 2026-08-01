'use client'

/**
 * Botão de socorro da dashboard.
 *
 * Fica na primeira dobra, dentro do bloco de destaque, ao lado da ação
 * principal — o lugar onde o olho já está. A copy muda conforme a situação da
 * pessoa, porque "Tour pela plataforma" não fala com quem está travado:
 *
 *  - nunca fez  → "Estou perdido, o que faço aqui?" + pontinho pulsante;
 *  - parou no meio → "Retomar o tour · passo N";
 *  - já concluiu → "Rever o tour da plataforma".
 */

import { Compass, LifeBuoy, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TourStatus } from '@/hooks/use-platform-tour'

export function TourTrigger({
  status,
  pausedStep,
  onStart,
  className,
}: {
  status: TourStatus
  /** Índice (base 0) do passo em que parou. */
  pausedStep: number | null
  onStart: () => void
  className?: string
}) {
  const paused = status === 'paused' && pausedStep !== null && pausedStep > 0

  const label = paused
    ? `Retomar o tour · passo ${pausedStep + 1}`
    : status === 'done'
      ? 'Rever o tour da plataforma'
      : 'Estou perdido, o que faço aqui?'

  const Icon = paused ? RotateCcw : status === 'done' ? Compass : LifeBuoy

  return (
    <button
      type="button"
      data-tour="tour-button"
      onClick={onStart}
      aria-label={label}
      className={cn(
        'group relative inline-flex h-11 items-center justify-center gap-2 rounded-md border border-white/20 bg-white/10 px-4',
        'text-sm font-semibold text-[#F0EBE0] backdrop-blur-sm transition-all duration-200',
        'hover:border-[#E2A43E]/60 hover:bg-white/[0.18] hover:text-white active:scale-[0.98]',
        className,
      )}
    >
      {/* Pontinho de "novidade" só para quem nunca fez — sumiu o motivo, some o ponto. */}
      {status === 'new' && (
        <span aria-hidden className="absolute -right-1 -top-1 flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#E2A43E] opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#E2A43E]" />
        </span>
      )}
      <Icon className="h-4 w-4 text-[#E2A43E] transition-transform duration-300 group-hover:rotate-[-12deg]" />
      <span className="truncate">{label}</span>
    </button>
  )
}
