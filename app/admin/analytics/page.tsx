'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  BadgeDollarSign,
  BarChart3,
  CalendarClock,
  Crown,
  Download,
  FileText,
  Filter,
  Heart,
  LineChart,
  Loader2,
  Percent,
  Receipt,
  RefreshCw,
  Search,
  ShoppingCart,
  TrendingUp,
  Users,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ThemeToggle } from '@/components/theme-toggle'
import { LogoLoading } from '@/components/logo-loading'

type SeriesPoint = { key?: string; label: string; value: number; count?: number; type?: string; revenue?: number }
type FunnelStep = { key: string; label: string; count: number; conversionFromPrevious: number; conversionFromStart: number }

type OrderRow = {
  id: string
  userName: string
  userEmail: string
  product: string
  productType: string
  value: number
  status: string
  rawStatus: string
  paymentMethod: string
  mercadoPagoPaymentId: string
  mercadoPagoPreferenceId: string
  createdAt: string | null
  paidAt: string | null
  endedAt: string | null
  origin: string
  couponCode: string
  couponDiscountAmount: number
  couponAmountBefore: number
}

type SubscriptionRow = {
  id: string
  userName: string
  userEmail: string
  plan: string
  type: string
  cycle: string
  value: number
  purchasedAt: string | null
  expiresAt: string | null
  status: string
  origin: string
  autoRenew: boolean
  lastPaymentAt: string | null
  nextBillingAt: string | null
  canceledAt: string | null
}

type AbandonedRow = {
  id: string
  userName: string
  userEmail: string
  product: string
  productType: string
  value: number
  startedAt: string | null
  lastStage: string
  minutesSinceAbandonment: number
  sentence: string
}

type CancellationRow = {
  id: string
  userName: string
  userEmail: string
  plan: string
  purchasedAt: string | null
  canceledAt: string | null
  subscriberDays: number
  value: number
  reason: string
  origin: string
}

type DonationSourceFilter = 'hide' | 'all' | 'platform' | 'bank_app'

type DonationRow = {
  id: string
  donorName: string
  donorEmail: string
  value: number
  status: string
  rawStatus: string
  source: 'platform' | 'bank_app' | 'admin' | 'unknown'
  sourceLabel: string
  paymentMethod: string
  mercadoPagoPaymentId: string
  mercadoPagoOrderId: string
  message: string
  donatedAt: string | null
  createdAt: string | null
}

type CouponStatRow = {
  couponId: string
  code: string
  description: string
  uses: number
  uniqueUsers: number
  revenueAttributed: number
  discountGiven: number
  lastUsedAt: string | null
  usageLimit: number | null
  usageCount: number
  isActive: boolean
}

type AnalyticsPayload = {
  updatedAt: string
  cards: {
    totalRevenue: number
    monthRevenue: number
    weekRevenue: number
    totalSales: number
    activeSubscriptions: number
    cancellations: number
    cancellationRate: number
    pendingOrders: number
    abandonedCheckouts: number
    topProduct: string
    topPlan: string
  }
  donationSummary: {
    totalApproved: number
    platformTotal: number
    bankAppTotal: number
    adminTotal: number
    approvedCount: number
    pendingCount: number
  }
  charts: {
    salesByDay: SeriesPoint[]
    salesByWeek: SeriesPoint[]
    salesByMonth: SeriesPoint[]
    revenueByPeriod: SeriesPoint[]
    productSales: SeriesPoint[]
    productRevenue: SeriesPoint[]
    revenueByType: SeriesPoint[]
    subscriptionNew: SeriesPoint[]
    subscriptionActive: SeriesPoint[]
    subscriptionCancelled: SeriesPoint[]
    planSales: SeriesPoint[]
    churn: SeriesPoint[]
    donationsByPeriod: SeriesPoint[]
    donationsBySource: SeriesPoint[]
  }
  subscriptionSummary: {
    active: number
    expiring7: number
    expiring30: number
    cancelled: number
    cancellationRate: number
    estimatedRecurringRevenue: number
  }
  funnel: FunnelStep[]
  orders: OrderRow[]
  abandoned: AbandonedRow[]
  subscriptions: SubscriptionRow[]
  cancellations: CancellationRow[]
  donations: DonationRow[]
  couponStats: CouponStatRow[]
}

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const number = new Intl.NumberFormat('pt-BR')

function formatCurrency(value: number) {
  return currency.format(value || 0)
}

function formatPercent(value: number) {
  return `${(Number.isFinite(value) ? value : 0).toFixed(1)}%`
}

function formatDate(value?: string | null) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function normalize(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')
}

function getMax(data: SeriesPoint[]) {
  return Math.max(...data.map((item) => item.value || item.count || 0), 1)
}

function trackColor(index: number) {
  return ['#34d399', '#fbbf24', '#22c55e', '#14b8a6', '#a3e635', '#60a5fa', '#f59e0b'][index % 7]
}

function monthLabel(key: string) {
  const [year, month] = key.split('-').map(Number)
  return new Date(year, month - 1, 1).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
}

