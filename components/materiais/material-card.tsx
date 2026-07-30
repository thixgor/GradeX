'use client'

import { memo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Check,
  Download,
  Eye,
  File,
  FileText,
  Gift,
  Info,
  Play,
  ShieldAlert,
  ShoppingCart,
  Sparkles,
  Star,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { PricingEventBadge } from '@/components/pricing-events/PricingEventBadge'
import {
  CardPrice,
  CopyLinkBtn,
  GROUP_META,
  LockedGroupOverlay,
  formatDuration,
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
  onDownload: () => void
  onViewPdf: () => void
  onCopyLink: () => void
  onPreview: () => void
  loading: boolean
  metricSettings: MaterialMetricSettings
  /** `featured` ganha a faixa de destaque e ocupa um slot maior na grade. */
  variant?: 'grid' | 'featured'
  /** Prioriza o carregamento da capa — só nos primeiros cards (LCP). */
  priority?: boolean
}

/** Spinner que herda a cor do botão em que está. */
function InlineSpinner() {
  return <span className="mr-1.5 h-3.5 w-3.5 animate-spin rounded-full border-2 border-transparent border-t-current" />
}

/**
 * Cartão de material. Unifica o antigo `MaterialCard` e `FeaturedCard`, que
 * duplicavam a lógica de acesso, preço, bloqueio por cargo e métricas.
 *
 * Mudanças de UX em relação à versão anterior:
 * - o preço saiu de cima da capa (contraste ruim sobre capas claras, e o
 *   `backdrop-blur` é degradado no mobile pelo globals.css) e foi para o
 *   corpo, junto do CTA;
 * - um CTA primário só — "Carrinho" virou botão-ícone secundário;
 * - a descrição não expande mais no lugar: o "Ver mais" empurrava a linha
 *   inteira da grade. O texto completo está na página do material;
 * - o botão de compartilhar saiu de dentro da âncora (`<button>` dentro de
 *   `<a>` é HTML inválido e quebrava a navegação por teclado).
 */
export const MaterialCard = memo(function MaterialCard({
  material,
  isPurchased,
  groupAccess,
  isHighlighted = false,
  copiedId,
  onAddToCart,
  onBuyNow,
  onDownload,
  onViewPdf,
  onCopyLink,
  onPreview,
  loading,
  metricSettings,
  variant = 'grid',
  priority = false,
}: MaterialCardProps) {
  const isFree = material.pricing === 'free'
  // isPurchased inclui concessões manuais do admin → sempre libera acesso.
  const canAccess = typeof material._hasAccess === 'boolean'
    ? material._hasAccess
    : isPurchased || (groupAccess && isFree)
  const isEmbed = material.type === 'video_embed'
  const canViewPdf = !!material._hasPdf && material.pdfViewerEnabled === true
  const pdfDownloadBlocked = !!material._hasPdf && material.pdfDownloadEnabled === false
  const showLocked = !groupAccess && !isPurchased && (material.allowedGroups?.length ?? 0) > 0
  const featured = variant === 'featured'
  const href = `/materiais/${material._id}`
  const hasEvent = !isFree && !!material._pricingEventState?.activeTier && material._pricingEventState.isActive

  const cover = (
    <>
      {material.coverImage ? (
        <Image
          src={material.coverImage}
          alt={material.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes={featured
            ? '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
            : '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw'}
          priority={priority}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-muted">
          <span className="flex h-16 w-16 items-center justify-center rounded-lg border border-border bg-card text-primary">
            {typeIcons[material.type] || <File className="h-8 w-8" />}
          </span>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

      {/* Tipo do arquivo */}
      <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-black/60 px-2 py-1 text-[10px] font-semibold text-white sm:left-3 sm:top-3">
        {isEmbed && <Play className="h-3 w-3 fill-white" />}
        {typeLabels[material.type] || 'Arquivo'}
      </span>

      {/* Restrição de cargo e lote promocional */}
      {(material.allowedGroups?.length > 0 || hasEvent) && (
        <span className="absolute right-2 top-2 flex flex-col items-end gap-1 sm:right-3 sm:top-3">
          {material.allowedGroups?.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-md bg-black/60 px-2 py-1 text-[10px] font-bold text-violet-200">
              <ShieldAlert className="h-3 w-3" />
              {material.allowedGroups.map(g => GROUP_META[g]?.label).filter(Boolean).join(' / ')}
            </span>
          )}
          {hasEvent && <PricingEventBadge state={material._pricingEventState} size="xs" />}
        </span>
      )}

      {/* Métricas — o `right-*` maior no desktop abre espaço para o botão de
          compartilhar, que aparece no hover. */}
      <span className="absolute bottom-2 left-2 right-2 flex flex-wrap items-center gap-x-3 gap-y-1 sm:bottom-3 sm:left-3 sm:right-32">
        {metricSettings.showDownloads && (
          <span className="inline-flex items-center gap-1 text-[11px] text-white/90">
            <Download className="h-3 w-3" /> {material.downloadCount}
          </span>
        )}
        {metricSettings.showViews && (
          <span className="inline-flex items-center gap-1 text-[11px] text-white/90">
            <Eye className="h-3 w-3" /> {material.viewCount}
          </span>
        )}
        {(material.type === 'video' || isEmbed) && material.videoDuration ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-white/90">
            <Play className="h-3 w-3 fill-white/70" /> {formatDuration(material.videoDuration)}
          </span>
        ) : null}
        {material.type === 'flashcard_deck' && material._cardCount != null ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-white/90">
            <Sparkles className="h-3 w-3" /> {material._cardCount} cards
          </span>
        ) : null}
        {material.type === 'pdf' && material._hasPdf && material._pageCount ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-white/90">
            <FileText className="h-3 w-3" /> {material._pageCount} {material._pageCount === 1 ? 'página' : 'páginas'}
          </span>
        ) : null}
      </span>
    </>
  )

  return (
    <div
      className={cn(
        'deck-card-rise group relative h-full',
        isHighlighted && 'rounded-lg ring-2 ring-primary ring-offset-2 ring-offset-background'
      )}
    >
      {showLocked && <LockedGroupOverlay allowedGroups={material.allowedGroups} onPreview={onPreview} />}

      <div
        className={cn(
          'flex h-full flex-col overflow-hidden rounded-lg border bg-card shadow-sm transition-colors',
          featured ? 'border-primary/25 hover:border-primary/45' : 'border-border hover:border-primary/35',
          // Com o overlay ativo nenhum link interno é renderizado, então nada
          // do conteúdo bloqueado entra na ordem de tabulação.
          showLocked && 'select-none'
        )}
      >
        {/* Região da capa. O botão de compartilhar e o de "assistir" são irmãos
            da âncora, nunca filhos — conteúdo interativo dentro de `<a>` é
            HTML inválido. */}
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

          {featured && (
            <span className="absolute right-0 top-0 inline-flex items-center gap-1 rounded-bl-md bg-accent px-2.5 py-1 text-[10px] font-bold text-accent-foreground">
              <Star className="h-3 w-3" /> DESTAQUE
            </span>
          )}

          {isEmbed && canAccess && !showLocked && (
            <button
              type="button"
              onClick={onDownload}
              aria-label={`Assistir ${material.title}`}
              className="group/play absolute inset-0 flex items-center justify-center"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/40 bg-black/45 transition-transform group-hover/play:scale-110">
                <Play className="ml-0.5 h-6 w-6 fill-white text-white" />
              </span>
            </button>
          )}

          {!showLocked && (
            <CopyLinkBtn
              id={material._id}
              copiedId={copiedId}
              onClick={e => { e.preventDefault(); e.stopPropagation(); onCopyLink() }}
              className="absolute bottom-3 right-3 hidden opacity-0 transition-opacity focus-visible:opacity-100 group-focus-within:opacity-100 group-hover:opacity-100 sm:inline-flex"
            />
          )}
        </div>

        <div className="flex flex-1 flex-col p-3 sm:p-4">
          {showLocked ? (
            <h3 className="mb-1 line-clamp-2 font-heading text-sm font-bold text-foreground">{material.title}</h3>
          ) : (
            <Link
              href={href}
              className={cn(
                'mb-1 line-clamp-2 font-heading font-bold text-foreground transition-colors hover:text-primary hover:underline',
                featured ? 'text-base' : 'text-sm'
              )}
            >
              {material.title}
            </Link>
          )}

          {material.description && (
            <p
              className={cn(
                'mb-3 line-clamp-2 text-xs text-muted-foreground',
                // No celular a grade tem 2 colunas: descrição espremida em
                // ~160px vira ruído, o título já identifica o material.
                !featured && 'hidden sm:block'
              )}
              title={material.description}
            >
              {material.description}
            </p>
          )}

          {material.tags?.length > 0 && (
            <div className="mb-3 hidden flex-wrap gap-1 sm:flex">
              {material.tags.slice(0, 3).map(tag => (
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
                className="mx-auto flex items-center gap-1 py-2 text-xs font-medium text-primary hover:underline"
              >
                <Info className="h-3 w-3" /> Ver detalhes e fazer upgrade
              </button>
            ) : canAccess ? (
              <>
                {isPurchased && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <Check className="h-3.5 w-3.5" /> Adquirido
                  </span>
                )}
                {canViewPdf && (
                  <Button onClick={onViewPdf} size="sm" variant="outline" className="h-10 w-full text-xs font-semibold">
                    <Eye className="mr-1.5 h-3.5 w-3.5" />
                    Visualizar PDF
                  </Button>
                )}
                {(!canViewPdf || !pdfDownloadBlocked) && (
                  <Button onClick={onDownload} size="sm" className="h-10 w-full text-xs font-semibold">
                    {isEmbed
                      ? <><Play className="mr-1.5 h-3.5 w-3.5 fill-current" /> Assistir</>
                      : material.type === 'flashcard_deck'
                        ? <><Sparkles className="mr-1.5 h-3.5 w-3.5" /> Acessar deck</>
                        : pdfDownloadBlocked
                          ? <><Info className="mr-1.5 h-3.5 w-3.5" /> Ver detalhes</>
                          : <><Download className="mr-1.5 h-3.5 w-3.5" /> Download</>}
                  </Button>
                )}
              </>
            ) : isFree ? (
              <>
                <CardPrice price={material.price} isFree state={material._pricingEventState} />
                <Button onClick={onAddToCart} disabled={loading} size="sm" className="h-10 w-full text-xs font-semibold">
                  {loading ? <InlineSpinner /> : <Gift className="mr-1.5 h-3.5 w-3.5" />}
                  Adquirir grátis
                </Button>
              </>
            ) : (
              <>
                <CardPrice price={material.price} isFree={false} state={material._pricingEventState} />
                <div className="flex gap-2">
                  <Button onClick={onBuyNow} disabled={loading} size="sm" className="h-10 flex-1 text-xs font-semibold">
                    {loading ? <InlineSpinner /> : null}
                    Comprar
                  </Button>
                  <Button
                    onClick={onAddToCart}
                    disabled={loading}
                    size="sm"
                    variant="outline"
                    aria-label={`Adicionar ${material.title} ao carrinho`}
                    title="Adicionar ao carrinho"
                    className="h-10 w-10 shrink-0 p-0"
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
