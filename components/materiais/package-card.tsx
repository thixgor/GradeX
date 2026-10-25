'use client'

import { memo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Check,
  ChevronRight,
  Clock,
  Crown,
  File,
  Info,
  Package,
  ShieldAlert,
  Star,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMaterialCart } from '@/context/MaterialCartContext'
import { PricingEventBadge } from '@/components/pricing-events/PricingEventBadge'
import { PLUS_LABEL } from '@/lib/account-tier'
import { TimedAccessPill } from './timed-access'
import {
  CartButton,
  CopyLinkBtn,
  formatBRL,
  GROUP_META,
  LockedGroupOverlay,
  resolveCardPrice,
  typeIcons,
  typeLabels,
  type MaterialPackage,
} from './shared'

function InlineSpinner() {
  return <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
}

/**
 * Pilha de capas para o pacote sem capa própria: as três primeiras capas do
 * que vem dentro, em leque — diz "várias coisas juntas" sem precisar de texto.
 */
function CoverStack({ materials }: { materials: MaterialPackage['materials'] }) {
  const withCover = materials.filter(m => m.coverImage).slice(0, 3)
  if (withCover.length === 0) {
    return (
      <div className="ios-capa-vazia flex h-full w-full items-center justify-center">
        <span className="ios-tinta flex h-16 w-16 items-center justify-center rounded-[18px] bg-white/70 shadow-sm dark:bg-white/10">
          <Package className="h-8 w-8" />
        </span>
      </div>
    )
  }
  const turns = withCover.length === 1 ? [0] : withCover.length === 2 ? [-6, 6] : [-9, 0, 9]
  return (
    <div className="ios-capa-vazia flex h-full w-full items-center justify-center">
      <div className="relative h-[62%] w-[46%]">
        {withCover.map((m, i) => (
          <span
            key={m._id}
            className="absolute inset-0 overflow-hidden rounded-[12px] shadow-[0_10px_24px_-10px_rgba(0,0,0,0.45)] ring-1 ring-black/5 transition-transform duration-500 ease-out [transform:var(--leque)] group-hover:[transform:var(--leque-aberto)]"
            style={{
              ['--leque' as string]: `rotate(${turns[i]}deg) translateX(${turns[i] * 2.2}%)`,
              ['--leque-aberto' as string]: `rotate(${turns[i] * 1.5}deg) translateX(${turns[i] * 4}%)`,
              zIndex: i === Math.floor(withCover.length / 2) ? 3 : 1,
            }}
          >
            <Image src={m.coverImage} alt="" fill className="object-cover" sizes="160px" />
          </span>
        ))}
      </div>
    </div>
  )
}

