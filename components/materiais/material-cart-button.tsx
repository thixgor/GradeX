'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, ArrowRight, FileText, Flame, Loader2, Package, Percent, ShoppingCart, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useMaterialCart } from '@/context/MaterialCartContext'

function formatBRL(value: number): string {
  return `R$ ${Number(value || 0).toFixed(2).replace('.', ',')}`
}

interface PreviewItem {
  itemType: 'material' | 'package'
  itemId: string
  itemTitle: string
  price: number
  originalPrice: number
  discountApplied: number
  tierDiscount?: number
  priceAfterTier?: number
  pricingEventState?: {
    eventId: string
    name: string
    activeTier?: { discountPercent: number; label: string; endsAt: string } | null
  } | null
}

interface PreviewResp {
  items: PreviewItem[]
  payableItems: PreviewItem[]
  amount: number
  tierDiscountTotal?: number
  amountAfterTier?: number
  skippedItems: any[]
}

interface AppliedCoupon {
  couponId: string
  code: string
  label: string
  amountBeforeCoupon: number
  eligibleAmount: number
  discountAmount: number
  amountAfterCoupon: number
}

export function MaterialCartButton({ isAuthenticated }: { isAuthenticated: boolean }) {
  const router = useRouter()
  const { items, itemCount, subtotal, removeItem, clearCart } = useMaterialCart()
  const [open, setOpen] = useState(false)
  const [checkoutChecking, setCheckoutChecking] = useState(false)
  const [notice, setNotice] = useState('')
  const [preview, setPreview] = useState<PreviewResp | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [couponCode, setCouponCode] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null)

  const cartKey = items.map(i => `${i.itemType}:${i.itemId}`).join('|')

  // Cupom é validado para o conjunto de itens atual — muda o carrinho, invalida o cupom.
  useEffect(() => {
    setAppliedCoupon(null)
    setCouponCode('')
    setCouponError('')
  }, [cartKey])

  // Busca preview com desconto de lote quando o carrinho abre (autenticado).
  useEffect(() => {
    if (!open || !isAuthenticated || items.length === 0) {
      setPreview(null)
      return
    }
    let cancelled = false
    setPreviewLoading(true)
    fetch('/api/materiais/cart/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: items.map(i => ({ itemType: i.itemType, itemId: i.itemId })) }),
      cache: 'no-store',
    })
      .then(r => r.json())
      .then(data => {
        if (cancelled) return
        if (data && Array.isArray(data.items)) setPreview(data)
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setPreviewLoading(false) })
    return () => { cancelled = true }
  }, [open, isAuthenticated, cartKey, items])

  const previewByKey = useMemo(() => {
    const map = new Map<string, PreviewItem>()
    preview?.items?.forEach(it => map.set(`${it.itemType}:${it.itemId}`, it))
    return map
  }, [preview])

  const tierTotal = preview?.tierDiscountTotal || 0
  const amountAfterTier = preview?.amountAfterTier ?? subtotal
  const couponEligibleAmount = preview?.amount ?? subtotal
  const couponDiscount = appliedCoupon?.discountAmount || 0
  const couponWinsOverTier = couponDiscount > tierTotal
  const finalSubtotal = appliedCoupon
    ? (couponWinsOverTier ? appliedCoupon.amountAfterCoupon : amountAfterTier)
    : amountAfterTier
  const activeLoteName = useMemo(() => {
    const first = preview?.items?.find(it => it.pricingEventState?.activeTier)
    return first?.pricingEventState?.name || null
  }, [preview])

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => Number(new Date(a.addedAt)) - Number(new Date(b.addedAt)))
  }, [items])

  const applyCoupon = async () => {
    const normalized = couponCode.trim()
    if (!normalized) return
    setCouponLoading(true)
    setCouponError('')
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: normalized, items: items.map(i => ({ itemType: i.itemType, itemId: i.itemId })) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Cupom inválido')
      setAppliedCoupon(data)
      setCouponCode(data.code || normalized.toUpperCase())
    } catch (err: any) {
      setCouponError(err?.message || 'Erro ao aplicar cupom')
    } finally {
      setCouponLoading(false)
    }
  }

  const removeCoupon = () => {
    setAppliedCoupon(null)
    setCouponCode('')
    setCouponError('')
  }

  const goToCheckout = async () => {
    const checkoutPath = appliedCoupon
      ? `/materiais/checkout?cart=1&coupon=${encodeURIComponent(appliedCoupon.code)}`
      : '/materiais/checkout?cart=1'
    // Visitante finaliza sem login: o checkout do carrinho coleta os dados do
    // comprador e gera uma Serial Key por item (ver /materiais/checkout?cart=1).
    if (!isAuthenticated) {
      setOpen(false)
      router.push(checkoutPath)
      return
    }
    setCheckoutChecking(true)
    setNotice('')
    try {
      const res = await fetch('/api/materiais/cart/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(item => ({ itemType: item.itemType, itemId: item.itemId })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao revisar carrinho')

      const alreadyOwnedItems = Array.isArray(data.skippedItems)
        ? data.skippedItems.filter((item: any) => item.reason === 'already_owned')
        : []

      if (alreadyOwnedItems.length > 0) {
        alreadyOwnedItems.forEach((item: any) => removeItem(item.itemType, item.itemId))
        const names = alreadyOwnedItems
          .map((item: any) => item.itemTitle || (item.itemType === 'package' ? 'Pacote' : 'Material'))
          .slice(0, 3)
        const extra = alreadyOwnedItems.length > names.length ? ` e mais ${alreadyOwnedItems.length - names.length}` : ''
        const hasRemainingItems = Array.isArray(data.items) && data.items.length > 0
        setNotice(`${alreadyOwnedItems.length === 1 ? 'Removemos 1 item que você já possui' : `Removemos ${alreadyOwnedItems.length} itens que você já possui`}: ${names.join(', ')}${extra}. ${hasRemainingItems ? 'Confira o carrinho atualizado antes de finalizar.' : 'Seu carrinho ficou vazio.'}`)
        return
      }

      setOpen(false)
      router.push(checkoutPath)
    } catch (err: any) {
      setNotice(err?.message || 'Não foi possível revisar o carrinho agora.')
    } finally {
      setCheckoutChecking(false)
    }
  }

  return (
    <>
      <Button
        onClick={() => { setNotice(''); setOpen(true) }}
        className="relative h-10 rounded-xl border border-emerald-300/50 bg-gradient-to-r from-emerald-700 via-emerald-600 to-amber-500 px-3 text-white shadow-lg shadow-emerald-700/25 transition hover:from-emerald-600 hover:via-emerald-500 hover:to-amber-400"
        aria-label="Abrir carrinho"
      >
        <ShoppingCart className="h-5 w-5" />
        <span className="ml-2 hidden text-sm font-bold sm:inline">Carrinho</span>
        {itemCount > 0 && (
          <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-black text-white ring-2 ring-background">
            {itemCount > 99 ? '99+' : itemCount}
          </span>
        )}
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[80]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <div className="pointer-events-none absolute right-3 top-16 h-64 w-[min(92vw,34rem)] rounded-[2rem] bg-emerald-400/25 blur-3xl dark:bg-emerald-500/20 sm:right-8 lg:right-12" />
            <motion.aside
              initial={{ opacity: 0, y: -10, scaleY: 0.86 }}
              animate={{ opacity: 1, y: 0, scaleY: 1 }}
              exit={{ opacity: 0, y: -10, scaleY: 0.92 }}
              transition={{ type: 'spring', stiffness: 380, damping: 34 }}
              style={{ transformOrigin: 'top right' }}
              className="absolute inset-x-3 top-16 mx-auto flex max-h-[calc(100dvh-5rem)] w-auto max-w-[30rem] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-950 shadow-2xl shadow-black/25 dark:border-white/10 dark:bg-zinc-950 dark:text-white sm:inset-x-auto sm:right-8 sm:mx-0 sm:w-[28rem] lg:right-12"
            >
              <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 dark:border-white/10 dark:bg-zinc-950">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-700/25">
                    <ShoppingCart className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Carrinho</p>
                    <p className="text-xs text-muted-foreground">
                      {itemCount} {itemCount === 1 ? 'item' : 'itens'}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="h-9 w-9">
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {itemCount === 0 ? (
                <div className="flex min-h-72 flex-1 flex-col items-center justify-center bg-slate-50 px-6 text-center dark:bg-zinc-950">
                  {notice ? (
                    <div className="mb-5 flex max-w-sm gap-2 rounded-xl border border-amber-300/40 bg-amber-50 p-3 text-left text-sm text-amber-900 shadow-sm dark:border-amber-400/25 dark:bg-amber-500/10 dark:text-amber-100">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <p className="leading-relaxed">{notice}</p>
                    </div>
                  ) : null}
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                    <ShoppingCart className="h-7 w-7" />
                  </div>
                  <h2 className="text-base font-bold">Seu carrinho está vazio</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Adicione materiais ou pacotes e finalize tudo em uma única compra.
                  </p>
                  <Button onClick={() => { setOpen(false); router.push('/materiais') }} className="mt-5 rounded-xl">
                    Ver materiais
                  </Button>
                </div>
              ) : (
                <>
                  <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 p-3 dark:bg-zinc-950 sm:p-4">
                    {notice ? (
                      <div className="mb-3 flex gap-2 rounded-xl border border-amber-300/40 bg-amber-50 p-3 text-sm text-amber-900 shadow-sm dark:border-amber-400/25 dark:bg-amber-500/10 dark:text-amber-100">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        <p className="leading-relaxed">{notice}</p>
                      </div>
                    ) : null}
                    <div className="space-y-3">
                      {sortedItems.map(item => {
                        const localPrice = item.effectivePrice ?? item.price
                        const previewMatch = previewByKey.get(`${item.itemType}:${item.itemId}`)
                        const tierPct = previewMatch?.pricingEventState?.activeTier?.discountPercent || 0
                        const hasTier = !!previewMatch && tierPct > 0 && (previewMatch.tierDiscount || 0) > 0
                        const displayPrice = hasTier
                          ? Number(previewMatch?.priceAfterTier ?? localPrice)
                          : Number(previewMatch?.price ?? localPrice)
                        const displayOriginal = hasTier
                          ? Number(previewMatch?.price ?? localPrice)
                          : localPrice
                        return (
                          <div key={`${item.itemType}:${item.itemId}`} className="flex gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-zinc-900">
                            <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-muted sm:h-16">
                              {item.coverImage ? (
                                <Image src={item.coverImage} alt="" fill className="object-cover" sizes="80px" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                                  {item.itemType === 'package' ? <Package className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="mb-1 flex flex-wrap items-center gap-1.5">
                                <span className="rounded-md bg-emerald-600/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                                  {item.itemType === 'package' ? 'Pacote' : 'Material'}
                                </span>
                                {item.discountApplied ? (
                                  <span className="rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                                    desconto
                                  </span>
                                ) : null}
                                {hasTier && (
                                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-black text-emerald-700 dark:text-emerald-200">
                                    <Flame className="h-3 w-3" />
                                    −{Math.round(tierPct)}% lote
                                  </span>
                                )}
                              </div>
                              <p className="line-clamp-2 text-sm font-semibold leading-snug">{item.title}</p>
                              <div className="mt-1 flex items-center justify-between gap-2">
                                <div className="flex flex-col">
                                  {hasTier && (
                                    <span className="text-[11px] text-muted-foreground line-through">
                                      {formatBRL(displayOriginal)}
                                    </span>
                                  )}
                                  <p className="text-sm font-black text-emerald-700 dark:text-emerald-300">
                                    {displayPrice <= 0 ? 'Grátis' : formatBRL(displayPrice)}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeItem(item.itemType, item.itemId)}
                                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500"
                                  aria-label={`Remover ${item.title}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="shrink-0 border-t border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-zinc-950">
                    {tierTotal > 0 && (
                      <div className="mb-3 flex items-start gap-2 rounded-xl border border-emerald-300/40 bg-emerald-50 p-3 text-xs leading-snug text-emerald-900 dark:border-emerald-400/25 dark:bg-emerald-500/10 dark:text-emerald-100">
                        <Flame className="mt-0.5 h-4 w-4 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="font-bold">
                            Lote {activeLoteName ? `"${activeLoteName}"` : 'ativo'}: você economiza {formatBRL(tierTotal)}
                          </p>
                          <p className="mt-0.5 text-[11px] opacity-80">
                            Desconto aplicado automaticamente nos itens elegíveis.
                          </p>
                        </div>
                      </div>
                    )}
                    {isAuthenticated && couponEligibleAmount > 0 && (
                      <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-zinc-900">
                        <div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                          <Percent className="h-3.5 w-3.5 text-emerald-600" />
                          Cupom de desconto
                        </div>
                        {appliedCoupon ? (
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-black text-emerald-700 dark:text-emerald-300">
                                {appliedCoupon.code} aplicado
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                -{formatBRL(appliedCoupon.discountAmount)} de desconto
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={removeCoupon}
                              className="shrink-0 rounded-lg border border-red-300/50 bg-red-500/10 px-2.5 py-1.5 text-[11px] font-bold text-red-600 transition-colors hover:bg-red-500/15 dark:text-red-300"
                            >
                              Remover
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <input
                              value={couponCode}
                              onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError('') }}
                              onKeyDown={(e) => { if (e.key === 'Enter') applyCoupon() }}
                              disabled={couponLoading}
                              placeholder="Digite seu cupom"
                              className="h-9 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm uppercase text-slate-950 outline-none dark:border-white/10 dark:bg-zinc-950 dark:text-white"
                            />
                            <Button
                              type="button"
                              onClick={applyCoupon}
                              disabled={couponLoading || !couponCode.trim()}
                              className="h-9 rounded-lg bg-emerald-700 px-3 text-xs text-white hover:bg-emerald-600"
                            >
                              {couponLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Aplicar'}
                            </Button>
                          </div>
                        )}
                        {couponError ? <p className="mt-1.5 text-[11px] text-red-500">{couponError}</p> : null}
                      </div>
                    )}
                    {tierTotal > 0 && (
                      <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                        <span>Sem o lote</span>
                        <span className="line-through">{formatBRL(subtotal)}</span>
                      </div>
                    )}
                    <div className="mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          {tierTotal > 0 || appliedCoupon ? 'Total com desconto' : 'Subtotal estimado'}
                        </span>
                        <span className="text-xl font-black text-emerald-700 dark:text-emerald-300">{formatBRL(finalSubtotal)}</span>
                      </div>
                      {appliedCoupon && couponWinsOverTier && (
                        <p className="mt-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-300">
                          Cupom {appliedCoupon.code}: -{formatBRL(appliedCoupon.discountAmount)} (vence o lote)
                        </p>
                      )}
                      {appliedCoupon && !couponWinsOverTier && tierTotal > 0 && (
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          Cupom {appliedCoupon.code} desativado: o desconto do lote é maior.
                        </p>
                      )}
                    </div>
                    {previewLoading && !preview && (
                      <p className="mb-3 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Calculando descontos...
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={clearCart} className="h-11 rounded-xl">
                        Limpar
                      </Button>
                      <Button onClick={goToCheckout} disabled={checkoutChecking} className="h-11 flex-1 rounded-xl bg-emerald-700 text-white hover:bg-emerald-600">
                        {checkoutChecking ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        {checkoutChecking ? 'Revisando...' : 'Finalizar compra'}
                        {!checkoutChecking ? <ArrowRight className="ml-2 h-4 w-4" /> : null}
                      </Button>
                    </div>
                    <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                      O valor final é recalculado com segurança no checkout antes do pagamento.
                    </p>
                  </div>
                </>
              )}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
