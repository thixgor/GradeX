'use client'

import { useCallback, useState } from 'react'
import {
  Check,
  ChevronRight,
  Clock,
  Crown,
  File,
  FileText,
  Gift,
  GraduationCap,
  Image as ImageIcon,
  Link2,
  Lock,
  Play,
  Plus,
  ShoppingBag,
  Share,
  Sparkles,
  Video,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { abrirCarrinho } from '@/lib/abrir-carrinho'
import type { PricingEventStatePayload } from '@/components/pricing-events/PricingEventCountdown'
import type { PublicMetricSettings } from '@/lib/display-settings'
import type { TimedAccessVersionView, TimedAccessView } from './timed-access'

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
  /** Assinante Plus+ leva sem custo, mas ainda precisa resgatar. */
  _includedInPlus?: boolean
  _cardCount?: number
  _hasPdf?: boolean
  _pageCount?: number
  pdfViewerEnabled?: boolean
  pdfDownloadEnabled?: boolean
  pricingEventId?: string | null
  _pricingEventState?: PricingEventStatePayload | null
  /** Versões de acesso por tempo publicadas (opcionais). */
  _timedAccessVersions?: TimedAccessVersionView[]
  /** Prazo restante quando a posse atual veio de uma versão por tempo. */
  _timedAccess?: TimedAccessView | null
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
  /** Assinante Plus+ leva sem custo, mas ainda precisa resgatar. */
  _includedInPlus?: boolean
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
  /** Versões de acesso por tempo publicadas (opcionais). */
  _timedAccessVersions?: TimedAccessVersionView[]
  /** Prazo restante quando a posse atual veio de uma versão por tempo. */
  _timedAccess?: TimedAccessView | null
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
 * Botão de compartilhar: o círculo com o ícone de compartilhar do sistema.
 * Fica sobreposto ao card, **fora** da âncora de navegação — `<button>` dentro
 * de `<a>` é HTML inválido e quebrava a navegação por teclado.
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
      className={cn('ios-icone-botao', className)}
      style={{ touchAction: 'manipulation' }}
    >
      {copied ? <Check className="h-4 w-4" strokeWidth={2.5} /> : <Share className="h-4 w-4" />}
    </button>
  )
}

/**
 * Sacola com o "+" — o ícone de "pôr no carrinho", distinto do carrinho do
 * cabeçalho (que é "ver o carrinho").
 */
export function BagPlusIcon({ className }: { className?: string }) {
  return (
    <span className={cn('relative mr-1 inline-flex', className)} aria-hidden>
      <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={2.1} />
      <span className="absolute -bottom-1 -right-1.5 flex h-[13px] w-[13px] items-center justify-center rounded-full bg-[var(--ios-tinta)] text-white ring-[1.5px] ring-[var(--ios-cartao-solido)]">
        <Plus className="h-2.5 w-2.5" strokeWidth={3.5} />
      </span>
    </span>
  )
}

/**
 * Botão de carrinho dos cartões. Ao adicionar, vira "No carrinho" na hora —
 * a pessoa vê que o item ficou guardado e que dá para seguir enchendo — e,
 * já no carrinho, abre a gaveta para fechar a compra de tudo junto.
 */
export function CartButton({
  inCart,
  onAdd,
  disabled,
  itemTitle,
  className,
  tabIndex,
}: {
  tabIndex?: number
  inCart: boolean
  onAdd: () => void
  disabled?: boolean
  itemTitle: string
  className?: string
}) {
  if (inCart) {
    return (
      <button
        type="button"
        onClick={abrirCarrinho}
        tabIndex={tabIndex}
        aria-label={`${itemTitle} já está no carrinho. Abrir carrinho`}
        title="Abrir carrinho"
        className={cn('ios-botao-suave ios-botao-p min-w-[44px] !px-3', className)}
      >
        <Check className="ios-pop h-4 w-4" strokeWidth={3} />
        <span className="hidden sm:inline">No carrinho</span>
      </button>
    )
  }
  return (
    <button
      type="button"
      onClick={onAdd}
      disabled={disabled}
      tabIndex={tabIndex}
      aria-label={`Adicionar ${itemTitle} ao carrinho`}
      title="Adicionar ao carrinho"
      className={cn('ios-botao-suave ios-botao-p min-w-[44px] !px-3', className)}
    >
      <BagPlusIcon />
      <span className="hidden sm:inline">Carrinho</span>
    </button>
  )
}