function StatCard({ title, value, hint, icon: Icon, tone = 'emerald' }: { title: string; value: string; hint?: string; icon: any; tone?: 'emerald' | 'gold' | 'forest' | 'blue' | 'red' }) {
  const tones = {
    emerald: 'text-emerald-300 bg-emerald-400/10 border-emerald-300/20',
    gold: 'text-amber-200 bg-amber-300/10 border-amber-200/20',
    forest: 'text-lime-200 bg-lime-300/10 border-lime-200/20',
    blue: 'text-sky-200 bg-sky-300/10 border-sky-200/20',
    red: 'text-rose-200 bg-rose-300/10 border-rose-200/20',
  }
  return (
    <Card className="overflow-hidden rounded-2xl border-white/10 bg-white/[0.07] text-white shadow-[0_18px_55px_rgba(0,0,0,0.24)] backdrop-blur-xl">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase text-white/45">{title}</p>
            <p className="mt-2 truncate text-2xl font-black tracking-tight">{value}</p>
            {hint ? <p className="mt-1 truncate text-xs text-white/45">{hint}</p> : null}
          </div>
          <div className={`rounded-xl border p-2 ${tones[tone]}`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function GlassPanel({ title, description, children, action }: { title: string; description?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <Card className="rounded-2xl border-white/10 bg-white/[0.07] text-white shadow-[0_18px_60px_rgba(0,0,0,0.22)] backdrop-blur-xl">
      <CardHeader className="gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-base font-bold text-white sm:text-lg">{title}</CardTitle>
            {description ? <CardDescription className="text-white/45">{description}</CardDescription> : null}
          </div>
          {action}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function BarChart({ data, formatter = number.format, compact = false }: { data: SeriesPoint[]; formatter?: (value: number) => string; compact?: boolean }) {
  const max = getMax(data)
  return (
    <div className="space-y-3">
      <div className={`flex items-end gap-2 ${compact ? 'h-44' : 'h-64'}`}>
        {data.map((item, index) => {
          const h = Math.max(4, ((item.value || 0) / max) * 100)
          return (
            <div key={`${item.label}-${index}`} className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <div className="flex h-full w-full items-end rounded-t-xl bg-white/[0.03]">
                <div
                  className="w-full rounded-t-xl shadow-[0_0_24px_rgba(52,211,153,0.18)]"
                  style={{ height: `${h}%`, background: `linear-gradient(180deg, ${trackColor(index)}, rgba(5,46,22,0.72))` }}
                  title={`${item.label}: ${formatter(item.value)}`}
                />
              </div>
              <span className="w-full truncate text-center text-[10px] font-semibold text-white/45">{item.label}</span>
            </div>
          )
        })}
      </div>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {data.slice(0, 6).map((item, index) => (
          <div key={`${item.label}-legend`} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/10 px-3 py-2">
            <span className="flex min-w-0 items-center gap-2 text-xs text-white/60">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: trackColor(index) }} />
              <span className="truncate">{item.label}</span>
            </span>
            <span className="shrink-0 text-xs font-bold text-white">{formatter(item.value)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function LineChartBlock({ data, formatter = formatCurrency }: { data: SeriesPoint[]; formatter?: (value: number) => string }) {
  const width = 720
  const height = 260
  const pad = 26
  const max = getMax(data)
  const points = data.map((item, index) => {
    const x = pad + ((width - pad * 2) * index) / Math.max(data.length - 1, 1)
    const y = height - pad - ((item.value || 0) / max) * (height - pad * 2)
    return { x, y, value: item.value, label: item.label }
  })
  const poly = points.map((point) => `${point.x},${point.y}`).join(' ')
  const area = points.length ? `M ${pad} ${height - pad} L ${points.map((point) => `${point.x} ${point.y}`).join(' L ')} L ${width - pad} ${height - pad} Z` : ''
  return (
    <div className="space-y-4">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-72 w-full overflow-visible">
        <defs>
          <linearGradient id="analytics-area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.42" />
            <stop offset="100%" stopColor="#34d399" stopOpacity="0.03" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((row) => {
          const y = pad + ((height - pad * 2) / 3) * row
          return <line key={row} x1={pad} y1={y} x2={width - pad} y2={y} stroke="white" strokeOpacity="0.08" />
        })}
        <path d={area} fill="url(#analytics-area)" />
        <polyline points={poly} fill="none" stroke="#34d399" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((point, index) => (
          <g key={`${point.label}-${index}`}>
            <circle cx={point.x} cy={point.y} r="6" fill="#fbbf24" />
            <title>{`${point.label}: ${formatter(point.value)}`}</title>
          </g>
        ))}
      </svg>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {data.slice(-4).map((item) => (
          <div key={item.label} className="rounded-xl border border-white/10 bg-black/10 px-3 py-2">
            <p className="truncate text-[10px] font-bold uppercase text-white/40">{item.label}</p>
            <p className="truncate text-sm font-bold text-white">{formatter(item.value)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function DonutChart({ data }: { data: SeriesPoint[] }) {
  const total = data.reduce((acc, item) => acc + item.value, 0) || 1
  let offset = 25
  return (
    <div className="grid gap-5 sm:grid-cols-[220px_1fr] sm:items-center">
      <svg viewBox="0 0 120 120" className="mx-auto h-52 w-52 -rotate-90">
        <circle cx="60" cy="60" r="42" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="18" />
        {data.map((item, index) => {
          const dash = (item.value / total) * 264
          const circle = (
            <circle
              key={item.label}
              cx="60"
              cy="60"
              r="42"
              fill="none"
              stroke={trackColor(index)}
              strokeWidth="18"
              strokeDasharray={`${dash} 264`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
            />
          )
          offset += dash
          return circle
        })}
      </svg>
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={item.label} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/10 px-3 py-2">
            <span className="flex min-w-0 items-center gap-2 text-sm text-white/70">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: trackColor(index) }} />
              <span className="truncate">{item.label}</span>
            </span>
            <span className="shrink-0 font-bold">{formatCurrency(item.value)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Funnel({ steps }: { steps: FunnelStep[] }) {
  const max = Math.max(...steps.map((step) => step.count), 1)
  return (
    <div className="space-y-3">
      {steps.map((step, index) => (
        <div key={step.key} className="rounded-2xl border border-white/10 bg-black/10 p-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-white">{index + 1}. {step.label}</span>
            <span className="text-sm font-black text-emerald-200">{number.format(step.count)}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-lime-400 to-amber-300" style={{ width: `${Math.max(4, (step.count / max) * 100)}%` }} />
          </div>
          <p className="mt-2 text-xs text-white/45">
            {formatPercent(step.conversionFromPrevious)} da etapa anterior · {formatPercent(step.conversionFromStart)} desde o início
          </p>
        </div>
      ))}
    </div>
  )
}

function OrdersTable({ rows }: { rows: OrderRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1260px] text-left text-sm">
        <thead className="text-xs uppercase text-white/40">
          <tr className="border-b border-white/10">
            {['Usuário', 'Produto', 'Tipo', 'Valor', 'Cupom', 'Status', 'Método', 'Pagamento MP', 'Preferência MP', 'Criação', 'Pagamento', 'Origem'].map((head) => (
              <th key={head} className="px-3 py-3 font-bold">{head}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-white/5 text-white/70">
              <td className="px-3 py-3">
                <div className="font-semibold text-white">{row.userName || '-'}</div>
                <div className="text-xs text-white/40">{row.userEmail || '-'}</div>
              </td>
              <td className="max-w-[220px] truncate px-3 py-3">{row.product}</td>
              <td className="px-3 py-3">{row.productType}</td>
              <td className="px-3 py-3 font-bold text-emerald-200">{formatCurrency(row.value)}</td>
              <td className="px-3 py-3">
                {row.couponCode ? (
                  <div>
                    <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2 py-1 text-xs font-bold text-emerald-200">{row.couponCode}</span>
                    <div className="mt-1 text-xs text-white/40">− {formatCurrency(row.couponDiscountAmount)}</div>
                  </div>
                ) : '-'}
              </td>
              <td className="px-3 py-3"><StatusPill status={row.status} /></td>
              <td className="px-3 py-3">{row.paymentMethod}</td>
              <td className="max-w-[150px] truncate px-3 py-3 font-mono text-xs">{row.mercadoPagoPaymentId || '-'}</td>
              <td className="max-w-[150px] truncate px-3 py-3 font-mono text-xs">{row.mercadoPagoPreferenceId || '-'}</td>
              <td className="px-3 py-3">{formatDate(row.createdAt)}</td>
              <td className="px-3 py-3">{formatDate(row.paidAt)}</td>
              <td className="px-3 py-3">{row.origin}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 ? <p className="py-8 text-center text-sm text-white/45">Nenhum pedido encontrado com esses filtros.</p> : null}
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  const good = ['Pago', 'Ativa'].includes(status)
  const bad = ['Cancelado', 'Expirado', 'Rejeitado', 'Abandonado'].includes(status)
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${good ? 'border-emerald-300/25 bg-emerald-400/10 text-emerald-200' : bad ? 'border-rose-300/25 bg-rose-400/10 text-rose-200' : 'border-amber-300/25 bg-amber-400/10 text-amber-100'}`}>
      {status}
    </span>
  )
}

export default function AdminAnalyticsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [data, setData] = useState<AnalyticsPayload | null>(null)
  const [query, setQuery] = useState('')
  const [type, setType] = useState('')
  const [status, setStatus] = useState('')
  const [method, setMethod] = useState('')
  const [couponFilter, setCouponFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [minValue, setMinValue] = useState('')
  const [maxValue, setMaxValue] = useState('')
  const [donationView, setDonationView] = useState<DonationSourceFilter>('all')
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    setError('')
    try {
      const auth = await fetch('/api/auth/me')
      if (!auth.ok) {
        router.push('/auth/login')
        return
      }
      const authData = await auth.json()
      if (authData.user.role !== 'admin') {
        router.push('/')
        return
      }
      const res = await fetch('/api/admin/analytics', { cache: 'no-store' })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload.error || 'Erro ao carregar analytics')
      setData(payload)
    } catch (err: any) {
      setError(err?.message || 'Erro ao carregar analytics')
    } finally {
      setLoading(false)
    }
  }

  const filteredOrders = useMemo(() => {
    if (!data) return []
    const q = normalize(query)
    return data.orders.filter((row) => {
      const hay = normalize(`${row.userName} ${row.userEmail} ${row.product}`)
      const created = row.createdAt ? new Date(row.createdAt) : null
      if (q && !hay.includes(q)) return false
      if (type && row.productType !== type) return false
      if (status && row.status !== status) return false
      if (method && row.paymentMethod !== method) return false
      if (couponFilter && row.couponCode !== couponFilter) return false
      if (dateFrom && created && created < new Date(`${dateFrom}T00:00:00`)) return false
      if (dateTo && created && created > new Date(`${dateTo}T23:59:59`)) return false
      if (minValue && row.value < Number(minValue)) return false
      if (maxValue && row.value > Number(maxValue)) return false
      return true
    })
  }, [data, query, type, status, method, couponFilter, dateFrom, dateTo, minValue, maxValue])

  const visibleDonations = useMemo(() => {
    if (!data || donationView === 'hide') return []
    return data.donations.filter((donation) => {
      if (donationView === 'platform') return donation.source === 'platform'
      if (donationView === 'bank_app') return donation.source === 'bank_app'
      return true
    })
  }, [data, donationView])

  const visibleDonationSummary = useMemo(() => {
    const approved = visibleDonations.filter((donation) => donation.rawStatus === 'approved' || donation.status === 'Pago')
    return {
      total: approved.reduce((total, donation) => total + donation.value, 0),
      count: approved.length,
      pending: visibleDonations.filter((donation) => ['pending', 'in_process'].includes(donation.rawStatus)).length,
    }
  }, [visibleDonations])

  const visibleDonationCharts = useMemo(() => {
    const approved = visibleDonations.filter((donation) => donation.rawStatus === 'approved' || donation.status === 'Pago')
    const byMonth = new Map<string, number>()
    const bySource = new Map<string, { label: string; value: number; count: number }>()

    for (const donation of approved) {
      const date = donation.donatedAt || donation.createdAt
      if (date) {
        const d = new Date(date)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        byMonth.set(key, (byMonth.get(key) || 0) + donation.value)
      }
      const source = bySource.get(donation.source) || { label: donation.sourceLabel, value: 0, count: 0 }
      source.value += donation.value
      source.count += 1
      bySource.set(donation.source, source)
    }

    return {
      byPeriod: [...byMonth.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => ({ key, label: monthLabel(key), value })),
      bySource: [...bySource.values()],
    }
  }, [visibleDonations])

  async function exportPdf() {
    if (!data) return
    setExporting(true)
    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF()
      const green = '#047857'
      const gold = '#b45309'
      doc.setFillColor(4, 120, 87)
      doc.rect(0, 0, 210, 34, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(18)
      doc.text('DomineAqui Analytics', 14, 16)
      doc.setFontSize(10)
      doc.text(`Relatório administrativo gerado em ${formatDate(new Date().toISOString())}`, 14, 25)

      doc.setTextColor(15, 23, 42)
      doc.setFontSize(12)
      const metrics = [
        ['Receita total', formatCurrency(data.cards.totalRevenue)],
        ['Receita no mês', formatCurrency(data.cards.monthRevenue)],
        ['Receita na semana', formatCurrency(data.cards.weekRevenue)],
        ['Vendas', number.format(data.cards.totalSales)],
        ['Assinaturas ativas', number.format(data.cards.activeSubscriptions)],
        ['Cancelamentos', number.format(data.cards.cancellations)],
        ['Taxa de cancelamento', formatPercent(data.cards.cancellationRate)],
        ['Checkouts abandonados', number.format(data.cards.abandonedCheckouts)],
        ['Doações aprovadas', formatCurrency(data.donationSummary.totalApproved)],
      ]
      let y = 46
      metrics.forEach(([label, value], index) => {
        const x = index % 2 === 0 ? 14 : 110
        if (index > 0 && index % 2 === 0) y += 18
        doc.setDrawColor(226, 232, 240)
        doc.roundedRect(x, y - 8, 84, 13, 2, 2)
        doc.setFontSize(8)
        doc.setTextColor(100, 116, 139)
        doc.text(label, x + 4, y - 2)
        doc.setFontSize(11)
        doc.setTextColor(15, 23, 42)
        doc.text(value, x + 4, y + 3)
      })

      y += 26
      doc.setFontSize(13)
      doc.setTextColor(green)
      doc.text('Receita por período', 14, y)
      y += 8
      const chartMax = Math.max(...data.charts.revenueByPeriod.map((item) => item.value), 1)
      data.charts.revenueByPeriod.slice(-8).forEach((item, index) => {
        const bar = (item.value / chartMax) * 112
        doc.setTextColor(71, 85, 105)
        doc.setFontSize(8)
        doc.text(item.label, 14, y + index * 8)
        doc.setFillColor(4, 120, 87)
        doc.rect(42, y - 4 + index * 8, bar, 4, 'F')
        doc.setTextColor(180, 83, 9)
        doc.text(formatCurrency(item.value), 158, y + index * 8)
      })

      y += 76
      doc.setFontSize(13)
      doc.setTextColor(gold)
      doc.text('Produtos e planos', 14, y)
      y += 8
      doc.setTextColor(15, 23, 42)
      doc.setFontSize(9)
      doc.text(`Produto mais vendido: ${data.cards.topProduct}`, 14, y)
      y += 6
      doc.text(`Plano mais comprado: ${data.cards.topPlan}`, 14, y)
      y += 6
      doc.text(`Doações aprovadas: ${formatCurrency(data.donationSummary.totalApproved)} (${data.donationSummary.approvedCount})`, 14, y)
      y += 10
      doc.text('Pedidos recentes:', 14, y)
      y += 7
      filteredOrders.slice(0, 8).forEach((row) => {
        doc.setFontSize(8)
        doc.setTextColor(71, 85, 105)
        doc.text(`${formatDate(row.createdAt)} · ${row.userName || row.userEmail || '-'} · ${row.product.slice(0, 32)} · ${formatCurrency(row.value)} · ${row.status}`, 14, y)
        y += 6
      })
      doc.save(`domineaqui-analytics-${new Date().toISOString().slice(0, 10)}.pdf`)
    } finally {
      setExporting(false)
    }
  }

  if (loading) return <LogoLoading message="Carregando DomineAqui Analytics..." size="lg" fullscreen />

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#03120b] p-6 text-white">
        <div className="mx-auto max-w-3xl rounded-2xl border border-rose-300/20 bg-rose-400/10 p-6">
          <p className="font-bold">Não foi possível carregar o analytics</p>
          <p className="mt-1 text-sm text-white/60">{error}</p>
          <Button className="mt-4" onClick={load}>Tentar novamente</Button>
        </div>
      </div>
    )
  }

  const productTypes = Array.from(new Set(data.orders.map((row) => row.productType))).filter(Boolean)
  const statuses = Array.from(new Set(data.orders.map((row) => row.status))).filter(Boolean)
  const methods = Array.from(new Set(data.orders.map((row) => row.paymentMethod))).filter(Boolean)
  const couponCodes = Array.from(new Set([
    ...data.orders.map((row) => row.couponCode),
    ...(data.couponStats || []).map((row) => row.code),
  ])).filter(Boolean)

  return (
    <div className="min-h-screen bg-[linear-gradient(145deg,#021006_0%,#062017_45%,#03120b_100%)] text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#03120b]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={() => router.push('/admin')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="min-w-0">
              <p className="text-xs font-black uppercase text-emerald-300/70">DomineAqui Analytics</p>
              <h1 className="truncate text-lg font-black sm:text-2xl">Vendas, assinaturas e conversão</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="hidden border-white/15 bg-white/5 text-white hover:bg-white/10 sm:inline-flex" onClick={load}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Atualizar
            </Button>
            <Button className="bg-gradient-to-r from-emerald-600 to-amber-500 text-white" onClick={exportPdf} disabled={exporting}>
              {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              PDF
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
        <section className="mb-6 rounded-3xl border border-emerald-200/10 bg-[linear-gradient(135deg,rgba(4,120,87,0.34),rgba(6,95,70,0.20),rgba(251,191,36,0.12))] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:p-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200/15 bg-white/10 px-3 py-1 text-xs font-bold uppercase text-emerald-100">
                <LineChart className="h-3.5 w-3.5" />
                MercadoPago integrado
              </div>
              <h2 className="max-w-3xl text-2xl font-black tracking-tight sm:text-4xl">Painel financeiro premium para decisão administrativa</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/58">
                Receita, pedidos, materiais, flashcards, pacotes, assinaturas, funil de checkout, abandonos e cancelamentos em um único painel.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-3">
                <p className="text-xs uppercase text-white/45">Atualizado</p>
                <p className="text-sm font-bold">{formatDate(data.updatedAt)}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-3">
                <p className="text-xs uppercase text-white/45">MRR estimado</p>
                <p className="text-sm font-bold text-emerald-200">{formatCurrency(data.subscriptionSummary.estimatedRecurringRevenue)}</p>
              </div>
              <div className="col-span-2 rounded-2xl border border-white/10 bg-black/15 px-4 py-3 sm:col-span-1">
                <p className="text-xs uppercase text-white/45">Produto líder</p>
                <p className="truncate text-sm font-bold text-amber-100">{data.cards.topProduct}</p>
              </div>
            </div>
          </div>
        </section>

        <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Receita total" value={formatCurrency(data.cards.totalRevenue)} hint="Pedidos pagos e assinaturas" icon={BadgeDollarSign} />
          <StatCard title="Receita no mês" value={formatCurrency(data.cards.monthRevenue)} hint="Mês corrente" icon={TrendingUp} tone="gold" />
          <StatCard title="Receita na semana" value={formatCurrency(data.cards.weekRevenue)} hint="Semana corrente" icon={CalendarClock} tone="forest" />
          <StatCard title="Total de vendas" value={number.format(data.cards.totalSales)} hint="Materiais, planos e pacotes" icon={ShoppingCart} tone="blue" />
          <StatCard title="Assinaturas ativas" value={number.format(data.cards.activeSubscriptions)} hint={`${data.subscriptionSummary.expiring7} vencem em 7 dias`} icon={Crown} tone="gold" />
          <StatCard title="Cancelamentos" value={number.format(data.cards.cancellations)} hint={`Taxa: ${formatPercent(data.cards.cancellationRate)}`} icon={XCircle} tone="red" />
          <StatCard title="Pedidos pendentes" value={number.format(data.cards.pendingOrders)} hint="Aguardando MercadoPago" icon={Receipt} />
          <StatCard title="Checkouts abandonados" value={number.format(data.cards.abandonedCheckouts)} hint="Sem pagamento aprovado" icon={Percent} tone="red" />
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid h-auto grid-cols-2 rounded-2xl border border-white/10 bg-white/[0.06] p-1.5 backdrop-blur-xl md:grid-cols-6">
            {[
              ['overview', 'Visão geral'],
              ['sales', 'Vendas'],
              ['subscriptions', 'Assinaturas'],
              ['conversion', 'Conversão'],
              ['donations', 'Doações'],
              ['orders', 'Histórico'],
            ].map(([value, label]) => (
              <TabsTrigger key={value} value={value} className="rounded-xl py-2 text-white/70 data-[state=active]:bg-emerald-400/20 data-[state=active]:text-white">
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
              <GlassPanel title="Receita por período" description="Receita aprovada por mês, incluindo assinaturas autorizadas">
                <LineChartBlock data={data.charts.revenueByPeriod} />
              </GlassPanel>
              <GlassPanel title="Receita por tipo" description="Material, flashcard, pacote e assinatura">
                <DonutChart data={data.charts.revenueByType} />
              </GlassPanel>
            </div>
            <div className="grid gap-6 xl:grid-cols-2">
              <GlassPanel title="Quantidade de vendas por produto">
                <BarChart data={data.charts.productSales} />
              </GlassPanel>
              <GlassPanel title="Receita por produto">
                <BarChart data={data.charts.productRevenue} formatter={formatCurrency} />
              </GlassPanel>
            </div>
            <GlassPanel title="Cupons" description="Usos aprovados, pessoas únicas e receita adquirida com cada cupom">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[780px] text-left text-sm">
                  <thead className="border-b border-white/10 text-xs uppercase text-white/40">
                    <tr>{['Cupom', 'Pessoas', 'Usos', 'Receita atribuída', 'Desconto concedido', 'Limite', 'Último uso'].map((h) => <th key={h} className="px-3 py-3">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {(data.couponStats || []).slice(0, 12).map((row) => (
                      <tr key={row.couponId || row.code} className="border-b border-white/5 text-white/70">
                        <td className="px-3 py-3">
                          <div className="font-mono font-black text-emerald-200">{row.code}</div>
                          <div className="max-w-[240px] truncate text-xs text-white/40">{row.description || (row.isActive ? 'Ativo' : 'Inativo')}</div>
                        </td>
                        <td className="px-3 py-3 font-bold text-white">{number.format(row.uniqueUsers)}</td>
                        <td className="px-3 py-3">{number.format(row.uses)}</td>
                        <td className="px-3 py-3 font-bold text-emerald-200">{formatCurrency(row.revenueAttributed)}</td>
                        <td className="px-3 py-3 text-amber-100">{formatCurrency(row.discountGiven)}</td>
                        <td className="px-3 py-3">{row.usageLimit ? `${row.usageCount}/${row.usageLimit}` : row.usageCount ? String(row.usageCount) : 'Sem limite'}</td>
                        <td className="px-3 py-3">{formatDate(row.lastUsedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {(data.couponStats || []).length === 0 ? <p className="py-8 text-center text-sm text-white/45">Nenhum cupom usado no período.</p> : null}
              </div>
            </GlassPanel>
            <GlassPanel
              title="Doações separadas da receita comercial"
              description="Valores de apoio vindos de /doar. Use a aba Doações para alternar entre plataforma e app do banco."
              action={<DonationModeSelector value={donationView} onChange={setDonationView} />}
            >
              {donationView === 'hide' ? (
                <p className="py-6 text-sm text-white/45">Doações ocultas nesta visualização.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-3">
                  <StatCard title="Doações visíveis" value={formatCurrency(visibleDonationSummary.total)} hint={`${visibleDonationSummary.count} aprovadas`} icon={Heart} tone="red" />
                  <StatCard title="Pendentes" value={number.format(visibleDonationSummary.pending)} hint="Aguardando confirmação/admin" icon={Receipt} tone="gold" />
                  <StatCard title="Total separado" value={formatCurrency(data.donationSummary.totalApproved)} hint="Não soma na receita comercial" icon={BadgeDollarSign} />
                </div>
              )}
            </GlassPanel>
          </TabsContent>

          <TabsContent value="sales" className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-3">
              <GlassPanel title="Vendas por dia"><BarChart data={data.charts.salesByDay} compact /></GlassPanel>
              <GlassPanel title="Vendas por semana"><BarChart data={data.charts.salesByWeek} compact /></GlassPanel>
              <GlassPanel title="Vendas por mês"><BarChart data={data.charts.salesByMonth} compact /></GlassPanel>
            </div>
            <GlassPanel title="Produtos com maior receita" description="Ranking por receita aprovada">
              <BarChart data={data.charts.productRevenue} formatter={formatCurrency} />
            </GlassPanel>
          </TabsContent>

          <TabsContent value="subscriptions" className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <StatCard title="Vigentes" value={number.format(data.subscriptionSummary.active)} icon={Users} />
              <StatCard title="Vencem em 7 dias" value={number.format(data.subscriptionSummary.expiring7)} icon={CalendarClock} tone="gold" />
              <StatCard title="Vencem em 30 dias" value={number.format(data.subscriptionSummary.expiring30)} icon={CalendarClock} tone="forest" />
              <StatCard title="Canceladas" value={number.format(data.subscriptionSummary.cancelled)} icon={XCircle} tone="red" />
              <StatCard title="Taxa cancelamento" value={formatPercent(data.subscriptionSummary.cancellationRate)} icon={Percent} tone="red" />
            </div>
            <div className="grid gap-6 xl:grid-cols-2">
              <GlassPanel title="Novas assinaturas por período"><BarChart data={data.charts.subscriptionNew} /></GlassPanel>
              <GlassPanel title="Planos mais assinados"><BarChart data={data.charts.planSales} /></GlassPanel>
              <GlassPanel title="Assinaturas por status"><BarChart data={data.charts.subscriptionActive} /></GlassPanel>
              <GlassPanel title="Cancelamentos por período"><BarChart data={data.charts.subscriptionCancelled} /></GlassPanel>
            </div>
            <GlassPanel title="Assinaturas vigentes e históricas">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px] text-left text-sm">
                  <thead className="border-b border-white/10 text-xs uppercase text-white/40">
                    <tr>{['Usuário', 'Plano', 'Tipo', 'Ciclo', 'Valor', 'Compra', 'Vencimento', 'Status', 'Origem', 'Renova', 'Último pagamento', 'Próxima cobrança', 'Cancelamento'].map((h) => <th key={h} className="px-3 py-3">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {data.subscriptions.map((row) => (
                      <tr key={row.id} className="border-b border-white/5 text-white/70">
                        <td className="px-3 py-3"><div className="font-bold text-white">{row.userName || '-'}</div><div className="text-xs text-white/40">{row.userEmail}</div></td>
                        <td className="px-3 py-3">{row.plan}</td>
                        <td className="px-3 py-3">{row.type}</td>
                        <td className="px-3 py-3">{row.cycle}</td>
                        <td className="px-3 py-3 font-bold text-emerald-200">{formatCurrency(row.value)}</td>
                        <td className="px-3 py-3">{formatDate(row.purchasedAt)}</td>
                        <td className="px-3 py-3">{formatDate(row.expiresAt)}</td>
                        <td className="px-3 py-3"><StatusPill status={row.status} /></td>
                        <td className="px-3 py-3">{row.origin}</td>
                        <td className="px-3 py-3">{row.autoRenew ? 'Sim' : 'Não'}</td>
                        <td className="px-3 py-3">{formatDate(row.lastPaymentAt)}</td>
                        <td className="px-3 py-3">{formatDate(row.nextBillingAt)}</td>
                        <td className="px-3 py-3">{formatDate(row.canceledAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassPanel>
          </TabsContent>

          <TabsContent value="conversion" className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
              <GlassPanel title="Funil de compra" description="Taxa de conversão entre cada etapa de intenção, checkout, pedido e pagamento">
                <Funnel steps={data.funnel} />
              </GlassPanel>
              <GlassPanel title="Checkouts abandonados" description="Pedidos/tentativas sem pagamento aprovado após a janela de abandono">
                <div className="space-y-3">
                  {data.abandoned.slice(0, 12).map((row) => (
                    <div key={row.id} className="rounded-2xl border border-white/10 bg-black/10 p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="font-bold text-white">{row.userName || 'Usuário não identificado'}</p>
                          <p className="text-xs text-white/45">{row.userEmail || '-'}</p>
                        </div>
                        <span className="rounded-full border border-amber-200/20 bg-amber-300/10 px-3 py-1 text-xs font-bold text-amber-100">{row.lastStage}</span>
                      </div>
                      <p className="mt-3 text-sm text-white/65">{row.sentence}</p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/45">
                        <span>{row.productType}</span>
                        <span>{formatCurrency(row.value)}</span>
                        <span>{formatDate(row.startedAt)}</span>
                        <span>{row.minutesSinceAbandonment} min desde abandono</span>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassPanel>
            </div>
          </TabsContent>

          <TabsContent value="donations" className="space-y-6">
            <GlassPanel
              title="Doações do /doar"
              description="Acompanhamento separado das contribuições, com origem por plataforma MercadoPago ou registro de Pix/app do banco."
              action={<DonationModeSelector value={donationView} onChange={setDonationView} />}
            >
              {donationView === 'hide' ? (
                <div className="rounded-2xl border border-white/10 bg-black/10 p-6 text-sm text-white/50">
                  As doações estão ocultas. Altere o seletor para mostrar todas, só plataforma ou só app do banco.
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                    <StatCard title="Doações visíveis" value={formatCurrency(visibleDonationSummary.total)} hint={`${visibleDonationSummary.count} aprovadas`} icon={Heart} tone="red" />
                    <StatCard title="Via plataforma" value={formatCurrency(data.donationSummary.platformTotal)} hint="MercadoPago em /doar" icon={BadgeDollarSign} />
                    <StatCard title="App do banco" value={formatCurrency(data.donationSummary.bankAppTotal)} hint="Pix registrado pelo usuário" icon={Receipt} tone="gold" />
                    <StatCard title="Admin/manual" value={formatCurrency(data.donationSummary.adminTotal)} hint="Inseridas pelo admin" icon={Users} tone="blue" />
                    <StatCard title="Pendentes" value={number.format(visibleDonationSummary.pending)} hint="A revisar/confirmar" icon={CalendarClock} tone="forest" />
                  </div>

                  <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                    <GlassPanel title="Doações por período" description="Somente doações aprovadas">
                      <LineChartBlock
                        data={visibleDonationCharts.byPeriod}
                        formatter={formatCurrency}
                      />
                    </GlassPanel>
                    <GlassPanel title="Doações por origem">
                      <DonutChart data={visibleDonationCharts.bySource} />
                    </GlassPanel>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1050px] text-left text-sm">
                      <thead className="border-b border-white/10 text-xs uppercase text-white/40">
                        <tr>{['Doador', 'Valor', 'Status', 'Origem', 'Método', 'Pagamento MP', 'Order MP', 'Data', 'Mensagem'].map((h) => <th key={h} className="px-3 py-3">{h}</th>)}</tr>
                      </thead>
                      <tbody>
                        {visibleDonations.map((row) => (
                          <tr key={row.id} className="border-b border-white/5 text-white/70">
                            <td className="px-3 py-3"><div className="font-bold text-white">{row.donorName || 'Anônimo'}</div><div className="text-xs text-white/40">{row.donorEmail || '-'}</div></td>
                            <td className="px-3 py-3 font-bold text-emerald-200">{formatCurrency(row.value)}</td>
                            <td className="px-3 py-3"><StatusPill status={row.status} /></td>
                            <td className="px-3 py-3">{row.sourceLabel}</td>
                            <td className="px-3 py-3">{row.paymentMethod}</td>
                            <td className="max-w-[150px] truncate px-3 py-3 font-mono text-xs">{row.mercadoPagoPaymentId || '-'}</td>
                            <td className="max-w-[150px] truncate px-3 py-3 font-mono text-xs">{row.mercadoPagoOrderId || '-'}</td>
                            <td className="px-3 py-3">{formatDate(row.donatedAt || row.createdAt)}</td>
                            <td className="max-w-[260px] truncate px-3 py-3">{row.message || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {visibleDonations.length === 0 ? <p className="py-8 text-center text-sm text-white/45">Nenhuma doação encontrada para este filtro.</p> : null}
                  </div>
                </div>
              )}
            </GlassPanel>
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            <GlassPanel
              title="Histórico detalhado de pedidos"
              description="Filtre por nome, email, produto, tipo, status, período, valor e método"
              action={<div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/10 px-3 py-1 text-xs text-white/50"><Filter className="h-3.5 w-3.5" /> {filteredOrders.length} registros</div>}
            >
              <div className="mb-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div className="xl:col-span-2">
                  <Label className="text-white/60">Nome, email ou produto</Label>
                  <div className="relative mt-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                    <Input value={query} onChange={(e) => setQuery(e.target.value)} className="border-white/10 bg-black/20 pl-9 text-white" placeholder="Buscar..." />
                  </div>
                </div>
                <FilterSelect label="Tipo" value={type} onChange={setType} options={productTypes} />
                <FilterSelect label="Status" value={status} onChange={setStatus} options={statuses} />
                <FilterSelect label="Método" value={method} onChange={setMethod} options={methods} />
                <FilterSelect label="Cupom" value={couponFilter} onChange={setCouponFilter} options={couponCodes} />
                <FilterInput label="De" type="date" value={dateFrom} onChange={setDateFrom} />
                <FilterInput label="Até" type="date" value={dateTo} onChange={setDateTo} />
                <FilterInput label="Valor mínimo" type="number" value={minValue} onChange={setMinValue} />
                <FilterInput label="Valor máximo" type="number" value={maxValue} onChange={setMaxValue} />
              </div>
              <OrdersTable rows={filteredOrders} />
            </GlassPanel>

            <GlassPanel title="Cancelamentos" description="Quem cancelou, origem, tempo como assinante, motivo e valor pago">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead className="border-b border-white/10 text-xs uppercase text-white/40">
                    <tr>{['Usuário', 'Plano', 'Compra', 'Cancelamento', 'Tempo', 'Valor', 'Motivo', 'Origem'].map((h) => <th key={h} className="px-3 py-3">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {data.cancellations.map((row) => (
                      <tr key={row.id} className="border-b border-white/5 text-white/70">
                        <td className="px-3 py-3"><div className="font-bold text-white">{row.userName || '-'}</div><div className="text-xs text-white/40">{row.userEmail}</div></td>
                        <td className="px-3 py-3">{row.plan}</td>
                        <td className="px-3 py-3">{formatDate(row.purchasedAt)}</td>
                        <td className="px-3 py-3">{formatDate(row.canceledAt)}</td>
                        <td className="px-3 py-3">{row.subscriberDays} dias</td>
                        <td className="px-3 py-3 font-bold text-emerald-200">{formatCurrency(row.value)}</td>
                        <td className="px-3 py-3">{row.reason}</td>
                        <td className="px-3 py-3">{row.origin}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassPanel>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return (
    <div>
      <Label className="text-white/60">{label}</Label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 h-10 w-full rounded-md border border-white/10 bg-[#06140a] px-3 text-sm text-white outline-none">
        <option value="">Todos</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </div>
  )
}

function FilterInput({ label, type, value, onChange }: { label: string; type: string; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <Label className="text-white/60">{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 border-white/10 bg-black/20 text-white" />
    </div>
  )
}

function DonationModeSelector({ value, onChange }: { value: DonationSourceFilter; onChange: (value: DonationSourceFilter) => void }) {
  const options: Array<{ value: DonationSourceFilter; label: string }> = [
    { value: 'all', label: 'Todas' },
    { value: 'platform', label: 'Plataforma' },
    { value: 'bank_app', label: 'App do banco' },
    { value: 'hide', label: 'Ocultar' },
  ]

  return (
    <div className="flex flex-wrap gap-1 rounded-xl border border-white/10 bg-black/15 p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${value === option.value ? 'bg-emerald-400/20 text-white' : 'text-white/45 hover:bg-white/10 hover:text-white/75'}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
