'use client'

import { Flame, Tag } from 'lucide-react'
import type { PricingEventStatePayload } from './PricingEventCountdown'

/**
 * Renders a compact lote badge for use on cards / list items.
 * Shows the discount % and the lote name when there's an active tier.
 */
export function PricingEventBadge({
  state,
  size = 'sm',
}: {
  state: PricingEventStatePayload | null | undefined
  size?: 'xs' | 'sm' | 'md'
}) {
  if (!state || !state.activeTier || !state.isActive) return null

  const pct = state.activeTier.discountPercent
  if (pct <= 0) return null

  const sizes = {
    xs: 'text-[9px] px-1.5 py-0.5 gap-0.5',
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1',
  } as const

  const icon = {
    xs: 'h-2.5 w-2.5',
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
  } as const

  return (
    <span
      className={`inline-flex items-center rounded-full font-bold backdrop-blur-xl border ${sizes[size]} bg-gradient-to-r from-emerald-500/40 to-cyan-500/40 text-emerald-50 border-emerald-300/40 shadow-lg shadow-emerald-500/20`}
      title={`${state.name} · −${pct}% agora`}
    >
      <Flame className={`${icon[size]} fill-emerald-200/60`} />
      −{pct}% Lote
    </span>
  )
}

/**
 * Renders the price block with original price strikethrough + tier-discounted price
 * inline, compact enough to fit on a card. Falls back to plain price when no tier.
 */
export function PricingEventCardPrice({
  originalPrice,
  state,
  className = '',
  align = 'right',
}: {
  originalPrice: number
  state: PricingEventStatePayload | null | undefined
  className?: string
  align?: 'left' | 'right' | 'center'
}) {
  const pct = state?.activeTier?.discountPercent || 0
  const hasDiscount = !!state?.activeTier && state.isActive !== false && pct > 0

  const finalPrice = hasDiscount
    ? Math.max(0, Math.round(originalPrice * (1 - pct / 100) * 100) / 100)
    : originalPrice

  const alignClass =
    align === 'left' ? 'items-start text-left' : align === 'center' ? 'items-center text-center' : 'items-end text-right'

  if (!hasDiscount) {
    return (
      <div className={`flex flex-col ${alignClass} ${className}`}>
        <span className="text-sm font-bold text-amber-200">
          R$ {originalPrice.toFixed(2).replace('.', ',')}
        </span>
      </div>
    )
  }

  return (
    <div className={`flex flex-col ${alignClass} ${className}`}>
      <span className="text-[10px] line-through text-white/60">
        R$ {originalPrice.toFixed(2).replace('.', ',')}
      </span>
      <span className="text-sm font-extrabold text-emerald-200 leading-tight">
        R$ {finalPrice.toFixed(2).replace('.', ',')}
      </span>
      <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-emerald-300/90">
        <Tag className="h-2.5 w-2.5" />
        −{pct}% no lote
      </span>
    </div>
  )
}

export default PricingEventBadge
