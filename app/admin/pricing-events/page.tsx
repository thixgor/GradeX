'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Calendar,
  CalendarClock,
  Check,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { PricingEventCountdown, type PricingEventStatePayload } from '@/components/pricing-events/PricingEventCountdown'

type Mode = 'weekly' | 'manual'

interface WeeklyTier {
  weeksBefore: number
  discountPercent: number
  label?: string
  // Apenas no formulário (modo "valor"): valor final digitado pelo admin. Não é persistido.
  targetValue?: string
}

interface ManualTier {
  startAt: string
  endAt: string
  discountPercent: number
  label?: string
  targetValue?: string
}

type DiscountMode = 'percent' | 'value'

function clampPct(n: number) {
  if (!Number.isFinite(n)) return 0
  return Math.min(100, Math.max(0, Math.round(n * 100) / 100))
}

// % de desconto necessário para que `base` chegue em `finalValue`.
function valueToPct(finalValue: number, base: number) {
  if (!base || base <= 0 || !Number.isFinite(finalValue)) return 0
  return clampPct((1 - finalValue / base) * 100)
}

// Valor final resultante de aplicar `pct` sobre `base`.
function pctToValue(pct: number, base: number) {
  if (!base || base <= 0) return 0
  return Math.max(0, Math.round(base * (1 - pct / 100) * 100) / 100)
}

interface PricingEvent {
  id: string
  name: string
  description: string
  bannerUrl: string
  eventDate: string
  mode: Mode
  weeklyTiers: WeeklyTier[]
  manualTiers: ManualTier[]
  isActive: boolean
  createdAt: string
  updatedAt: string
  state: PricingEventStatePayload | null
}

function emptyForm() {
  return {
    name: '',
    description: '',
    bannerUrl: '',
    eventDate: '',
    mode: 'weekly' as Mode,
    weeklyTiers: [
      { weeksBefore: 4, discountPercent: 50 },
      { weeksBefore: 3, discountPercent: 40 },
      { weeksBefore: 2, discountPercent: 30 },
      { weeksBefore: 1, discountPercent: 20 },
      { weeksBefore: 0, discountPercent: 10 },
    ] as WeeklyTier[],
    manualTiers: [] as ManualTier[],
    isActive: true,
  }
}

function toLocalInput(dateIso: string) {
  if (!dateIso) return ''
  const d = new Date(dateIso)
  if (Number.isNaN(d.getTime())) return ''
  const offset = d.getTimezoneOffset() * 60_000
  return new Date(d.getTime() - offset).toISOString().slice(0, 16)
}

function fromLocalInput(value: string) {
  if (!value) return ''
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? '' : d.toISOString()
}

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

const glassCard: React.CSSProperties = {
  background: 'rgba(6,20,10,0.85)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(52,211,153,0.15)',
  borderRadius: '20px',
}

