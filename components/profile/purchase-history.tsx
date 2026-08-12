'use client'

/**
 * Histórico de compras digitais (materiais, pacotes e Manual Clínico) — separado
 * dos pedidos físicos, que têm rastreio e vivem no `OrdersPanel`.
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, Receipt, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function PurchaseHistory({
  userId,
  userName,
  userEmail,
  onError,
}: {
  userId: string
  userName: string
  userEmail: string
  onError: (message: string) => void
}) {
  const router = useRouter()
  const [purchases, setPurchases] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [generatingReceipt, setGeneratingReceipt] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/materiais/purchases')
        if (res.ok) {
          const data = await res.json()
          if (!cancelled) setPurchases(data.purchases || [])
        }
      } catch (error) {
        console.error('Erro ao carregar compras:', error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  async function handleGenerateReceipt() {
    setGeneratingReceipt(true)
    try {
      const { generatePurchaseReceiptPDF, downloadPDF } = await import('@/lib/pdf-generator')
      // Resgate suspenso não entra no comprovante: no momento não é um item da
      // conta (volta se o Plus+ for renovado).
      const blob = await generatePurchaseReceiptPDF(
        purchases.filter((p: any) => !p.plusRevoked),
        { id: userId, name: userName, email: userEmail },
      )
      downloadPDF(blob, `Comprovante-DomineAqui-${new Date().toISOString().slice(0, 10)}.pdf`, {
        type: 'exam_pdf',
        resourceId: userId,
        resourceTitle: 'Comprovante de Compras',
      })
    } catch (error: any) {
      onError('Erro ao gerar comprovante: ' + error.message)
    } finally {
      setGeneratingReceipt(false)
    }
  }

  if (loading) {
    return <div className="py-8 text-center text-sm text-muted-foreground">Carregando...</div>
  }

  if (purchases.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card py-10 text-center shadow-sm">
        <ShoppingBag className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
        <p className="mb-4 text-sm text-muted-foreground">Você ainda não comprou nenhum material</p>
        <Button size="sm" variant="outline" onClick={() => router.push('/materiais')}>
          Ver materiais
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end">
        <button
          onClick={handleGenerateReceipt}
          disabled={generatingReceipt}
          className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20 disabled:opacity-50"
        >
          <Receipt className="h-3 w-3" />
          {generatingReceipt ? 'Gerando...' : 'Comprovante PDF'}
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm">
        {purchases.map((p, i) => (
          <div
            key={p._id}
            className={cn('flex items-center gap-3 px-4 py-3', i !== purchases.length - 1 && 'border-b border-border/30')}
          >
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
              {p.itemType === 'manual_clinico' ? (
                <BookOpen className="h-4 w-4 text-primary" />
              ) : (
                <ShoppingBag className="h-4 w-4 text-primary" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className={cn('truncate text-sm font-medium', p.plusRevoked && 'text-muted-foreground')}>
                {p.itemTitle}
              </p>
              {p.plusRevoked && (
                <p className="mt-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                  Resgate do Plus+ suspenso — renove a assinatura para reativar
                </p>
              )}
              <p className="mt-0.5 text-xs text-muted-foreground">
                {new Date(p.purchasedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                {' · '}
                <span className="capitalize">
                  {p.itemType === 'manual_clinico' ? 'Produto' : p.itemType === 'package' ? 'Pacote' : 'Material'}
                </span>
                {p.couponCode ? <> {' · '}<span>Cupom {p.couponCode}</span></> : null}
              </p>
              {p.itemType === 'manual_clinico' && (p.planLabel || p.expiresAt || p.accessType) && (
                <p className="mt-0.5 text-[11px] text-muted-foreground/80">
                  {p.planLabel ? (
                    <span className="font-bold text-emerald-700 dark:text-emerald-300">{p.planLabel}</span>
                  ) : null}
                  {p.accessType === 'lifetime' || !p.expiresAt
                    ? ' · Vitalício (não expira)'
                    : (() => {
                        const end = new Date(p.expiresAt).getTime()
                        const ms = end - Date.now()
                        const days = Math.ceil(ms / 86_400_000)
                        const expStr = new Date(p.expiresAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                        return days <= 0
                          ? ` · Expirou em ${expStr}`
                          : ` · ${days} ${days === 1 ? 'dia' : 'dias'} restantes · Expira ${expStr}`
                      })()}
                </p>
              )}
            </div>
            {p.itemType === 'manual_clinico' && (
              <Button
                size="sm"
                variant="outline"
                className="hidden h-8 text-xs sm:inline-flex"
                onClick={() => router.push('/manual-clinico')}
              >
                Acessar Manual
              </Button>
            )}
            <div className="flex-shrink-0 text-right">
              {p.price === 0 ? (
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Grátis</span>
              ) : (
                <span className="text-sm font-bold">R$ {Number(p.price).toFixed(2)}</span>
              )}
            </div>
          </div>
        ))}
        <div className="flex items-center justify-between border-t border-border/30 bg-muted/20 px-4 py-3">
          <span className="text-xs text-muted-foreground">
            {purchases.length} {purchases.length === 1 ? 'compra' : 'compras'}
          </span>
          <span className="text-sm font-bold">
            Total: R$ {purchases.reduce((s: number, p: any) => s + (p.price || 0), 0).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  )
}