/**
 * Cartão de pacote. Mesma gramática do `MaterialCard` (capa encaixada, cápsula
 * de preço, compartilhar fora da âncora), com o que é próprio do pacote: o que
 * vem dentro em lista curta e quanto se economiza levando junto.
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
  const { isInCart } = useMaterialCart()
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
  const itemCount = pkg.materialIds?.length || 0
  const price = resolveCardPrice({ price: effectivePrice, state: pkg._pricingEventState, crossedPrice })
  const included = pkg.materials || []
  const inCart = isInCart('package', pkg._id)

  const cover = (
    <>
      {pkg.coverImage ? (
        <Image
          src={pkg.coverImage}
          alt={pkg.title}
          fill
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          sizes="(max-width: 768px) 92vw, (max-width: 1024px) 50vw, 33vw"
          priority={priority}
        />
      ) : (
        <CoverStack materials={included} />
      )}

      <span className="absolute left-2.5 top-2.5 z-[4] flex flex-wrap gap-1">
        <span className="ios-selo">
          <Package className="h-3 w-3" /> {itemCount} {itemCount === 1 ? 'material' : 'materiais'}
        </span>
        {pkg.isFeatured && (
          <span className="ios-selo ios-selo-claro">
            <Star className="h-3 w-3 fill-current" /> Destaque
          </span>
        )}
      </span>

      {(pkg.allowedGroups?.length > 0 || hasEvent) && (
        <span className="absolute right-2.5 top-2.5 z-[4] flex flex-col items-end gap-1">
          {pkg.allowedGroups?.length > 0 && (
            <span className="ios-selo">
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
        isHighlighted && 'rounded-[26px] ring-2 ring-[var(--ios-tinta)] ring-offset-2 ring-offset-[var(--ios-chao)]'
      )}
    >
      <article
        className={cn(
          'ios-cartao ios-toque relative flex h-full flex-col rounded-[26px] p-2',
          showLocked && 'select-none'
        )}
      >
        {showLocked && <LockedGroupOverlay allowedGroups={pkg.allowedGroups} onPreview={onPreview} />}

        <div className="relative">
          {showLocked ? (
            <div className="ios-capa block aspect-[16/9] rounded-[20px]">{cover}</div>
          ) : (
            <Link href={href} className="ios-capa block aspect-[16/9] rounded-[20px] focus-visible:outline-offset-[-3px]">
              {cover}
            </Link>
          )}

          {!showLocked && (
            <CopyLinkBtn
              id={pkg._id}
              copiedId={copiedId}
              onClick={e => { e.preventDefault(); e.stopPropagation(); onCopyLink() }}
              className="absolute bottom-2.5 right-2.5 z-[5] bg-white/85 text-[#101814] opacity-0 shadow-sm backdrop-blur-md transition-opacity hover:bg-white focus-visible:opacity-100 group-focus-within:opacity-100 group-hover:opacity-100 dark:bg-black/55 dark:text-white"
            />
          )}
        </div>

        <div className="flex flex-1 flex-col px-2 pb-1.5 pt-3.5 sm:px-2.5">
          {showLocked ? (
            <h3 className="line-clamp-2 text-[18px] font-bold leading-snug tracking-[-0.02em]">{pkg.title}</h3>
          ) : (
            <Link
              href={href}
              className="line-clamp-2 text-[18px] font-bold leading-snug tracking-[-0.02em] transition-colors hover:text-[var(--ios-tinta-texto)]"
            >
              {pkg.title}
            </Link>
          )}

          {pkg.description && (
            <p className="ios-rotulo-2 mt-1 line-clamp-2 text-[14px] leading-snug" title={pkg.description}>
              {pkg.description}
            </p>
          )}

          {included.length > 0 && (
            <ul className="mt-3 overflow-hidden rounded-[14px] bg-[var(--ios-preenchimento)]" aria-label="O que vem no pacote">
              {included.slice(0, 3).map(m => (
                <li key={m._id}>
                  <div className="ios-linha min-h-[40px] gap-2.5 px-3 py-2 [--ios-recuo:44px]">
                    <span className="ios-tinta flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px] bg-[var(--ios-cartao-solido)] [&_svg]:h-3.5 [&_svg]:w-3.5">
                      {typeIcons[m.type] || <File />}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{m.title}</span>
                    <span className="ios-rotulo-3 shrink-0 text-[11px] font-semibold">{typeLabels[m.type] || 'Arquivo'}</span>
                  </div>
                </li>
              ))}
              {included.length > 3 && (
                <li>
                  {showLocked ? (
                    <div className="ios-linha ios-rotulo-2 min-h-[36px] px-3 py-2 text-[12px] font-semibold [--ios-recuo:12px]">
                      e mais {included.length - 3} {included.length - 3 === 1 ? 'item' : 'itens'}
                    </div>
                  ) : (
                    <Link
                      href={href}
                      className="ios-linha ios-tinta min-h-[36px] justify-between px-3 py-2 text-[12px] font-semibold [--ios-recuo:12px]"
                    >
                      e mais {included.length - 3} {included.length - 3 === 1 ? 'item' : 'itens'}
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </li>
              )}
            </ul>
          )}

          <div className="mt-auto pt-4">
            {showLocked ? (
              <button type="button" onClick={onPreview} className="ios-botao-cinza w-full">
                <Info className="h-4 w-4" /> Ver como liberar
              </button>
            ) : canAccess ? (
              <div className="flex items-center justify-between gap-3">
                {pkg._timedAccess?.isTimed ? (
                  <TimedAccessPill access={pkg._timedAccess} />
                ) : (
                  <span className="ios-tinta inline-flex items-center gap-1.5 text-[14px] font-semibold">
                    <Check className="h-4 w-4" strokeWidth={2.75} /> Adquirido
                  </span>
                )}
                <Link href={href} className="ios-botao-suave ios-botao-p">
                  Abrir <ChevronRight className="-mr-1 h-4 w-4" />
                </Link>
              </div>
            ) : includedInPlus ? (
              <div className="flex items-center justify-between gap-3">
                <span className="ios-ambar inline-flex items-center gap-1.5 text-[14px] font-semibold">
                  <Crown className="h-4 w-4" /> Incluído no {PLUS_LABEL}
                </span>
                <button type="button" onClick={onClaimWithPlus} disabled={loading} className="ios-botao-ambar ios-botao-p">
                  {loading ? <InlineSpinner /> : null}
                  Resgatar
                </button>
              </div>
            ) : showFreeAcquire ? (
              <div className="flex items-center justify-between gap-3">
                <span className="flex flex-col">
                  {crossedPrice ? <span className="ios-rotulo-3 text-[12px] tabular-nums line-through">{formatBRL(crossedPrice)}</span> : null}
                  <span className="ios-tinta text-[17px] font-bold">Grátis</span>
                </span>
                <button
                  type="button"
                  onClick={onAddToCart}
                  disabled={loading}
                  aria-label={`Obter o pacote ${pkg.title} grátis`}
                  className="ios-botao-suave ios-botao-p px-5"
                >
                  {loading ? <InlineSpinner /> : null}
                  Obter
                </button>
              </div>
            ) : (
              <div className="flex items-end justify-between gap-3">
                <span className="flex min-w-0 flex-col">
                  {price.strike ? (
                    <span className="flex items-baseline gap-1.5 text-[12px]">
                      <span className="ios-rotulo-3 tabular-nums line-through">{formatBRL(price.strike)}</span>
                      {price.savingsPct > 0 && <span className="ios-tinta font-semibold">−{price.savingsPct}%</span>}
                    </span>
                  ) : cheapestTimedVersion ? (
                    <span className="ios-rotulo-2 flex items-center gap-1 text-[12px] font-medium">
                      <Clock className="h-3 w-3" /> ou {formatBRL(cheapestTimedVersion.price)} / {cheapestTimedVersion.durationLabel}
                    </span>
                  ) : null}
                  <span className="text-[20px] font-bold leading-tight tracking-[-0.02em] tabular-nums">
                    {formatBRL(price.finalPrice)}
                  </span>
                </span>
                <span className="flex shrink-0 gap-1.5">
                  <CartButton inCart={inCart} onAdd={onAddToCart} disabled={loading} itemTitle={`pacote ${pkg.title}`} className="h-11 text-[15px]" />
                  <button type="button" onClick={onBuyNow} disabled={loading} className="ios-botao px-5">
                    {loading ? <InlineSpinner /> : null}
                    Comprar
                  </button>
                </span>
              </div>
            )}
          </div>
        </div>
      </article>
    </div>
  )
})
