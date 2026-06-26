'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Ticket } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { AdminRaffleForm, emptyRaffleForm, type RaffleFormValues } from '@/components/rifas/admin-raffle-form'
import { formToPayload } from '@/components/rifas/raffle-form-utils'

export default function NewRafflePage() {
  const router = useRouter()

  async function handleSubmit(values: RaffleFormValues) {
    const res = await fetch('/api/admin/raffles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formToPayload(values)),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error || 'Erro ao criar rifa.')
    }
    const data = await res.json()
    router.push(`/admin/rifas/${data.id}`)
  }

  return (
    <AppShell headerTitle="Nova rifa" headerSubtitle="Configure os detalhes da rifa">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <Button variant="ghost" onClick={() => router.push('/admin/rifas')} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para rifas
        </Button>

        {/* Hero */}
        <div className="mb-6 overflow-hidden rounded-2xl border border-border bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-transparent p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 p-3 text-white shadow-lg">
              <Ticket className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold sm:text-2xl">Criar nova rifa</h1>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Preencha os campos e acompanhe como a página ficará na pré-visualização ao lado.
                Você pode salvar como rascunho e abrir para venda depois.
              </p>
            </div>
          </div>
        </div>

        <AdminRaffleForm initial={emptyRaffleForm} submitLabel="Criar rifa" onSubmit={handleSubmit} />
      </div>
    </AppShell>
  )
}
