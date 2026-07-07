'use client'

/**
 * Bloco de pagamento UNIFICADO (digital + físico numa compra) para a página de
 * checkout de materiais (tema escuro, estilos inline). Só entra em ação quando há
 * itens físicos elegíveis no carrinho da loja; caso contrário renderiza `fallback`
 * (o pagamento digital normal). Coleta a entrega (retirada/endereço + frete) e paga
 * tudo junto via /api/materiais/checkout com `extraBody.physical`.
 */

import { useMemo, type ReactNode } from 'react'
import { MapPin, Home, Truck, Clock, Printer } from 'lucide-react'
import { MercadoPagoCheckout } from '@/components/payments/mercado-pago-checkout'
import { useShopCart } from '@/context/ShopCartContext'
import { useDeliverySelection } from '@/components/shop/use-delivery-selection'
import { UFS, resolveFreight } from '@/lib/shop'

const brl = (n: number) => `R$ ${Number(n).toFixed(2).replace('.', ',')}`
const inputStyle: React.CSSProperties = {
  height: 38, borderRadius: 9, border: '1px solid rgba(255,255,255,0.14)',
  background: 'rgba(0,0,0,0.25)', color: 'white', fontSize: 13, padding: '0 10px', width: '100%',
}

export function UnifiedCheckoutPayment({
  publicKey,
  digitalPayable,
  digitalBody,
  purchaseMaterialIds,
  purchasePackageIds,
  includeStandalone,
  description,
  payerNameHint,
  onSuccess,
  fallback,
}: {
  publicKey: string
  digitalPayable: number
  digitalBody: Record<string, any>
  purchaseMaterialIds: string[]
  purchasePackageIds?: string[]
  includeStandalone: boolean
  description: string
  payerNameHint?: string
  onSuccess: (resp: any) => void
  fallback: ReactNode
}) {
  const { items, removeItem } = useShopCart()

  const eligible = useMemo(() => {
    const matSet = new Set(purchaseMaterialIds)
    const pkgSet = new Set(purchasePackageIds || [])
    return items.filter((si) =>
      si.isAddon
        ? !!(si.linkedMaterialId && matSet.has(si.linkedMaterialId)) ||
          !!(si.linkedPackageId && pkgSet.has(si.linkedPackageId))
        : includeStandalone
    )
  }, [items, purchaseMaterialIds, purchasePackageIds, includeStandalone])

  const physicalSubtotal = useMemo(
    () => Math.round(eligible.reduce((s, i) => s + i.price * i.quantity, 0) * 100) / 100,
    [eligible]
  )

  const delivery = useDeliverySelection(physicalSubtotal)

  // Sem itens físicos elegíveis → pagamento digital normal.
  if (eligible.length === 0) return <>{fallback}</>

  const combined = Math.round((digitalPayable + physicalSubtotal + delivery.freight) * 100) / 100
  const { settings, deliveryType, setDeliveryType, pickupPointId, setPickupPointId, deliveryMethodId, setDeliveryMethodId, address, setAddress } = delivery

  const physicalPayload = {
    items: eligible.map((i) => ({ productId: i.productId, quantity: i.quantity, versionId: i.versionId })),
    ...delivery.deliveryPayload,
  }

  return (
    <div>
      {/* Itens físicos incluídos */}
      <div style={{ marginBottom: 14, borderRadius: 12, border: '1px solid rgba(70,129,82,0.35)', background: 'rgba(70,129,82,0.10)', padding: 12 }}>
        <p style={{ margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 800, color: 'white' }}>
          <Printer size={14} style={{ color: '#7ee2a0' }} /> Impressos nesta compra
        </p>
        {eligible.map((i) => (
          <div key={`${i.productId}::${i.versionId || ''}`} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12, color: 'rgba(255,255,255,0.8)', marginBottom: 3 }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {i.quantity}× {i.title}{i.versionName ? ` (${i.versionName})` : ''}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <strong style={{ color: 'white' }}>{brl(i.price * i.quantity)}</strong>
              <button onClick={() => removeItem(i.productId, i.versionId)} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 11 }}>remover</button>
            </span>
          </div>
        ))}
      </div>

      {/* Entrega */}
      <div style={{ marginBottom: 14 }}>
        <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'rgba(255,255,255,0.6)' }}>Entrega dos impressos</p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <button onClick={() => setDeliveryType('pickup')} style={tabStyle(deliveryType === 'pickup')}>
            <MapPin size={15} /> Retirar
          </button>
          <button onClick={() => setDeliveryType('shipping')} style={tabStyle(deliveryType === 'shipping')}>
            <Home size={15} /> Receber em casa
          </button>
        </div>

        {deliveryType === 'pickup' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {(settings?.pickupPoints || []).length === 0 && <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Nenhum ponto disponível.</p>}
            {(settings?.pickupPoints || []).map((pp) => (
              <label key={pp.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', cursor: 'pointer', borderRadius: 9, border: `1px solid ${pickupPointId === pp.id ? 'rgba(70,129,82,0.7)' : 'rgba(255,255,255,0.12)'}`, padding: 10, background: pickupPointId === pp.id ? 'rgba(70,129,82,0.12)' : 'transparent' }}>
                <input type="radio" checked={pickupPointId === pp.id} onChange={() => setPickupPointId(pp.id)} style={{ marginTop: 3 }} />
                <span>
                  <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'white' }}>{pp.name}</span>
                  {pp.address && <span style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{pp.address}</span>}
                </span>
              </label>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              <input style={inputStyle} placeholder="Nome completo" value={address.name} onChange={(e) => setAddress({ ...address, name: e.target.value })} />
              <input style={inputStyle} placeholder="Telefone" value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value })} />
              <input style={inputStyle} placeholder="CEP" value={address.cep} onChange={(e) => setAddress({ ...address, cep: e.target.value })} />
              <input style={inputStyle} placeholder="Cidade" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} />
              <input style={inputStyle} placeholder="Rua" value={address.street} onChange={(e) => setAddress({ ...address, street: e.target.value })} />
              <input style={inputStyle} placeholder="Número" value={address.number} onChange={(e) => setAddress({ ...address, number: e.target.value })} />
              <input style={inputStyle} placeholder="Bairro" value={address.district} onChange={(e) => setAddress({ ...address, district: e.target.value })} />
              <input style={inputStyle} placeholder="Complemento" value={address.complement} onChange={(e) => setAddress({ ...address, complement: e.target.value })} />
              <select style={inputStyle} value={address.uf} onChange={(e) => setAddress({ ...address, uf: e.target.value })}>
                <option value="" style={{ color: '#000' }}>UF</option>
                {UFS.map((uf) => <option key={uf} value={uf} style={{ color: '#000' }}>{uf}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(settings?.deliveryMethods || []).length === 0 && <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Nenhum método configurado.</p>}
              {(settings?.deliveryMethods || []).map((m) => {
                const f = m.freeShipping ? 0 : resolveFreight(m, address.uf)
                return (
                  <label key={m.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', cursor: 'pointer', borderRadius: 9, border: `1px solid ${deliveryMethodId === m.id ? 'rgba(70,129,82,0.7)' : 'rgba(255,255,255,0.12)'}`, padding: 10 }}>
                    <span style={{ display: 'flex', gap: 8 }}>
                      <input type="radio" checked={deliveryMethodId === m.id} onChange={() => setDeliveryMethodId(m.id)} />
                      <span>
                        <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'white' }}>{m.name}</span>
                        <span style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{m.estimatedDaysMin}–{m.estimatedDaysMax} dias úteis</span>
                      </span>
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: m.freeShipping ? '#7ee2a0' : 'white' }}>
                      {m.freeShipping ? 'Grátis' : address.uf ? (f > 0 ? brl(f) : 'Grátis') : '—'}
                    </span>
                  </label>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Resumo combinado */}
      <div style={{ marginBottom: 14, fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
        <Row label="Digital" value={brl(digitalPayable)} />
        <Row label="Impressos" value={brl(physicalSubtotal)} />
        <Row label="Frete" value={deliveryType === 'pickup' ? 'Grátis' : address.uf || pickupPointId ? (delivery.freight > 0 ? brl(delivery.freight) : 'Grátis') : '—'} />
        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: 6, paddingTop: 6, fontSize: 16, fontWeight: 800, color: 'white' }}>
          <span>Total</span><span>{brl(combined)}</span>
        </div>
      </div>

      {!delivery.valid ? (
        <div style={{ borderRadius: 10, background: 'rgba(255,255,255,0.05)', padding: '12px 14px', fontSize: 12, color: 'rgba(255,255,255,0.6)', textAlign: 'center' }}>
          Escolha a entrega dos impressos {deliveryType === 'shipping' ? '(endereço + método)' : ''} para pagar.
        </div>
      ) : (
        <MercadoPagoCheckout
          key={`unified-${combined}-${deliveryType}-${deliveryMethodId}-${pickupPointId}-${address.uf}`}
          publicKey={publicKey}
          amount={combined}
          description={description}
          endpoint="/api/materiais/checkout"
          extraBody={{ ...digitalBody, physical: physicalPayload }}
          payerNameHint={payerNameHint}
          analytics={{ productType: 'material', source: 'Checkout unificado' }}
          onApproved={(resp) => {
            eligible.forEach((i) => removeItem(i.productId, i.versionId))
            onSuccess(resp)
          }}
        />
      )}

      <p style={{ margin: '12px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
        <Truck size={12} /> {settings?.sellerFooter || 'Entregue por DomineAqui LTDA — Rio de Janeiro'}
      </p>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
      <span>{label}</span><span style={{ color: 'white' }}>{value}</span>
    </div>
  )
}

function tabStyle(active: boolean): React.CSSProperties {
  return {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    height: 40, borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700,
    border: `1.5px solid ${active ? 'rgba(70,129,82,0.8)' : 'rgba(255,255,255,0.14)'}`,
    background: active ? 'rgba(70,129,82,0.15)' : 'transparent',
    color: active ? 'white' : 'rgba(255,255,255,0.6)',
  }
}
