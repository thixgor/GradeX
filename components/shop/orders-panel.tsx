'use client'

/**
 * Painel "Meus Pedidos" (produtos físicos) exibido no perfil. Mostra cada
 * pedido com timeline de status, previsão, rastreio e polling de pagamento
 * enquanto aguarda aprovação (Pix).
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Package, Truck, MapPin, ExternalLink, Clock, Check, Loader2, PackageOpen } from 'lucide-react'
import { SHOP_STATUS_LABELS, timelineSteps, statusStepIndex } from '@/lib/shop'
import type { ShopOrder, ShopOrderStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

const brl = (n: number) => n.toFixed(2).replace('.', ',')

export function OrdersPanel() {
  const [orders, setOrders] = useState<ShopOrder[]>([])
  const [loading, setLoading] = useState(true)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/loja/orders')
      const d = await r.json()
      setOrders(Array.isArray(d.orders) ? d.orders : [])
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // Polling de pagamento para pedidos aguardando aprovação (Pix).
  useEffect(() => {
    const pending = orders.filter((o) => o.status === 'awaiting_payment' && o.providerOrderId)
    if (pending.length === 0) {
      if (pollRef.current) clearInterval(pollRef.current)
      return
    }
    pollRef.current = setInterval(async () => {
      let changed = false
      for (const o of pending) {
        try {
          const r = await fetch(`/api/payments/orders/${o.providerOrderId}/status`)
          const d = await r.json()
          if (d.status && d.status !== 'pending' && d.status !== 'in_process') changed = true
        } catch {
          /* ignore */
        }
      }
      if (changed) load()
    }, 6000)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [orders, load])

  if (loading) {
    return <div className="py-16 text-center text-sm text-muted-foreground">Carregando pedidos...</div>
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/50 py-16 text-center">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50">
          <PackageOpen className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-base font-semibold">Você ainda não fez pedidos físicos</h3>
        <p className="mt-1 text-sm text-muted-foreground">Materiais impressos e produtos aparecem aqui após a compra.</p>
        <a href="/materiais?tab=loja" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
          Explorar a loja →
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {orders.map((o, i) => (
        <OrderCard key={String(o._id)} order={o} index={i} />
      ))}
    </div>
  )
}

function OrderCard({ order, index }: { order: ShopOrder; index: number }) {
  const steps = timelineSteps(order.deliveryType)
  const currentIdx = statusStepIndex(order.status, order.deliveryType)
  const cancelled = order.status === 'cancelled' || order.status === 'refunded'
  const awaiting = order.status === 'awaiting_payment'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="overflow-hidden rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm shadow-sm"
    >
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center gap-3 border-b border-border/30 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Package className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">Pedido #{order.orderNumber}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(order.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
            {' · '}
            {order.items.reduce((s, it) => s + it.quantity, 0)} {order.items.reduce((s, it) => s + it.quantity, 0) === 1 ? 'item' : 'itens'}
          </p>
        </div>
        <span
          className={cn(
            'rounded-full px-2.5 py-1 text-[11px] font-semibold',
            cancelled ? 'bg-red-500/10 text-red-500' : awaiting ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
          )}
        >
          {awaiting && <Loader2 className="mr-1 inline h-3 w-3 animate-spin" />}
          {SHOP_STATUS_LABELS[order.status]}
        </span>
        <span className="text-sm font-bold">R$ {brl(order.total)}</span>
      </div>

      {/* Itens */}
      <div className="flex flex-wrap gap-3 px-4 pt-4">
        {order.items.map((it, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-muted/50">
              {it.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={it.imageUrl} alt={it.title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground/40"><Package className="h-4 w-4" /></div>
              )}
            </div>
            <div>
              <p className="max-w-[160px] truncate text-xs font-medium">{it.title}</p>
              {it.versionName && <p className="max-w-[160px] truncate text-[10px] text-muted-foreground">{it.versionName}</p>}
              <p className="text-[11px] text-muted-foreground">{it.quantity}× R$ {brl(it.unitPrice)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Timeline */}
      {!cancelled && !awaiting && (
        <div className="px-4 py-5">
          <div className="flex items-center">
            {steps.map((step, i) => {
              const done = i <= currentIdx
              const isLast = i === steps.length - 1
              return (
                <div key={step} className="flex flex-1 items-center last:flex-none">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        'flex h-7 w-7 items-center justify-center rounded-full border-2 transition-colors',
                        done ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-muted-foreground'
                      )}
                    >
                      {done ? <Check className="h-3.5 w-3.5" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
                    </div>
                    <span className={cn('mt-1.5 w-16 text-center text-[10px] leading-tight', done ? 'font-semibold text-foreground' : 'text-muted-foreground')}>
                      {SHOP_STATUS_LABELS[step as ShopOrderStatus]}
                    </span>
                  </div>
                  {!isLast && (
                    <div className="-mt-5 h-0.5 flex-1">
                      <div className={cn('h-full', i < currentIdx ? 'bg-primary' : 'bg-border')} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Rodapé: entrega + rastreio + previsão */}
      <div className="space-y-2 border-t border-border/30 bg-muted/20 p-4 text-xs">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          {order.deliveryType === 'pickup' ? <MapPin className="h-3.5 w-3.5 text-primary" /> : <Truck className="h-3.5 w-3.5 text-primary" />}
          {order.deliveryType === 'pickup'
            ? <span>Retirada em <strong className="text-foreground">{order.pickupPointName}</strong></span>
            : <span>Entrega via <strong className="text-foreground">{order.deliveryMethodName}</strong> · {order.shippingAddress?.city}/{order.shippingAddress?.uf}</span>}
        </div>
        {order.estimatedDeliveryDate && !cancelled && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            Previsão: <strong className="text-foreground">{new Date(order.estimatedDeliveryDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}</strong>
          </div>
        )}
        {order.tracking && (order.tracking.code || order.tracking.url) && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {order.tracking.carrier && <span className="text-muted-foreground">{order.tracking.carrier}</span>}
            {order.tracking.code && (
              <span className="rounded-md bg-background px-2 py-1 font-mono text-[11px] font-semibold">{order.tracking.code}</span>
            )}
            {order.tracking.url && (
              <a href={order.tracking.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
                Rastrear <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        )}
        {/* Última nota da timeline (atualização do admin) */}
        {(() => {
          const lastNote = [...(order.statusHistory || [])].reverse().find((h) => h.note)
          return lastNote?.note ? (
            <p className="border-l-2 border-primary/40 pl-2 text-muted-foreground">{lastNote.note}</p>
          ) : null
        })()}
      </div>
    </motion.div>
  )
}
