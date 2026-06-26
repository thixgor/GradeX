'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Plus, Loader2, Ticket, Copy, Trash2, Pencil, ExternalLink,
  Check, Filter, Gift,
} from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { RAFFLE_STATUS_LABELS, RAFFLE_STATUS_COLORS, RAFFLE_VISIBILITY_LABELS, formatBRL } from '@/lib/raffle-shared'

interface AdminRaffle {
  id: string
  name: string
  slug: string
  prizeName: string
  prizeCategory: string
  coverImageUrl: string
  pricePerNumber: number
  totalNumbers: number
  winnersCount: number
  soldCount: number
  status: string
  effectiveStatus: string
  visibility: string
  template: string
  winnersDrawn: number
}

export default function AdminRifasPage() {
  const router = useRouter()
  const [raffles, setRaffles] = useState<AdminRaffle[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [visibilityFilter, setVisibilityFilter] = useState('')
  const [copiedId, setCopiedId] = useState('')

  async function load() {
    setLoading(true)
    const qs = new URLSearchParams()
    if (statusFilter) qs.set('status', statusFilter)
    if (visibilityFilter) qs.set('visibility', visibilityFilter)
    try {
      const res = await fetch(`/api/admin/raffles?${qs.toString()}`)
      const data = await res.json()
      setRaffles(data.raffles || [])
    } catch {} finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [statusFilter, visibilityFilter])

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Excluir a rifa "${name}"? Esta ação remove participantes, números e ganhadores. Não pode ser desfeita.`)) return
    const res = await fetch(`/api/admin/raffles/${id}`, { method: 'DELETE' })
    if (res.ok) load()
    else alert('Erro ao excluir.')
  }

  async function handleDuplicate(id: string) {
    const res = await fetch(`/api/admin/raffles/${id}/duplicate`, { method: 'POST' })
    if (res.ok) {
      const data = await res.json()
      router.push(`/admin/rifas/${data.id}`)
    } else alert('Erro ao duplicar.')
  }

  function copyLink(slug: string, id: string) {
    const url = `${window.location.origin}/rifas/${slug}`
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(''), 2000)
  }

  return (
    <AppShell headerTitle="Rifas" headerSubtitle="Crie e gerencie rifas e sorteios">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <Button variant="ghost" onClick={() => router.push('/admin')} className="self-start">
            <ArrowLeft className="h-4 w-4 mr-2" /> Painel
          </Button>
          <Button onClick={() => router.push('/admin/rifas/new')}>
            <Plus className="h-4 w-4 mr-2" /> Nova rifa
          </Button>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">Todos os status</option>
            {Object.entries(RAFFLE_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={visibilityFilter} onChange={e => setVisibilityFilter(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">Todas as visibilidades</option>
            {Object.entries(RAFFLE_VISIBILITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : raffles.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Ticket className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p>Nenhuma rifa criada ainda.</p>
            <Button className="mt-4" onClick={() => router.push('/admin/rifas/new')}><Plus className="h-4 w-4 mr-2" /> Criar primeira rifa</Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {raffles.map(r => {
              const pct = r.totalNumbers > 0 ? Math.round((r.soldCount / r.totalNumbers) * 100) : 0
              const statusColor = RAFFLE_STATUS_COLORS[(r.effectiveStatus || r.status) as keyof typeof RAFFLE_STATUS_COLORS]
              return (
                <div key={r.id} className="rounded-xl border border-border bg-card overflow-hidden flex flex-col">
                  <div className="h-28 bg-muted relative flex items-center justify-center">
                    {r.coverImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.coverImageUrl} alt={r.name} className="w-full h-full object-cover" />
                    ) : <Gift className="h-8 w-8 text-muted-foreground/40" />}
                    <span className="absolute top-2 left-2 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase" style={{ background: `${statusColor}22`, color: statusColor, border: `1px solid ${statusColor}66` }}>
                      {RAFFLE_STATUS_LABELS[(r.effectiveStatus || r.status) as keyof typeof RAFFLE_STATUS_LABELS]}
                    </span>
                    <span className="absolute top-2 right-2 rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-medium">{RAFFLE_VISIBILITY_LABELS[r.visibility as keyof typeof RAFFLE_VISIBILITY_LABELS]}</span>
                  </div>
                  <div className="p-4 flex flex-col flex-1 gap-2">
                    <h3 className="font-bold line-clamp-1">{r.name}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-1">{r.prizeName}</p>
                    <div className="text-xs text-muted-foreground">
                      {formatBRL(r.pricePerNumber)} · {r.soldCount}/{r.totalNumbers} ({pct}%) · {r.winnersDrawn}/{r.winnersCount} sorteados
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex items-center gap-1.5 mt-auto pt-2">
                      <Button size="sm" variant="default" className="flex-1" onClick={() => router.push(`/admin/rifas/${r.id}`)}>
                        <Pencil className="h-3.5 w-3.5 mr-1" /> Gerenciar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => copyLink(r.slug, r.id)} title="Copiar link público">
                        {copiedId === r.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => window.open(`/rifas/${r.slug}`, '_blank')} title="Abrir página">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDuplicate(r.id)} title="Duplicar">
                        <Copy className="h-3.5 w-3.5 opacity-60" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDelete(r.id, r.name)} title="Excluir" className="text-red-500 hover:text-red-600">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AppShell>
  )
}
