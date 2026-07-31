'use client'

import { useCallback, useState } from 'react'
import {
  Clock,
  Crown,
  File,
  FileText,
  Gift,
  GraduationCap,
  Image as ImageIcon,
  Info,
  Link2,
  Lock,
  Play,
  Share2,
  CheckCheck,
  Sparkles,
  Video,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PricingEventStatePayload } from '@/components/pricing-events/PricingEventCountdown'
import type { PublicMetricSettings } from '@/lib/display-settings'

/**
 * Tipos, formatadores e peças visuais compartilhadas entre os cartões de
 * /materiais. Antes viviam duplicados dentro de `app/materiais/page.tsx` —
 * `MaterialCard`, `FeaturedCard` e `PackageCard` repetiam a mesma lógica de
 * acesso, preço e bloqueio por grupo.
 */

export interface Material {
  _id: string
  title: string
  description: string
  coverImage: string
  type: string
  downloadUrl: string
  folderId: string | null
  moduloId: string
  tags: string[]
  allowedGroups: string[]
  videoDuration?: number
  pricing: 'free' | 'paid'
  price: number
  downloadCount: number
  viewCount: number
  isHidden: boolean
  isFeatured: boolean
  order: number
  createdAt: string
  // Flags de acesso calculadas no servidor (definitivas).
  _isPurchased?: boolean
  _hasGroupAccess?: boolean
  _hasAccess?: boolean
  _cardCount?: number
  _hasPdf?: boolean
  _pageCount?: number
  pdfViewerEnabled?: boolean
  pdfDownloadEnabled?: boolean
  pricingEventId?: string | null
  _pricingEventState?: PricingEventStatePayload | null
}

export interface Folder {
  _id: string
  name: string
  description: string
  coverImage: string
  color: string
  icon: string
  parentFolderId: string | null
  order: number
}

export interface MaterialPackage {
  _id: string
  title: string
  description: string
  coverImage: string
  materialIds: string[]
  materials: { _id: string; title: string; coverImage: string; type: string }[]
  tags: string[]
  allowedGroups: string[]
  pricing: 'free' | 'paid'
  price: number
  originalPrice: number
  downloadCount: number
  viewCount: number
  isFeatured: boolean
  createdAt: string
  _isPurchased?: boolean
  _hasGroupAccess?: boolean
  _hasAccess?: boolean
  _pricing?: {
    originalPackagePrice: number
    effectivePrice: number
    discountApplied: number
    ownedValue: number
    totalPaidIndividualValue: number
    ownedMaterialIds: string[]
  }
  pricingEventId?: string | null
  _pricingEventState?: PricingEventStatePayload | null
}

export type MaterialMetricSettings = PublicMetricSettings['materials']

/** Cargos que podem restringir o acesso a um material ou pacote. */
export const GROUP_META: Record<string, { label: string; color: string; icon: React.ReactNode; upgradeMsg: string }> = {
  gratuito: { label: 'Gratuito', color: '#6b7280', icon: <Gift className="h-3.5 w-3.5" />, upgradeMsg: 'Disponível na conta Gratuita' },
  trial:    { label: 'Trial',    color: '#3b82f6', icon: <Clock className="h-3.5 w-3.5" />, upgradeMsg: 'Disponível no período Trial' },
  plus:     { label: 'Plus+',    color: '#f59e0b', icon: <Crown className="h-3.5 w-3.5" />, upgradeMsg: 'Disponível no Plus+' },
  // Legado — materiais marcados antes da consolidação dos cargos.
  essential:{ label: 'Plus+',    color: '#f59e0b', icon: <Crown className="h-3.5 w-3.5" />, upgradeMsg: 'Disponível no Plus+' },
  premium:  { label: 'Plus+',    color: '#f59e0b', icon: <Crown className="h-3.5 w-3.5" />, upgradeMsg: 'Disponível no Plus+' },
  monitor:  { label: 'Monitor',  color: '#10b981', icon: <GraduationCap className="h-3.5 w-3.5" />, upgradeMsg: 'Disponível para Monitores' },
}

