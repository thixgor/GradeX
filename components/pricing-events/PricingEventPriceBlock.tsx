'use client'

import { useMemo } from 'react'
import { Sparkles, TrendingDown } from 'lucide-react'
import type { PricingEventStatePayload } from './PricingEventCountdown'

function fmt(value: number) {
  return `R$ ${Number(value || 0).toFixed(2).replace('.', ',')}`
}

const wrapStyle: React.CSSProperties = {
  background: 'rgba(6,20,10,0.5)',
  border: '1px solid rgba(52,211,153,0.18)',
  borderRadius: '16px',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
}

export function PricingEventPriceBlock({
  originalPrice,
  state,
  ctaLabel,
  onCta,
  ctaDisabled,
}: {
  originalPrice: number
  state: PricingEventStatePayload | null
  ctaLabel?: string
  onCta?: () => void
  ctaDisabled?: boolean
}) {
  const computed = useMemo(() => {
    const pct = state?.activeTier?.discountPercent ?? 0
    const discount = Math.max(0, Math.round(originalPrice * (pct / 100) * 100) / 100)
    const final = Math.max(0, Math.round((originalPrice - discount) * 100) / 100)
    return { discount, final, pct }
  }, [originalPrice, state])

  const hasTier = !!state?.activeTier && computed.pct > 0

  return (
    <div style={wrapStyle} className="p-4 sm:p-5">
      <div className="flex items-baseline gap-3">
        {hasTier ? (
          <>
            <span className="text-3xl font-bold text-white sm:text-4xl">{fmt(computed.final)}</span>
            <span className="text-base text-slate-400 line-through">{fmt(originalPrice)}</span>
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-300">
              −{computed.pct}%
            </span>
          </>
        ) : (
          <span className="text-3xl font-bold text-white sm:text-4xl">{fmt(originalPrice)}</span>
        )}
      </div>

      {hasTier ? (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 rounded-md border border-emerald-400/30 bg-emerald-500/10 px-2 py-1 text-emerald-300">
            <Sparkles className="h-3 w-3" />
            Lote atual: {state!.activeTier!.label}
          </span>
          <span className="text-emerald-200/80">
            Você economiza <strong className="text-emerald-200">{fmt(computed.discount)}</strong>
          </span>
        </div>
      ) : null}

      {state?.nextTier ? (
        <div className="mt-2 flex items-center gap-1 text-[11px] text-amber-200/80">
          <TrendingDown className="h-3 w-3 rotate-180" />
          <span>
            O valor aumenta na próxima virada (lote sobe para {state.nextTier.discountPercent}% OFF).
          </span>
        </div>
      ) : null}

      {ctaLabel ? (
        <button
          type="button"
          disabled={ctaDisabled}
          onClick={onCta}
          className="mt-4 w-full rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_-10px_rgba(15,139,95,0.6)] transition hover:from-emerald-300 hover:to-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {ctaLabel}
        </button>
      ) : null}
    </div>
  )
}

export default PricingEventPriceBlock
