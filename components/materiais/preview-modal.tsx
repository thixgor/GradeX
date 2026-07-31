'use client'

import { useEffect, useId, useRef } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import {
  Clock,
  File,
  Gift,
  Lock,
  Package,
  ShieldAlert,
  ShoppingCart,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  CardPrice,
  GROUP_META,
  formatDuration,
  typeIcons,
  typeLabels,
  type Material,
  type MaterialPackage,
} from './shared'

/**
 * Detalhe de um item bloqueado (por cargo ou por não ter sido adquirido).
 *
 * Para vídeos incorporados renderiza um placeholder falso — a URL real nunca
 * chega ao cliente sem acesso.
 */
export function PreviewModal({
  item,
  onClose,
  onAddToCart,
  onBuyNow,
  checkoutLoading,
}: {
  item: { type: 'material'; data: Material } | { type: 'package'; data: MaterialPackage }
  onClose: () => void
  onAddToCart: () => void
  onBuyNow: () => void
  checkoutLoading: string | null
}) {
  const isMaterial = item.type === 'material'
  const data = item.data as Material & MaterialPackage
  const isFree = data.pricing === 'free'
  const isEmbed = isMaterial && data.type === 'video_embed'
  const isVideo = isMaterial && (data.type === 'video' || data.type === 'video_embed')
  const loading = checkoutLoading === data._id
  const titleId = useId()
  const closeRef = useRef<HTMLButtonElement>(null)

  // Escape fecha e o foco entra no diálogo — o `ui/dialog` do projeto não faz
  // nenhum dos dois, e este modal é a porta de entrada do upgrade.
  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [onClose])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-border bg-background shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background/90 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative flex-shrink-0">
          {isEmbed ? (
            // Placeholder falso — a URL real do vídeo nunca é exposta.
            <div className="relative w-full bg-black" style={{ paddingBottom: '56.25%' }}>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                {data.coverImage && (
                  <img src={data.coverImage} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-30 blur-sm" />
                )}
                <div className="relative z-10 flex flex-col items-center gap-3">
                  <span className="flex h-16 w-16 items-center justify-center rounded-full border border-white/30 bg-white/20">
                    <Lock className="h-7 w-7 text-white" />
                  </span>
                  <span className="rounded-full border border-white/10 bg-black/50 px-4 py-1.5 text-sm font-semibold text-white/90">
                    Vídeo bloqueado · faça upgrade para assistir
                  </span>
                </div>
              </div>
            </div>
          ) : data.coverImage ? (
            <div className="relative aspect-[16/10] overflow-hidden">
              <Image src={data.coverImage} alt={data.title} fill className="object-cover" sizes="(max-width: 640px) 100vw, 512px" />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center bg-muted">
              <Lock className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {isMaterial ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                {typeIcons[data.type] || <File className="h-3 w-3" />}
                {typeLabels[data.type] || 'Arquivo'}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-md border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                <Package className="h-3 w-3" /> Pacote · {data.materialIds?.length || 0} materiais
              </span>
            )}
            {isVideo && data.videoDuration ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                <Clock className="h-3 w-3" /> {formatDuration(data.videoDuration)}
              </span>
            ) : null}
            <CardPrice price={data.price} isFree={isFree} state={data._pricingEventState} className="ml-auto" />
          </div>

          <h2 id={titleId} className="mb-3 font-heading text-xl font-bold">{data.title}</h2>

          {data.description && (
            <p className="mb-5 text-sm leading-relaxed text-muted-foreground">{data.description}</p>
          )}

          {!isMaterial && data.materials?.length > 0 && (
            <div className="mb-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">O que está incluído</p>
              <ul className="space-y-1.5">
                {data.materials.map(m => (
                  <li key={m._id} className="flex items-center gap-2.5 rounded-md bg-muted/40 p-2 text-sm">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-primary/10 text-primary">
                      {typeIcons[m.type] || <File className="h-3.5 w-3.5" />}
                    </span>
                    <span className="truncate font-medium">{m.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data.allowedGroups?.length > 0 && (
            <div className="mb-5 rounded-lg border border-primary/20 bg-primary/5 p-4">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-primary">
                <ShieldAlert className="h-3.5 w-3.5" /> Disponível nos planos:
              </p>
              <div className="flex flex-wrap gap-2">
                {data.allowedGroups.map(g => {
                  const meta = GROUP_META[g]
                  if (!meta) return null
                  return (
                    <span
                      key={g}
                      className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold"
                      style={{ color: meta.color, background: `${meta.color}15`, borderColor: `${meta.color}40` }}
                    >
                      {meta.icon} {meta.label}
                    </span>
                  )
                })}
              </div>
              <p className="mt-2.5 text-xs text-muted-foreground">
                Faça upgrade do seu plano para desbloquear este conteúdo e ter acesso a todos os materiais exclusivos.
              </p>
            </div>
          )}

          {isFree ? (
            <Button onClick={onAddToCart} disabled={loading} className="h-11 w-full font-semibold">
              {loading
                ? <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-transparent border-t-current" />
                : <Gift className="mr-2 h-4 w-4" />}
              Adquirir gratuitamente
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button onClick={onBuyNow} disabled={loading} className="h-11 flex-1 font-semibold">
                {loading
                  ? <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-transparent border-t-current" />
                  : null}
                Comprar agora
              </Button>
              <Button
                onClick={onAddToCart}
                disabled={loading}
                variant="outline"
                aria-label="Adicionar ao carrinho"
                title="Adicionar ao carrinho"
                className="h-11 w-11 shrink-0 p-0"
              >
                <ShoppingCart className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
