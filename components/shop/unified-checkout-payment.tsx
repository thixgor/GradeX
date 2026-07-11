'use client'

/**
 * Bloco de pagamento UNIFICADO (digital + físico numa compra) para a página de
 * checkout de materiais (tema escuro, estilos inline). Só entra em ação quando há
 * itens físicos elegíveis no carrinho da loja; caso contrário renderiza `fallback`
 * (o pagamento digital normal). Coleta a entrega (retirada/endereço + frete) e paga
 * tudo junto via /api/materiais/checkout com `extraBody.physical`.
 */

import { useMemo, type ReactNode } from 'react'
import { MapPin, Home, Truck, Clock, Printer, CalendarClock } from 'lucide-react'
import { MercadoPagoCheckout } from '@/components/payments/mercado-pago-checkout'
import { useShopCart } from '@/context/ShopCartContext'
import { useDeliverySelection } from '@/components/shop/use-delivery-selection'
import { UFS, resolveFreight, estimateDeliveryDate } from '@/lib/shop'

const brl = (n: number) => `R$ ${Number(n).toFixed(2).replace('.', ',')}`
const inputStyle: React.CSSProperties = {
  height: 38, borderRadius: 9, border: '1px solid hsl(var(--border))',
  background: 'hsl(var(--background))', color: 'hsl(var(--foreground))', fontSize: 13, padding: '0 10px', width: '100%',
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

  const matSet = useMemo(() => new Set(purchaseMaterialIds), [purchaseMaterialIds])
  const pkgSet = useMemo(() => new Set(purchasePackageIds || []), [purchasePackageIds])

  // Preço unitário: add-on cujo material/pacote está na compra → preço de add-on;
  // caso contrário, preço cheio (avulso).
  const unitOf = useMemo(
    () => (si: { isAddon?: boolean; linkedMaterialId?: string; linkedPackageId?: string; price: number; addonPrice?: number }) => {
      const linked =
        !!si.isAddon &&
        (!!(si.linkedMaterialId && matSet.has(si.linkedMaterialId)) || !!(si.linkedPackageId && pkgSet.has(si.linkedPackageId)))
      return linked ? (si.addonPrice ?? si.price) : si.price
    },
    [matSet, pkgSet]
  )

  const eligible = useMemo(() => {
    // No carrinho (includeStandalone) todos os físicos entram; no item único só os
    // add-ons vinculados àquele material/pacote.
    return items.filter((si) =>
      includeStandalone
        ? true
        : !!si.isAddon &&
          (!!(si.linkedMaterialId && matSet.has(si.linkedMaterialId)) || !!(si.linkedPackageId && pkgSet.has(si.linkedPackageId)))
    )
  }, [items, matSet, pkgSet, includeStandalone])

  const physicalSubtotal = useMemo(
    () => Math.round(eligible.reduce((s, i) => s + unitOf(i) * i.quantity, 0) * 100) / 100,
    [eligible, unitOf]
  )

  const maxProductionDays = useMemo(
    () => eligible.reduce((m, i) => (i.madeToOrder && i.productionDays ? Math.max(m, i.productionDays) : m), 0),
    [eligible]
  )
  const anyMadeToOrder = useMemo(() => eligible.some((i) => i.madeToOrder), [eligible])

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
      <div style={{ marginBottom: 14, borderRadius: 12, border: '1px solid hsl(var(--primary) / 0.4)', background: 'hsl(var(--primary) / 0.12)', padding: 12 }}>
        <p style={{ margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 800, color: 'hsl(var(--foreground))' }}>
          <Printer size={14} style={{ color: 'hsl(var(--primary))' }} /> Impressos nesta compra
        </p>
        {eligible.map((i) => (
          <div key={`${i.productId}::${i.versionId || ''}`} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12, color: 'hsl(var(--foreground))', marginBottom: 3 }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {i.quantity}× {i.title}{i.versionName ? ` (${i.versionName})` : ''}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <strong style={{ color: 'hsl(var(--foreground))' }}>{brl(unitOf(i) * i.quantity)}</strong>
              <button onClick={() => removeItem(i.productId, i.versionId)} style={{ background: 'transparent', border: 'none', color: 'hsl(var(--muted-foreground) / 0.75)', cursor: 'pointer', fontSize: 11 }}>remover</button>
            </span>
          </div>
        ))}
      </div>

      {/* Entrega */}
      <div style={{ marginBottom: 14 }}>
        <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'hsl(var(--muted-foreground))' }}>Entrega dos impressos</p>
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
            {(settings?.pickupPoints || []).length === 0 && <p style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>Nenhum ponto disponível.</p>}
            {(settings?.pickupPoints || []).map((pp) => (
              <label key={pp.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', cursor: 'pointer', borderRadius: 9, border: `1px solid ${pickupPointId === pp.id ? 'hsl(var(--primary) / 0.6)' : 'hsl(var(--border))'}`, padding: 10, background: pickupPointId === pp.id ? 'hsl(var(--primary) / 0.12)' : 'transparent' }}>
                <input type="radio" checked={pickupPointId === pp.id} onChange={() => setPickupPointId(pp.id)} style={{ marginTop: 3 }} />
                <span>
                  <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'hsl(var(--foreground))' }}>{pp.name}</span>
                  {pp.address && <span style={{ display: 'block', fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>{pp.address}</span>}
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
              {(settings?.deliveryMethods || []).length === 0 && <p style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>Nenhum método configurado.</p>}
              {(settings?.deliveryMethods || []).map((m) => {
                const f = m.freeShipping ? 0 : resolveFreight(m, address.uf)
                return (
                  <label key={m.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', cursor: 'pointer', borderRadius: 9, border: `1px solid ${deliveryMethodId === m.id ? 'hsl(var(--primary) / 0.6)' : 'hsl(var(--border))'}`, padding: 10 }}>
                    <span style={{ display: 'flex', gap: 8 }}>
                      <input type="radio" checked={deliveryMethodId === m.id} onChange={() => setDeliveryMethodId(m.id)} />
                      <span>
                        <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'hsl(var(--foreground))' }}>{m.name}</span>
                        <span style={{ display: 'block', fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>{m.estimatedDaysMin}–{m.estimatedDaysMax} dias úteis</span>
                      </span>
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: m.freeShipping ? 'hsl(var(--primary))' : 'hsl(var(--foreground))' }}>
                      {m.freeShipping ? 'Grátis' : address.uf ? (f > 0 ? brl(f) : 'Grátis') : '—'}
                    </span>
                  </label>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Sob encomenda */}
      {anyMadeToOrder && (
        <div style={{ marginBottom: 12, display: 'flex', gap: 8, alignItems: 'flex-start', borderRadius: 10, border: '1px solid hsl(var(--accent) / 0.4)', background: 'hsl(var(--accent) / 0.15)', padding: '10px 12px', fontSize: 12, color: 'hsl(var(--foreground))' }}>
          <Clock size={15} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>
            <strong>Sob encomenda:</strong> impresso após a compra
            {maxProductionDays > 0 ? ` (~${maxProductionDays} ${maxProductionDays === 1 ? 'dia' : 'dias'} de produção)` : ''}. O prazo já está somado na previsão abaixo.
          </span>
        </div>
      )}

      {/* Resumo combinado */}
      <div style={{ marginBottom: 14, fontSize: 13, color: 'hsl(var(--muted-foreground))' }}>
        <Row label="Digital" value={brl(digitalPayable)} />
        <Row label="Impressos" value={brl(physicalSubtotal)} />
        <Row label="Frete" value={deliveryType === 'pickup' ? 'Grátis' : address.uf || pickupPointId ? (delivery.freight > 0 ? brl(delivery.freight) : 'Grátis') : '—'} />
        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid hsl(var(--border))', marginTop: 6, paddingTop: 6, fontSize: 16, fontWeight: 800, color: 'hsl(var(--foreground))' }}>
          <span>Total</span><span>{brl(combined)}</span>
        </div>
        {delivery.valid && (
          <div style={{ marginTop: 8, display: 'flex', gap: 6, alignItems: 'center', fontSize: 12, color: 'hsl(var(--foreground))' }}>
            <CalendarClock size={14} style={{ color: 'hsl(var(--primary))' }} />
            {deliveryType === 'pickup' ? 'Disponível para retirada até ' : 'Previsão de entrega: '}
            <strong style={{ color: 'hsl(var(--foreground))' }}>
              {estimateDeliveryDate({ deliveryType, method: delivery.selectedMethod, maxProductionDays }).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
            </strong>
          </div>
        )}
      </div>

      {!delivery.valid ? (
        <div style={{ borderRadius: 10, background: 'hsl(var(--muted) / 0.5)', padding: '12px 14px', fontSize: 12, color: 'hsl(var(--muted-foreground))', textAlign: 'center' }}>
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

      <p style={{ margin: '12px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontSize: 11, color: 'hsl(var(--muted-foreground) / 0.75)' }}>
        <Truck size={12} /> {settings?.sellerFooter || 'Entregue por DomineAqui LTDA — Rio de Janeiro'}
      </p>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
      <span>{label}</span><span style={{ color: 'hsl(var(--foreground))' }}>{value}</span>
    </div>
  )
}

function tabStyle(active: boolean): React.CSSProperties {
  return {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    height: 40, borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700,
    border: `1.5px solid ${active ? 'hsl(var(--primary) / 0.7)' : 'hsl(var(--border))'}`,
    background: active ? 'hsl(var(--primary) / 0.15)' : 'transparent',
    color: active ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
  }
}