/**
 * Sobreposição de conteúdo restrito por cargo. É o **único** alvo focável do
 * card enquanto o bloqueio está ativo — antes o corpo recebia
 * `pointer-events-none` mas os links internos continuavam na ordem de
 * tabulação, deixando o teclado focar algo invisível e inoperante.
 *
 * É o único vidro com desfoque dentro da grade: são poucos cartões, e o
 * desfoque é o que diz "isto está atrás de uma porta".
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
      className="group/locked absolute inset-0 z-10 flex w-full flex-col items-center justify-center rounded-[inherit] bg-[var(--ios-cartao)] p-4 text-center backdrop-blur-xl"
    >
      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--ios-preenchimento)] transition-transform duration-300 group-hover/locked:scale-110">
        <Lock className="h-5 w-5" strokeWidth={2.25} />
      </span>
      <span className="text-[15px] font-semibold tracking-[-0.01em]">Acesso restrito</span>
      <span className="ios-rotulo-2 mb-3 mt-0.5 text-[13px]">Exclusivo para</span>
      <span className="mb-3 flex flex-wrap justify-center gap-1.5">
        {allowedGroups.map(g => {
          const meta = GROUP_META[g]
          if (!meta) return null
          return (
            <span
              key={g}
              className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
              style={{ color: meta.color, background: `${meta.color}1f` }}
            >
              {meta.icon} {meta.label}
            </span>
          )
        })}
      </span>
      {onPreview && (
        <span className="ios-tinta flex items-center gap-0.5 text-[13px] font-semibold">
          Ver detalhes <ChevronRight className="h-3.5 w-3.5" />
        </span>
      )}
    </button>
  )
}

/** Preço final e o "de" riscado, do jeito que os cartões e o detalhe mostram. */
export function resolveCardPrice({
  price,
  state,
  crossedPrice,
}: {
  price: number
  state?: PricingEventStatePayload | null
  crossedPrice?: number | null
}) {
  const pct = state?.activeTier?.discountPercent || 0
  const hasEvent = !!state?.activeTier && state.isActive !== false && pct > 0
  const finalPrice = hasEvent ? effectivePriceWithEvent(price, state) : Number(price || 0)
  const strike = hasEvent ? Number(price || 0) : (crossedPrice && crossedPrice > finalPrice ? crossedPrice : null)
  const savingsPct = strike && strike > 0 ? Math.round((1 - finalPrice / strike) * 100) : 0
  return { finalPrice, strike, savingsPct, hasEvent }
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

  const { finalPrice, strike, hasEvent } = resolveCardPrice({ price, state, crossedPrice })

  return (
    <span className={cn('inline-flex items-baseline gap-1.5', className)}>
      {strike ? (
        <span className="text-xs text-muted-foreground line-through tabular-nums">{formatBRL(strike)}</span>
      ) : null}
      <span
        className={cn(
          'text-base font-bold tabular-nums',
          hasEvent ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'
        )}
      >
        {formatBRL(finalPrice)}
      </span>
    </span>
  )
}

/** Estado vazio acionável: o ícone num círculo, o título, a saída. */
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
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-14 text-center sm:py-20">
      <div className="ios-tinta mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--ios-tinta-suave)] [&_svg]:h-7 [&_svg]:w-7">
        {icon || <Sparkles />}
      </div>
      <h3 className="text-[20px] font-bold tracking-[-0.02em]">{title}</h3>
      <p className="ios-rotulo-2 mt-1.5 text-[15px] leading-relaxed">{hint}</p>
      {cta && <div className="mt-5 flex flex-wrap justify-center gap-2">{cta}</div>}
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
  const packages = columns === 'packages'
  const grid = packages
    ? 'grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'
    : 'grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4'

  return (
    <div className={grid} aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={cn('ios-cartao p-2', packages ? 'rounded-[26px]' : 'rounded-[24px]')}>
          <div className={cn('ios-esqueleto', packages ? 'aspect-[16/9] rounded-[20px]' : 'aspect-[16/10] rounded-[18px]')} />
          <div className="space-y-2 px-2 pb-1.5 pt-3">
            <div className="ios-esqueleto h-4 w-4/5 rounded-full" />
            <div className="ios-esqueleto h-3 w-3/5 rounded-full" />
            <div className="ios-esqueleto mt-4 h-[34px] w-full rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}
