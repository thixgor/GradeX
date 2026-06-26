'use client'

import { useMemo } from 'react'
import { Ticket, Gift, Trophy, CheckCircle2, Tag, Clock, ShieldCheck, Video } from 'lucide-react'
import { resolveTheme, getEffectiveStatus, RAFFLE_STATUS_LABELS, RAFFLE_STATUS_COLORS, formatBRL } from '@/lib/raffle-shared'
import type { RaffleStatus } from '@/lib/types'
import type { RaffleFormValues } from './admin-raffle-form'

/**
 * Pré-visualização fiel (em miniatura) da página pública da rifa, renderizada ao
 * vivo a partir dos valores do formulário do admin. O grid de números e a barra
 * de progresso são ILUSTRATIVOS (a rifa nova ainda não tem vendas).
 */
export function RafflePreview({ values }: { values: RaffleFormValues }) {
  const theme = useMemo(() => resolveTheme(values.template as any, values.customDesign as any), [values.template, values.customDesign])

  const status = getEffectiveStatus({
    status: values.status as RaffleStatus,
    startsAt: values.startsAt ? new Date(values.startsAt) : undefined,
    endsAt: values.endsAt ? new Date(values.endsAt) : undefined,
  })
  const statusColor = RAFFLE_STATUS_COLORS[status]
  const textColor = theme.light ? '#0b0b0b' : '#ffffff'
  const subText = theme.light ? '#333333' : 'rgba(255,255,255,0.7)'

  // Amostra ilustrativa: ~28% vendido para o design "respirar".
  const samplePct = 28
  const total = Math.max(2, values.totalNumbers || 2)
  const radius = theme.gridStyle === 'pill' ? '9999px' : theme.gridStyle === 'square' ? '4px' : '10px'

  // 30 números de amostra com estados variados.
  const sampleCells = Array.from({ length: 30 }, (_, i) => i + 1)
  const soldSample = new Set([2, 5, 9, 14, 20, 23, 28])
  const reservedSample = new Set([7, 17])
  const selectedSample = new Set([11, 12])

  return (
    <div className="overflow-hidden rounded-2xl border" style={{ borderColor: `${theme.primaryColor}33` }}>
      {/* Barra do "navegador" */}
      <div className="flex items-center gap-1.5 px-3 py-2" style={{ background: 'rgba(0,0,0,0.4)' }}>
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#ff5f56' }} />
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#ffbd2e' }} />
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#27c93f' }} />
        <span className="ml-2 truncate rounded px-2 py-0.5 text-[10px]" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}>
          domineaqui.com.br/rifas/{values.slug || 'sua-rifa'}
        </span>
      </div>

      {/* Conteúdo da página */}
      <div className="max-h-[70vh] overflow-y-auto p-3 sm:p-4" style={{ background: theme.background }}>
        {/* Cabeçalho */}
        <div className="overflow-hidden rounded-2xl" style={{ border: `1px solid ${theme.primaryColor}33`, background: 'rgba(0,0,0,0.3)' }}>
          {values.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={values.coverImageUrl} alt="" className="h-28 w-full object-cover" />
          ) : (
            <div className="flex h-20 w-full items-center justify-center" style={{ background: `linear-gradient(135deg, ${theme.secondaryColor}33, ${theme.primaryColor}22)` }}>
              <Ticket size={26} style={{ color: theme.primaryColor }} />
            </div>
          )}
          <div className="p-4">
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              <span className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide" style={{ background: `${statusColor}22`, color: statusColor, border: `1px solid ${statusColor}66` }}>
                {RAFFLE_STATUS_LABELS[status]}
              </span>
              {values.prizeCategory && (
                <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold" style={{ background: `${theme.primaryColor}1a`, color: theme.primaryColor }}>
                  <Tag size={9} /> {values.prizeCategory}
                </span>
              )}
              {theme.highlightText && (
                <span className="rounded-full px-2 py-0.5 text-[9px] font-bold" style={{ background: theme.primaryColor, color: theme.light ? '#fff' : '#08130d' }}>
                  {theme.highlightText}
                </span>
              )}
            </div>
            <h1 className="text-lg font-extrabold leading-tight tracking-tight" style={{ color: textColor }}>
              {values.name || 'Nome da sua rifa'}
            </h1>
            {values.description && <p className="mt-1 line-clamp-2 text-[11px]" style={{ color: subText }}>{values.description}</p>}

            {/* Métricas */}
            <div className="mt-3 grid grid-cols-4 gap-1.5">
              <MiniStat icon={<Ticket size={11} />} label="Número" value={formatBRL(values.pricePerNumber)} theme={theme} highlight />
              <MiniStat icon={<Trophy size={11} />} label="Ganham" value={String(values.winnersCount || 1)} theme={theme} />
              <MiniStat icon={<Gift size={11} />} label="Total" value={String(total)} theme={theme} />
              <MiniStat icon={<CheckCircle2 size={11} />} label="Vendidos" value={`${samplePct}%`} theme={theme} />
            </div>

            {/* Progresso */}
            <div className="mt-2.5 h-1.5 overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,0.12)' }}>
              <div className="h-full rounded-full" style={{ width: `${samplePct}%`, background: `linear-gradient(90deg, ${theme.secondaryColor}, ${theme.primaryColor})` }} />
            </div>

            {(values.startsAt || values.endsAt) && (
              <div className="mt-2.5 flex items-center gap-2 rounded-lg px-2.5 py-1.5" style={{ background: `${theme.primaryColor}12`, border: `1px solid ${theme.primaryColor}33` }}>
                <Clock size={12} style={{ color: theme.primaryColor }} />
                <span className="text-[10px] font-semibold" style={{ color: subText }}>
                  {status === 'scheduled' ? 'Começa em breve' : 'Encerra no prazo definido'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Prêmio */}
        <div className="mt-3 rounded-2xl p-3" style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${theme.primaryColor}22` }}>
          <h2 className="mb-2 flex items-center gap-1.5 text-xs font-bold" style={{ color: theme.primaryColor }}><Gift size={13} /> O prêmio</h2>
          <div className="flex gap-3">
            {values.prizeImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={values.prizeImageUrl} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" />
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <Gift size={20} style={{ color: theme.primaryColor, opacity: 0.5 }} />
              </div>
            )}
            <div className="min-w-0">
              <h3 className="truncate text-sm font-bold" style={{ color: textColor }}>{values.prizeName || 'Nome do prêmio'}</h3>
              {values.prizeDescription && <p className="mt-0.5 line-clamp-2 text-[11px]" style={{ color: subText }}>{values.prizeDescription}</p>}
            </div>
          </div>
        </div>

        {/* Vídeos */}
        {values.videos && values.videos.filter(v => v.url).length > 0 && (
          <div className="mt-3 rounded-2xl p-3" style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${theme.primaryColor}22` }}>
            <h2 className="mb-2 flex items-center gap-1.5 text-xs font-bold" style={{ color: theme.primaryColor }}><Video size={13} /> Vídeos do prêmio</h2>
            <div className="grid grid-cols-2 gap-2">
              {values.videos.filter(v => v.url).slice(0, 4).map((vid, i) => (
                <div key={i} className="overflow-hidden rounded-lg" style={{ border: `1px solid ${theme.primaryColor}22` }}>
                  <div className="flex items-center justify-center" style={{ aspectRatio: '16/9', background: 'rgba(0,0,0,0.4)' }}>
                    <Video size={16} style={{ color: theme.primaryColor, opacity: 0.6 }} />
                  </div>
                  {vid.caption && <div className="truncate px-1.5 py-1 text-[9px]" style={{ color: subText }}>{vid.caption}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Grid de números (amostra) */}
        <div className="mt-3 rounded-2xl p-3" style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${theme.primaryColor}22` }}>
          <h2 className="mb-2 flex items-center gap-1.5 text-xs font-bold" style={{ color: theme.primaryColor }}><Ticket size={13} /> Escolha seus números</h2>
          <div className="grid grid-cols-10 gap-1">
            {sampleCells.map(n => {
              const sold = soldSample.has(n)
              const reserved = reservedSample.has(n)
              const selected = selectedSample.has(n)
              let bg = 'rgba(255,255,255,0.06)'
              let color = subText
              let border = `1px solid ${theme.primaryColor}22`
              if (sold) { bg = 'rgba(255,255,255,0.03)'; color = 'rgba(255,255,255,0.25)'; border = '1px solid transparent' }
              else if (reserved) { bg = `${theme.secondaryColor}33`; color = theme.secondaryColor; border = `1px solid ${theme.secondaryColor}66` }
              else if (selected) { bg = theme.primaryColor; color = theme.light ? '#fff' : '#08130d'; border = `1px solid ${theme.primaryColor}` }
              return (
                <div key={n} className="flex aspect-square items-center justify-center text-[9px] font-bold" style={{ background: bg, color, border, borderRadius: radius, textDecoration: sold ? 'line-through' : 'none' }}>
                  {n}
                </div>
              )
            })}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[9px]" style={{ color: subText }}>
            <Legend swatch={theme.primaryColor} label="Selecionado" />
            <Legend swatch={`${theme.secondaryColor}aa`} label="Reservado" />
            <Legend swatch="rgba(255,255,255,0.06)" label="Disponível" />
          </div>
        </div>

        {/* Botão de compra (ilustrativo) */}
        <button
          type="button"
          disabled
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold"
          style={{ background: `linear-gradient(135deg, ${theme.secondaryColor}, ${theme.primaryColor})`, color: theme.light ? '#fff' : '#08130d' }}
        >
          <ShieldCheck size={13} /> Comprar 2 números • {formatBRL(values.pricePerNumber * 2)}
        </button>
      </div>
    </div>
  )
}

function MiniStat({ icon, label, value, theme, highlight }: { icon: React.ReactNode; label: string; value: string; theme: any; highlight?: boolean }) {
  return (
    <div className="rounded-lg p-1.5" style={{ background: highlight ? `${theme.primaryColor}1a` : 'rgba(255,255,255,0.05)', border: `1px solid ${theme.primaryColor}22` }}>
      <div className="flex items-center gap-1 text-[8px] uppercase tracking-wide" style={{ color: theme.light ? '#555' : 'rgba(255,255,255,0.55)' }}>
        <span style={{ color: theme.primaryColor }}>{icon}</span> {label}
      </div>
      <div className="mt-0.5 truncate text-[11px] font-extrabold" style={{ color: highlight ? theme.primaryColor : theme.light ? '#111' : '#fff' }}>{value}</div>
    </div>
  )
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="h-2.5 w-2.5 rounded" style={{ background: swatch }} /> {label}
    </span>
  )
}
