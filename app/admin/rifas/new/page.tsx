'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
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
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Button variant="ghost" onClick={() => router.push('/admin/rifas')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>
        <AdminRaffleForm initial={emptyRaffleForm} submitLabel="Criar rifa" onSubmit={handleSubmit} />
      </div>
    </AppShell>
  )
}
