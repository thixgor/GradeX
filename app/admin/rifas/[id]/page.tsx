'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, Loader2, Users, Receipt, Trophy, Pencil, Copy, Check,
  ExternalLink, Dices, AlertCircle, Play, Pause, XCircle, RotateCcw,
  Coins, User, Mail, Phone,
} from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AdminRaffleForm, emptyRaffleForm, type RaffleFormValues } from '@/components/rifas/admin-raffle-form'
import { formToPayload, isoToLocalInput } from '@/components/rifas/raffle-form-utils'
import { NumberGrid } from '@/components/rifas/number-grid'
import { resolveTheme, RAFFLE_STATUS_LABELS, formatBRL, pad } from '@/lib/raffle-shared'

type Tab = 'edit' | 'participants' | 'purchases' | 'draw' | 'manual'

export default function ManageRafflePage() {
  const params = useParams()
  const router = useRouter()
  const id = String(params.id || '')

  const [raffle, setRaffle] = useState<any>(null)
  const [formValues, setFormValues] = useState<RaffleFormValues | null>(null)
  const [soldNumbers, setSoldNumbers] = useState<number[]>([])
  const [reservedNumbers, setReservedNumbers] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('edit')
  const [copied, setCopied] = useState('')

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/raffles/${id}`)
      if (!res.ok) { router.push('/admin/rifas'); return }
      const data = await res.json()
      const r = data.raffle
      setRaffle(r)
      setSoldNumbers(data.soldNumbers || [])
      setReservedNumbers(data.reservedNumbers || [])
      setFormValues({
        ...emptyRaffleForm,
        name: r.name || '',
        slug: r.slug || '',
        description: r.description || '',
        pricePerNumber: r.pricePerNumber || 0,
        totalNumbers: r.totalNumbers || 0,
        winnersCount: r.winnersCount || 1,
        coverImageUrl: r.coverImageUrl || '',
        prizeName: r.prizeName || '',
        prizeDescription: r.prizeDescription || '',
        prizeCategory: r.prizeCategory || '',
        prizeImageUrl: r.prizeImageUrl || '',
        videos: (r.videos || []).map((vd: any) => ({ url: vd.url || '', caption: vd.caption || '' })),
        template: r.template || 'premium-dark',
        customDesign: r.customDesign || {},
        visibility: r.visibility || 'public',
        status: r.status || 'draft',
        rules: r.rules || '',
        allowManualDrawWhileOpen: !!r.allowManualDrawWhileOpen,
        allowDrawUnsoldNumbers: !!r.allowDrawUnsoldNumbers,
        startsAt: isoToLocalInput(r.startsAt),
        endsAt: isoToLocalInput(r.endsAt),
      })
    } finally {
      setLoading(false)
    }
  }, [id, router])

  useEffect(() => { load() }, [load])

  async function handleSave(values: RaffleFormValues) {
    const res = await fetch(`/api/admin/raffles/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formToPayload(values)),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error || 'Erro ao salvar.')
    }
    await load()
  }

  async function quickStatus(status: string) {
    const res = await fetch(`/api/admin/raffles/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) load()
    else { const d = await res.json().catch(() => ({})); alert(d.error || 'Erro.') }
  }

  function copyLink() {
    navigator.clipboard.writeText(`${window.location.origin}/rifas/${raffle.slug}`)
    setCopied('public')
    setTimeout(() => setCopied(''), 2000)
  }

  if (loading || !formValues || !raffle) {
    return <AppShell headerTitle="Rifa" headerSubtitle="Carregando"><div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></AppShell>
  }

  return (
    <AppShell headerTitle={raffle.name} headerSubtitle={`${RAFFLE_STATUS_LABELS[raffle.status as keyof typeof RAFFLE_STATUS_LABELS]} · ${raffle.soldCount || 0}/${raffle.totalNumbers} vendidos`}>
      <div className={`${tab === 'edit' ? 'max-w-6xl' : 'max-w-4xl'} mx-auto px-4 py-6 transition-[max-width]`}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <Button variant="ghost" onClick={() => router.push('/admin/rifas')}><ArrowLeft className="h-4 w-4 mr-2" /> Rifas</Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={copyLink}>
              {copied === 'public' ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />} Copiar link
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.open(`/rifas/${raffle.slug}`, '_blank')}>
              <ExternalLink className="h-4 w-4 mr-1" /> Abrir
            </Button>
          </div>
        </div>

        {/* Ações rápidas de status */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button size="sm" variant="outline" onClick={() => quickStatus('open')}><Play className="h-3.5 w-3.5 mr-1" /> Abrir</Button>
          <Button size="sm" variant="outline" onClick={() => quickStatus('closed')}><Pause className="h-3.5 w-3.5 mr-1" /> Encerrar</Button>
          <Button size="sm" variant="outline" onClick={() => quickStatus('cancelled')} className="text-red-500"><XCircle className="h-3.5 w-3.5 mr-1" /> Cancelar</Button>
          {raffle.winnersDrawn === 0 && raffle.status !== 'open' && (
            <Button size="sm" variant="outline" onClick={() => quickStatus('open')}><RotateCcw className="h-3.5 w-3.5 mr-1" /> Reabrir</Button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border mb-6 overflow-x-auto">
          <TabBtn active={tab === 'edit'} onClick={() => setTab('edit')} icon={<Pencil className="h-4 w-4" />} label="Editar" />
          <TabBtn active={tab === 'manual'} onClick={() => setTab('manual')} icon={<Coins className="h-4 w-4" />} label="Venda manual" />
          <TabBtn active={tab === 'draw'} onClick={() => setTab('draw')} icon={<Trophy className="h-4 w-4" />} label="Sorteio" />
          <TabBtn active={tab === 'participants'} onClick={() => setTab('participants')} icon={<Users className="h-4 w-4" />} label="Participantes" />
          <TabBtn active={tab === 'purchases'} onClick={() => setTab('purchases')} icon={<Receipt className="h-4 w-4" />} label="Compras" />
        </div>

        {tab === 'edit' && <AdminRaffleForm initial={formValues} submitLabel="Salvar alterações" onSubmit={handleSave} />}
        {tab === 'manual' && <ManualSalePanel raffle={raffle} soldNumbers={soldNumbers} reservedNumbers={reservedNumbers} onSold={load} />}
        {tab === 'draw' && <DrawPanel raffle={raffle} onDrawn={load} />}
        {tab === 'participants' && <ParticipantsPanel id={id} totalNumbers={raffle.totalNumbers} />}
        {tab === 'purchases' && <PurchasesPanel id={id} totalNumbers={raffle.totalNumbers} />}
      </div>
    </AppShell>
  )
}

function TabBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition whitespace-nowrap ${active ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
    >
      {icon} {label}
    </button>
  )
}

function DrawPanel({ raffle, onDrawn }: { raffle: any; onDrawn: () => void }) {
  const [count, setCount] = useState(1)
  const [allowUnsold, setAllowUnsold] = useState(false)
  const [specific, setSpecific] = useState('')
  const [drawing, setDrawing] = useState(false)
  const [error, setError] = useState('')

  const winners = raffle.winners || []
  const remaining = Math.max(0, (raffle.winnersCount || 1) - winners.length)

  async function handleDraw() {
    setError('')
    if (!confirm('Confirmar sorteio? O resultado é permanente.')) return
    setDrawing(true)
    try {
      const body: any = {}
      if (specific.trim()) {
        body.specificNumbers = specific.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n))
      } else {
        body.count = count
      }
      if (allowUnsold) body.allowUnsold = true
      const res = await fetch(`/api/admin/raffles/${raffle.id}/draw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao sortear.')
      onDrawn()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setDrawing(false)
    }
  }

  return (
    <div className="space-y-6">
      {winners.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-bold mb-3 flex items-center gap-2"><Trophy className="h-4 w-4 text-amber-500" /> Ganhadores ({winners.length})</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {winners.map((w: any) => (
              <div key={w.number} className="flex items-center gap-3 rounded-lg bg-muted p-3">
                <span className="text-xl font-black font-mono text-primary">{pad(w.number, raffle.totalNumbers)}</span>
                <div className="text-sm">
                  <div className="font-medium">{w.participantName || 'Participante'}</div>
                  <div className="text-xs text-muted-foreground">{w.drawMethod === 'manual' ? 'Manual' : 'Automático'} · {new Date(w.drawnAt).toLocaleString('pt-BR')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {remaining > 0 ? (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="font-bold flex items-center gap-2"><Dices className="h-4 w-4" /> Realizar sorteio</h3>
          <p className="text-sm text-muted-foreground">Faltam {remaining} ganhador(es) a sortear.</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Quantidade a sortear</label>
              <input type="number" min={1} max={remaining} value={count} onChange={e => setCount(Math.max(1, Math.min(remaining, Number(e.target.value))))} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium">Ou números específicos (vírgula)</label>
              <input value={specific} onChange={e => setSpecific(e.target.value)} placeholder="12, 47, 88" className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={allowUnsold} onChange={e => setAllowUnsold(e.target.checked)} className="h-4 w-4" />
            Permitir sortear números não vendidos
          </label>
          {error && <p className="text-sm text-red-500 flex items-center gap-1"><AlertCircle className="h-4 w-4" /> {error}</p>}
          <Button onClick={handleDraw} disabled={drawing}>
            {drawing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Dices className="h-4 w-4 mr-2" />}
            Sortear agora
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-5 text-center text-muted-foreground">
          <Check className="h-8 w-8 mx-auto mb-2 text-green-500" />
          Todos os ganhadores já foram sorteados.
        </div>
      )}
    </div>
  )
}

function ManualSalePanel({ raffle, soldNumbers, reservedNumbers, onSold }: { raffle: any; soldNumbers: number[]; reservedNumbers: number[]; onSold: () => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [selected, setSelected] = useState<number[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const theme = resolveTheme(raffle.template, raffle.customDesign)
  const amount = Math.round((raffle.pricePerNumber || 0) * selected.length * 100) / 100

  async function handleSubmit() {
    setError(''); setSuccess('')
    if (name.trim().length < 2) return setError('Informe o nome do participante.')
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return setError('Informe um e-mail válido.')
    if (phone.replace(/\D/g, '').length < 8) return setError('Informe um telefone/WhatsApp válido.')
    if (selected.length === 0) return setError('Selecione ao menos um número.')
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/raffles/${raffle.id}/manual-sale`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), phone: phone.trim(), numbers: selected }),
      })
      const data = await res.json()
      if (!res.ok) {
        const conf = (data.conflicting || []).map((n: number) => pad(n, raffle.totalNumbers)).join(', ')
        throw new Error(data.error + (conf ? ` Números em conflito: ${conf}` : ''))
      }
      const conf = (data.conflicting || []).length
      setSuccess(`Venda registrada com sucesso!${conf ? ` (${conf} número(s) já estavam tomados e foram ignorados.)` : ''}`)
      setName(''); setEmail(''); setPhone(''); setSelected([])
      onSold()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="mb-1 flex items-center gap-2 font-bold"><Coins className="h-4 w-4 text-emerald-500" /> Venda manual</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Registre uma venda paga fora do Mercado Pago (dinheiro, Pix manual, cortesia). Os números ficam marcados como vendidos imediatamente.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nome completo" className="pl-9" />
          </div>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="E-mail" type="email" className="pl-9" />
          </div>
          <div className="relative">
            <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Celular / WhatsApp" className="pl-9" />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h4 className="mb-3 text-sm font-semibold">Selecione os números</h4>
        <NumberGrid
          totalNumbers={raffle.totalNumbers}
          soldNumbers={soldNumbers}
          reservedNumbers={reservedNumbers}
          selected={selected}
          onChange={setSelected}
          theme={theme}
        />
      </div>

      {error && <p className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-500"><AlertCircle className="h-4 w-4" /> {error}</p>}
      {success && <p className="flex items-center gap-1.5 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-600"><Check className="h-4 w-4" /> {success}</p>}

      <div className="sticky bottom-0 flex flex-col gap-3 bg-background/80 py-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          {selected.length} número(s) · <span className="font-bold text-foreground">{formatBRL(amount)}</span>
        </div>
        <Button onClick={handleSubmit} disabled={saving} size="lg">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Coins className="mr-2 h-4 w-4" />}
          Registrar venda
        </Button>
      </div>
    </div>
  )
}

function ParticipantsPanel({ id, totalNumbers }: { id: string; totalNumbers: number }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    fetch(`/api/admin/raffles/${id}/participants`).then(r => r.json()).then(setData).finally(() => setLoading(false))
  }, [id])
  if (loading) return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
  const participants = data?.participants || []
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="p-4 border-b border-border font-bold">{participants.length} participante(s)</div>
      {participants.length === 0 ? (
        <p className="p-6 text-center text-muted-foreground text-sm">Nenhum participante com compra paga ainda.</p>
      ) : (
        <div className="divide-y divide-border">
          {participants.map((p: any, i: number) => (
            <div key={i} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="font-medium">{p.name}</div>
                <div className="text-xs text-muted-foreground">{p.email} · {p.phone}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold">{p.count} número(s) · {formatBRL(p.total)}</div>
                <div className="text-xs text-muted-foreground max-w-xs truncate">{p.numbers.map((n: number) => pad(n, totalNumbers)).join(', ')}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function PurchasesPanel({ id, totalNumbers }: { id: string; totalNumbers: number }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    fetch(`/api/admin/raffles/${id}/purchases`).then(r => r.json()).then(setData).finally(() => setLoading(false))
  }, [id])
  if (loading) return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
  const purchases = data?.purchases || []
  const statusColors: Record<string, string> = { paid: 'text-green-600', pending: 'text-amber-600', expired: 'text-gray-400', cancelled: 'text-red-500', refunded: 'text-purple-500' }
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="p-4 border-b border-border font-bold flex justify-between">
        <span>{purchases.length} compra(s)</span>
        <span className="text-green-600">{formatBRL(data?.paidTotal || 0)} arrecadado</span>
      </div>
      {purchases.length === 0 ? (
        <p className="p-6 text-center text-muted-foreground text-sm">Nenhuma compra registrada.</p>
      ) : (
        <div className="divide-y divide-border">
          {purchases.map((p: any) => (
            <div key={p.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="font-medium">{p.name} <span className={`text-xs font-bold ${statusColors[p.status] || ''}`}>· {p.status}</span></div>
                <div className="text-xs text-muted-foreground">{p.email} · {new Date(p.createdAt).toLocaleString('pt-BR')}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold">{formatBRL(p.amount)}</div>
                <div className="text-xs text-muted-foreground max-w-xs truncate">{p.numbers.map((n: number) => pad(n, totalNumbers)).join(', ')}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
