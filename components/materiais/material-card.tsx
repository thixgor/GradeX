'use client'

import { memo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  BookOpen,
  Check,
  Clock,
  Crown,
  Download,
  Eye,
  File,
  FileText,
  Info,
  Play,
  ShieldAlert,
  Sparkles,
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
  formatDuration,
  resolveCardPrice,
  typeIcons,
  typeLabels,
  type Material,
  type MaterialMetricSettings,
} from './shared'

export interface MaterialCardProps {
  material: Material
  isPurchased: boolean
  groupAccess: boolean
  isHighlighted?: boolean
  copiedId: string | null
  onAddToCart: () => void
  onBuyNow: () => void
  /** Resgate sem custo pela assinatura Plus+ (item com `_includedInPlus`). */
  onClaimWithPlus: () => void
  onDownload: () => void
  onViewPdf: () => void
  onCopyLink: () => void
  onPreview: () => void
  loading: boolean
  metricSettings: MaterialMetricSettings
  /** `featured` ganha o selo de destaque e o título maior. */
  variant?: 'grid' | 'featured'
  /** Prioriza o carregamento da capa — só nos primeiros cards (LCP). */
  priority?: boolean
}

/** Spinner que herda a cor do botão em que está. */
function InlineSpinner() {
  return <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
}

/**
 * Cartão de material, no desenho de um cartão da App Store: a capa encaixada
 * com canto próprio dentro do cartão, o título logo abaixo e, no pé, a cápsula
 * que é ao mesmo tempo o preço e a compra ("R$ 29,90", "Obter", "Ler").
 *
 * O que ficou da versão anterior, de propósito:
 * - o preço fica no corpo, nunca sobre a capa (contraste ruim em capa clara);
 * - um CTA primário só; o carrinho é o botão-ícone ao lado;
 * - a descrição não expande no lugar (empurrava a linha inteira da grade);
 * - os botões de compartilhar e "assistir" são irmãos da âncora, nunca filhos.
 */
