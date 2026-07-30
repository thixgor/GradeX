'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AlertCircle, Check, ChevronLeft, FileText, Flame, Loader2, Package, Percent, ShoppingCart, Sparkles, Trash2, X } from 'lucide-react'
import { MercadoPagoCheckout } from '@/components/payments/mercado-pago-checkout'
import { CheckoutAddonOffers } from '@/components/shop/checkout-addon-offers'
import { UnifiedCheckoutPayment } from '@/components/shop/unified-checkout-payment'
import { CheckoutAccountNotice } from '@/components/checkout/checkout-account-notice'
import { PackageContents } from '@/components/shop/package-contents'
import { useMaterialCart } from '@/context/MaterialCartContext'
import { PricingEventCountdown, type PricingEventStatePayload } from '@/components/pricing-events/PricingEventCountdown'

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #020d06 0%, #031a0b 40%, #041408 100%)',
  padding: '24px 16px',
}

const glassCard: React.CSSProperties = {
  background: 'rgba(6,20,10,0.85)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(52,211,153,0.15)',
  borderRadius: '20px',
}

const emeraldBadge: React.CSSProperties = {
  background: 'linear-gradient(135deg, #059669, #34d399)',
  borderRadius: '10px',
  padding: '6px 14px',
  fontSize: '13px',
  fontWeight: 700,
  color: 'white',
  display: 'inline-block',
}

interface CartPreviewItem {
  itemType: 'material' | 'package'
  itemId: string
  itemTitle: string
  materialType?: string
  price: number
  originalPrice: number
  discountApplied: number
}

interface CartSkippedItem {
  itemType: 'material' | 'package'
  itemId: string
  reason: string
  itemTitle?: string
  includedInPackageTitle?: string
  includedInPackageId?: string
}

interface CartUpgradeSuggestion {
  packageId: string
  packageTitle: string
  packageCoverImage?: string
  packageEffectivePrice: number
  packageOriginalPrice: number
  cartMaterialIds: string[]
  cartMaterialTitles: string[]
  currentCost: number
  savings: number
  totalMaterialsInPackage: number
  extraMaterialsCount: number
}

interface CartPreviewItemWithEvent extends CartPreviewItem {
  tierDiscount?: number
  priceAfterTier?: number
  pricingEventState?: PricingEventStatePayload | null
}

interface CartPreview {
  items: CartPreviewItemWithEvent[]
  payableItems: CartPreviewItemWithEvent[]
  freeItems: CartPreviewItemWithEvent[]
  skippedItems: CartSkippedItem[]
  amount: number
  tierDiscountTotal?: number
  amountAfterTier?: number
  suggestions?: CartUpgradeSuggestion[]
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

function formatBRL(value: number): string {
  return `R$ ${Number(value || 0).toFixed(2).replace('.', ',')}`
}

function CouponBox({
  amount,
  payload,
  appliedCoupon,
  onApplied,
  onRemoved,
  initialCode,
}: {
  amount: number
  payload: Record<string, any>
  appliedCoupon: AppliedCoupon | null
  onApplied: (coupon: AppliedCoupon) => void
  onRemoved: () => void
  initialCode?: string
}) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const applyCoupon = async (overrideCode?: string) => {
    const normalized = (overrideCode ?? code).trim()
    if (!normalized) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: normalized, ...payload }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Cupom inválido')
      onApplied(data)
      setCode(data.code || normalized.toUpperCase())
      setNotice('')
    } catch (err: any) {
      setError(err?.message || 'Erro ao aplicar cupom')
    } finally {
      setLoading(false)
    }
  }

  // Cupom vindo do mini-carrinho (aplicado antes de entrar no checkout): aplica uma única vez.
  const autoAppliedRef = useRef(false)
  useEffect(() => {
    if (!initialCode || autoAppliedRef.current || appliedCoupon || amount <= 0) return
    autoAppliedRef.current = true
    setCode(initialCode.toUpperCase())
    applyCoupon(initialCode)
  }, [initialCode, amount, appliedCoupon])

  return (
    <div style={{
      padding: '14px',
      borderRadius: '12px',
      border: '1px solid rgba(52,211,153,0.16)',
      background: 'rgba(255,255,255,0.035)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', color: 'rgba(255,255,255,0.72)', fontSize: '13px', fontWeight: 700 }}>
        <Percent size={15} style={{ color: '#34d399' }} />
        Cupom de desconto
      </div>

      {appliedCoupon ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, color: '#34d399', fontSize: '14px', fontWeight: 800 }}>
              {appliedCoupon.code} aplicado
            </p>
            <p style={{ margin: '2px 0 0 0', color: 'rgba(255,255,255,0.45)', fontSize: '12px' }}>
              {formatBRL(appliedCoupon.discountAmount)} de desconto · total {formatBRL(appliedCoupon.amountAfterCoupon)}
            </p>
            </div>
            <span style={{
              flexShrink: 0,
              borderRadius: '999px',
              background: 'rgba(52,211,153,0.12)',
              color: '#34d399',
              padding: '5px 9px',
              fontSize: '11px',
              fontWeight: 900,
            }}>
              {appliedCoupon.label}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setCode('')
              setError('')
              setNotice('Cupom removido. O total foi recalculado sem desconto.')
              onRemoved()
            }}
            style={{
              width: '100%',
              minHeight: '38px',
              borderRadius: '10px',
              border: '1px solid rgba(248,113,113,0.26)',
              background: 'rgba(248,113,113,0.08)',
              color: '#fca5a5',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 900,
            }}
            aria-label="Remover cupom"
          >
            <X size={15} />
            Remover cupom
          </button>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase())
                setError('')
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') applyCoupon()
              }}
              disabled={loading || amount <= 0}
              placeholder="Digite seu cupom"
              style={{
                flex: 1,
                minWidth: 0,
                height: '38px',
                borderRadius: '10px',
                border: '1px solid rgba(52,211,153,0.16)',
                background: 'rgba(0,0,0,0.22)',
                color: 'white',
                padding: '0 12px',
                outline: 'none',
                textTransform: 'uppercase',
              }}
            />
            <button
              type="button"
              onClick={() => applyCoupon()}
              disabled={loading || amount <= 0 || !code.trim()}
              style={{
                height: '38px',
                borderRadius: '10px',
                border: 'none',
                background: '#34d399',
                color: '#04130a',
                fontSize: '12px',
                fontWeight: 900,
                padding: '0 14px',
                cursor: loading || amount <= 0 || !code.trim() ? 'not-allowed' : 'pointer',
                opacity: loading || amount <= 0 || !code.trim() ? 0.55 : 1,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {loading && <Loader2 size={13} className="animate-spin" />}
              Aplicar
            </button>
          </div>
          {error ? <p style={{ color: '#f87171', fontSize: '12px', marginTop: '8px' }}>{error}</p> : null}
          {notice ? <p style={{ color: '#34d399', fontSize: '12px', marginTop: '8px', fontWeight: 700 }}>{notice}</p> : null}
        </>
      )}
    </div>
  )
}

