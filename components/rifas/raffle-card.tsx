'use client'

import Link from 'next/link'
import { Ticket, Gift, Clock, ArrowRight, Trophy } from 'lucide-react'
import {
  resolveTheme,
  RAFFLE_STATUS_LABELS,
  RAFFLE_STATUS_COLORS,
  formatBRL,
} from '@/lib/raffle-shared'
import type { RaffleStatus, RaffleTemplate, RaffleCustomDesign } from '@/lib/types'

export interface RaffleCardData {
  id: string
  name: string
  slug: string
  prizeName: string
  prizeCategory?: string
  coverImageUrl?: string
  pricePerNumber: number
  totalNumbers: number
  soldCount: number
  availableCount?: number
  status: RaffleStatus
  template: RaffleTemplate
  customDesign?: RaffleCustomDesign | null
  startsAt?: string | null
  endsAt?: string | null
}

export function RaffleCard({ raffle }: { raffle: RaffleCardData }) {
  const theme = resolveTheme(raffle.template, raffle.customDesign)
  const sold = raffle.soldCount || 0
  const pct = raffle.totalNumbers > 0 ? Math.min(100, Math.round((sold / raffle.totalNumbers) * 100)) : 0
  const statusColor = RAFFLE_STATUS_COLORS[raffle.status]

  return (
    <Link
      href={`/rifas/${raffle.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1"
      style={{
        background: theme.cardStyle === 'solid' ? 'rgba(10,15,12,0.96)' : 'rgba(10,15,12,0.7)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: `1px solid ${theme.primaryColor}33`,
        boxShadow: `0 8px 30px rgba(0,0,0,0.35)`,
      }}
    >
      {/* Capa */}
      <div className="relative h-44 overflow-hidden" style={{ background: theme.background }}>
        {raffle.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={raffle.coverImageUrl} alt={raffle.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Gift size={48} style={{ color: theme.primaryColor, opacity: 0.5 }} />
          </div>
        )}
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide backdrop-blur" style={{ background: `${statusColor}dd`, color: '#fff' }}>
            {RAFFLE_STATUS_LABELS[raffle.status]}
          </span>
        </div>
        {raffle.prizeCategory && (
          <span className="absolute top-3 right-3 rounded-full px-2.5 py-1 text-[11px] font-semibold backdrop-blur" style={{ background: 'rgba(0,0,0,0.5)', color: theme.primaryColor }}>
            {raffle.prizeCategory}
          </span>
        )}
      </div>

      {/* Conteúdo */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        <div>
          <h3 className="text-base font-bold text-white line-clamp-1">{raffle.name}</h3>
          <p className="text-sm text-white/60 line-clamp-1 flex items-center gap-1.5 mt-0.5">
            <Trophy size={13} style={{ color: theme.primaryColor }} /> {raffle.prizeName}
          </p>
        </div>

        {/* Progresso */}
        <div>
          <div className="flex justify-between text-[11px] mb-1" style={{ color: 'rgba(255,255,255,0.55)' }}>
            <span>{pct}% vendido</span>
            <span>{sold}/{raffle.totalNumbers}</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${theme.secondaryColor}, ${theme.primaryColor})` }} />
          </div>
        </div>

        <div className="flex items-center justify-between mt-auto pt-1">
          <div className="flex items-center gap-1.5">
            <Ticket size={16} style={{ color: theme.primaryColor }} />
            <span className="text-lg font-extrabold" style={{ color: theme.primaryColor }}>{formatBRL(raffle.pricePerNumber)}</span>
          </div>
          <span
            className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-bold transition group-hover:gap-2"
            style={{ background: theme.primaryColor, color: '#08130d' }}
          >
            Participar <ArrowRight size={15} />
          </span>
        </div>
      </div>
    </Link>
  )
}