export const MaterialCard = memo(function MaterialCard({
  material,
  isPurchased,
  groupAccess,
  isHighlighted = false,
  copiedId,
  onAddToCart,
  onBuyNow,
  onClaimWithPlus,
  onDownload,
  onViewPdf,
  onCopyLink,
  onPreview,
  loading,
  metricSettings,
  variant = 'grid',
  priority = false,
}: MaterialCardProps) {
  const { isInCart } = useMaterialCart()
  const isFree = material.pricing === 'free'
  // isPurchased inclui concessões manuais do admin → sempre libera acesso.
  const canAccess = typeof material._hasAccess === 'boolean'
    ? material._hasAccess
    : isPurchased || (groupAccess && isFree)
  const isEmbed = material.type === 'video_embed'
  const canViewPdf = !!material._hasPdf && material.pdfViewerEnabled === true
  const pdfDownloadBlocked = !!material._hasPdf && material.pdfDownloadEnabled === false
  // Assinante Plus+ leva sem custo, mas precisa resgatar — o botão troca de
  // "Comprar" para "Resgatar" e o bloqueio por cargo não se aplica.
  const includedInPlus = material._includedInPlus === true
  const showLocked =
    !includedInPlus && !groupAccess && !isPurchased && (material.allowedGroups?.length ?? 0) > 0
  const featured = variant === 'featured'
  const href = `/materiais/${material._id}`
  const hasEvent = !isFree && !!material._pricingEventState?.activeTier && material._pricingEventState.isActive
  const timedAccess = material._timedAccess?.isTimed ? material._timedAccess : null
  // Versão por tempo mais barata — vira o "ou R$X por 30 dias" abaixo do preço.
  const cheapestTimedVersion = (material._timedAccessVersions || [])
    .slice()
    .sort((a, b) => a.price - b.price)[0] || null
  const price = resolveCardPrice({ price: material.price, state: material._pricingEventState })
  const inCart = isInCart('material', material._id)

  const metrics: { key: string; node: React.ReactNode }[] = []
  if (metricSettings.showDownloads) {
    metrics.push({ key: 'dl', node: <><Download className="h-3 w-3" /> {material.downloadCount}</> })
  }
  if (metricSettings.showViews) {
    metrics.push({ key: 'views', node: <><Eye className="h-3 w-3" /> {material.viewCount}</> })
  }
  if ((material.type === 'video' || isEmbed) && material.videoDuration) {
    metrics.push({ key: 'dur', node: <><Play className="h-3 w-3 fill-current" /> {formatDuration(material.videoDuration)}</> })
  }
  if (material.type === 'flashcard_deck' && material._cardCount != null) {
    metrics.push({ key: 'cards', node: <><Sparkles className="h-3 w-3" /> {material._cardCount} cards</> })
  }
  if (material.type === 'pdf' && material._hasPdf && material._pageCount) {
    metrics.push({
      key: 'pages',
      node: <><FileText className="h-3 w-3" /> {material._pageCount} {material._pageCount === 1 ? 'pág.' : 'págs.'}</>,
    })
  }

  // A ação principal de quem já tem: abrir do jeito que o material se lê.
  const ownedAction = isEmbed
    ? { label: 'Assistir', icon: <Play className="h-3.5 w-3.5 fill-current" />, onClick: onDownload }
    : material.type === 'flashcard_deck'
      ? { label: 'Estudar', icon: <Sparkles className="h-3.5 w-3.5" />, onClick: onDownload }
      : canViewPdf
        ? { label: 'Ler', icon: <BookOpen className="h-3.5 w-3.5" />, onClick: onViewPdf }
        : pdfDownloadBlocked
          ? { label: 'Ver detalhes', icon: <Info className="h-3.5 w-3.5" />, onClick: onDownload }
          : material.type === 'link'
            ? { label: 'Abrir', icon: null, onClick: onDownload }
            : { label: 'Baixar', icon: <Download className="h-3.5 w-3.5" />, onClick: onDownload }
  // O download fica de lado como ícone quando a leitura é a ação principal —
  // a versão por tempo nunca baixa (o servidor recusa de qualquer forma).
  const showSideDownload = canViewPdf && !pdfDownloadBlocked && !timedAccess && !isEmbed && material.type !== 'flashcard_deck'

  const cover = (
    <>
      {material.coverImage ? (
        <Image
          src={material.coverImage}
          alt={material.title}
          fill
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          sizes={featured
            ? '(max-width: 640px) 82vw, (max-width: 1024px) 50vw, 33vw'
            : '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw'}
          priority={priority}
        />
      ) : (
        <div className="ios-capa-vazia flex h-full w-full items-center justify-center">
          <span className="ios-tinta flex h-14 w-14 items-center justify-center rounded-[16px] bg-white/70 shadow-sm dark:bg-white/10 [&_svg]:h-7 [&_svg]:w-7">
            {typeIcons[material.type] || <File />}
          </span>
        </div>
      )}

      <span className="absolute left-2 top-2 z-[1] flex flex-wrap gap-1 sm:left-2.5 sm:top-2.5">
        <span className="ios-selo">
          {isEmbed && <Play className="h-3 w-3 fill-current" />}
          {typeLabels[material.type] || 'Arquivo'}
        </span>
        {featured && (
          <span className="ios-selo ios-selo-claro">
            <Star className="h-3 w-3 fill-current" /> Destaque
          </span>
        )}
      </span>

      {(material.allowedGroups?.length > 0 || hasEvent) && (
        <span className="absolute right-2 top-2 z-[1] flex flex-col items-end gap-1 sm:right-2.5 sm:top-2.5">
          {material.allowedGroups?.length > 0 && (
            <span className="ios-selo">
              <ShieldAlert className="h-3 w-3" />
              {material.allowedGroups.map(g => GROUP_META[g]?.label).filter(Boolean).join(' / ')}
            </span>
          )}
          {hasEvent && <PricingEventBadge state={material._pricingEventState} size="xs" />}
        </span>
      )}

      {metrics.length > 0 && (
        <span className="ios-selo absolute bottom-2 left-2 z-[1] max-w-[calc(100%-1rem)] !gap-x-2.5 sm:bottom-2.5 sm:left-2.5 sm:max-w-[calc(100%-3.5rem)]">
          {metrics.map(m => (
            <span key={m.key} className="inline-flex items-center gap-1 tabular-nums">{m.node}</span>
          ))}
        </span>
      )}
    </>
  )

  return (
    <div
      className={cn(
        'deck-card-rise group relative h-full',
        isHighlighted && 'rounded-[24px] ring-2 ring-[var(--ios-tinta)] ring-offset-2 ring-offset-[var(--ios-chao)]'
      )}
    >
      <article
        className={cn(
          'ios-cartao ios-toque relative flex h-full flex-col rounded-[24px] p-2',
          // Com o overlay ativo nenhum link interno é renderizado, então nada
          // do conteúdo bloqueado entra na ordem de tabulação.
          showLocked && 'select-none'
        )}
      >
        {showLocked && <LockedGroupOverlay allowedGroups={material.allowedGroups} onPreview={onPreview} />}

        <div className="relative">
          {showLocked ? (
            <div className="ios-capa block aspect-[16/10] rounded-[18px]">{cover}</div>
          ) : (
            <Link
              href={href}
              className="ios-capa block aspect-[16/10] rounded-[18px] focus-visible:outline-offset-[-3px]"
            >
              {cover}
            </Link>
          )}

          {isEmbed && canAccess && !showLocked && (
            <button
              type="button"
              onClick={onDownload}
              aria-label={`Assistir ${material.title}`}
              className="group/play absolute inset-0 z-[2] flex items-center justify-center rounded-[18px]"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/85 text-[#101814] shadow-lg backdrop-blur-md transition-transform duration-300 group-hover/play:scale-110">
                <Play className="ml-0.5 h-6 w-6 fill-current" />
              </span>
            </button>
          )}

          {!showLocked && (
            <CopyLinkBtn
              id={material._id}
              copiedId={copiedId}
              onClick={e => { e.preventDefault(); e.stopPropagation(); onCopyLink() }}
              className="absolute bottom-2.5 right-2.5 z-[3] hidden bg-white/85 text-[#101814] opacity-0 shadow-sm backdrop-blur-md transition-opacity hover:bg-white focus-visible:opacity-100 group-focus-within:opacity-100 group-hover:opacity-100 dark:bg-black/55 dark:text-white sm:inline-flex"
            />
          )}
        </div>

        <div className="flex flex-1 flex-col px-1.5 pb-1 pt-3 sm:px-2">
          {showLocked ? (
            <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug tracking-[-0.015em]">
              {material.title}
            </h3>
          ) : (
            <Link
              href={href}
              className={cn(
                'line-clamp-2 font-semibold leading-snug tracking-[-0.015em] transition-colors hover:text-[var(--ios-tinta-texto)]',
                featured ? 'text-[17px]' : 'text-[15px]'
              )}
            >
              {material.title}
            </Link>
          )}

          {material.description && (
            <p
              className={cn(
                'ios-rotulo-2 mt-1 line-clamp-2 text-[13px] leading-snug',
                // No celular a grade tem 2 colunas: descrição espremida em
                // ~160px vira ruído, o título já identifica o material.
                !featured && 'hidden sm:block'
              )}
              title={material.description}
            >
              {material.description}
            </p>
          )}

          <div className="mt-auto pt-3">
            {showLocked ? (
              <button
                type="button"
                onClick={onPreview}
                className="ios-botao-cinza ios-botao-p w-full"
              >
                <Info className="h-3.5 w-3.5" /> Ver como liberar
              </button>
            ) : canAccess ? (
              <>
                <div className="mb-2 flex min-h-[18px] items-center">
                  {timedAccess ? (
                    // Posse por tempo: o selo vira contagem regressiva — é a
                    // informação que o usuário precisa antes de abrir o material.
                    <TimedAccessPill access={timedAccess} />
                  ) : (
                    <span className="ios-tinta inline-flex items-center gap-1 text-[13px] font-semibold">
                      <Check className="h-3.5 w-3.5" strokeWidth={2.75} /> {isPurchased ? 'Adquirido' : 'Liberado para você'}
                    </span>
                  )}
                </div>
                <div className="flex gap-1.5">
                  <button type="button" onClick={ownedAction.onClick} className="ios-botao-suave ios-botao-p flex-1">
                    {ownedAction.icon}
                    {ownedAction.label}
                  </button>
                  {showSideDownload && (
                    <button
                      type="button"
                      onClick={onDownload}
                      aria-label={`Baixar ${material.title}`}
                      title="Baixar PDF"
                      className="ios-icone-botao"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </>
            ) : includedInPlus ? (
              <>
                <p className="ios-ambar mb-2 flex items-center gap-1 text-[13px] font-semibold">
                  <Crown className="h-3.5 w-3.5" /> Incluído no {PLUS_LABEL}
                </p>
                <button
                  type="button"
                  onClick={onClaimWithPlus}
                  disabled={loading}
                  className="ios-botao-ambar ios-botao-p w-full"
                >
                  {loading ? <InlineSpinner /> : null}
                  Resgatar
                </button>
              </>
            ) : isFree ? (
              <>
                <p className="ios-tinta mb-2 text-[13px] font-semibold">Grátis</p>
                <button
                  type="button"
                  onClick={onAddToCart}
                  disabled={loading}
                  aria-label={`Obter ${material.title} grátis`}
                  className="ios-botao-suave ios-botao-p w-full"
                >
                  {loading ? <InlineSpinner /> : null}
                  Obter
                </button>
              </>
            ) : (
              <>
                <div className="mb-2 flex min-h-[22px] flex-wrap items-baseline gap-x-1.5">
                  <span className="text-[17px] font-bold tracking-[-0.02em] tabular-nums">{formatBRL(price.finalPrice)}</span>
                  {price.strike ? (
                    <span className="text-[12px]">
                      <span className="ios-rotulo-3 tabular-nums line-through">{formatBRL(price.strike)}</span>
                      {price.savingsPct > 0 && <span className="ios-tinta ml-1 font-semibold">−{price.savingsPct}%</span>}
                    </span>
                  ) : cheapestTimedVersion ? (
                    <span className="ios-rotulo-2 inline-flex items-center gap-1 text-[12px] font-medium">
                      <Clock className="h-3 w-3" />
                      ou {formatBRL(cheapestTimedVersion.price)}/{cheapestTimedVersion.durationLabel}
                    </span>
                  ) : null}
                </div>
                <div className="flex gap-1.5">
                  <CartButton
                    inCart={inCart}
                    onAdd={onAddToCart}
                    disabled={loading}
                    itemTitle={material.title}
                    className="sm:flex-1"
                  />
                  <button
                    type="button"
                    onClick={onBuyNow}
                    disabled={loading}
                    aria-label={`Comprar ${material.title} por ${formatBRL(price.finalPrice)}`}
                    className="ios-botao ios-botao-p flex-1 !px-3"
                  >
                    {loading ? <InlineSpinner /> : null}
                    Comprar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </article>
    </div>
  )
})
