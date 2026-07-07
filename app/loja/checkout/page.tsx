'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ShoppingCart, MapPin, Home, Truck, Trash2, Minus, Plus, Clock, ArrowLeft, PackageCheck } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MercadoPagoCheckout } from '@/components/payments/mercado-pago-checkout'
import { useShopCart } from '@/context/ShopCartContext'
import { resolveFreight, estimateDeliveryDate, UFS } from '@/lib/shop'
import type { DeliveryMethod, PickupPoint } from '@/lib/types'
import { cn } from '@/lib/utils'

interface PublicSettings {
  deliveryMethods: DeliveryMethod[]
  pickupPoints: PickupPoint[]
  sellerFooter: string
}

const emptyAddress = {
  name: '', phone: '', cep: '', street: '', number: '', complement: '', district: '', city: '', uf: '',
}

export default function ShopCheckoutPage() {
  const router = useRouter()
  const { items, subtotal, setQuantity, removeItem, clearCart, itemCount } = useShopCart()

  const [settings, setSettings] = useState<PublicSettings | null>(null)
  const [publicKey, setPublicKey] = useState('')
  const [deliveryType, setDeliveryType] = useState<'pickup' | 'shipping'>('pickup')
  const [pickupPointId, setPickupPointId] = useState('')
  const [deliveryMethodId, setDeliveryMethodId] = useState('')
  const [address, setAddress] = useState({ ...emptyAddress })

  useEffect(() => {
    Promise.all([
      fetch('/api/loja/settings/public').then((r) => r.json()),
      fetch('/api/payments/public-key').then((r) => r.json()),
    ]).then(([s, pk]) => {
      setSettings(s)
      setPublicKey(pk?.publicKey || '')
      const firstPickup = (s?.pickupPoints || [])[0]
      if (firstPickup) setPickupPointId(firstPickup.id)
      const firstMethod = (s?.deliveryMethods || [])[0]
      if (firstMethod) setDeliveryMethodId(firstMethod.id)
    })
  }, [])

  const selectedMethod = useMemo(
    () => settings?.deliveryMethods.find((m) => m.id === deliveryMethodId),
    [settings, deliveryMethodId]
  )

  const maxProductionDays = useMemo(
    () => items.reduce((max, i) => (i.madeToOrder && i.productionDays ? Math.max(max, i.productionDays) : max), 0),
    [items]
  )

  const freight = useMemo(() => {
    if (deliveryType === 'pickup') return 0
    if (!selectedMethod) return 0
    return resolveFreight(selectedMethod, address.uf)
  }, [deliveryType, selectedMethod, address.uf])

  const total = Math.round((subtotal + freight) * 100) / 100

  const eta = useMemo(() => {
    if (deliveryType === 'shipping' && !selectedMethod) return null
    return estimateDeliveryDate({
      deliveryType,
      method: selectedMethod,
      maxProductionDays,
    })
  }, [deliveryType, selectedMethod, maxProductionDays])

  const brl = (n: number) => n.toFixed(2).replace('.', ',')

  const addressValid =
    address.name.trim() &&
    address.cep.replace(/\D/g, '').length >= 8 &&
    address.street.trim() &&
    address.number.trim() &&
    address.district.trim() &&
    address.city.trim() &&
    address.uf.length === 2

  const canPay =
    itemCount > 0 &&
    total > 0 &&
    (deliveryType === 'pickup' ? !!pickupPointId : !!deliveryMethodId && addressValid)

  const extraBody = useMemo(() => {
    const base: Record<string, any> = {
      items: items.map((i) => ({ productId: i.productId, quantity: i.quantity, versionId: i.versionId })),
      deliveryType,
    }
    if (deliveryType === 'pickup') {
      base.pickupPointId = pickupPointId
    } else {
      base.deliveryMethodId = deliveryMethodId
      base.shippingAddress = { ...address, uf: address.uf.toUpperCase() }
    }
    return base
  }, [items, deliveryType, pickupPointId, deliveryMethodId, address])

  if (itemCount === 0) {
    return (
      <AppShell headerTitle="Finalizar pedido">
        <div className="container mx-auto max-w-2xl px-4 py-24 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50">
            <ShoppingCart className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold">Seu carrinho está vazio</h2>
          <p className="mt-1 text-sm text-muted-foreground">Adicione produtos físicos para continuar.</p>
          <Button className="mt-6" onClick={() => router.push('/materiais?tab=loja')}>
            Ir para a loja
          </Button>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell headerTitle="Finalizar pedido">
      <div className="container mx-auto max-w-5xl px-4 py-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-4 gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          {/* Coluna esquerda: itens + entrega */}
          <div className="space-y-6">
            {/* Itens */}
            <section className="rounded-2xl border border-border/50 bg-card/60 p-4 backdrop-blur-sm">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Itens do pedido</h2>
              <div className="space-y-3">
                {items.map((i) => (
                  <div key={`${i.productId}::${i.versionId || ''}`} className="flex items-center gap-3">
                    <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-muted/50">
                      {i.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={i.imageUrl} alt={i.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
                          <PackageCheck className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{i.title}</p>
                      {i.versionName && <p className="truncate text-[11px] text-muted-foreground">Versão: {i.versionName}</p>}
                      <p className="text-xs text-muted-foreground">R$ {brl(i.price)}</p>
                    </div>
                    <div className="flex items-center gap-1 rounded-lg border border-border/60 p-0.5">
                      <button className="flex h-7 w-7 items-center justify-center rounded hover:bg-muted" onClick={() => setQuantity(i.productId, i.quantity - 1, i.versionId)}>
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-6 text-center text-xs font-semibold">{i.quantity}</span>
                      <button className="flex h-7 w-7 items-center justify-center rounded hover:bg-muted" onClick={() => setQuantity(i.productId, i.quantity + 1, i.versionId)}>
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <button className="text-muted-foreground hover:text-red-500" onClick={() => removeItem(i.productId, i.versionId)}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* Entrega */}
            <section className="rounded-2xl border border-border/50 bg-card/60 p-4 backdrop-blur-sm">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Forma de entrega</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  onClick={() => setDeliveryType('pickup')}
                  className={cn(
                    'flex items-start gap-3 rounded-xl border-2 p-3 text-left transition-all',
                    deliveryType === 'pickup' ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-border'
                  )}
                >
                  <MapPin className={cn('mt-0.5 h-5 w-5', deliveryType === 'pickup' ? 'text-primary' : 'text-muted-foreground')} />
                  <div>
                    <p className="text-sm font-semibold">Retirar num ponto</p>
                    <p className="text-xs text-muted-foreground">Sem frete</p>
                  </div>
                </button>
                <button
                  onClick={() => setDeliveryType('shipping')}
                  className={cn(
                    'flex items-start gap-3 rounded-xl border-2 p-3 text-left transition-all',
                    deliveryType === 'shipping' ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-border'
                  )}
                >
                  <Home className={cn('mt-0.5 h-5 w-5', deliveryType === 'shipping' ? 'text-primary' : 'text-muted-foreground')} />
                  <div>
                    <p className="text-sm font-semibold">Receber no meu endereço</p>
                    <p className="text-xs text-muted-foreground">Frete conforme região</p>
                  </div>
                </button>
              </div>

              {/* Pickup points */}
              {deliveryType === 'pickup' && (
                <div className="mt-4 space-y-2">
                  {(settings?.pickupPoints || []).length === 0 && (
                    <p className="text-xs text-muted-foreground">Nenhum ponto de retirada disponível.</p>
                  )}
                  {(settings?.pickupPoints || []).map((pp) => (
                    <label
                      key={pp.id}
                      className={cn(
                        'flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-all',
                        pickupPointId === pp.id ? 'border-primary bg-primary/5' : 'border-border/50'
                      )}
                    >
                      <input
                        type="radio"
                        name="pickup"
                        checked={pickupPointId === pp.id}
                        onChange={() => setPickupPointId(pp.id)}
                        className="mt-1 accent-[hsl(var(--primary))]"
                      />
                      <div>
                        <p className="text-sm font-medium">{pp.name}</p>
                        {pp.address && <p className="text-xs text-muted-foreground">{pp.address}</p>}
                        {pp.details && <p className="text-xs text-muted-foreground/80">{pp.details}</p>}
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {/* Shipping address + methods */}
              {deliveryType === 'shipping' && (
                <div className="mt-4 space-y-4">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input placeholder="Nome completo" value={address.name} onChange={(e) => setAddress({ ...address, name: e.target.value })} />
                    <Input placeholder="Telefone (opcional)" value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value })} />
                    <Input placeholder="CEP" value={address.cep} onChange={(e) => setAddress({ ...address, cep: e.target.value })} />
                    <Input placeholder="Cidade" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} />
                    <Input placeholder="Rua" value={address.street} onChange={(e) => setAddress({ ...address, street: e.target.value })} />
                    <Input placeholder="Número" value={address.number} onChange={(e) => setAddress({ ...address, number: e.target.value })} />
                    <Input placeholder="Bairro" value={address.district} onChange={(e) => setAddress({ ...address, district: e.target.value })} />
                    <Input placeholder="Complemento (opcional)" value={address.complement} onChange={(e) => setAddress({ ...address, complement: e.target.value })} />
                    <select
                      value={address.uf}
                      onChange={(e) => setAddress({ ...address, uf: e.target.value })}
                      className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground [&>option]:bg-background [&>option]:text-foreground"
                    >
                      <option value="">UF</option>
                      {UFS.map((uf) => (
                        <option key={uf} value={uf}>{uf}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Método de entrega</p>
                    {(settings?.deliveryMethods || []).length === 0 && (
                      <p className="text-xs text-muted-foreground">Nenhum método configurado. Escolha retirada.</p>
                    )}
                    {(settings?.deliveryMethods || []).map((m) => {
                      const f = resolveFreight(m, address.uf)
                      return (
                        <label
                          key={m.id}
                          className={cn(
                            'flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-3 transition-all',
                            deliveryMethodId === m.id ? 'border-primary bg-primary/5' : 'border-border/50'
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="radio"
                              name="method"
                              checked={deliveryMethodId === m.id}
                              onChange={() => setDeliveryMethodId(m.id)}
                              className="mt-1 accent-[hsl(var(--primary))]"
                            />
                            <div>
                              <p className="text-sm font-medium">{m.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {m.estimatedDaysMin}–{m.estimatedDaysMax} dias úteis
                                {m.details ? ` · ${m.details}` : ''}
                              </p>
                            </div>
                          </div>
                          <span className="text-sm font-semibold">{address.uf ? (f > 0 ? `R$ ${brl(f)}` : 'Grátis') : '—'}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* Coluna direita: resumo + pagamento */}
          <div className="space-y-4">
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="sticky top-4 rounded-2xl border border-border/50 bg-card/70 p-5 backdrop-blur-sm shadow-lg"
            >
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Resumo</h2>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'itens'})</span>
                  <span className="text-foreground">R$ {brl(subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Frete</span>
                  <span className="text-foreground">
                    {deliveryType === 'pickup' ? 'Grátis' : address.uf ? (freight > 0 ? `R$ ${brl(freight)}` : 'Grátis') : '—'}
                  </span>
                </div>
                <div className="mt-2 flex justify-between border-t border-border/40 pt-2 text-base font-bold">
                  <span>Total</span>
                  <span>R$ {brl(total)}</span>
                </div>
              </div>

              {eta && (
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  Previsão de {deliveryType === 'pickup' ? 'disponibilidade' : 'entrega'}:{' '}
                  <strong className="text-foreground">
                    {eta.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
                  </strong>
                </div>
              )}

              <div className="mt-4">
                {!canPay ? (
                  <div className="rounded-xl bg-muted/40 px-4 py-3 text-center text-xs text-muted-foreground">
                    {deliveryType === 'shipping' && !addressValid
                      ? 'Preencha o endereço e escolha o método de entrega para pagar.'
                      : 'Selecione a forma de entrega para continuar.'}
                  </div>
                ) : publicKey ? (
                  <MercadoPagoCheckout
                    publicKey={publicKey}
                    amount={total}
                    description={`Pedido — DomineAqui`}
                    endpoint="/api/loja/checkout"
                    extraBody={extraBody}
                    payerNameHint={address.name}
                    analytics={{ productType: 'product', source: 'Loja física' }}
                    onApproved={() => {
                      clearCart()
                      setTimeout(() => router.push('/profile?tab=pedidos'), 300)
                    }}
                  />
                ) : (
                  <div className="text-center text-xs text-muted-foreground">Carregando pagamento...</div>
                )}
              </div>

              <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground/70">
                <Truck className="h-3 w-3" /> {settings?.sellerFooter || 'Entregue por DomineAqui LTDA — Rio de Janeiro'}
              </p>
            </motion.section>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