export default function PricingEventsAdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<PricingEvent[]>([])
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm())
  const [previewPrice, setPreviewPrice] = useState<number>(100)
  const [discountMode, setDiscountMode] = useState<DiscountMode>('percent')
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)

  // Quando se define o desconto por valor, o % depende do preço de referência.
  // Ao mudar a referência, recalcula o % dos lotes que têm valor digitado.
  function changeReferencePrice(next: number) {
    setPreviewPrice(next)
    if (discountMode !== 'value') return
    setForm((f) => ({
      ...f,
      weeklyTiers: f.weeklyTiers.map((t) =>
        t.targetValue != null && t.targetValue !== ''
          ? { ...t, discountPercent: valueToPct(parseFloat(t.targetValue), next) }
          : t
      ),
      manualTiers: f.manualTiers.map((t) =>
        t.targetValue != null && t.targetValue !== ''
          ? { ...t, discountPercent: valueToPct(parseFloat(t.targetValue), next) }
          : t
      ),
    }))
  }

  useEffect(() => {
    refresh()
  }, [])

  async function refresh() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/pricing-events', { cache: 'no-store' })
      if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error || 'Falha ao carregar')
      const data = await res.json()
      setEvents(data.events || [])
    } catch (e: any) {
      setError(e?.message || 'Erro ao carregar eventos')
    } finally {
      setLoading(false)
    }
  }

  function startCreate() {
    setEditingId(null)
    setForm(emptyForm())
    setShowForm(true)
  }

  function startEdit(event: PricingEvent) {
    setEditingId(event.id)
    setForm({
      name: event.name,
      description: event.description,
      bannerUrl: event.bannerUrl,
      eventDate: toLocalInput(event.eventDate),
      mode: event.mode,
      weeklyTiers: event.weeklyTiers.length > 0 ? event.weeklyTiers : emptyForm().weeklyTiers,
      manualTiers: event.manualTiers.map((t) => ({
        ...t,
        startAt: toLocalInput(t.startAt),
        endAt: toLocalInput(t.endAt),
      })),
      isActive: event.isActive,
    })
    setShowForm(true)
  }

  function cancelForm() {
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm())
  }

  function addWeeklyTier() {
    setForm((f) => ({
      ...f,
      weeklyTiers: [...f.weeklyTiers, { weeksBefore: 0, discountPercent: 5 }],
    }))
  }
  function removeWeeklyTier(idx: number) {
    setForm((f) => ({ ...f, weeklyTiers: f.weeklyTiers.filter((_, i) => i !== idx) }))
  }
  function updateWeeklyTier(idx: number, patch: Partial<WeeklyTier>) {
    setForm((f) => ({
      ...f,
      weeklyTiers: f.weeklyTiers.map((t, i) => (i === idx ? { ...t, ...patch } : t)),
    }))
  }

  function addManualTier() {
    setForm((f) => ({
      ...f,
      manualTiers: [
        ...f.manualTiers,
        { startAt: '', endAt: '', discountPercent: 10 },
      ],
    }))
  }
  function removeManualTier(idx: number) {
    setForm((f) => ({ ...f, manualTiers: f.manualTiers.filter((_, i) => i !== idx) }))
  }
  function updateManualTier(idx: number, patch: Partial<ManualTier>) {
    setForm((f) => ({
      ...f,
      manualTiers: f.manualTiers.map((t, i) => (i === idx ? { ...t, ...patch } : t)),
    }))
  }

  async function save() {
    if (saving) return
    setSaving(true)
    setError('')
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        bannerUrl: form.bannerUrl.trim() || undefined,
        eventDate: fromLocalInput(form.eventDate),
        mode: form.mode,
        weeklyTiers: form.mode === 'weekly'
          ? form.weeklyTiers.map(({ targetValue, ...t }) => ({
              ...t,
              discountPercent: clampPct(t.discountPercent),
            }))
          : [],
        manualTiers: form.mode === 'manual'
          ? form.manualTiers.map(({ targetValue, ...t }) => ({
              ...t,
              discountPercent: clampPct(t.discountPercent),
              startAt: fromLocalInput(t.startAt),
              endAt: fromLocalInput(t.endAt),
            }))
          : [],
        isActive: form.isActive,
      }
      const url = editingId ? `/api/admin/pricing-events/${editingId}` : '/api/admin/pricing-events'
      const method = editingId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error || 'Falha ao salvar')
      }
      await refresh()
      cancelForm()
    } catch (e: any) {
      setError(e?.message || 'Erro ao salvar evento')
    } finally {
      setSaving(false)
    }
  }

  async function remove(eventId: string) {
    if (!window.confirm('Remover este evento? Os materiais ficarão sem desconto progressivo.')) return
    try {
      const res = await fetch(`/api/admin/pricing-events/${eventId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Falha ao remover')
      await refresh()
    } catch (e: any) {
      setError(e?.message || 'Erro ao remover')
    }
  }

  const previewState = useMemo<PricingEventStatePayload | null>(() => {
    // Constrói um state de preview a partir do formulário atual usando lógica do server.
    if (!form.eventDate) return null
    const eventDate = new Date(form.eventDate)
    if (Number.isNaN(eventDate.getTime())) return null
    const now = new Date()

    const startOfDay = (d: Date) => {
      const x = new Date(d)
      x.setHours(0, 0, 0, 0)
      return x
    }
    const event0 = startOfDay(eventDate)

    if (form.mode === 'weekly') {
      const tiers = [...form.weeklyTiers]
        .map((t) => ({ ...t }))
        .filter((t) => Number.isFinite(t.weeksBefore))
        .sort((a, b) => b.weeksBefore - a.weeksBefore)
      const timeline = tiers.map((t, i) => {
        const startAt = new Date(event0)
        startAt.setDate(event0.getDate() - t.weeksBefore * 7)
        const next = tiers[i + 1]
        const endAt = new Date(event0)
        if (next) endAt.setDate(event0.getDate() - next.weeksBefore * 7)
        else endAt.setTime(eventDate.getTime())
        return {
          index: i,
          startAt: startAt.toISOString(),
          endAt: endAt.toISOString(),
          discountPercent: t.discountPercent,
          label: t.label || (t.weeksBefore <= 0 ? 'Semana do evento' : t.weeksBefore === 1 ? '1 semana antes' : `${t.weeksBefore}+ semanas antes`),
          isActive: now >= startAt && now < endAt,
          isPast: now >= endAt,
          isFuture: now < startAt,
        }
      })
      const active = timeline.find((t) => t.isActive) || null
      const next = timeline.find((t) => t.isFuture) || null
      return {
        eventId: 'preview',
        name: form.name || 'Evento',
        description: form.description,
        bannerUrl: form.bannerUrl,
        eventDate: eventDate.toISOString(),
        mode: 'weekly',
        isActive: form.isActive,
        daysUntilEvent: Math.round((event0.getTime() - startOfDay(now).getTime()) / 86_400_000),
        maxDiscountPercent: timeline.reduce((m, t) => Math.max(m, t.discountPercent), 0),
        activeTier: active ? {
          index: active.index, discountPercent: active.discountPercent, label: active.label, endsAt: active.endAt, startedAt: active.startAt,
        } : null,
        nextTier: next ? {
          index: next.index, discountPercent: next.discountPercent, label: next.label, startsAt: next.startAt, endsAt: next.endAt,
        } : null,
        tiersTimeline: timeline,
      }
    }

    const cleaned = form.manualTiers
      .map((t) => ({ ...t }))
      .filter((t) => t.startAt && t.endAt)
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
    const timeline = cleaned.map((t, i) => {
      const startAt = new Date(t.startAt)
      const endAt = new Date(t.endAt)
      return {
        index: i,
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        discountPercent: t.discountPercent,
        label: t.label || `Lote ${i + 1}`,
        isActive: now >= startAt && now < endAt,
        isPast: now >= endAt,
        isFuture: now < startAt,
      }
    })
    const active = timeline.find((t) => t.isActive) || null
    const next = timeline.find((t) => t.isFuture) || null
    return {
      eventId: 'preview',
      name: form.name || 'Evento',
      description: form.description,
      bannerUrl: form.bannerUrl,
      eventDate: eventDate.toISOString(),
      mode: 'manual',
      isActive: form.isActive,
      daysUntilEvent: Math.round((event0.getTime() - startOfDay(now).getTime()) / 86_400_000),
      maxDiscountPercent: timeline.reduce((m, t) => Math.max(m, t.discountPercent), 0),
      activeTier: active ? {
        index: active.index, discountPercent: active.discountPercent, label: active.label, endsAt: active.endAt, startedAt: active.startAt,
      } : null,
      nextTier: next ? {
        index: next.index, discountPercent: next.discountPercent, label: next.label, startsAt: next.startAt, endsAt: next.endAt,
      } : null,
      tiersTimeline: timeline,
    }
  }, [form])

  const previewFinalPrice = useMemo(() => {
    if (!previewState?.activeTier) return previewPrice
    const discount = previewPrice * (previewState.activeTier.discountPercent / 100)
    return Math.max(0, Math.round((previewPrice - discount) * 100) / 100)
  }, [previewPrice, previewState])

  if (loading) {
    return (
      <AppShell>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="container mx-auto max-w-6xl py-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.push('/admin')}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </Button>
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
                <Calendar className="h-6 w-6 text-emerald-400" />
                Lotes Dinâmicos por Evento
              </h1>
              <p className="text-sm text-slate-400">
                Descontos progressivos vinculados a uma prova. Quanto antes comprar, maior o desconto.
              </p>
            </div>
          </div>
          {!showForm && (
            <Button onClick={startCreate} className="gap-1 bg-emerald-600 hover:bg-emerald-500">
              <Plus className="h-4 w-4" /> Novo evento
            </Button>
          )}
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {showForm && (
          <div className="mb-8 grid gap-6 lg:grid-cols-[1.2fr,1fr]">
            <Card style={glassCard}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-white">
                  <span>{editingId ? 'Editar evento' : 'Criar novo evento'}</span>
                  <Button variant="ghost" size="sm" onClick={cancelForm}>
                    <X className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label className="text-xs text-slate-300">Nome do evento</Label>
                    <Input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Ex: ME 2 — SOI III"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-300">Data e hora do evento</Label>
                    <Input
                      type="datetime-local"
                      value={form.eventDate}
                      onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-slate-300">Descrição (opcional)</Label>
                  <Textarea
                    rows={2}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Texto curto exibido no contador da página do material."
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-300">URL do banner (opcional)</Label>
                  <Input
                    value={form.bannerUrl}
                    onChange={(e) => setForm({ ...form, bannerUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </div>

                <div className="flex items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                  <input
                    id="active"
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  />
                  <label htmlFor="active" className="text-sm text-slate-200">
                    Sistema de lotes ativo (descontos serão aplicados)
                  </label>
                </div>

                <div className="space-y-3">
                  <Label className="text-xs uppercase tracking-wider text-emerald-300">Modo de lote</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, mode: 'weekly' })}
                      className={`rounded-lg border px-3 py-2 text-left text-xs transition ${
                        form.mode === 'weekly'
                          ? 'border-emerald-400/60 bg-emerald-500/10 text-emerald-200'
                          : 'border-slate-600/40 bg-slate-800/30 text-slate-400'
                      }`}
                    >
                      <div className="font-semibold">Automático por semana</div>
                      <div className="opacity-70">Sistema calcula a partir da data do evento.</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, mode: 'manual' })}
                      className={`rounded-lg border px-3 py-2 text-left text-xs transition ${
                        form.mode === 'manual'
                          ? 'border-emerald-400/60 bg-emerald-500/10 text-emerald-200'
                          : 'border-slate-600/40 bg-slate-800/30 text-slate-400'
                      }`}
                    >
                      <div className="font-semibold">Datas manuais</div>
                      <div className="opacity-70">Defina cada janela de lote livremente.</div>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-emerald-300">Como definir o desconto</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDiscountMode('percent')}
                      className={`rounded-lg border px-3 py-2 text-left text-xs transition ${
                        discountMode === 'percent'
                          ? 'border-emerald-400/60 bg-emerald-500/10 text-emerald-200'
                          : 'border-slate-600/40 bg-slate-800/30 text-slate-400'
                      }`}
                    >
                      <div className="font-semibold">Porcentagem (%)</div>
                      <div className="opacity-70">Digite o % de desconto de cada lote.</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiscountMode('value')}
                      className={`rounded-lg border px-3 py-2 text-left text-xs transition ${
                        discountMode === 'value'
                          ? 'border-emerald-400/60 bg-emerald-500/10 text-emerald-200'
                          : 'border-slate-600/40 bg-slate-800/30 text-slate-400'
                      }`}
                    >
                      <div className="font-semibold">Valor final (R$)</div>
                      <div className="opacity-70">Digite o preço de cada lote — o % é calculado.</div>
                    </button>
                  </div>
                  {discountMode === 'value' && (
                    <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                      <Label className="text-[11px] text-slate-300">Preço de referência (base para calcular o %)</Label>
                      <div className="relative mt-1">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">R$</span>
                        <Input
                          type="number"
                          min={0}
                          value={previewPrice}
                          onChange={(e) => changeReferencePrice(Number(e.target.value || 0))}
                          className="pl-9"
                        />
                      </div>
                      <p className="mt-1.5 text-[10px] leading-snug text-slate-400">
                        O % é calculado sobre este preço e aplicado proporcionalmente a todos os produtos do evento.
                        Produtos com outro preço terão o mesmo % (não exatamente o valor digitado).
                      </p>
                    </div>
                  )}
                </div>

                {form.mode === 'weekly' ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs uppercase tracking-wider text-slate-300">Lotes (semanas antes)</Label>
                      <Button size="sm" variant="ghost" onClick={addWeeklyTier} className="gap-1">
                        <Plus className="h-3 w-3" /> Adicionar
                      </Button>
                    </div>
                    {form.weeklyTiers.map((tier, idx) => (
                      <div key={idx} className="grid grid-cols-[1fr,1fr,auto] gap-2">
                        <Input
                          type="number"
                          min={0}
                          value={tier.weeksBefore}
                          onChange={(e) => updateWeeklyTier(idx, { weeksBefore: Number(e.target.value) })}
                          placeholder="Semanas antes"
                        />
                        {discountMode === 'value' ? (
                          <div className="relative">
                            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">R$</span>
                            <Input
                              type="number"
                              min={0}
                              value={tier.targetValue ?? String(pctToValue(tier.discountPercent, previewPrice))}
                              onChange={(e) => updateWeeklyTier(idx, {
                                targetValue: e.target.value,
                                discountPercent: valueToPct(parseFloat(e.target.value || '0'), previewPrice),
                              })}
                              placeholder="Valor final"
                              className="pl-9"
                            />
                            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-emerald-300/80">−{Math.round(tier.discountPercent)}%</span>
                          </div>
                        ) : (
                          <div className="relative">
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              value={tier.discountPercent}
                              onChange={(e) => updateWeeklyTier(idx, { discountPercent: Number(e.target.value), targetValue: undefined })}
                              placeholder="% OFF"
                            />
                            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
                          </div>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => removeWeeklyTier(idx)}>
                          <Trash2 className="h-4 w-4 text-red-300" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs uppercase tracking-wider text-slate-300">Lotes (datas manuais)</Label>
                      <Button size="sm" variant="ghost" onClick={addManualTier} className="gap-1">
                        <Plus className="h-3 w-3" /> Adicionar
                      </Button>
                    </div>
                    {form.manualTiers.map((tier, idx) => (
                      <div key={idx} className="space-y-1 rounded-lg border border-slate-700/40 p-2">
                        <div className="grid gap-2 sm:grid-cols-2">
                          <div>
                            <Label className="text-[10px] text-slate-400">Início</Label>
                            <Input
                              type="datetime-local"
                              value={tier.startAt}
                              onChange={(e) => updateManualTier(idx, { startAt: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label className="text-[10px] text-slate-400">Fim</Label>
                            <Input
                              type="datetime-local"
                              value={tier.endAt}
                              onChange={(e) => updateManualTier(idx, { endAt: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-[1fr,1fr,auto] gap-2">
                          <Input
                            value={tier.label || ''}
                            onChange={(e) => updateManualTier(idx, { label: e.target.value })}
                            placeholder="Rótulo (opcional)"
                          />
                          {discountMode === 'value' ? (
                            <div className="relative">
                              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">R$</span>
                              <Input
                                type="number"
                                min={0}
                                value={tier.targetValue ?? String(pctToValue(tier.discountPercent, previewPrice))}
                                onChange={(e) => updateManualTier(idx, {
                                  targetValue: e.target.value,
                                  discountPercent: valueToPct(parseFloat(e.target.value || '0'), previewPrice),
                                })}
                                placeholder="Valor final"
                                className="pl-9"
                              />
                              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-emerald-300/80">−{Math.round(tier.discountPercent)}%</span>
                            </div>
                          ) : (
                            <div className="relative">
                              <Input
                                type="number"
                                min={0}
                                max={100}
                                value={tier.discountPercent}
                                onChange={(e) => updateManualTier(idx, { discountPercent: Number(e.target.value), targetValue: undefined })}
                                placeholder="% OFF"
                              />
                              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
                            </div>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => removeManualTier(idx)}>
                            <Trash2 className="h-4 w-4 text-red-300" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="ghost" onClick={cancelForm}>Cancelar</Button>
                  <Button onClick={save} disabled={saving} className="gap-1 bg-emerald-600 hover:bg-emerald-500">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    {editingId ? 'Salvar alterações' : 'Criar evento'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card style={glassCard}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm text-emerald-300">
                    <Sparkles className="h-4 w-4" /> Pré-visualização ao vivo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {previewState ? (
                    <PricingEventCountdown state={previewState} />
                  ) : (
                    <div className="rounded-lg border border-slate-700/40 bg-slate-800/30 p-4 text-sm text-slate-400">
                      Preencha a data do evento para ver a prévia.
                    </div>
                  )}

                  <div className="rounded-lg border border-slate-700/40 bg-slate-800/30 p-3">
                    <Label className="text-xs text-slate-300">Preço fictício para simulação</Label>
                    <Input
                      type="number"
                      min={0}
                      value={previewPrice}
                      onChange={(e) => changeReferencePrice(Number(e.target.value || 0))}
                    />
                    <div className="mt-3 text-sm text-slate-200">
                      Lote atual: <span className="text-emerald-300">{previewState?.activeTier?.label || '—'}</span>
                    </div>
                    <div className="text-sm text-slate-200">
                      Final: <strong className="text-white">{currency.format(previewFinalPrice)}</strong>{' '}
                      {previewState?.activeTier ? (
                        <span className="text-xs text-slate-400 line-through">{currency.format(previewPrice)}</span>
                      ) : null}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {events.length === 0 ? (
          <Card style={glassCard}>
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center text-slate-400">
              <CalendarClock className="h-10 w-10 text-emerald-400/60" />
              <p>Nenhum evento criado ainda.</p>
              <Button onClick={startCreate} className="gap-1 bg-emerald-600 hover:bg-emerald-500">
                <Plus className="h-4 w-4" /> Criar o primeiro
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {events.map((event) => (
              <Card key={event.id} style={glassCard}>
                <CardContent className="grid gap-4 p-5 md:grid-cols-[1.5fr,1fr]">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-white">{event.name}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        event.isActive
                          ? 'bg-emerald-500/15 text-emerald-300'
                          : 'bg-slate-700/40 text-slate-400'
                      }`}>
                        {event.isActive ? 'ATIVO' : 'INATIVO'}
                      </span>
                      <span className="text-xs text-slate-400">
                        {event.mode === 'weekly' ? 'Semanal' : 'Datas manuais'}
                      </span>
                    </div>
                    {event.description ? (
                      <p className="text-sm text-slate-300">{event.description}</p>
                    ) : null}
                    <div className="text-xs text-slate-400">
                      Data do evento: {new Date(event.eventDate).toLocaleString('pt-BR')}
                    </div>
                    {event.state?.activeTier ? (
                      <div className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-300">
                        <Sparkles className="h-3 w-3" />
                        Lote ativo: {event.state.activeTier.label} · −{Math.round(event.state.activeTier.discountPercent)}%
                      </div>
                    ) : event.state ? (
                      <div className="inline-flex items-center gap-1 rounded-full border border-slate-600/40 bg-slate-700/30 px-2 py-0.5 text-xs text-slate-300">
                        Sem lote ativo no momento
                      </div>
                    ) : null}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {(event.mode === 'weekly' ? event.weeklyTiers : event.manualTiers).map((t, i) => (
                        <span
                          key={i}
                          className="rounded-md border border-slate-700/40 bg-slate-800/40 px-2 py-0.5 text-[11px] text-slate-300"
                        >
                          {event.mode === 'weekly'
                            ? `${(t as WeeklyTier).weeksBefore}sem → −${Math.round(t.discountPercent)}%`
                            : `${new Date((t as ManualTier).startAt).toLocaleDateString('pt-BR')}–${new Date((t as ManualTier).endAt).toLocaleDateString('pt-BR')} → −${Math.round(t.discountPercent)}%`}
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" variant="ghost" onClick={() => startEdit(event)}>
                        Editar
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => remove(event.id)}>
                        <Trash2 className="h-4 w-4 text-red-300" />
                      </Button>
                    </div>
                  </div>

                  {event.state && event.state.daysUntilEvent >= 0 ? (
                    <PricingEventCountdown state={event.state} compact />
                  ) : (
                    <div className="rounded-lg border border-slate-700/40 bg-slate-800/30 p-4 text-xs text-slate-400">
                      Evento já passou ou sistema desativado — descontos não aplicados.
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
