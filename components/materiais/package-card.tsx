'use client'

import { memo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Check,
  Clock,
  Crown,
  File,
  Gift,
  Info,
  Package,
  ShieldAlert,
  ShoppingCart,
  Star,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { PricingEventBadge } from '@/components/pricing-events/PricingEventBadge'
import { PLUS_LABEL } from '@/lib/account-tier'
import { TimedAccessPill } from './timed-access'
import {
  CardPrice,
  CopyLinkBtn,
  formatBRL,
  GROUP_META,
  LockedGroupOverlay,
  typeIcons,
  typeLabels,
  type MaterialPackage,
} from './shared'

/**
 * Cartão de pacote. Mesmas correções do `MaterialCard` (preço no corpo, CTA
 * primário único, botão de compartilhar fora da âncora, sem "Ver mais" que
 * empurra a linha da grade), mantendo o cálculo de desconto próprio do pacote.
 */
export const PackageCard = memo(function PackageCard({
  pkg,
  isPurchased,
  groupAccess,
  isHighlighted = false,
  copiedId,
  onAddToCart,
  onBuyNow,
  onClaimWithPlus,
  onCopyLink,
  onPreview,
  loading,
  priority = false,
}: {
  pkg: MaterialPackage
  isPurchased: boolean
  groupAccess: boolean
  isHighlighted?: boolean
  copiedId: string | null
  onAddToCart: () => void
  onBuyNow: () => void
  /** Resgate sem custo pela assinatura Plus+ (pacote com `_includedInPlus`). */
  onClaimWithPlus: () => void
  onCopyLink: () => void
  onPreview: () => void
  loading: boolean
  priority?: boolean
}) {
  const isFree = pkg.pricing === 'free'
  const effectivePrice = Number(pkg._pricing?.effectivePrice ?? pkg.price ?? 0)
  const packagePrice = Number(pkg.price || 0)
  const staticOriginalPrice = Number(pkg.originalPrice || 0)
  const userDiscountApplied = Number(pkg._pricing?.discountApplied || 0) > 0
  const crossedPrice = userDiscountApplied
    ? packagePrice
    : staticOriginalPrice > packagePrice
      ? staticOriginalPrice
      : null
  // Versão por tempo mais barata do pacote, para o "ou R$X por 30 dias".
  const cheapestTimedVersion = (pkg._timedAccessVersions || [])
    .slice()
    .sort((a, b) => a.price - b.price)[0] || null
  const canAccess = typeof pkg._hasAccess === 'boolean'
    ? pkg._hasAccess
    : isPurchased || (groupAccess && isFree)
  const showFreeAcquire = isFree || effectivePrice <= 0
  // Assinante Plus+ leva sem custo, mas precisa resgatar.
  const includedInPlus = pkg._includedInPlus === true
  const showLocked =
    !includedInPlus && !groupAccess && !isPurchased && (pkg.allowedGroups?.length ?? 0) > 0
  const hasEvent = !isFree && !!pkg._pricingEventState?.activeTier && pkg._pricingEventState.isActive
  const href = `/pacotes/${pkg._id}`

  const cover = (
    <>
      {pkg.coverImage ? (
        <Image
          src={pkg.coverImage}
          alt={pkg.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          priority={priority}
        />
      ) : (
        <div className="cover-plate flex h-full w-full items-center justify-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-lg border border-border bg-card/80 text-primary shadow-sm">
            <Package className="h-8 w-8" />
          </span>
        </div>
      )}
      {pkg.coverImage && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />
      )}

      <span className="cover-chip absolute left-3 top-3 inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold text-white">
        <Package className="h-3 w-3" /> {pkg.materialIds?.length || 0} materiais
      </span>

      {(pkg.allowedGroups?.length > 0 || hasEvent || pkg.isFeatured) && (
        <span className="absolute right-3 top-3 flex flex-col items-end gap-1">
          {pkg.isFeatured && (
            <span className="inline-flex items-center gap-1 rounded-md bg-accent px-2 py-1 text-[10px] font-bold text-accent-foreground">
              <Star className="h-3 w-3" /> DESTAQUE
            </span>
          )}
          {pkg.allowedGroups?.length > 0 && (
            <span className="cover-chip inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold text-violet-200">
              <ShieldAlert className="h-3 w-3" />
              {pkg.allowedGroups.map(g => GROUP_META[g]?.label).filter(Boolean).join(' / ')}
            </span>
          )}
          {hasEvent && <PricingEventBadge state={pkg._pricingEventState} size="xs" />}
        </span>
      )}
    </>
  )

  return (
    <div
      className={cn(
        'deck-card-rise group relative h-full',
        isHighlighted && 'rounded-lg ring-2 ring-primary ring-offset-2 ring-offset-background'
      )}
    >
      {showLocked && <LockedGroupOverlay allowedGroups={pkg.allowedGroups} onPreview={onPreview} />}

      <div
        className={cn(
          'surface-lift flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card hover:border-primary/35',
          showLocked && 'select-none'
        )}
      >
        <div className="relative">
          {showLocked ? (
            <div className="relative block aspect-[16/10] overflow-hidden">{cover}</div>
          ) : (
            <Link
              href={href}
              className="relative block aspect-[16/10] overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
            >
              {cover}
            </Link>
          )}

          {!showLocked && (
            <CopyLinkBtn
              id={pkg._id}
              copiedId={copiedId}
              onClick={e => { e.preventDefault(); e.stopPropagation(); onCopyLink() }}
              className="absolute bottom-3 right-3 opacity-0 transition-opacity focus-visible:opacity-100 group-focus-within:opacity-100 group-hover:opacity-100"
            />
          )}
        </div>

        <div className="flex flex-1 flex-col p-4 sm:p-5">
          {showLocked ? (
            <h3 className="mb-1 line-clamp-2 font-heading text-base font-bold leading-snug tracking-[-0.015em] text-foreground">{pkg.title}</h3>
          ) : (
            <Link
              href={href}
              className="mb-1 line-clamp-2 font-heading text-base font-bold leading-snug tracking-[-0.015em] text-foreground transition-colors hover:text-primary hover:underline"
            >
              {pkg.title}
            </Link>
          )}

          {pkg.description && (
            <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground" title={pkg.description}>
              {pkg.description}
            </p>
          )}

          {pkg.materials && pkg.materials.length > 0 && (
            <div className="mb-4">
              <p className="mb-2 text-xs font-medium text-muted-foreground">Inclui:</p>
              <ul className="space-y-1.5">
                {pkg.materials.slice(0, 4).map(m => (
                  <li key={m._id} className="flex items-center gap-2 rounded-md bg-muted/50 p-1.5 text-xs">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-primary/10 text-primary">
                      {typeIcons[m.type] || <File className="h-3 w-3" />}
                    </span>
                    <span className="flex-1 truncate">{m.title}</span>
                    <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                      {typeLabels[m.type] || 'Arquivo'}
                    </span>
                  </li>
                ))}
              </ul>
              {pkg.materials.length > 4 && (
                <p className="pl-1 pt-1.5 text-xs text-muted-foreground">+{pkg.materials.length - 4} mais</p>
              )}
            </div>
          )}

          {pkg.tags?.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-1">
              {pkg.tags.slice(0, 4).map(tag => (
                <span key={tag} className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="mt-auto space-y-2">
            {showLocked ? (
              <button
                type="button"
                onClick={onPreview}
                className="mx-auto flex items-center gap-1 py-2 text-sm font-medium text-primary hover:underline"
              >
                <Info className="h-3.5 w-3.5" /> Ver detalhes e fazer upgrade
              </button>
            ) : canAccess ? (
              pkg._timedAccess?.isTimed ? (
                <TimedAccessPill access={pkg._timedAccess} className="px-3 py-2 text-sm" />
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                  <Check className="h-4 w-4" /> Adquirido
                </span>
              )
            ) : includedInPlus ? (
              <>
                <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm font-semibold text-amber-700 dark:text-amber-300">
                  <Crown className="h-4 w-4" /> Incluído no {PLUS_LABEL}
                </span>
                <Button onClick={onClaimWithPlus} disabled={loading} size="sm" className="cta-raised h-11 w-full font-semibold">
                  {loading
                    ? <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-transparent border-t-current" />
                    : <Gift className="mr-2 h-4 w-4 shrink-0" />}
                  Resgatar pacote
                </Button>
              </>
            ) : showFreeAcquire ? (
              <>
                <CardPrice price={effectivePrice} isFree crossedPrice={crossedPrice} />
                <Button onClick={onAddToCart} disabled={loading} size="sm" className="cta-raised h-11 w-full font-semibold">
                  {loading
                    ? <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-transparent border-t-current" />
                    : <Gift className="mr-2 h-4 w-4 shrink-0" />}
                  Adquirir grátis
                </Button>
              </>
            ) : (
              <>
                <CardPrice
                  price={effectivePrice}
                  isFree={false}
                  state={pkg._pricingEventState}
                  crossedPrice={crossedPrice}
                />
                {cheapestTimedVersion && (
                  <p className="flex items-center gap-1 text-[11px] font-medium text-sky-600 dark:text-sky-400">
                    <Clock className="h-3 w-3" />
                    ou {formatBRL(cheapestTimedVersion.price)} por {cheapestTimedVersion.durationLabel}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button onClick={onBuyNow} disabled={loading} size="sm" className="cta-raised h-11 flex-1 font-semibold">
                    {loading
                      ? <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-transparent border-t-current" />
                      : null}
                    Comprar pacote
                  </Button>
                  <Button
                    onClick={onAddToCart}
                    disabled={loading}
                    size="sm"
                    variant="outline"
                    aria-label={`Adicionar pacote ${pkg.title} ao carrinho`}
                    title="Adicionar ao carrinho"
                    className="h-11 w-11 shrink-0 p-0"
                  >
                    <ShoppingCart className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})
