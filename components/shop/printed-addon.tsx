'use client'

/**
 * Oferta de "versão impressa" (add-on) exibida na página de um material digital.
 * Busca produtos físicos com linkMode='addon' vinculados a este material e
 * permite adicionar a versão impressa ao carrinho da loja por +R$X.
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Printer, Check, Plus, Truck } from 'lucide-react'
import { useShopCart } from '@/context/ShopCartContext'
import type { PhysicalProduct } from '@/lib/types'

export function PrintedAddon({ materialId }: { materialId: string }) {
  const router = useRouter()
  const { addItem, isInCart } = useShopCart()
  const [products, setProducts] = useState<PhysicalProduct[]>([])
  const [justAdded, setJustAdded] = useState<string | null>(null)
  const [selectedVersions, setSelectedVersions] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!materialId) return
    let alive = true
    fetch(`/api/loja/produtos?linkedMaterialId=${encodeURIComponent(materialId)}`)
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return
        const list = (Array.isArray(d.products) ? d.products : []).filter((p: PhysicalProduct) => p.linkMode === 'addon')
        setProducts(list)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [materialId])

  if (products.length === 0) return null

  const brl = (n: number) => n.toFixed(2).replace('.', ',')

  return (
    <div className="my-6 space-y-3">
      {products.map((p) => {
        const pid = String(p._id)
        const base = p.addonSurcharge ?? p.price
        const versions = p.versions || []
        const verId = versions.length > 0 ? (selectedVersions[pid] || versions[0].id) : undefined
        const ver = versions.find((v) => v.id === verId)
        const price = ver && typeof ver.price === 'number' ? ver.price : base
        const inCart = isInCart(pid, verId)
        return (
          <motion.div
            key={pid}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-4"
          >
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary/10">
              {p.images?.[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.images[0]} alt={p.title} className="h-full w-full object-cover" />
              ) : (
                <Printer className="h-6 w-6 text-primary" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                <Printer className="h-3.5 w-3.5 text-primary" /> Leve a versão impressa
              </p>
              <p className="truncate text-xs text-muted-foreground">{p.title}</p>
              <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-muted-foreground/80">
                <Truck className="h-3 w-3" /> Entrega ou retirada · {p.madeToOrder ? 'sob encomenda' : 'pronta entrega'}
              </p>
              {versions.length > 0 && (
                <select
                  value={verId}
                  onChange={(e) => setSelectedVersions((s) => ({ ...s, [pid]: e.target.value }))}
                  className="mt-1.5 h-7 rounded-md border border-input bg-background px-2 text-xs"
                >
                  {versions.map((v) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm font-extrabold text-primary">+ R$ {brl(price)}</p>
              <AnimatePresence mode="wait">
                {inCart || justAdded === `${pid}::${verId || ''}` ? (
                  <motion.button
                    key="incart"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    onClick={() => router.push('/loja/checkout')}
                    className="mt-1 inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400"
                  >
                    <Check className="h-3.5 w-3.5" /> No carrinho
                  </motion.button>
                ) : (
                  <motion.button
                    key="add"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    onClick={() => {
                      addItem({
                        productId: pid,
                        title: p.title,
                        price,
                        imageUrl: p.images?.[0],
                        versionId: ver?.id,
                        versionName: ver?.name,
                        isAddon: true,
                        linkedMaterialId: materialId,
                        madeToOrder: p.madeToOrder,
                        productionDays: p.productionDays,
                      })
                      setJustAdded(`${pid}::${verId || ''}`)
                    }}
                    className="mt-1 inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
                  >
                    <Plus className="h-3.5 w-3.5" /> Adicionar
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
