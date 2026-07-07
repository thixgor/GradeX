'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ShoppingCart, Zap, Clock, Truck, Package, Minus, Plus, Check, ArrowLeft, ShieldCheck, BookOpen, FileText } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { ImageGallery } from '@/components/shop/image-gallery'
import { useShopCart } from '@/context/ShopCartContext'
import type { PhysicalProduct } from '@/lib/types'

export default function ProductPage() {
  const params = useParams()
  const router = useRouter()
  const id = String(params?.id || '')
  const { addItem, itemCount } = useShopCart()

  const [product, setProduct] = useState<PhysicalProduct | null>(null)
  const [linkedTitle, setLinkedTitle] = useState<string | undefined>()
  const [loading, setLoading] = useState(true)
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const [selectedVersionId, setSelectedVersionId] = useState<string | undefined>()

  useEffect(() => {
    let alive = true
    fetch(`/api/loja/produtos/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return
        if (d.product) {
          setProduct(d.product)
          setLinkedTitle(d.linkedMaterialTitle)
          if (Array.isArray(d.product.versions) && d.product.versions.length > 0) {
            setSelectedVersionId(d.product.versions[0].id)
          }
        }
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [id])

  const brl = (n: number) => n.toFixed(2).replace('.', ',')
  const outOfStock = !!product && product.trackStock && typeof product.stock === 'number' && product.stock <= 0
  const versions = product?.versions || []
  const selectedVersion = versions.find((v) => v.id === selectedVersionId)
  const baseUnit = product ? (product.linkMode === 'addon' ? product.addonSurcharge ?? product.price : product.price) : 0
  const unitPrice = selectedVersion && typeof selectedVersion.price === 'number' ? selectedVersion.price : baseUnit

  function handleAdd(buyNow = false) {
    if (!product || outOfStock) return
    addItem({
      productId: String(product._id),
      title: product.title,
      price: unitPrice,
      imageUrl: product.images?.[0],
      versionId: selectedVersion?.id,
      versionName: selectedVersion?.name,
      isAddon: product.linkMode === 'addon',
      linkedMaterialId: product.linkedMaterialId,
      madeToOrder: product.madeToOrder,
      productionDays: product.productionDays,
      quantity: qty,
    })
    if (buyNow) {
      router.push('/loja/checkout')
    } else {
      setAdded(true)
      setTimeout(() => setAdded(false), 1800)
    }
  }

  return (
    <AppShell headerTitle="Loja">
      <div className="container mx-auto max-w-5xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => router.push('/materiais?tab=loja')} className="gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
          <Link href="/loja/checkout" className="relative">
            <Button variant="outline" size="sm" className="gap-1.5">
              <ShoppingCart className="h-4 w-4" /> Carrinho
              {itemCount > 0 && (
                <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                  {itemCount}
                </span>
              )}
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="py-24 text-center text-sm text-muted-foreground">Carregando produto...</div>
        ) : !product ? (
          <div className="py-24 text-center text-sm text-muted-foreground">Produto não encontrado.</div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <ImageGallery images={product.images || []} title={product.title} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="flex flex-col"
            >
              <div className="mb-2 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-primary">
                  <Truck className="h-3 w-3" /> Produto físico
                </span>
                {product.madeToOrder && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                    <Clock className="h-3 w-3" /> Sob encomenda
                  </span>
                )}
              </div>

              <h1 className="text-2xl font-extrabold leading-tight text-foreground">{product.title}</h1>

              {product.linkMode === 'addon' && linkedTitle && (
                <p className="mt-1.5 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                  <BookOpen className="h-4 w-4 text-primary" /> Versão impressa de <strong className="text-foreground">{linkedTitle}</strong>
                </p>
              )}

              <div className="mt-4 flex items-end gap-3">
                <span className="text-3xl font-black text-foreground">R$ {brl(unitPrice)}</span>
                {product.compareAtPrice && product.compareAtPrice > unitPrice && (
                  <span className="mb-1 text-base text-muted-foreground line-through">R$ {brl(product.compareAtPrice)}</span>
                )}
              </div>

              {product.description && (
                <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{product.description}</p>
              )}

              {/* versões */}
              {versions.length > 0 && (
                <div className="mt-5">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Escolha a versão</p>
                  <div className="flex flex-wrap gap-2">
                    {versions.map((v) => {
                      const vPrice = typeof v.price === 'number' ? v.price : baseUnit
                      const active = v.id === selectedVersionId
                      return (
                        <button
                          key={v.id}
                          onClick={() => setSelectedVersionId(v.id)}
                          className={
                            'rounded-xl border-2 px-3 py-2 text-left transition-all ' +
                            (active ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-border')
                          }
                        >
                          <span className="block text-sm font-semibold">{v.name}</span>
                          <span className="block text-xs text-muted-foreground">R$ {brl(vPrice)}</span>
                        </button>
                      )
                    })}
                  </div>
                  {selectedVersion?.details && (
                    <p className="mt-2 whitespace-pre-line rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                      {selectedVersion.details}
                    </p>
                  )}
                </div>
              )}

              {/* estoque */}
              <div className="mt-4 text-xs">
                {outOfStock ? (
                  <span className="font-semibold text-red-500">Esgotado no momento</span>
                ) : product.trackStock && typeof product.stock === 'number' && product.stock <= 5 ? (
                  <span className="font-semibold text-amber-600 dark:text-amber-400">Últimas {product.stock} unidades!</span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <Check className="h-3.5 w-3.5" /> Disponível
                  </span>
                )}
                {product.madeToOrder && product.productionDays ? (
                  <span className="ml-3 text-muted-foreground">Produção: ~{product.productionDays} dias</span>
                ) : null}
                {product.pageCount ? (
                  <span className="ml-3 inline-flex items-center gap-1 text-muted-foreground">
                    <FileText className="h-3.5 w-3.5" /> {product.pageCount} páginas
                  </span>
                ) : null}
              </div>

              {/* quantidade */}
              <div className="mt-6 flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground">Quantidade</span>
                <div className="flex items-center gap-1 rounded-xl border border-border/60 p-1">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted"
                    disabled={outOfStock}
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-8 text-center text-sm font-semibold">{qty}</span>
                  <button
                    onClick={() => setQty((q) => q + 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted"
                    disabled={outOfStock}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* ações */}
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button
                  size="lg"
                  className="flex-1 gap-2"
                  onClick={() => handleAdd(true)}
                  disabled={outOfStock}
                >
                  <Zap className="h-5 w-5" /> Comprar agora
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => handleAdd(false)}
                  disabled={outOfStock}
                >
                  {added ? <Check className="h-5 w-5 text-emerald-500" /> : <ShoppingCart className="h-5 w-5" />}
                  {added ? 'Adicionado!' : 'Adicionar ao carrinho'}
                </Button>
              </div>

              <div className="mt-6 flex items-center gap-2 rounded-xl bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Entrega por retirada na Afya Unigranrio Barra ou no seu endereço. Pagamento seguro via Pix, cartão ou boleto.
              </div>
              <p className="mt-3 text-center text-[11px] text-muted-foreground/70">Entregue por DomineAqui LTDA — Rio de Janeiro</p>
            </motion.div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
