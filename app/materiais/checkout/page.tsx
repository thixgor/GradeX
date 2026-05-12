'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, ChevronLeft, FileText, Package } from 'lucide-react'
import { MercadoPagoCheckout } from '@/components/payments/mercado-pago-checkout'

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

export default function MateriaisCheckoutPage() {
  const router = useRouter()
  const params = useSearchParams()
  const itemType = (params.get('type') as 'material' | 'package') || 'material'
  const itemId = params.get('id') || ''

  const [item, setItem] = useState<any>(null)
  const [publicKey, setPublicKey] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  function getOwnedRedirect(found: any): string {
    if (itemType === 'package') return `/pacotes/${itemId}`
    if (found?.type === 'flashcard_deck') {
      if (found?.downloadUrl) return found.downloadUrl
      if (found?.linkedDeckSlug) return `/flashcards/d/${found.linkedDeckSlug}`
    }
    return `/materiais/${itemId}`
  }

  useEffect(() => {
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
          }
        } else if (itemType === 'material' && itemResp?.material) {
          found = itemResp.material
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
          router.replace(getOwnedRedirect(found))
          return
        }
        setItem(found)
        setPublicKey(pkResp.publicKey || '')
      })
      .catch(err => setError(String(err?.message || err)))
      .finally(() => setLoading(false))
  }, [itemId, itemType])

  useEffect(() => {
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
  }, [item, itemId, itemType])

  if (loading) {
    return (
      <div style={pageStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <Loader2 size={32} style={{ color: '#34d399', animation: 'spin 1s linear infinite' }} />
        </div>
      </div>
    )
  }

  if (error || !item) {
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

  const originalPrice = Number(item.originalPackagePrice ?? item.price ?? 0)
  const price = Number(item.effectivePrice ?? item.price ?? 0)
  const discountApplied = Number(item.discountApplied ?? 0)
  const hasOverlapDiscount = itemType === 'package' && discountApplied > 0
  const typeLabel = itemType === 'package' ? 'Pacote' : 'Material'

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

              {/* Price */}
              <div style={{
                padding: '16px',
                background: 'rgba(52,211,153,0.06)',
                border: '1px solid rgba(52,211,153,0.12)',
                borderRadius: '12px',
                marginBottom: '16px',
              }}>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '2px' }}>Valor</p>
                {hasOverlapDiscount && (
                  <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', textDecoration: 'line-through', marginBottom: '2px' }}>
                    R$ {originalPrice.toFixed(2).replace('.', ',')}
                  </p>
                )}
                <p style={{ fontSize: '32px', fontWeight: 800, color: '#34d399', letterSpacing: '-0.03em' }}>
                  R$ {price.toFixed(2).replace('.', ',')}
                </p>
                {hasOverlapDiscount && (
                  <p style={{ fontSize: '12px', color: '#34d399', marginTop: '4px', fontWeight: 600 }}>
                    Desconto de R$ {discountApplied.toFixed(2).replace('.', ',')} por itens já adquiridos
                  </p>
                )}
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>Pagamento único · Acesso permanente</p>
              </div>

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
            <MercadoPagoCheckout
              publicKey={publicKey}
              amount={price}
              description={item.title}
              endpoint="/api/materiais/checkout"
              extraBody={{ itemType, itemId }}
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
          </div>
        </div>
      </div>
    </div>
  )
}
