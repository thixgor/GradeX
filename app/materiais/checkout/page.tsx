'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, ChevronLeft } from 'lucide-react'
import { MercadoPagoCheckout } from '@/components/payments/mercado-pago-checkout'

export default function MateriaisCheckoutPage() {
  const router = useRouter()
  const params = useSearchParams()
  const itemType = (params.get('type') as 'material' | 'package') || 'material'
  const itemId = params.get('id') || ''

  const [item, setItem] = useState<any>(null)
  const [publicKey, setPublicKey] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!itemId) {
      setError('Item não informado')
      setLoading(false)
      return
    }
    Promise.all([
      fetch(`/api/materiais${itemType === 'package' ? '/packages' : ''}?id=${itemId}`).then(r => r.json()),
      fetch('/api/payments/public-key').then(r => r.json()),
    ])
      .then(([itemResp, pkResp]) => {
        const found = Array.isArray(itemResp)
          ? itemResp.find((x: any) => x._id === itemId)
          : itemResp.materials?.find((x: any) => x._id === itemId) ||
            itemResp.packages?.find((x: any) => x._id === itemId) ||
            itemResp
        if (!found || !found._id) {
          setError('Item não encontrado')
          return
        }
        setItem(found)
        setPublicKey(pkResp.publicKey || '')
      })
      .catch(err => setError(String(err?.message || err)))
      .finally(() => setLoading(false))
  }, [itemId, itemType])

  if (loading) {
    return (
      <AppShell headerTitle="Checkout">
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </AppShell>
    )
  }

  if (error || !item) {
    return (
      <AppShell headerTitle="Checkout">
        <div className="max-w-2xl mx-auto p-6 space-y-4">
          <Card><CardContent className="pt-6">{error || 'Item não disponível.'}</CardContent></Card>
          <Button variant="outline" onClick={() => router.push('/materiais')}>
            <ChevronLeft className="h-4 w-4 mr-2" /> Voltar
          </Button>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell headerTitle="Checkout" headerSubtitle={item.title}>
      <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/materiais')}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>{item.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <MercadoPagoCheckout
              publicKey={publicKey}
              amount={Number(item.price || 0)}
              description={item.title}
              endpoint="/api/materiais/checkout"
              extraBody={{ itemType, itemId }}
              onApproved={(resp) => {
                setTimeout(() => {
                  window.location.href = resp.successRedirect || '/materiais?purchase=success'
                }, 1200)
              }}
            />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
