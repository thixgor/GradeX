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
        onClick={() => setOpen(true)}
        className="relative h-10 rounded-xl border border-emerald-300/50 bg-gradient-to-r from-emerald-700 via-emerald-600 to-amber-500 px-3 text-white shadow-lg shadow-emerald-700/25 transition hover:from-emerald-600 hover:via-emerald-500 hover:to-amber-400"
        aria-label="Abrir carrinho"
      >
        <ShoppingCart className="h-5 w-5" />
        <span className="ml-2 hidden text-sm font-bold sm:inline">Carrinho</span>
        {itemCount > 0 && (
          <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-black text-white ring-2 ring-background">
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
            <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <div className="pointer-events-none absolute right-3 top-16 h-64 w-[min(92vw,34rem)] rounded-[2rem] bg-emerald-400/25 blur-3xl dark:bg-emerald-500/20 sm:right-8 lg:right-12" />
            <motion.aside
              initial={{ opacity: 0, y: -10, scaleY: 0.86 }}
              animate={{ opacity: 1, y: 0, scaleY: 1 }}
              exit={{ opacity: 0, y: -10, scaleY: 0.92 }}
              transition={{ type: 'spring', stiffness: 380, damping: 34 }}
              style={{ transformOrigin: 'top right' }}
              className="absolute inset-x-3 top-16 mx-auto flex max-h-[calc(100dvh-5rem)] w-auto max-w-[30rem] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-950 shadow-2xl shadow-black/25 dark:border-white/10 dark:bg-zinc-950 dark:text-white sm:inset-x-auto sm:right-8 sm:mx-0 sm:w-[28rem] lg:right-12"
            >
              <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 dark:border-white/10 dark:bg-zinc-950">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-700/25">
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
                <div className="flex min-h-72 flex-1 flex-col items-center justify-center bg-slate-50 px-6 text-center dark:bg-zinc-950">
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
                  <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 p-3 dark:bg-zinc-950 sm:p-4">
                    <div className="space-y-3">
                      {sortedItems.map(item => {
                        const price = item.effectivePrice ?? item.price
                        return (
                          <div key={`${item.itemType}:${item.itemId}`} className="flex gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-zinc-900">
                            <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-muted sm:h-16">
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

                  <div className="shrink-0 border-t border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-zinc-950">
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