export const typeIcons: Record<string, React.ReactNode> = {
  pdf: <FileText className="h-5 w-5" />,
  video: <Video className="h-5 w-5" />,
  video_embed: <Play className="h-5 w-5" />,
  link: <Link2 className="h-5 w-5" />,
  image: <ImageIcon className="h-5 w-5" />,
  document: <File className="h-5 w-5" />,
  other: <File className="h-5 w-5" />,
  flashcard_deck: <Sparkles className="h-5 w-5" />,
}

export const typeLabels: Record<string, string> = {
  pdf: 'PDF',
  video: 'Vídeo',
  video_embed: 'Vídeo',
  link: 'Link',
  image: 'Imagem',
  document: 'Documento',
  other: 'Outro',
  flashcard_deck: 'Flashcard',
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m > 0 ? `${m}min` : ''}`.trim()
  if (m > 0) return `${m}min${s > 0 ? ` ${s}s` : ''}`
  return `${s}s`
}

/** pt-BR usa vírgula decimal — `toFixed(2)` cru mostrava "R$ 29.90". */
export function formatBRL(value: number): string {
  return `R$ ${Number(value || 0).toFixed(2).replace('.', ',')}`
}

/** Preço final considerando o lote (evento de preço) ativo, se houver. */
export function effectivePriceWithEvent(price: number, state?: PricingEventStatePayload | null): number {
  const pct = state?.activeTier?.discountPercent || 0
  if (!state?.activeTier || state.isActive === false || pct <= 0) return Number(price || 0)
  return Math.max(0, Math.round(Number(price || 0) * (1 - pct / 100) * 100) / 100)
}

export function useCopyLink() {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const copy = useCallback((id: string, url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }, [])

  return { copiedId, copy }
}

/**
 * Botão de compartilhar. Fica sobreposto ao card, **fora** da âncora de
 * navegação — `<button>` dentro de `<a>` é HTML inválido e quebrava a
 * navegação por teclado.
 */
export function CopyLinkBtn({
  id,
  copiedId,
  onClick,
  className,
}: {
  id: string
  copiedId: string | null
  onClick: (e: React.MouseEvent) => void
  className?: string
}) {
  const copied = copiedId === id
  return (
    <button
      type="button"
      onClick={onClick}
      title={copied ? 'Link copiado!' : 'Copiar link'}
      aria-label={copied ? 'Link copiado' : 'Copiar link para compartilhar'}
      className={cn(
        'press-scale inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-semibold transition-colors',
        copied
          ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
          : 'border-border bg-card/95 text-muted-foreground hover:border-primary/40 hover:text-primary',
        className
      )}
      style={{ touchAction: 'manipulation' }}
    >
      {copied ? <CheckCheck className="h-3 w-3" /> : <Share2 className="h-3 w-3" />}
      {copied ? 'Copiado!' : 'Compartilhar'}
    </button>
  )
}

/**
 * Sobreposição de conteúdo restrito por cargo. É o **único** alvo focável do
 * card enquanto o bloqueio está ativo — antes o corpo recebia
 * `pointer-events-none` mas os links internos continuavam na ordem de
 * tabulação, deixando o teclado focar algo invisível e inoperante.
 */
export function LockedGroupOverlay({
  allowedGroups,
  onPreview,
}: {
  allowedGroups: string[]
  onPreview?: () => void
}) {
  const labels = allowedGroups.map(g => GROUP_META[g]?.label).filter(Boolean).join(', ')

  return (
    <button
      type="button"
      onClick={onPreview}
      aria-label={`Conteúdo restrito${labels ? ` a ${labels}` : ''}. Ver detalhes.`}
      className="group/locked absolute inset-0 z-10 flex w-full flex-col items-center justify-center rounded-xl bg-background/70 p-4 text-center backdrop-blur-md"
    >
      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 transition-transform group-hover/locked:scale-110">
        <Lock className="h-6 w-6 text-primary" />
      </span>
      <span className="font-heading text-sm font-bold tracking-[-0.01em] text-foreground">Acesso restrito</span>
      <span className="mb-3 mt-0.5 text-xs text-muted-foreground">Este conteúdo é exclusivo para:</span>
      <span className="mb-3 flex flex-wrap justify-center gap-1.5">
        {allowedGroups.map(g => {
          const meta = GROUP_META[g]
          if (!meta) return null
          return (
            <span
              key={g}
              className="flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold"
              style={{ color: meta.color, background: `${meta.color}18`, borderColor: `${meta.color}40` }}
            >
              {meta.icon} {meta.label}
            </span>
          )
        })}
      </span>
      {onPreview && (
        <span className="mt-1 flex items-center gap-1 text-[11px] font-medium text-primary underline-offset-2 group-hover/locked:underline">
          <Info className="h-3 w-3" /> Ver detalhes
        </span>
      )}
    </button>
  )
}

/**
 * Bloco de preço no corpo do card. Antes ficava sobre a capa com
 * `text-amber-100` sobre `bg-accent/30` — ilegível em capas claras, e o
 * `backdrop-blur` é degradado no mobile pelo globals.css.
 */
export function CardPrice({
  price,
  isFree,
  state,
  crossedPrice,
  className,
}: {
  price: number
  isFree: boolean
  state?: PricingEventStatePayload | null
  /** Preço "de" riscado (pacotes com desconto estático ou por itens já possuídos). */
  crossedPrice?: number | null
  className?: string
}) {
  if (isFree) {
    return (
      <span className={cn('inline-flex items-center gap-1 text-sm font-bold text-emerald-600 dark:text-emerald-400', className)}>
        <Gift className="h-3.5 w-3.5" /> Grátis
      </span>
    )
  }

  const pct = state?.activeTier?.discountPercent || 0
  const hasEvent = !!state?.activeTier && state.isActive !== false && pct > 0
  const finalPrice = hasEvent ? effectivePriceWithEvent(price, state) : Number(price || 0)
  const strike = hasEvent ? Number(price || 0) : (crossedPrice && crossedPrice > finalPrice ? crossedPrice : null)

  return (
    <span className={cn('inline-flex items-baseline gap-1.5', className)}>
      {strike ? (
        <span className="text-xs text-muted-foreground line-through tabular-nums">{formatBRL(strike)}</span>
      ) : null}
      <span
        className={cn(
          'font-heading text-base font-bold tabular-nums',
          hasEvent ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'
        )}
      >
        {formatBRL(finalPrice)}
      </span>
    </span>
  )
}

/** Estado vazio acionável — espelha o `EmptyCallout` de `/flashcards`. */
export function EmptyCallout({
  icon,
  title,
  hint,
  cta,
}: {
  icon?: React.ReactNode
  title: string
  hint: string
  cta?: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-10 text-center sm:p-12">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
        {icon || <Sparkles className="h-6 w-6" />}
      </div>
      <h3 className="font-heading text-base font-semibold tracking-[-0.01em] text-foreground">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-muted-foreground">{hint}</p>
      {cta && <div className="mt-4 flex flex-wrap justify-center gap-2">{cta}</div>}
    </div>
  )
}

/**
 * Esqueleto da grade. Espelha exatamente as colunas, o `aspect` e o `gap` da
 * grade real — skeleton que não bate com o layout final anula o ganho de
 * performance percebida e ainda produz salto (CLS).
 */
export function MaterialGridSkeleton({
  count = 8,
  columns = 'materials',
}: {
  count?: number
  columns?: 'materials' | 'packages'
}) {
  const grid =
    columns === 'packages'
      ? 'grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3'
      : 'grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4'

  return (
    <div className={grid} aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="surface-lift overflow-hidden rounded-xl border border-border bg-card">
          <div className="aspect-[16/10] skeleton-pulse" />
          <div className="space-y-2 p-3 sm:p-4">
            <div className="h-4 w-4/5 rounded skeleton-pulse" />
            <div className="h-3 w-3/5 rounded skeleton-pulse" />
            <div className="mt-3 h-9 w-full rounded-md skeleton-pulse" />
          </div>
        </div>
      ))}
    </div>
  )
}