export default function MateriaisCheckoutPage() {
  const router = useRouter()
  const params = useSearchParams()
  const isCartMode = params.get('cart') === '1'
  const itemType = (params.get('type') as 'material' | 'package') || 'material'
  const itemId = params.get('id') || ''
  const couponFromQuery = params.get('coupon') || ''
  const { items: cartItems, clearCart, removeItem, addItem } = useMaterialCart()

  const [item, setItem] = useState<any>(null)
  const [cartPreview, setCartPreview] = useState<CartPreview | null>(null)
  const [publicKey, setPublicKey] = useState('')
  const [loading, setLoading] = useState(true)
  const [freeCheckoutLoading, setFreeCheckoutLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null)
  const [removedAccessibleItems, setRemovedAccessibleItems] = useState<CartSkippedItem[]>([])

  // Compra sem login (Serial Key): detectamos visitante e coletamos os dados.
  const [isGuest, setIsGuest] = useState<boolean | null>(null)
  const [buyer, setBuyer] = useState({ name: '', email: '', phone: '' })
  const [buyerConfirmed, setBuyerConfirmed] = useState(false)

  // Usuário logado que já possui o item avulso: mostramos um aviso claro (em vez
  // de redirecionar em silêncio para a página do material, o que confundia).
  const [alreadyOwnedInfo, setAlreadyOwnedInfo] = useState<
    { redirect: string; title: string; type: 'material' | 'package' | 'flashcard' } | null
  >(null)

  useEffect(() => {
    let active = true
    fetch('/api/auth/me', { cache: 'no-store' })
      .then(r => { if (active) setIsGuest(!r.ok) })
      .catch(() => { if (active) setIsGuest(true) })
    return () => { active = false }
  }, [])

  const cartPayload = cartItems.map(item => ({ itemType: item.itemType, itemId: item.itemId }))
  const cartPayloadKey = cartPayload.map(item => `${item.itemType}:${item.itemId}`).join('|')

  // Visitante em compra de item único → usa o checkout de Serial Key (/comprar),
  // que mantém preço e fluxo consistentes. O carrinho é tratado nesta página.
  useEffect(() => {
    if (isGuest && !isCartMode && item?._id) {
      const pt = itemType === 'package' ? 'package' : (item.type === 'flashcard_deck' ? 'flashcard' : 'material')
      router.replace(`/comprar?productType=${pt}&productId=${item._id}&itemType=${itemType}`)
    }
  }, [isGuest, isCartMode, item, itemType, router])

  useEffect(() => {
    setAppliedCoupon(null)
  }, [cartPayloadKey, isCartMode, itemId, itemType])

  function getOwnedRedirect(found: any): string {
    if (itemType === 'package') return `/pacotes/${itemId}`
    if (found?.type === 'flashcard_deck') {
      if (found?.downloadUrl) return found.downloadUrl
      if (found?.linkedDeckSlug) return `/flashcards/d/${found.linkedDeckSlug}`
    }
    return `/materiais/${itemId}`
  }

  function buildRemovedItemsMessage(items: CartSkippedItem[]) {
    const names = items
      .map((item) => item.itemTitle || (item.itemType === 'package' ? 'Pacote' : 'Material'))
      .slice(0, 4)
    const extra = items.length > names.length ? ` e mais ${items.length - names.length}` : ''
    return `${items.length === 1 ? 'Removemos 1 item que você já possui' : `Removemos ${items.length} itens que você já possui`}: ${names.join(', ')}${extra}.`
  }

  useEffect(() => {
    if (isCartMode) {
      if (cartPayload.length === 0) {
        setError(removedAccessibleItems.length > 0
          ? `${buildRemovedItemsMessage(removedAccessibleItems)} Seu carrinho ficou vazio.`
          : 'Seu carrinho está vazio'
        )
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)
      Promise.all([
        fetch('/api/materiais/cart/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: cartPayload }),
          cache: 'no-store',
        }).then(async r => {
          const data = await r.json()
          if (!r.ok) throw new Error(data.error || 'Erro ao calcular carrinho')
          return data
        }),
        fetch('/api/payments/public-key').then(r => r.json()),
      ])
        .then(([previewResp, pkResp]) => {
          const skippedItems = Array.isArray(previewResp?.skippedItems) ? previewResp.skippedItems : []
          const alreadyOwnedItems = skippedItems.filter((item: CartSkippedItem) => item.reason === 'already_owned')
          if (alreadyOwnedItems.length > 0) {
            setRemovedAccessibleItems(alreadyOwnedItems)
            alreadyOwnedItems.forEach((item: CartSkippedItem) => removeItem(item.itemType, item.itemId))
            if (!previewResp?.items?.length) {
              setError(`${buildRemovedItemsMessage(alreadyOwnedItems)} Seu carrinho ficou vazio.`)
              setCartPreview(previewResp)
              return
            }
            setCartPreview({
              ...previewResp,
              skippedItems: skippedItems.filter((item: CartSkippedItem) => item.reason !== 'already_owned'),
            })
            setPublicKey(pkResp.publicKey || '')
            return
          }
          if (!previewResp?.items?.length) {
            const allAlreadyOwned = skippedItems.length > 0 && skippedItems.every((item: CartSkippedItem) => item.reason === 'already_owned')
            setError(allAlreadyOwned
              ? 'Você já possui todos os itens deste carrinho.'
              : 'Nenhum item do carrinho está disponível para compra'
            )
            setCartPreview(previewResp)
            return
          }
          setCartPreview(previewResp)
          setPublicKey(pkResp.publicKey || '')
        })
        .catch(err => setError(String(err?.message || err)))
        .finally(() => setLoading(false))
      return
    }

    setAlreadyOwnedInfo(null)

    if (!itemId) {
      setError('Item não informado')
      setLoading(false)
      return
    }
    const itemUrl = itemType === 'package'
      ? `/api/materiais/packages/${itemId}`
      : `/api/materiais/${itemId}`
    Promise.all([
      fetch(itemUrl, { cache: 'no-store' }).then(r => r.json()),
      fetch('/api/payments/public-key').then(r => r.json()),
    ])
      .then(([itemResp, pkResp]) => {
        // Normaliza estruturas: o endpoint de pacote retorna { package, pricing },
        // o de material retorna { material }. Achatamos para um único objeto `found`
        // expondo o `effectivePrice` quando aplicável.
        let found: any = null
        if (itemType === 'package' && itemResp?.package) {
          found = {
            ...itemResp.package,
            effectivePrice: itemResp.pricing?.effectivePrice ?? itemResp.package.price,
            originalPackagePrice: itemResp.pricing?.originalPackagePrice ?? itemResp.package.price,
            discountApplied: itemResp.pricing?.discountApplied ?? 0,
            ownedMaterialIds: itemResp.pricing?.ownedMaterialIds ?? [],
            pricingEventState: itemResp.pricingEventState ?? null,
          }
        } else if (itemType === 'material' && itemResp?.material) {
          found = {
            ...itemResp.material,
            pricingEventState: itemResp.pricingEventState ?? null,
          }
        } else if (Array.isArray(itemResp)) {
          found = itemResp.find((x: any) => x._id === itemId)
        } else {
          found = itemResp.materials?.find((x: any) => x._id === itemId) ||
            itemResp.packages?.find((x: any) => x._id === itemId) ||
            itemResp
        }
        if (!found || !found._id) {
          setError('Item não encontrado')
          return
        }
        const alreadyOwned = itemType === 'package'
          ? !!(itemResp?.access?.hasAccess || itemResp?.access?.isPurchased)
          : !!(itemResp?.hasAccess || itemResp?.isPurchased || found?._hasAccess || found?._isPurchased)
        if (alreadyOwned) {
          setAlreadyOwnedInfo({
            redirect: getOwnedRedirect(found),
            title: found.title || found.name || (itemType === 'package' ? 'Este pacote' : 'Este material'),
            type: itemType === 'package'
              ? 'package'
              : (found?.type === 'flashcard_deck' ? 'flashcard' : 'material'),
          })
          return
        }
        setItem(found)
        setPublicKey(pkResp.publicKey || '')
      })
      .catch(err => setError(String(err?.message || err)))
      .finally(() => setLoading(false))
  }, [cartPayloadKey, isCartMode, itemId, itemType])

  useEffect(() => {
    if (isCartMode) {
      if (!cartPreview) return
      fetch('/api/analytics/checkout-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'checkout_view',
          productId: 'cart',
          productTitle: `Carrinho (${cartPreview.items.length} itens)`,
          productType: 'material',
          amount: Number(cartPreview.amount || 0),
          source: 'Carrinho',
          metadata: {
            itemType: 'cart',
            items: cartPreview.items.map(item => ({ itemType: item.itemType, itemId: item.itemId })),
            skippedItems: cartPreview.skippedItems,
          },
        }),
        keepalive: true,
      }).catch(() => {})
      return
    }

    if (!item) return
    fetch('/api/analytics/checkout-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'checkout_view',
        productId: itemId,
        productTitle: item.title,
        productType: itemType === 'package' ? 'package' : item.type === 'flashcard_deck' ? 'flashcard' : 'material',
        amount: Number(item.price || 0),
        source: itemType === 'package' ? 'Pacote' : 'Compra direta',
        metadata: { itemType, materialType: item.type },
      }),
      keepalive: true,
    }).catch(() => {})
  }, [cartPreview, isCartMode, item, itemId, itemType])

  if (loading) {
    return (
      <div style={pageStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <Loader2 size={32} style={{ color: '#34d399', animation: 'spin 1s linear infinite' }} />
        </div>
      </div>
    )
  }

  if (!isCartMode && alreadyOwnedInfo) {
    const typeWord = alreadyOwnedInfo.type === 'package'
      ? 'pacote'
      : alreadyOwnedInfo.type === 'flashcard' ? 'baralho' : 'material'
    const goToItem = () => {
      if (/^https?:\/\//.test(alreadyOwnedInfo.redirect)) window.location.href = alreadyOwnedInfo.redirect
      else router.push(alreadyOwnedInfo.redirect)
    }
    return (
      <div style={pageStyle}>
        <div style={{ maxWidth: '540px', margin: '0 auto', paddingTop: '48px' }}>
          <div style={{ ...glassCard, padding: '40px 32px', textAlign: 'center' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '18px',
              background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.22)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 22px',
            }}>
              <Check size={34} style={{ color: '#34d399' }} />
            </div>
            <span style={{ ...emeraldBadge, marginBottom: '14px' }}>Você já tem acesso</span>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'white', letterSpacing: '-0.02em', lineHeight: 1.25, marginBottom: '12px' }}>
              Este {typeWord} já é seu
            </h1>
            <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, marginBottom: '6px' }}>
              <strong style={{ color: '#34d399' }}>{alreadyOwnedInfo.title}</strong> já está liberado na sua conta — sem
              precisar comprar de novo nem gastar nada.
            </p>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.42)', lineHeight: 1.6, marginBottom: '30px' }}>
              É só abrir e continuar de onde você parou.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={goToItem}
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  width: '100%', height: '50px', borderRadius: '13px', border: 'none',
                  background: '#34d399', color: '#04140d', fontWeight: 800, fontSize: '15px', cursor: 'pointer',
                }}
              >
                Abrir meu {typeWord}
              </button>
              <button
                onClick={() => router.push('/materiais?tab=mine')}
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: '100%', height: '46px', borderRadius: '13px',
                  border: '1px solid rgba(255,255,255,0.15)', background: 'transparent',
                  color: 'rgba(255,255,255,0.72)', fontWeight: 600, fontSize: '14px', cursor: 'pointer',
                }}
              >
                Ver todos os meus materiais
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || (!isCartMode && !item) || (isCartMode && !cartPreview)) {
    return (
      <div style={pageStyle}>
        <div style={{ maxWidth: '640px', margin: '0 auto', paddingTop: '40px' }}>
          <div style={{ ...glassCard, padding: '28px', color: '#f87171', marginBottom: '16px' }}>
            {error || 'Item não disponível.'}
          </div>
          <button
            onClick={() => router.push('/materiais')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: 'transparent', border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '10px', padding: '8px 16px', color: 'rgba(255,255,255,0.7)',
              cursor: 'pointer', fontSize: '14px',
            }}
          >
            <ChevronLeft size={16} /> Voltar
          </button>
        </div>
      </div>
    )
  }

  if (isCartMode && cartPreview) {
    const amount = Number(cartPreview.amount || 0)
    const tierTotal = Number(cartPreview.tierDiscountTotal || 0)
    const amountAfterTier = Number(cartPreview.amountAfterTier ?? (amount - tierTotal))
    const hasTier = tierTotal > 0
    const couponDiscount = appliedCoupon ? Number(appliedCoupon.discountAmount || 0) : 0
    const couponWinsOverTier = couponDiscount > tierTotal
    const payableAmount = appliedCoupon
      ? (couponWinsOverTier ? Number(appliedCoupon.amountAfterCoupon || 0) : amountAfterTier)
      : amountAfterTier
    const firstLoteName = cartPreview.items.find(it => (it as any).pricingEventState?.activeTier)?.pricingEventState?.name || null
    const firstLoteState = cartPreview.items.find(it => (it as any).pricingEventState?.activeTier)?.pricingEventState || null
    const acceptedIds = new Set(cartPreview.items.map(item => `${item.itemType}:${item.itemId}`))
    const acceptedLocalItems = cartItems.filter(item => acceptedIds.has(`${item.itemType}:${item.itemId}`))
    const suggestions = cartPreview.suggestions || []
    const alreadyOwnedItems = cartPreview.skippedItems.filter(item => item.reason === 'already_owned')
    const hasAlreadyOwnedItems = alreadyOwnedItems.length > 0

    const applySuggestion = (suggestion: CartUpgradeSuggestion) => {
      // Remove os materiais cobertos e adiciona o pacote em uma transação client-side.
      // A próxima ronda de preview vai re-validar tudo no servidor.
      for (const materialId of suggestion.cartMaterialIds) {
        removeItem('material', materialId)
      }
      addItem({
        itemType: 'package',
        itemId: suggestion.packageId,
        title: suggestion.packageTitle,
        pricing: 'paid',
        price: suggestion.packageEffectivePrice,
        coverImage: suggestion.packageCoverImage,
        materialCount: suggestion.totalMaterialsInPackage,
        effectivePrice: suggestion.packageEffectivePrice,
        originalPrice: suggestion.packageOriginalPrice,
        discountApplied: Math.max(0, suggestion.packageOriginalPrice - suggestion.packageEffectivePrice),
      })
    }

    const removeAlreadyOwnedItems = () => {
      for (const skipped of alreadyOwnedItems) {
        removeItem(skipped.itemType, skipped.itemId)
      }
    }

    const unlockFreeCart = async () => {
      setFreeCheckoutLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/materiais/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: cartPayload, paymentMethodId: 'free', couponCode: appliedCoupon?.code }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Erro ao liberar carrinho')
        clearCart()
        window.location.href = data.redirectTo || '/materiais?tab=mine&purchase=success'
      } catch (err: any) {
        setError(err?.message || 'Erro ao liberar carrinho')
      } finally {
        setFreeCheckoutLoading(false)
      }
    }

    return (
      <div style={pageStyle}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <button
            onClick={() => router.push('/materiais')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: 'transparent', border: 'none',
              color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '14px',
              marginBottom: '24px', padding: '0',
            }}
          >
            <ChevronLeft size={16} /> Voltar aos materiais
          </button>

          <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'white', marginBottom: '8px', letterSpacing: '-0.02em' }}>
            Finalizar carrinho
          </h1>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginBottom: suggestions.length > 0 ? '20px' : '32px' }}>
            {cartPreview.items.length} {cartPreview.items.length === 1 ? 'item selecionado' : 'itens selecionados'}
          </p>

          {hasTier && firstLoteState && (
            <div style={{ marginBottom: '20px' }}>
              <PricingEventCountdown state={firstLoteState as PricingEventStatePayload} compact />
            </div>
          )}

          {removedAccessibleItems.length > 0 && (
            <div style={{
              display: 'flex',
              gap: '10px',
              padding: '14px 16px',
              borderRadius: '14px',
              background: 'rgba(245,158,11,0.10)',
              border: '1px solid rgba(245,158,11,0.24)',
              color: 'rgba(253,230,138,0.98)',
              fontSize: '13px',
              lineHeight: 1.5,
              marginBottom: '20px',
            }}>
              <AlertCircle size={17} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 800 }}>Carrinho atualizado automaticamente</p>
                <p style={{ margin: '3px 0 0 0' }}>
                  {buildRemovedItemsMessage(removedAccessibleItems)} Eles foram retirados para evitar uma nova cobrança.
                </p>
              </div>
            </div>
          )}

          {suggestions.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
              {suggestions.map(suggestion => {
                const isSavings = suggestion.savings > 0
                const accent = isSavings ? '#34d399' : '#c4b5fd'
                const accentBg = isSavings ? 'rgba(52,211,153,0.10)' : 'rgba(139,92,246,0.10)'
                const accentBorder = isSavings ? 'rgba(52,211,153,0.28)' : 'rgba(139,92,246,0.28)'
                return (
                  <div
                    key={suggestion.packageId}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      padding: '14px 16px',
                      borderRadius: '14px',
                      background: accentBg,
                      border: `1px solid ${accentBorder}`,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <Sparkles size={16} style={{ color: accent, flexShrink: 0, marginTop: '2px' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.45 }}>
                          {suggestion.cartMaterialIds.length}{' '}
                          {suggestion.cartMaterialIds.length === 1 ? 'item do seu carrinho faz' : 'itens do seu carrinho fazem'}{' '}
                          parte do pacote{' '}
                          <strong style={{ color: accent }}>{suggestion.packageTitle}</strong>.
                          {isSavings ? (
                            <> Troque e economize <strong style={{ color: accent }}>{formatBRL(suggestion.savings)}</strong>
                              {suggestion.extraMaterialsCount > 0 && (
                                <> levando {suggestion.extraMaterialsCount}{' '}
                                {suggestion.extraMaterialsCount === 1 ? 'item extra' : 'itens extras'}</>
                              )}.
                            </>
                          ) : (
                            <> Por {formatBRL(Math.abs(suggestion.savings))} a mais você leva{' '}
                              {suggestion.extraMaterialsCount}{' '}
                              {suggestion.extraMaterialsCount === 1 ? 'item extra' : 'itens extras'}.
                            </>
                          )}
                        </p>
                        <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.45)' }}>
                          {formatBRL(suggestion.currentCost)} em itens soltos → {formatBRL(suggestion.packageEffectivePrice)} no pacote ({suggestion.totalMaterialsInPackage} itens no total)
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => applySuggestion(suggestion)}
                        style={{
                          flexShrink: 0,
                          padding: '7px 14px',
                          borderRadius: '10px',
                          border: 'none',
                          background: accent,
                          color: '#04130a',
                          fontSize: '12px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Trocar agora
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <CheckoutAddonOffers
            materialIds={cartPreview.items.filter(i => i.itemType === 'material').map(i => i.itemId)}
            packageIds={cartPreview.items.filter(i => i.itemType === 'package').map(i => i.itemId)}
          />

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] gap-6 items-start">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ ...glassCard, padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '10px',
                    background: 'rgba(52,211,153,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <ShoppingCart size={20} style={{ color: '#34d399' }} />
                  </div>
                  <span style={emeraldBadge}>Carrinho</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {cartPreview.items.map(previewItem => {
                    const local = acceptedLocalItems.find(item => item.itemType === previewItem.itemType && item.itemId === previewItem.itemId)
                    const price = Number(previewItem.price || 0)
                    const itemTierDiscount = Number(previewItem.tierDiscount || 0)
                    const itemTierFinal = Number(previewItem.priceAfterTier ?? price)
                    const itemHasTier = itemTierDiscount > 0 && previewItem.pricingEventState?.activeTier
                    const itemTierPct = previewItem.pricingEventState?.activeTier?.discountPercent || 0
                    return (
                      <div
                        key={`${previewItem.itemType}:${previewItem.itemId}`}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                          padding: '12px',
                          borderRadius: '14px',
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.08)',
                        }}
                      >
                        <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '10px',
                          background: 'rgba(52,211,153,0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          color: '#34d399',
                        }}>
                          {previewItem.itemType === 'package' ? <Package size={18} /> : <FileText size={18} />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', marginBottom: '2px' }}>
                            {previewItem.itemType === 'package' ? 'Pacote' : 'Material'}
                          </p>
                          <p style={{ fontSize: '14px', fontWeight: 700, color: 'white', lineHeight: 1.35 }}>
                            {previewItem.itemTitle}
                          </p>
                          {previewItem.discountApplied > 0 && (
                            <p style={{ fontSize: '12px', color: '#34d399', marginTop: '3px' }}>
                              Desconto aplicado: {formatBRL(previewItem.discountApplied)}
                            </p>
                          )}
                          {itemHasTier && (
                            <p style={{
                              fontSize: '11px',
                              marginTop: '4px',
                              color: '#34d399',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                            }}>
                              <Flame size={11} />
                              Lote "{previewItem.pricingEventState?.name}" · −{Math.round(itemTierPct)}% (−{formatBRL(itemTierDiscount)})
                            </p>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            {itemHasTier && (
                              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textDecoration: 'line-through' }}>
                                {formatBRL(price)}
                              </span>
                            )}
                            <span style={{ fontSize: '14px', fontWeight: 800, color: '#34d399' }}>
                              {itemTierFinal <= 0 ? 'Grátis' : formatBRL(itemTierFinal)}
                            </span>
                          </div>
                          {local && (
                            <button
                              type="button"
                              onClick={() => removeItem(local.itemType, local.itemId)}
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '9px',
                                border: '1px solid rgba(255,255,255,0.1)',
                                background: 'rgba(255,255,255,0.04)',
                                color: 'rgba(255,255,255,0.55)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                              }}
                              aria-label={`Remover ${local.title}`}
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                        </div>
                        {previewItem.itemType === 'package' && (
                          <PackageContents packageId={previewItem.itemId} variant="dark" />
                        )}
                      </div>
                    )
                  })}
                </div>

                {cartPreview.skippedItems.length > 0 && (
                  <div style={{
                    marginTop: '16px',
                    display: 'flex',
                    gap: '10px',
                    padding: '12px',
                    borderRadius: '12px',
                    background: 'rgba(245,158,11,0.08)',
                    border: '1px solid rgba(245,158,11,0.18)',
                    color: 'rgba(253,230,138,0.95)',
                    fontSize: '12px',
                    lineHeight: 1.5,
                  }}>
                    <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: '0 0 6px 0', fontWeight: 700 }}>
                        {hasAlreadyOwnedItems ? 'Seu carrinho precisa de revisão:' : 'Alguns itens foram ajustados automaticamente:'}
                      </p>
                      <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {cartPreview.skippedItems.map((skipped, idx) => {
                          const label = skipped.itemTitle || (skipped.itemType === 'package' ? 'Pacote' : 'Material')
                          let detail = ''
                          if (skipped.reason === 'included_in_cart_package') {
                            detail = ` foi removido porque já está incluso no pacote "${skipped.includedInPackageTitle || 'do carrinho'}".`
                          } else if (skipped.reason === 'already_owned') {
                            detail = ' já estava na sua conta.'
                          } else if (skipped.reason === 'duplicate') {
                            detail = ' foi enviado duplicado e considerado apenas uma vez.'
                          } else if (skipped.reason === 'not_found') {
                            detail = ' não está mais disponível.'
                          } else {
                            detail = ' foi ignorado (item inválido).'
                          }
                          return (
                            <li key={`${skipped.itemType}:${skipped.itemId}:${idx}`}>
                              <strong>{label}</strong>{detail}
                            </li>
                          )
                        })}
                      </ul>
                      {hasAlreadyOwnedItems && (
                        <button
                          type="button"
                          onClick={removeAlreadyOwnedItems}
                          style={{
                            marginTop: '10px',
                            height: '34px',
                            borderRadius: '10px',
                            border: '1px solid rgba(253,230,138,0.28)',
                            background: 'rgba(245,158,11,0.12)',
                            color: 'rgba(253,230,138,0.98)',
                            fontSize: '12px',
                            fontWeight: 800,
                            padding: '0 12px',
                            cursor: 'pointer',
                          }}
                        >
                          Remover itens já adquiridos
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div style={{
                  marginTop: '18px',
                  padding: '16px',
                  background: 'rgba(52,211,153,0.06)',
                  border: '1px solid rgba(52,211,153,0.12)',
                  borderRadius: '12px',
                }}>
                  {hasTier && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: '6px',
                    }}>
                      <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>Sem o lote</span>
                      <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', textDecoration: 'line-through' }}>
                        {formatBRL(amount)}
                      </span>
                    </div>
                  )}
                  {hasTier && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: '8px',
                    }}>
                      <span style={{
                        fontSize: '12px',
                        color: '#34d399',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                      }}>
                        <Flame size={12} />
                        Lote {firstLoteName ? `"${firstLoteName}"` : 'ativo'}
                      </span>
                      <span style={{ fontSize: '13px', color: '#34d399', fontWeight: 800 }}>
                        − {formatBRL(tierTotal)}
                      </span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)' }}>Total recalculado</span>
                    <span style={{ fontSize: '28px', fontWeight: 900, color: '#34d399', letterSpacing: '-0.03em' }}>
                      {payableAmount <= 0 ? 'Grátis' : formatBRL(payableAmount)}
                    </span>
                  </div>
                  {appliedCoupon && couponWinsOverTier && (
                    <p style={{ fontSize: '12px', color: '#34d399', marginTop: '5px', fontWeight: 700 }}>
                      Cupom {appliedCoupon.code}: − {formatBRL(appliedCoupon.discountAmount)} (vence o lote)
                    </p>
                  )}
                  {appliedCoupon && !couponWinsOverTier && hasTier && (
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)', marginTop: '5px' }}>
                      Cupom {appliedCoupon.code} desativado: o desconto do lote é maior.
                    </p>
                  )}
                  {appliedCoupon && !hasTier && (
                    <p style={{ fontSize: '12px', color: '#34d399', marginTop: '5px', fontWeight: 700 }}>
                      Cupom {appliedCoupon.code}: − {formatBRL(appliedCoupon.discountAmount)}
                    </p>
                  )}
                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginTop: '4px' }}>
                    Pagamento único · Acesso permanente
                  </p>
                </div>
                <div style={{ marginTop: '14px' }}>
                  <CouponBox
                    amount={amount}
                    payload={{ items: cartPayload, ...(isGuest && buyer.email ? { buyerEmail: buyer.email } : {}) }}
                    appliedCoupon={appliedCoupon}
                    onApplied={setAppliedCoupon}
                    onRemoved={() => setAppliedCoupon(null)}
                    initialCode={couponFromQuery}
                  />
                </div>
              </div>
            </div>

            <div style={{ ...glassCard, padding: '28px' }}>
              {hasAlreadyOwnedItems ? (
                <div style={{ textAlign: 'center', color: 'white' }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '16px',
                    background: 'rgba(245,158,11,0.12)',
                    border: '1px solid rgba(245,158,11,0.22)',
                    margin: '0 auto 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fbbf24',
                  }}>
                    <AlertCircle size={24} />
                  </div>
                  <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px' }}>Revise o carrinho</h2>
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)', marginBottom: '20px' }}>
                    Você já possui {alreadyOwnedItems.length === 1 ? 'um item deste carrinho' : 'alguns itens deste carrinho'}. Remova antes de finalizar a compra.
                  </p>
                  <button
                    type="button"
                    onClick={removeAlreadyOwnedItems}
                    style={{
                      width: '100%',
                      height: '48px',
                      borderRadius: '14px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #d97706, #fbbf24)',
                      color: '#04130a',
                      fontWeight: 900,
                      cursor: 'pointer',
                    }}
                  >
                    Remover itens já adquiridos
                  </button>
                </div>
              ) : payableAmount <= 0 ? (
                <div style={{ textAlign: 'center', color: 'white' }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '16px',
                    background: 'rgba(52,211,153,0.12)',
                    border: '1px solid rgba(52,211,153,0.22)',
                    margin: '0 auto 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#34d399',
                  }}>
                    <Check size={24} />
                  </div>
                  <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px' }}>Carrinho gratuito</h2>
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)', marginBottom: '20px' }}>
                    Confirme para liberar os itens disponíveis na sua conta.
                  </p>
                  <button
                    onClick={unlockFreeCart}
                    disabled={freeCheckoutLoading}
                    style={{
                      width: '100%',
                      height: '48px',
                      borderRadius: '14px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #059669, #34d399)',
                      color: 'white',
                      fontWeight: 800,
                      cursor: freeCheckoutLoading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {freeCheckoutLoading ? 'Liberando...' : 'Liberar itens'}
                  </button>
                </div>
              ) : isGuest === null ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}>
                  <Loader2 size={28} style={{ color: '#34d399', animation: 'spin 1s linear infinite' }} />
                </div>
              ) : isGuest ? (
                !buyerConfirmed ? (
                  <GuestBuyerForm buyer={buyer} setBuyer={setBuyer} onConfirm={() => setBuyerConfirmed(true)} />
                ) : (
                  <>
                    <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '10px 12px', marginBottom: '16px', fontSize: '12px', color: 'rgba(255,255,255,0.55)' }}>
                      Comprando como <strong style={{ color: 'white' }}>{buyer.name}</strong> · {buyer.email}
                      <button onClick={() => setBuyerConfirmed(false)} style={{ marginLeft: '8px', background: 'transparent', border: 'none', color: '#34d399', cursor: 'pointer', fontSize: '12px', textDecoration: 'underline' }}>editar</button>
                    </div>
                    <MercadoPagoCheckout
                      key={`cart-guest-${payableAmount}-${appliedCoupon?.code || 'sem-cupom'}`}
                      publicKey={publicKey}
                      amount={payableAmount}
                      description={`Carrinho DomineAqui - ${cartPreview.payableItems.length} itens`}
                      endpoint="/api/serial-keys/checkout"
                      extraBody={{ cart: cartPayload, buyerName: buyer.name, buyerEmail: buyer.email, buyerPhone: buyer.phone, couponCode: appliedCoupon?.code }}
                      payerEmailHint={buyer.email}
                      payerNameHint={buyer.name}
                      analytics={{ productId: 'cart', productTitle: `Carrinho (${cartPreview.items.length} itens)`, productType: 'material', source: 'Serial Key' }}
                      onApproved={(resp) => {
                        clearCart()
                        window.location.href = (resp as any).successRedirect || '/compra/aprovada'
                      }}
                    />
                  </>
                )
              ) : (
                <>
                <CheckoutAccountNotice tone="dark" className="mb-4" />
                <UnifiedCheckoutPayment
                  publicKey={publicKey}
                  digitalPayable={payableAmount}
                  digitalBody={{ items: cartPayload, couponCode: appliedCoupon?.code }}
                  purchaseMaterialIds={cartPreview.items.filter(i => i.itemType === 'material').map(i => i.itemId)}
                  purchasePackageIds={cartPreview.items.filter(i => i.itemType === 'package').map(i => i.itemId)}
                  includeStandalone={true}
                  description={`Carrinho DomineAqui - ${cartPreview.payableItems.length} itens`}
                  onSuccess={(resp) => {
                    clearCart()
                    setTimeout(() => {
                      window.location.href = resp.successRedirect || '/materiais?tab=mine&purchase=success'
                    }, 1200)
                  }}
                  fallback={(
                    <MercadoPagoCheckout
                      key={`cart-${payableAmount}-${appliedCoupon?.code || 'sem-cupom'}`}
                      publicKey={publicKey}
                      amount={payableAmount}
                      description={`Carrinho DomineAqui - ${cartPreview.payableItems.length} itens`}
                      endpoint="/api/materiais/checkout"
                      extraBody={{ items: cartPayload, couponCode: appliedCoupon?.code }}
                      analytics={{
                        productId: 'cart',
                        productTitle: `Carrinho (${cartPreview.items.length} itens)`,
                        productType: 'material',
                        source: 'Carrinho',
                      }}
                      onApproved={(resp) => {
                        clearCart()
                        setTimeout(() => {
                          window.location.href = resp.successRedirect || '/materiais?tab=mine&purchase=success'
                        }, 1200)
                      }}
                    />
                  )}
                />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const originalPrice = Number(item.originalPackagePrice ?? item.price ?? 0)
  const priceBeforeTier = Number(item.effectivePrice ?? item.price ?? 0)
  const discountApplied = Number(item.discountApplied ?? 0)
  const hasOverlapDiscount = itemType === 'package' && discountApplied > 0

  // Lote dinâmico por evento — aplica desconto progressivo (regra "maior dos dois" vs cupom no servidor).
  const eventState: PricingEventStatePayload | null = item.pricingEventState || null
  const tierPct = eventState?.activeTier?.discountPercent || 0
  const hasTier =
    !!eventState?.activeTier && eventState.isActive !== false && tierPct > 0 && priceBeforeTier > 0
  const tierFinalPrice = hasTier
    ? Math.max(0, Math.round(priceBeforeTier * (1 - tierPct / 100) * 100) / 100)
    : priceBeforeTier
  const tierDiscountAmount = hasTier ? Math.max(0, priceBeforeTier - tierFinalPrice) : 0

  // O cupom é avaliado separadamente; o servidor escolhe o maior desconto.
  // Aqui, no UI, mostramos o que aparece quando o usuário aplica um cupom
  // (caso vença o lote) ou o tier (caso contrário).
  const couponWinsOverTier = appliedCoupon
    ? Number(appliedCoupon.discountAmount || 0) > tierDiscountAmount
    : false
  const baseForCoupon = appliedCoupon ? Number(appliedCoupon.amountAfterCoupon || 0) : priceBeforeTier
  const price = couponWinsOverTier ? baseForCoupon : tierFinalPrice
  const payablePrice = appliedCoupon ? (couponWinsOverTier ? baseForCoupon : tierFinalPrice) : tierFinalPrice
  const typeLabel = itemType === 'package' ? 'Pacote' : 'Material'

  const unlockFreeSingle = async () => {
    setFreeCheckoutLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/materiais/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemType, itemId, paymentMethodId: 'free', couponCode: appliedCoupon?.code }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao liberar item')
      window.location.href = data.redirectTo || '/materiais?purchase=success'
    } catch (err: any) {
      setError(err?.message || 'Erro ao liberar item')
    } finally {
      setFreeCheckoutLoading(false)
    }
  }

  return (
    <div style={pageStyle}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Back button */}
        <button
          onClick={() => router.push('/materiais')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'transparent', border: 'none',
            color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '14px',
            marginBottom: '24px', padding: '0',
          }}
        >
          <ChevronLeft size={16} /> Voltar aos materiais
        </button>

        {/* Page title */}
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'white', marginBottom: '8px', letterSpacing: '-0.02em' }}>
          Finalizar compra
        </h1>
        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginBottom: '32px' }}>
          Você está adquirindo: <strong style={{ color: '#34d399' }}>{item.title}</strong>
        </p>

        <CheckoutAddonOffers
          materialIds={itemType === 'material' ? [itemId] : []}
          packageIds={itemType === 'package' ? [itemId] : []}
        />

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-6 items-start">
          {/* Left: Item summary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ ...glassCard, padding: '28px' }}>
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '10px',
                    background: 'rgba(52,211,153,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {itemType === 'package'
                      ? <Package size={20} style={{ color: '#34d399' }} />
                      : <FileText size={20} style={{ color: '#34d399' }} />
                    }
                  </div>
                  <span style={emeraldBadge}>{typeLabel}</span>
                </div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'white', letterSpacing: '-0.01em', lineHeight: '1.3' }}>
                  {item.title}
                </h2>
              </div>

              {hasTier && eventState && (
                <div style={{ marginBottom: '16px' }}>
                  <PricingEventCountdown state={eventState} compact />
                </div>
              )}

              {/* Price */}
              <div style={{
                padding: '16px',
                background: 'rgba(52,211,153,0.06)',
                border: '1px solid rgba(52,211,153,0.12)',
                borderRadius: '12px',
                marginBottom: '16px',
              }}>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '2px' }}>Valor</p>
                {(hasOverlapDiscount || appliedCoupon || hasTier) && (
                  <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', textDecoration: 'line-through', marginBottom: '2px' }}>
                    {formatBRL(hasTier ? priceBeforeTier : appliedCoupon ? priceBeforeTier : originalPrice)}
                  </p>
                )}
                <p style={{ fontSize: '32px', fontWeight: 800, color: '#34d399', letterSpacing: '-0.03em' }}>
                  {payablePrice <= 0 ? 'Grátis' : formatBRL(payablePrice)}
                </p>
                {hasOverlapDiscount && (
                  <p style={{ fontSize: '12px', color: '#34d399', marginTop: '4px', fontWeight: 600 }}>
                    Desconto de R$ {discountApplied.toFixed(2).replace('.', ',')} por itens já adquiridos
                  </p>
                )}
                {hasTier && !couponWinsOverTier && (
                  <p style={{
                    fontSize: '12px',
                    color: '#34d399',
                    marginTop: '6px',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}>
                    <Flame size={13} />
                    Lote "{eventState?.name}" · −{Math.round(tierPct)}% ({formatBRL(tierDiscountAmount)})
                  </p>
                )}
                {appliedCoupon && couponWinsOverTier && (
                  <p style={{ fontSize: '12px', color: '#34d399', marginTop: '4px', fontWeight: 600 }}>
                    Cupom {appliedCoupon.code}: − {formatBRL(appliedCoupon.discountAmount)} (vence o lote)
                  </p>
                )}
                {appliedCoupon && !couponWinsOverTier && hasTier && (
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)', marginTop: '4px' }}>
                    Cupom {appliedCoupon.code} desativado: o desconto do lote é maior.
                  </p>
                )}
                {appliedCoupon && !hasTier && (
                  <p style={{ fontSize: '12px', color: '#34d399', marginTop: '4px', fontWeight: 600 }}>
                    Cupom {appliedCoupon.code}: − {formatBRL(appliedCoupon.discountAmount)}
                  </p>
                )}
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginTop: '6px' }}>Pagamento único · Acesso permanente</p>
              </div>

              <CouponBox
                amount={price}
                payload={{ itemType, itemId }}
                appliedCoupon={appliedCoupon}
                onApplied={setAppliedCoupon}
                onRemoved={() => setAppliedCoupon(null)}
              />

              {item.description && (
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)', lineHeight: '1.6' }}>
                  {item.description}
                </p>
              )}
            </div>

            {/* Trust badges */}
            <div style={{ ...glassCard, padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                <span style={{ fontSize: '16px' }}>🔒</span>
                <span>Ambiente 100% seguro · Mercado Pago</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                <span style={{ fontSize: '16px' }}>📥</span>
                <span>Acesso imediato após confirmação do pagamento</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                <span style={{ fontSize: '16px' }}>🛡️</span>
                <span>Dados criptografados · Nunca armazenamos seu cartão</span>
              </div>
            </div>
          </div>

          {/* Right: Payment */}
          <div style={{ ...glassCard, padding: '28px' }}>
            <>
            <CheckoutAccountNotice tone="dark" className="mb-4" />
            <UnifiedCheckoutPayment
              publicKey={publicKey}
              digitalPayable={Math.max(0, payablePrice)}
              digitalBody={{ itemType, itemId, couponCode: appliedCoupon?.code }}
              purchaseMaterialIds={itemType === 'material' ? [itemId] : ((item.materialIds || []) as any[]).map(String)}
              purchasePackageIds={itemType === 'package' ? [itemId] : []}
              includeStandalone={false}
              description={item.title}
              onSuccess={(resp) => {
                setTimeout(() => {
                  window.location.href = resp.successRedirect || '/materiais?purchase=success'
                }, 1200)
              }}
              fallback={payablePrice <= 0 ? (
              <div style={{ textAlign: 'center', color: 'white' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: 'rgba(52,211,153,0.12)',
                  border: '1px solid rgba(52,211,153,0.22)',
                  margin: '0 auto 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#34d399',
                }}>
                  <Check size={24} />
                </div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px' }}>Compra gratuita</h2>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)', marginBottom: '20px' }}>
                  Confirme para liberar o acesso na sua conta.
                </p>
                <button
                  onClick={unlockFreeSingle}
                  disabled={freeCheckoutLoading}
                  style={{
                    width: '100%',
                    height: '48px',
                    borderRadius: '14px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #059669, #34d399)',
                    color: 'white',
                    fontWeight: 800,
                    cursor: freeCheckoutLoading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {freeCheckoutLoading ? 'Liberando...' : 'Liberar acesso'}
                </button>
              </div>
            ) : (
              <MercadoPagoCheckout
                key={`single-${payablePrice}-${appliedCoupon?.code || 'sem-cupom'}`}
                publicKey={publicKey}
                amount={payablePrice}
                description={item.title}
                endpoint="/api/materiais/checkout"
                extraBody={{ itemType, itemId, couponCode: appliedCoupon?.code }}
                analytics={{
                  productId: itemId,
                  productTitle: item.title,
                  productType: itemType === 'package' ? 'package' : item.type === 'flashcard_deck' ? 'flashcard' : 'material',
                  source: itemType === 'package' ? 'Pacote' : 'Compra direta',
                }}
                onApproved={(resp) => {
                  setTimeout(() => {
                    window.location.href = resp.successRedirect || '/materiais?purchase=success'
                  }, 1200)
                }}
              />
            )}
            />
            </>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Formulário de dados do comprador (visitante) para compra via Serial Key. */
function GuestBuyerForm({
  buyer,
  setBuyer,
  onConfirm,
}: {
  buyer: { name: string; email: string; phone: string }
  setBuyer: (b: { name: string; email: string; phone: string }) => void
  onConfirm: () => void
}) {
  const [touched, setTouched] = useState(false)
  const digits = (v: string) => v.replace(/\D/g, '')
  const nameValid = buyer.name.trim().includes(' ') && buyer.name.trim().length >= 3
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyer.email.trim())
  const phoneValid = digits(buyer.phone).length >= 10 && digits(buyer.phone).length <= 15
  const valid = nameValid && emailValid && phoneValid

  const label: React.CSSProperties = { display: 'block', fontSize: '12px', fontWeight: 600, color: 'rgba(52,211,153,0.8)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }
  const input: React.CSSProperties = { width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(52,211,153,0.2)', color: 'white', borderRadius: '10px', padding: '12px 14px', fontSize: '14px', outline: 'none' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div>
        <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'white', marginBottom: '4px' }}>Seus dados</h2>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
          Você comprará sem login. Enviaremos sua(s) Serial Key(s) por e-mail — uma para cada produto.
        </p>
      </div>
      <div>
        <label style={label}>Nome completo</label>
        <input value={buyer.name} onChange={(e) => setBuyer({ ...buyer, name: e.target.value })} onBlur={() => setTouched(true)} placeholder="Seu nome completo" style={input} />
        {touched && !nameValid && <span style={{ fontSize: '11px', color: '#f87171' }}>Informe nome e sobrenome.</span>}
      </div>
      <div>
        <label style={label}>E-mail</label>
        <input value={buyer.email} onChange={(e) => setBuyer({ ...buyer, email: e.target.value })} onBlur={() => setTouched(true)} type="email" placeholder="seu@email.com" style={input} />
        {touched && !emailValid && <span style={{ fontSize: '11px', color: '#f87171' }}>E-mail inválido.</span>}
      </div>
      <div>
        <label style={label}>Telefone (com DDD)</label>
        <input value={buyer.phone} onChange={(e) => setBuyer({ ...buyer, phone: e.target.value })} onBlur={() => setTouched(true)} placeholder="(00) 00000-0000" style={input} />
        {touched && !phoneValid && <span style={{ fontSize: '11px', color: '#f87171' }}>Telefone inválido.</span>}
      </div>
      <button
        onClick={() => { setTouched(true); if (valid) onConfirm() }}
        disabled={!valid}
        style={{ background: 'linear-gradient(135deg, #059669, #34d399)', boxShadow: '0 0 30px rgba(52,211,153,0.3)', border: 'none', borderRadius: '12px', color: 'white', fontWeight: 700, fontSize: '15px', padding: '14px 24px', width: '100%', cursor: valid ? 'pointer' : 'not-allowed', opacity: valid ? 1 : 0.6 }}
      >
        Ir para pagamento
      </button>
    </div>
  )
}
