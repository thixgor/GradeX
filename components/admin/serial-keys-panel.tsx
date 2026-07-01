'use client'

/**
 * Painel "Serial Keys" para /admin/analytics. Autossuficiente: busca seus
 * próprios dados de /api/admin/serial-keys, com filtros, métricas, tabela e
 * ações (copiar key, copiar link, reenviar e-mail, cancelar).
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Loader2, KeyRound, CheckCircle2, Clock, TrendingUp, ShieldAlert,
  Copy, Mail, Ban, Search, RefreshCw, Users,
} from 'lucide-react'

interface Row {
  id: string
  key: string
  buyerName: string
  buyerFirstName: string
  buyerEmail: string
  buyerPhone: string
  productType: string
  productTypeLabel: string
  productTitle: string
  amount: number
  paymentStatus: string
  status: string
  purchasedAt: string
  activatedAt: string | null
  activatedByEmail: string | null
  activationUrl: string | null
  providerPaymentId: string | null
  orderId: string | null
  source: string | null
  ip: string | null
  userAgent: string | null
  emailHistory: { to: string; status: string; kind: string; sentAt: string; error?: string }[]
  guest: boolean
}

interface Payload {
  rows: Row[]
  metrics: {
    totalGuest: number
    totalGenerated: number
    totalActivated: number
    totalPending: number
    activationRate: number
    totalRevenue: number
    emailsResent: number
    suspiciousAttempts: number
  }
  charts: {
    revenueByProduct: { label: string; value: number }[]
    revenueByType: { label: string; value: number }[]
    salesByDay: { label: string; value: number }[]
    productSales: { label: string; value: number }[]
  }
  securityLogs: { kind: string; ip?: string; email?: string; detail?: string; createdAt: string }[]
}

function brl(v: number) {
  return `R$ ${Number(v || 0).toFixed(2).replace('.', ',')}`
}
function pct(v: number) {
  return `${(Number(v || 0) * 100).toFixed(1)}%`
}
function dt(v?: string | null) {
  if (!v) return '—'
  try {
    return new Date(v).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
  } catch { return '—' }
}

const STATUS_LABEL: Record<string, string> = {
  unactivated: 'Não ativada',
  activated: 'Ativada',
  expired: 'Expirada',
  cancelled: 'Cancelada',
}
const STATUS_TONE: Record<string, string> = {
  unactivated: 'bg-amber-400/15 text-amber-200',
  activated: 'bg-emerald-400/15 text-emerald-200',
  expired: 'bg-white/10 text-white/60',
  cancelled: 'bg-red-400/15 text-red-200',
}

const PRODUCT_TYPES = [
  ['', 'Todos os tipos'],
  ['manual_clinico', 'Manual Clínico'],
  ['material', 'Material'],
  ['flashcard', 'Flashcards'],
  ['package', 'Pacote'],
  ['premium', 'Premium'],
  ['essential', 'Essential'],
]
const STATUSES = [
  ['', 'Todos os status'],
  ['unactivated', 'Não ativada'],
  ['activated', 'Ativada'],
  ['cancelled', 'Cancelada'],
  ['expired', 'Expirada'],
]

function MetricCard({ label, value, hint, icon: Icon, tone = 'emerald' }: { label: string; value: string; hint?: string; icon: any; tone?: string }) {
  const tones: Record<string, string> = {
    emerald: 'text-emerald-300',
    gold: 'text-amber-300',
    blue: 'text-sky-300',
    red: 'text-red-300',
  }
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 backdrop-blur-xl">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-white/45">{label}</span>
        <Icon size={16} className={tones[tone] || tones.emerald} />
      </div>
      <div className="text-2xl font-black text-white">{value}</div>
      {hint ? <div className="mt-1 text-xs text-white/40">{hint}</div> : null}
    </div>
  )
}

function Bars({ data, money = false }: { data: { label: string; value: number }[]; money?: boolean }) {
  const max = Math.max(1, ...data.map((d) => d.value))
  if (!data.length) return <p className="py-6 text-center text-sm text-white/40">Sem dados ainda.</p>
  return (
    <div className="space-y-2">
      {data.slice(0, 10).map((d) => (
        <div key={d.label} className="flex items-center gap-3">
          <div className="w-32 shrink-0 truncate text-xs text-white/60">{d.label}</div>
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-white/5">
            <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-300" style={{ width: `${(d.value / max) * 100}%` }} />
          </div>
          <div className="w-20 shrink-0 text-right text-xs font-bold text-emerald-200">{money ? brl(d.value) : d.value}</div>
        </div>
      ))}
    </div>
  )
}

export function SerialKeysPanel() {
  const [data, setData] = useState<Payload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [productType, setProductType] = useState('')
  const [status, setStatus] = useState('')
  const [q, setQ] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [busyId, setBusyId] = useState('')
  const [copied, setCopied] = useState('')
  const [toast, setToast] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (productType) params.set('productType', productType)
      if (status) params.set('status', status)
      if (q) params.set('q', q)
      if (dateFrom) params.set('dateFrom', dateFrom)
      if (dateTo) params.set('dateTo', dateTo)
      const res = await fetch(`/api/admin/serial-keys?${params.toString()}`, { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Falha ao carregar')
      setData(json)
    } catch (e: any) {
      setError(e?.message || 'Erro')
    } finally {
      setLoading(false)
    }
  }, [productType, status, q, dateFrom, dateTo])

  useEffect(() => { load() }, [load])

  const flash = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  async function copy(text: string, id: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(id)
      setTimeout(() => setCopied(''), 1500)
    } catch {}
  }

  async function act(id: string, action: 'resend' | 'cancel') {
    if (action === 'cancel' && !confirm('Cancelar/desativar esta Serial Key? O comprador não poderá mais ativá-la.')) return
    setBusyId(id)
    try {
      const res = await fetch(`/api/admin/serial-keys/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const json = await res.json()
      flash(json.message || (res.ok ? 'Feito.' : 'Falha.'))
      if (res.ok) await load()
    } catch {
      flash('Erro na ação.')
    } finally {
      setBusyId('')
    }
  }

  const m = data?.metrics

  return (
    <div className="space-y-6">
      {toast ? (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl border border-emerald-400/30 bg-emerald-500/20 px-4 py-2 text-sm text-emerald-100 backdrop-blur-xl">
          {toast}
        </div>
      ) : null}

      {/* Métricas */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Compras sem login" value={String(m?.totalGuest ?? 0)} icon={Users} tone="blue" />
        <MetricCard label="Serial Keys geradas" value={String(m?.totalGenerated ?? 0)} icon={KeyRound} />
        <MetricCard label="Ativadas" value={String(m?.totalActivated ?? 0)} hint={`Taxa: ${pct(m?.activationRate ?? 0)}`} icon={CheckCircle2} />
        <MetricCard label="Pendentes" value={String(m?.totalPending ?? 0)} icon={Clock} tone="gold" />
        <MetricCard label="Receita (Serial Keys)" value={brl(m?.totalRevenue ?? 0)} icon={TrendingUp} />
        <MetricCard label="E-mails reenviados" value={String(m?.emailsResent ?? 0)} icon={Mail} tone="blue" />
        <MetricCard label="Tentativas suspeitas (30d)" value={String(m?.suspiciousAttempts ?? 0)} icon={ShieldAlert} tone="red" />
        <MetricCard label="Taxa de ativação" value={pct(m?.activationRate ?? 0)} icon={TrendingUp} />
      </div>

      {/* Charts */}
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <h3 className="mb-4 text-sm font-bold text-white">Receita por tipo de produto</h3>
          <Bars data={data?.charts.revenueByType || []} money />
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <h3 className="mb-4 text-sm font-bold text-white">Produtos mais vendidos</h3>
          <Bars data={data?.charts.productSales || []} />
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <h3 className="mb-4 text-sm font-bold text-white">Receita por produto</h3>
          <Bars data={data?.charts.revenueByProduct || []} money />
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <h3 className="mb-4 text-sm font-bold text-white">Compras por dia</h3>
          <Bars data={data?.charts.salesByDay || []} />
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        <div className="flex-1 min-w-[200px]">
          <label className="mb-1 block text-xs text-white/45">Buscar (nome, e-mail, telefone, key)</label>
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3">
            <Search size={14} className="text-white/40" />
            <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()}
              className="w-full bg-transparent py-2 text-sm text-white outline-none" placeholder="Digite e Enter…" />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs text-white/45">Tipo</label>
          <select value={productType} onChange={(e) => setProductType(e.target.value)} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none">
            {PRODUCT_TYPES.map(([v, l]) => <option key={v} value={v} className="bg-slate-900">{l}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-white/45">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none">
            {STATUSES.map(([v, l]) => <option key={v} value={v} className="bg-slate-900">{l}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-white/45">De</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-white/45">Até</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none" />
        </div>
        <button onClick={load} className="flex items-center gap-2 rounded-lg bg-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/30">
          <RefreshCw size={14} /> Atualizar
        </button>
      </div>

      {error ? <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</div> : null}

      {/* Tabela */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="animate-spin text-emerald-300" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead className="border-b border-white/10 text-xs uppercase text-white/40">
                <tr>
                  {['Comprador', 'Contato', 'Produto', 'Valor', 'Pagamento', 'Serial Key', 'Status', 'Compra', 'Ativação', 'Origem', 'Ações'].map((h) => (
                    <th key={h} className="px-3 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(data?.rows || []).map((r) => (
                  <tr key={r.id} className="border-b border-white/5 align-top text-white/70">
                    <td className="px-3 py-3">
                      <div className="font-bold text-white">{r.buyerName || '—'}</div>
                      <div className="text-xs text-white/40">{r.buyerFirstName}</div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-xs">{r.buyerEmail}</div>
                      <div className="text-xs text-white/40">{r.buyerPhone}</div>
                    </td>
                    <td className="px-3 py-3">
                      <div>{r.productTitle || r.productTypeLabel}</div>
                      <div className="text-xs text-white/40">{r.productTypeLabel}</div>
                    </td>
                    <td className="px-3 py-3 font-bold text-emerald-200">{brl(r.amount)}</td>
                    <td className="px-3 py-3">
                      <div className="text-xs">{r.paymentStatus}</div>
                      {r.providerPaymentId ? <div className="text-[10px] text-white/40">MP: {r.providerPaymentId}</div> : null}
                    </td>
                    <td className="px-3 py-3">
                      <button onClick={() => copy(r.key, `k-${r.id}`)} className="flex items-center gap-1 font-mono text-xs text-emerald-200 hover:text-emerald-100">
                        <Copy size={11} /> {copied === `k-${r.id}` ? 'Copiado!' : r.key}
                      </button>
                      {r.activationUrl ? (
                        <button onClick={() => copy(r.activationUrl!, `l-${r.id}`)} className="mt-1 flex items-center gap-1 text-[10px] text-white/40 hover:text-white/70">
                          <Copy size={10} /> {copied === `l-${r.id}` ? 'Link copiado!' : 'Copiar link'}
                        </button>
                      ) : null}
                    </td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${STATUS_TONE[r.status] || 'bg-white/10 text-white/60'}`}>
                        {STATUS_LABEL[r.status] || r.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs">{dt(r.purchasedAt)}</td>
                    <td className="px-3 py-3 text-xs">
                      {r.activatedAt ? (
                        <>
                          <div>{dt(r.activatedAt)}</div>
                          <div className="text-white/40">{r.activatedByEmail}</div>
                        </>
                      ) : '—'}
                    </td>
                    <td className="px-3 py-3 text-xs">
                      <div>{r.guest ? 'Sem login' : 'Logado'}</div>
                      <div className="text-white/40">{r.source}</div>
                      {r.emailHistory?.length ? <div className="text-[10px] text-white/40">{r.emailHistory.length} e-mail(s)</div> : null}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-col gap-1">
                        <button disabled={busyId === r.id} onClick={() => act(r.id, 'resend')}
                          className="flex items-center gap-1 rounded-md bg-sky-500/15 px-2 py-1 text-[11px] text-sky-200 hover:bg-sky-500/25 disabled:opacity-50">
                          {busyId === r.id ? <Loader2 size={11} className="animate-spin" /> : <Mail size={11} />} Reenviar
                        </button>
                        {r.status !== 'cancelled' ? (
                          <button disabled={busyId === r.id} onClick={() => act(r.id, 'cancel')}
                            className="flex items-center gap-1 rounded-md bg-red-500/15 px-2 py-1 text-[11px] text-red-200 hover:bg-red-500/25 disabled:opacity-50">
                            <Ban size={11} /> Cancelar
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && !(data?.rows || []).length ? (
              <p className="py-10 text-center text-sm text-white/40">Nenhuma compra via Serial Key encontrada.</p>
            ) : null}
          </div>
        )}
      </div>

      {/* Logs de segurança */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-white"><ShieldAlert size={15} className="text-red-300" /> Tentativas suspeitas / bloqueadas</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-white/10 text-xs uppercase text-white/40">
              <tr>{['Tipo', 'IP', 'E-mail', 'Detalhe', 'Quando'].map((h) => <th key={h} className="px-3 py-2">{h}</th>)}</tr>
            </thead>
            <tbody>
              {(data?.securityLogs || []).map((l, i) => (
                <tr key={i} className="border-b border-white/5 text-white/60">
                  <td className="px-3 py-2 text-red-200">{l.kind}</td>
                  <td className="px-3 py-2 font-mono text-xs">{l.ip || '—'}</td>
                  <td className="px-3 py-2 text-xs">{l.email || '—'}</td>
                  <td className="px-3 py-2 text-xs">{l.detail || '—'}</td>
                  <td className="px-3 py-2 text-xs">{dt(l.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!(data?.securityLogs || []).length ? <p className="py-6 text-center text-sm text-white/40">Nenhum evento de segurança registrado.</p> : null}
        </div>
      </div>
    </div>
  )
}
