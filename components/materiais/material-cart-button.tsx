'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, FileText, Package, ShoppingCart, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useMaterialCart } from '@/context/MaterialCartContext'

function formatBRL(value: number): string {
  return `R$ ${Number(value || 0).toFixed(2).replace('.', ',')}`
}

export function MaterialCartButton({ isAuthenticated }: { isAuthenticated: boolean }) {
  const router = useRouter()
  const { items, itemCount, subtotal, removeItem, clearCart } = useMaterialCart()
  const [open, setOpen] = useState(false)

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => Number(new Date(a.addedAt)) - Number(new Date(b.addedAt)))
  }, [items])

  const goToCheckout = () => {
    const checkoutPath = '/materiais/checkout?cart=1'
    setOpen(false)
    if (!isAuthenticated) {
      router.push(`/auth/login?redirect=${encodeURIComponent(checkoutPath)}`)
      return
    }
    router.push(checkoutPath)
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="relative h-9 w-9"
        aria-label="Abrir carrinho"
      >
        <ShoppingCart className="h-5 w-5" />
        {itemCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1.5 text-[10px] font-bold text-white ring-2 ring-background">
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
            <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <motion.aside
              initial={{ x: 420 }}
              animate={{ x: 0 }}
              exit={{ x: 420 }}
              transition={{ type: 'spring', stiffness: 360, damping: 36 }}
              className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-border bg-background shadow-2xl"
            >
              <div className="flex h-16 items-center justify-between border-b px-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600/10 text-emerald-600">
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
                <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
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
                  <div className="flex-1 overflow-y-auto p-4">
                    <div className="space-y-3">
                      {sortedItems.map(item => {
                        const price = item.effectivePrice ?? item.price
                        return (
                          <div key={`${item.itemType}:${item.itemId}`} className="flex gap-3 rounded-2xl border border-border/60 bg-muted/25 p-3">
                            <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-muted">
                              {item.coverImage ? (
                                <Image src={item.coverImage} alt="" fill className="object-cover" sizes="80px" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                                  {item.itemType === 'package' ? <Package className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="mb-1 flex items-center gap-1.5">
                                <span className="rounded-md bg-emerald-600/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                                  {item.itemType === 'package' ? 'Pacote' : 'Material'}
                                </span>
                                {item.discountApplied ? (
                                  <span className="rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                                    desconto
                                  </span>
                                ) : null}
                              </div>
                              <p className="line-clamp-2 text-sm font-semibold leading-snug">{item.title}</p>
                              <div className="mt-1 flex items-center justify-between gap-2">
                                <p className="text-sm font-black text-emerald-700 dark:text-emerald-300">
                                  {price <= 0 ? 'Grátis' : formatBRL(price)}
                                </p>
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

                  <div className="border-t p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Subtotal estimado</span>
                      <span className="text-xl font-black text-emerald-700 dark:text-emerald-300">{formatBRL(subtotal)}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={clearCart} className="h-11 rounded-xl">
                        Limpar
                      </Button>
                      <Button onClick={goToCheckout} className="h-11 flex-1 rounded-xl bg-emerald-700 text-white hover:bg-emerald-600">
                        Finalizar compra
                        <ArrowRight className="ml-2 h-4 w-4" />
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
