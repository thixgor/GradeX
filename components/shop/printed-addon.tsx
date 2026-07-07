'use client'

/**
 * Oferta de "versão impressa" (add-on) exibida na página de um material digital.
 * Busca produtos físicos com linkMode='addon' vinculados a este material e
 * permite adicionar a versão impressa ao carrinho da loja por +R$X.
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Printer, Check, Plus, Truck, LogIn, Info } from 'lucide-react'
import { useShopCart } from '@/context/ShopCartContext'
import { useAuthUser } from '@/hooks/use-auth-user'
import { physicalAddonPrice, physicalFullPrice } from '@/lib/shop'
import type { PhysicalProduct } from '@/lib/types'

export function PrintedAddon({ materialId, packageId }: { materialId?: string; packageId?: string }) {
  const router = useRouter()
  const { addItem, isInCart } = useShopCart()
  const { isAuthenticated, loading: authLoading } = useAuthUser({})
  const [products, setProducts] = useState<PhysicalProduct[]>([])
  const [justAdded, setJustAdded] = useState<string | null>(null)
  const [selectedVersions, setSelectedVersions] = useState<Record<string, string>>({})

  const loginHref =
    typeof window !== 'undefined'
      ? `/auth/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`
      : '/auth/login'

  useEffect(() => {
    if (!materialId && !packageId) return
    let alive = true
    const qs = materialId
      ? `linkedMaterialId=${encodeURIComponent(materialId)}`
      : `linkedPackageIds=${encodeURIComponent(packageId!)}`
    fetch(`/api/loja/produtos?${qs}`)
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
  }, [materialId, packageId])

  if (products.length === 0) return null

  const brl = (n: number) => n.toFixed(2).replace('.', ',')

  return (
    <div className="my-6 space-y-3">
      {!authLoading && !isAuthenticated && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
          <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
          <span>É necessário fazer login para comprar materiais físicos.</span>
        </div>
      )}
      {products.map((p) => {
        const pid = String(p._id)
        const versions = p.versions || []
        const verId = versions.length > 0 ? (selectedVersions[pid] || versions[0].id) : undefined
        const ver = versions.find((v) => v.id === verId)
        const addonPrice = physicalAddonPrice(p, ver)   // preço com o material (exibido)
        const fullPrice = physicalFullPrice(p, ver)      // preço cheio (avulso)
        const price = addonPrice
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
                  className="mt-1.5 h-7 rounded-md border border-input bg-background px-2 text-xs text-foreground [&>option]:bg-background [&>option]:text-foreground"
                >
                  {versions.map((v) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm font-extrabold text-primary">+ R$ {brl(price)}</p>
              {!authLoading && !isAuthenticated ? (
                <a
                  href={loginHref}
                  className="mt-1 inline-flex items-center gap-1 rounded-lg bg-muted px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted/70"
                >
                  <LogIn className="h-3.5 w-3.5" /> Entrar
                </a>
              ) : (
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
                        price: fullPrice,
                        addonPrice,
                        imageUrl: p.images?.[0],
                        versionId: ver?.id,
                        versionName: ver?.name,
                        isAddon: true,
                        linkedMaterialId: p.linkedMaterialId || materialId,
                        linkedPackageId: p.linkedPackageId || packageId,
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
              )}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
