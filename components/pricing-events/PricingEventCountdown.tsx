'use client'

import { useEffect, useMemo, useState } from 'react'
import { Calendar, Clock, Sparkles, TrendingDown } from 'lucide-react'

export interface PricingEventStatePayload {
  eventId: string
  name: string
  description?: string
  bannerUrl?: string
  eventDate: string
  mode: 'weekly' | 'manual'
  isActive: boolean
  daysUntilEvent: number
  maxDiscountPercent: number
  activeTier: {
    index: number
    discountPercent: number
    label: string
    endsAt: string
    startedAt?: string
  } | null
  nextTier: {
    index: number
    discountPercent: number
    label: string
    startsAt?: string
    endsAt: string
  } | null
  tiersTimeline: Array<{
    index: number
    startAt: string
    endAt: string
    discountPercent: number
    label: string
    isActive: boolean
    isPast: boolean
    isFuture: boolean
  }>
}

function pluralize(n: number, singular: string, plural: string) {
  return n === 1 ? `${n} ${singular}` : `${n} ${plural}`
}

function formatRemaining(ms: number) {
  if (ms <= 0) return null
  const totalSeconds = Math.floor(ms / 1000)
  const days = Math.floor(totalSeconds / 86_400)
  const hours = Math.floor((totalSeconds % 86_400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return { days, hours, minutes, seconds }
}

function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(t)
  }, [intervalMs])
  return now
}

const containerStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, rgba(15,139,95,0.18) 0%, rgba(6,20,10,0.85) 100%)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: '1px solid rgba(52,211,153,0.22)',
  borderRadius: '20px',
  boxShadow: '0 20px 60px -20px rgba(15,139,95,0.45)',
}

const tickStyle: React.CSSProperties = {
  background: 'rgba(6,20,10,0.6)',
  border: '1px solid rgba(52,211,153,0.18)',
  borderRadius: '12px',
}

export function PricingEventCountdown({ state, compact = false }: { state: PricingEventStatePayload; compact?: boolean }) {
  const now = useNow(1000)

  const eventDate = useMemo(() => new Date(state.eventDate), [state.eventDate])
  const tierEndsAt = useMemo(
    () => (state.activeTier ? new Date(state.activeTier.endsAt) : null),
    [state.activeTier]
  )

  const remainingToEvent = formatRemaining(eventDate.getTime() - now)
  const remainingToTierEnd = tierEndsAt ? formatRemaining(tierEndsAt.getTime() - now) : null

  if (!state.isActive || state.daysUntilEvent < 0) return null

  const headlineDays = remainingToEvent?.days ?? 0
  const headline = headlineDays > 0
    ? `Faltam ${pluralize(headlineDays, 'dia', 'dias')} para ${state.name}`
    : 'O evento começa em breve'

  const tierMessage = remainingToTierEnd
    ? remainingToTierEnd.days > 0
      ? `O desconto atual termina em ${pluralize(remainingToTierEnd.days, 'dia', 'dias')}`
      : remainingToTierEnd.hours > 0
        ? `O desconto atual termina em ${pluralize(remainingToTierEnd.hours, 'hora', 'horas')}`
        : `O desconto atual termina em minutos`
    : null

  return (
    <div style={containerStyle} className="p-4 sm:p-5 text-emerald-50">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2 text-emerald-300/90">
          <Calendar className="h-4 w-4" />
          <span className="text-xs font-medium uppercase tracking-wider">Lote dinâmico do evento</span>
        </div>
        {state.activeTier ? (
          <div className="flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
            <Sparkles className="h-3 w-3" />
            {state.activeTier.discountPercent}% OFF — {state.activeTier.label}
          </div>
        ) : null}
      </div>

      <div className="mt-3 text-lg font-semibold text-white sm:text-xl">{headline}</div>
      {state.description ? (
        <p className="mt-1 text-xs text-emerald-100/70">{state.description}</p>
      ) : null}

      {!compact && remainingToEvent ? (
        <div className="mt-4 grid grid-cols-4 gap-2 sm:gap-3">
          {(['days', 'hours', 'minutes', 'seconds'] as const).map((unit) => {
            const value = remainingToEvent[unit]
            const label =
              unit === 'days' ? 'dias' : unit === 'hours' ? 'horas' : unit === 'minutes' ? 'min' : 'seg'
            return (
              <div key={unit} style={tickStyle} className="flex flex-col items-center px-1 py-2 sm:py-3">
                <div className="text-xl font-bold tabular-nums text-white sm:text-2xl">
                  {String(value).padStart(2, '0')}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-emerald-200/70">{label}</div>
              </div>
            )
          })}
        </div>
      ) : null}

      {tierMessage ? (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-amber-300/20 bg-amber-400/5 px-3 py-2 text-xs text-amber-200/90">
          <Clock className="h-3.5 w-3.5 flex-none" />
          <span>{tierMessage}. Aproveite o lote atual antes da virada.</span>
        </div>
      ) : null}

      {state.nextTier ? (
        <div className="mt-2 flex items-center gap-2 text-[11px] text-emerald-200/70">
          <TrendingDown className="h-3.5 w-3.5 flex-none rotate-180" />
          <span>
            Próximo lote sobe para {100 - state.nextTier.discountPercent}% do preço (
            {state.nextTier.discountPercent}% OFF). Quanto antes comprar, maior o desconto.
          </span>
        </div>
      ) : null}
    </div>
  )
}

export default PricingEventCountdown
