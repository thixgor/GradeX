'use client'

import { useEffect, useId, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Activity, ArrowLeft, BadgeDollarSign, BarChart3, Crown, PencilLine, TrendingUp, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { ThemeToggle } from '@/components/theme-toggle'
import { LogoLoading } from '@/components/logo-loading'

interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'user'
}

interface LiveMetrics {
  totalEstimatedRevenue: number
  activeSubscribers: number
  revenueGrowthPercent: number
  subscriberGrowthPercent: number
  revenueSeries: { label: string; revenue: number; subscribers: number }[]
  subscriberSeries: { label: string; value: number }[]
  subscriberBreakdown: {
    premium: number
    essential: number
    trial: number
    free: number
  }
  updatedAt: string
}

interface ManualScenario {
  headline: string
  summary: string
  totalRevenue: number
  totalSubscribers: number
  revenueRangeMin: number
  revenueRangeMax: number
  subscriberRangeMin: number
  subscriberRangeMax: number
  monthlyRevenue: number[]
  monthlySubscribers: number[]
  monthlyLabels: string[]
}

type ChartStyle = 'bars' | 'line' | 'area' | 'lollipop' | 'mountain'

const STORAGE_KEY = 'admin-revenue-scenario-v1'

const defaultScenario: ManualScenario = {
  headline: 'Receita recorrente',
  summary: 'Visão consolidada da base premium.',
  totalRevenue: 36131.35,
  totalSubscribers: 131,
  revenueRangeMin: 1484.85,
  revenueRangeMax: 12967.69,
  subscriberRangeMin: 15,
  subscriberRangeMax: 131,
  monthlyRevenue: [1484.85, 3365.66, 4553.54, 5345.46, 8414.15, 12967.69],
  monthlySubscribers: [15, 34, 46, 54, 85, 131],
  monthlyLabels: ['Nov', 'Dez', 'Jan', 'Fev', 'Mar', 'Abr'],
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0)
}

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value || 0)
}

function formatPercent(value: number) {
  const safe = Number.isFinite(value) ? value : 0
  const prefix = safe > 0 ? '+' : ''
  return `${prefix}${safe.toFixed(1)}%`
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function parseNumberList(input: string, fallback: number[]) {
  const values = input
    .split(',')
    .map((item) => Number(item.trim().replace(/\s+/g, '').replace(',', '.')))
    .filter((item) => Number.isFinite(item))

  return values.length > 0 ? values : fallback
}

function parseLabelList(input: string, fallback: string[]) {
  const values = input
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

  return values.length > 0 ? values : fallback
}

function buildChartPoints(values: number[], width: number, height: number, padding: number) {
  const max = Math.max(...values, 1)
  const innerWidth = width - padding * 2
  const innerHeight = height - padding * 2

  return values.map((value, index) => {
    const x = padding + (innerWidth * index) / Math.max(values.length - 1, 1)
    const y = padding + innerHeight - (value / max) * innerHeight
    return { x, y, value }
  })
}

function ChartStylePicker({
  value,
  onChange,
}: {
  value: ChartStyle
  onChange: (value: ChartStyle) => void
}) {
  const styles: { value: ChartStyle; label: string; icon: typeof BarChart3 }[] = [
    { value: 'bars', label: 'Barras', icon: BarChart3 },
    { value: 'line', label: 'Linha', icon: TrendingUp },
    { value: 'area', label: 'Area', icon: Activity },
    { value: 'lollipop', label: 'Lollipop', icon: BarChart3 },
    { value: 'mountain', label: 'Mountain', icon: TrendingUp },
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {styles.map((style) => {
        const Icon = style.icon
        const active = value === style.value
        return (
          <Button
            key={style.value}
            type="button"
            variant={active ? 'default' : 'outline'}
            size="sm"
            className="h-9 rounded-xl px-3"
            onClick={() => onChange(style.value)}
          >
            <Icon className="mr-2 h-4 w-4" />
            {style.label}
          </Button>
        )
      })}
    </div>
  )
}

function MultiStyleChart({
  values,
  labels,
  style,
  strokeColor,
  fillColor,
  formatter,
}: {
  values: number[]
  labels: string[]
  style: ChartStyle
  strokeColor: string
  fillColor: string
  formatter: (value: number) => string
}) {
  const gradientId = useId().replace(/:/g, '')
  const width = 720
  const height = 280
  const padding = 24
  const points = buildChartPoints(values, width, height, padding)
  const bars = values.map((value, index) => {
    const slotWidth = (width - padding * 2) / Math.max(values.length, 1)
    const barWidth = Math.max(18, slotWidth - 16)
    const x = padding + index * slotWidth + (slotWidth - barWidth) / 2
    const y = points[index]?.y ?? height - padding
    return {
      x,
      y,
      width: barWidth,
      height: height - padding - y,
      cx: x + barWidth / 2,
    }
  })
  const polyline = points.map((point) => `${point.x},${point.y}`).join(' ')
  const areaPath = points.length
    ? `M ${padding} ${height - padding} L ${points.map((point) => `${point.x} ${point.y}`).join(' L ')} L ${points[points.length - 1].x} ${height - padding} Z`
    : ''
  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-[28px] border border-border/60 bg-gradient-to-b from-background/60 to-muted/30 p-4">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-[320px] w-full">
          <defs>
            <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={fillColor} stopOpacity="0.45" />
              <stop offset="100%" stopColor={fillColor} stopOpacity="0.04" />
            </linearGradient>
          </defs>

          {[0, 1, 2, 3].map((row) => {
            const y = padding + ((height - padding * 2) / 4) * row
            return <line key={row} x1={padding} y1={y} x2={width - padding} y2={y} stroke="currentColor" strokeOpacity="0.12" />
          })}

          {style === 'area' && areaPath && (
            <>
              <path d={areaPath} fill={`url(#${gradientId})`} />
              <polyline fill="none" stroke={strokeColor} strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" points={polyline} />
            </>
          )}

          {style === 'line' && (
            <>
              <polyline fill="none" stroke={strokeColor} strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" points={polyline} />
              {points.map((point, index) => (
                <g key={`${labels[index]}-line-point`}>
                  <circle cx={point.x} cy={point.y} r="6" fill={strokeColor} />
                  <circle cx={point.x} cy={point.y} r="12" fill={strokeColor} fillOpacity="0.14" />
                </g>
              ))}
            </>
          )}

          {style === 'bars' && bars.map((bar, index) => (
            <g key={`${labels[index]}-bar`}>
              <rect x={bar.x} y={bar.y} width={bar.width} height={bar.height} rx="14" fill={fillColor} fillOpacity="0.95" />
              <rect x={bar.x} y={bar.y} width={bar.width} height={Math.min(28, bar.height)} rx="14" fill="white" fillOpacity="0.18" />
            </g>
          ))}

          {style === 'lollipop' && bars.map((bar, index) => (
            <g key={`${labels[index]}-lollipop`}>
              <line x1={bar.cx} y1={height - padding} x2={bar.cx} y2={bar.y} stroke={strokeColor} strokeWidth="6" strokeLinecap="round" strokeOpacity="0.38" />
              <circle cx={bar.cx} cy={bar.y} r="14" fill={fillColor} />
              <circle cx={bar.cx} cy={bar.y} r="6" fill="white" fillOpacity="0.95" />
            </g>
          ))}

          {style === 'mountain' && areaPath && (
            <>
              <path d={areaPath} fill={`url(#${gradientId})`} />
              <path d={areaPath} fill={fillColor} fillOpacity="0.16" />
              <polyline fill="none" stroke={strokeColor} strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" points={polyline} />
            </>
          )}
        </svg>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {values.map((value, index) => (
          <div key={`${labels[index]}-legend`} className="rounded-2xl border border-border/60 bg-background/70 px-3 py-3">
            <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{labels[index] || `M${index + 1}`}</div>
            <div className="mt-1 text-sm font-semibold">{formatter(value)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function RangeMeter({
  current,
  min,
  max,
  label,
  formatter,
  colorClass,
}: {
  current: number
  min: number
  max: number
  label: string
  formatter: (value: number) => string
  colorClass: string
}) {
  const safeMax = Math.max(max, min + 1)
  const ratio = ((current - min) / (safeMax - min)) * 100
  const clamped = Math.min(100, Math.max(0, ratio))

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">{formatter(current)}</span>
      </div>
      <div className="h-3 rounded-full bg-muted">
        <div className={`h-3 rounded-full ${colorClass}`} style={{ width: `${clamped}%` }} />
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{formatter(min)}</span>
        <span>{formatter(max)}</span>
      </div>
    </div>
  )
}

export default function AdminRevenuePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [metricsLoading, setMetricsLoading] = useState(true)
  const [metricsError, setMetricsError] = useState('')
  const [liveMetrics, setLiveMetrics] = useState<LiveMetrics | null>(null)
  const [scenario, setScenario] = useState<ManualScenario>(defaultScenario)
  const [scenarioLoaded, setScenarioLoaded] = useState(false)
  const [mode, setMode] = useState<'live' | 'manual'>('live')
  const [showSimulationEditor, setShowSimulationEditor] = useState(false)
  const [revenueChartStyle, setRevenueChartStyle] = useState<ChartStyle>('area')
  const [subscriberChartStyle, setSubscriberChartStyle] = useState<ChartStyle>('line')
  const [revenueInput, setRevenueInput] = useState(defaultScenario.monthlyRevenue.join(', '))
  const [subscribersInput, setSubscribersInput] = useState(defaultScenario.monthlySubscribers.join(', '))
  const [labelsInput, setLabelsInput] = useState(defaultScenario.monthlyLabels.join(', '))

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      setScenarioLoaded(true)
      return
    }

    try {
      const parsed = JSON.parse(stored) as ManualScenario
      setScenario(parsed)
      setRevenueInput(parsed.monthlyRevenue.join(', '))
      setSubscribersInput(parsed.monthlySubscribers.join(', '))
      setLabelsInput(parsed.monthlyLabels.join(', '))
    } catch {
      window.localStorage.removeItem(STORAGE_KEY)
    } finally {
      setScenarioLoaded(true)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || !scenarioLoaded) return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(scenario))
  }, [scenario, scenarioLoaded])

  async function checkAuth() {
    try {
      const authRes = await fetch('/api/auth/me')
      if (!authRes.ok) {
        router.push('/auth/login')
        return
      }

      const authData = await authRes.json()
      if (authData.user.role !== 'admin') {
        router.push('/')
        return
      }

      setUser(authData.user)

      const metricsRes = await fetch('/api/admin/revenue-metrics')
      const metricsData = await metricsRes.json()

      if (!metricsRes.ok) {
        throw new Error(metricsData.error || 'Erro ao carregar métricas')
      }

      setLiveMetrics(metricsData.metrics)
    } catch (error: any) {
      setMetricsError(error.message || 'Erro ao carregar métricas')
    } finally {
      setLoading(false)
      setMetricsLoading(false)
    }
  }

  function updateScenarioField<K extends keyof ManualScenario>(field: K, value: ManualScenario[K]) {
    setScenario((current) => ({ ...current, [field]: value }))
  }

  function syncSeriesInputs(nextLabelsInput: string, nextRevenueInput: string, nextSubscribersInput: string) {
    setRevenueInput(nextRevenueInput)
    setSubscribersInput(nextSubscribersInput)
    setLabelsInput(nextLabelsInput)

    const parsedRevenue = parseNumberList(nextRevenueInput, scenario.monthlyRevenue)
    const parsedSubscribers = parseNumberList(nextSubscribersInput, scenario.monthlySubscribers)
    const parsedLabels = parseLabelList(nextLabelsInput, scenario.monthlyLabels)
    const parsedSize = Math.min(parsedRevenue.length, parsedSubscribers.length, parsedLabels.length)

    updateScenarioField('monthlyRevenue', parsedRevenue.slice(0, parsedSize))
    updateScenarioField('monthlySubscribers', parsedSubscribers.slice(0, parsedSize))
    updateScenarioField('monthlyLabels', parsedLabels.slice(0, parsedSize))
  }

  const liveRevenueValues = liveMetrics?.revenueSeries.map((item) => item.revenue) || []
  const liveRevenueLabels = liveMetrics?.revenueSeries.map((item) => item.label) || []
  const liveSubscriberValues = liveMetrics?.subscriberSeries.map((item) => item.value) || []
  const liveSubscriberLabels = liveMetrics?.subscriberSeries.map((item) => item.label) || []

  const manualGrowth = useMemo(() => {
    const revenue = scenario.monthlyRevenue
    const subscribers = scenario.monthlySubscribers
    const lastRevenue = revenue[revenue.length - 1] || 0
    const prevRevenue = revenue[revenue.length - 2] || 0
    const lastSubscribers = subscribers[subscribers.length - 1] || 0
    const prevSubscribers = subscribers[subscribers.length - 2] || 0

    return {
      revenue: prevRevenue > 0 ? ((lastRevenue - prevRevenue) / prevRevenue) * 100 : 0,
      subscribers: prevSubscribers > 0 ? ((lastSubscribers - prevSubscribers) / prevSubscribers) * 100 : 0,
    }
  }, [scenario])

  const currentTicket = useMemo(() => {
    const lastRevenue = scenario.monthlyRevenue[scenario.monthlyRevenue.length - 1] || 0
    const lastSubscribers = scenario.monthlySubscribers[scenario.monthlySubscribers.length - 1] || 0
    return lastSubscribers > 0 ? lastRevenue / lastSubscribers : 0
  }, [scenario])

  const panelClass = 'border border-border/60 bg-white/72 backdrop-blur-xl shadow-[0_24px_70px_rgba(15,23,42,0.08)] dark:bg-slate-950/72 dark:shadow-[0_24px_70px_rgba(0,0,0,0.36)]'
  const statCardClass = 'overflow-hidden border border-border/60 bg-white/76 backdrop-blur-xl shadow-[0_20px_55px_rgba(15,23,42,0.07)] dark:bg-slate-950/76 dark:shadow-[0_20px_55px_rgba(0,0,0,0.34)]'

  if (loading) {
    return <LogoLoading message="Carregando painel de receita..." size="lg" fullscreen />
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.14),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.14),_transparent_24%),linear-gradient(180deg,_#f7fbf9,_#eef4f2_52%,_#edf4f6)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_26%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.16),_transparent_24%),linear-gradient(180deg,_#081015,_#0b1620_48%,_#0d1520)]">
      <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
        <div className="container mx-auto flex max-w-7xl items-center justify-between gap-3 px-3 py-3 sm:px-4">
          <div className="flex min-w-0 items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push('/admin')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold sm:text-2xl">Receita e Assinantes</h1>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto max-w-7xl px-3 py-6 sm:px-4 sm:py-8">
        <Card className="mb-6 overflow-hidden border-0 bg-[linear-gradient(135deg,_rgba(5,46,22,0.98),_rgba(6,78,59,0.96)_38%,_rgba(8,145,178,0.88))] text-white shadow-[0_30px_90px_rgba(6,78,59,0.3)]">
          <CardHeader className="gap-6 pb-7">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-3">
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-white/85">
                  <BadgeDollarSign className="h-3.5 w-3.5" />
                  Admin metrics
                </div>
                <CardTitle className="flex items-center gap-2 text-2xl sm:text-4xl">
                  {mode === 'manual' ? scenario.headline : 'Painel financeiro do admin'}
                </CardTitle>
                <CardDescription className="max-w-2xl text-sm text-white/78 sm:text-base">
                  {mode === 'manual' ? scenario.summary : 'Base premium, receita mensal e evolução de assinantes.'}
                </CardDescription>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/14 bg-white/10 px-4 py-3 backdrop-blur">
                  <div className="text-[11px] uppercase tracking-wide text-white/65">Receita total</div>
                  <div className="mt-1 text-lg font-semibold">{formatCurrency(mode === 'manual' ? scenario.totalRevenue : liveMetrics?.totalEstimatedRevenue || 0)}</div>
                </div>
                <div className="rounded-2xl border border-white/14 bg-white/10 px-4 py-3 backdrop-blur">
                  <div className="text-[11px] uppercase tracking-wide text-white/65">Assinantes</div>
                  <div className="mt-1 text-lg font-semibold">{formatCompactNumber(mode === 'manual' ? scenario.totalSubscribers : liveMetrics?.activeSubscribers || 0)}</div>
                </div>
                <div className="rounded-2xl border border-white/14 bg-white/10 px-4 py-3 backdrop-blur col-span-2 sm:col-span-1">
                  <div className="text-[11px] uppercase tracking-wide text-white/65">Ticket mensal</div>
                  <div className="mt-1 text-lg font-semibold">{formatCurrency(mode === 'manual' ? currentTicket : 0)}</div>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Tabs value={mode} onValueChange={(value) => setMode(value as 'live' | 'manual')} defaultValue="live" className="space-y-6">
          <TabsList className="grid h-auto w-full grid-cols-2 rounded-2xl border border-border/60 bg-white/55 p-1.5 backdrop-blur dark:bg-slate-950/60">
            <TabsTrigger value="live" className="rounded-xl py-2.5 text-sm font-medium">Modo real</TabsTrigger>
            <TabsTrigger value="manual" className="rounded-xl py-2.5 text-sm font-medium">Modo simulacao</TabsTrigger>
          </TabsList>

          <TabsContent value="live" className="space-y-6">
            {metricsLoading ? (
              <Card>
                <CardContent className="flex items-center gap-3 p-6">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <span>Carregando métricas de receita...</span>
                </CardContent>
              </Card>
            ) : metricsError || !liveMetrics ? (
              <Card>
                <CardHeader>
                  <CardTitle>Não foi possível carregar os dados estimados</CardTitle>
                  <CardDescription>{metricsError || 'Erro inesperado ao buscar métricas.'}</CardDescription>
                </CardHeader>
              </Card>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <Card className={statCardClass}>
                    <CardContent className="p-5">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Receita estimada ativa</span>
                        <BadgeDollarSign className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div className="text-2xl font-bold">{formatCurrency(liveMetrics.totalEstimatedRevenue)}</div>
                      <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-300">{formatPercent(liveMetrics.revenueGrowthPercent)} vs. mês anterior</p>
                    </CardContent>
                  </Card>

                  <Card className={statCardClass}>
                    <CardContent className="p-5">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Assinantes ativos</span>
                        <Users className="h-4 w-4 text-cyan-600" />
                      </div>
                      <div className="text-2xl font-bold">{formatCompactNumber(liveMetrics.activeSubscribers)}</div>
                      <p className="mt-1 text-xs text-cyan-700 dark:text-cyan-300">{formatPercent(liveMetrics.subscriberGrowthPercent)} vs. mês anterior</p>
                    </CardContent>
                  </Card>

                  <Card className={statCardClass}>
                    <CardContent className="p-5">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Premium ativos</span>
                        <Crown className="h-4 w-4 text-amber-500" />
                      </div>
                      <div className="text-2xl font-bold">{formatCompactNumber(liveMetrics.subscriberBreakdown.premium)}</div>
                      <p className="mt-1 text-xs text-muted-foreground">Base principal paga</p>
                    </CardContent>
                  </Card>

                  <Card className={statCardClass}>
                    <CardContent className="p-5">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Atualizado em</span>
                        <TrendingUp className="h-4 w-4 text-violet-500" />
                      </div>
                      <div className="text-base font-semibold">{formatDateTime(liveMetrics.updatedAt)}</div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
                  <Card className={panelClass}>
                    <CardHeader>
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                        <div>
                          <CardTitle>Receita por ativações recentes</CardTitle>
                          <CardDescription>Últimos 6 meses com base em ativações pagas registradas</CardDescription>
                        </div>
                        <ChartStylePicker value={revenueChartStyle} onChange={setRevenueChartStyle} />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <MultiStyleChart
                        values={liveRevenueValues}
                        labels={liveRevenueLabels}
                        style={revenueChartStyle}
                        strokeColor="#10b981"
                        fillColor="#34d399"
                        formatter={formatCurrency}
                      />
                    </CardContent>
                  </Card>

                  <Card className={panelClass}>
                    <CardHeader>
                      <CardTitle>Distribuição atual</CardTitle>
                      <CardDescription>Leitura rápida da base por plano</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      <RangeMeter
                        current={liveMetrics.subscriberBreakdown.premium}
                        min={0}
                        max={Math.max(liveMetrics.activeSubscribers, 1)}
                        label="Premium"
                        formatter={formatCompactNumber}
                        colorClass="bg-amber-500"
                      />
                      <RangeMeter
                        current={liveMetrics.subscriberBreakdown.essential}
                        min={0}
                        max={Math.max(liveMetrics.activeSubscribers, 1)}
                        label="Essential"
                        formatter={formatCompactNumber}
                        colorClass="bg-blue-500"
                      />
                      <RangeMeter
                        current={liveMetrics.subscriberBreakdown.trial}
                        min={0}
                        max={Math.max(liveMetrics.subscriberBreakdown.trial + liveMetrics.subscriberBreakdown.free, 1)}
                        label="Trial ativos"
                        formatter={formatCompactNumber}
                        colorClass="bg-fuchsia-500"
                      />
                    </CardContent>
                  </Card>
                </div>

                <Card className={panelClass}>
                  <CardHeader>
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                      <div>
                        <CardTitle>Entradas de assinantes por mês</CardTitle>
                        <CardDescription>Número de usuários pagos ativados em cada mês recente</CardDescription>
                      </div>
                      <ChartStylePicker value={subscriberChartStyle} onChange={setSubscriberChartStyle} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <MultiStyleChart
                      values={liveSubscriberValues}
                      labels={liveSubscriberLabels}
                      style={subscriberChartStyle}
                      strokeColor="#0ea5e9"
                      fillColor="#38bdf8"
                      formatter={formatCompactNumber}
                    />
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="manual" className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Card className={statCardClass}>
                <CardContent className="p-6">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Receita acumulada</span>
                    <BadgeDollarSign className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="text-3xl font-bold tracking-tight">{formatCurrency(scenario.totalRevenue)}</div>
                  <p className="mt-2 text-xs font-medium text-emerald-700 dark:text-emerald-300">{formatPercent(manualGrowth.revenue)} vs. mês anterior</p>
                </CardContent>
              </Card>

              <Card className={statCardClass}>
                <CardContent className="p-6">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Assinantes premium</span>
                    <Users className="h-4 w-4 text-cyan-600" />
                  </div>
                  <div className="text-3xl font-bold tracking-tight">{formatCompactNumber(scenario.totalSubscribers)}</div>
                  <p className="mt-2 text-xs font-medium text-cyan-700 dark:text-cyan-300">{formatPercent(manualGrowth.subscribers)} vs. mês anterior</p>
                </CardContent>
              </Card>

              <Card className={statCardClass}>
                <CardContent className="p-6">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Faixa mensal</span>
                    <TrendingUp className="h-4 w-4 text-violet-500" />
                  </div>
                  <div className="text-lg font-semibold">
                    {formatCurrency(scenario.revenueRangeMin)} - {formatCurrency(scenario.revenueRangeMax)}
                  </div>
                </CardContent>
              </Card>

              <Card className={statCardClass}>
                <CardContent className="p-6">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Ticket medio</span>
                    <Crown className="h-4 w-4 text-amber-500" />
                  </div>
                  <div className="text-lg font-semibold">{formatCurrency(currentTicket)}</div>
                  <p className="mt-2 text-xs text-muted-foreground">R$ 98,99 por assinante no cenário atual</p>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end">
              <Button
                variant={showSimulationEditor ? 'default' : 'outline'}
                onClick={() => setShowSimulationEditor((current) => !current)}
                className="gap-2"
              >
                <PencilLine className="h-4 w-4" />
                {showSimulationEditor ? 'Ocultar controles' : 'Mostrar controles'}
              </Button>
            </div>

            <div className={`grid gap-6 ${showSimulationEditor ? 'xl:grid-cols-[0.9fr_1.1fr]' : 'xl:grid-cols-1'}`}>
              {showSimulationEditor && (
                <Card className={panelClass}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PencilLine className="h-5 w-5 text-primary" />
                      Controles da simulacao
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="headline">Título interno</Label>
                      <Input id="headline" value={scenario.headline} onChange={(e) => updateScenarioField('headline', e.target.value)} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="summary">Resumo</Label>
                      <Textarea id="summary" value={scenario.summary} onChange={(e) => updateScenarioField('summary', e.target.value)} className="min-h-[96px]" />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="totalRevenue">Receita principal</Label>
                        <Input
                          id="totalRevenue"
                          type="number"
                          value={scenario.totalRevenue}
                          onChange={(e) => updateScenarioField('totalRevenue', Number(e.target.value) || 0)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="totalSubscribers">Assinantes principais</Label>
                        <Input
                          id="totalSubscribers"
                          type="number"
                          value={scenario.totalSubscribers}
                          onChange={(e) => updateScenarioField('totalSubscribers', Number(e.target.value) || 0)}
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="revenueMin">Receita mínima</Label>
                        <Input
                          id="revenueMin"
                          type="number"
                          value={scenario.revenueRangeMin}
                          onChange={(e) => updateScenarioField('revenueRangeMin', Number(e.target.value) || 0)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="revenueMax">Receita máxima</Label>
                        <Input
                          id="revenueMax"
                          type="number"
                          value={scenario.revenueRangeMax}
                          onChange={(e) => updateScenarioField('revenueRangeMax', Number(e.target.value) || 0)}
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="subscribersMin">Assinantes mínimos</Label>
                        <Input
                          id="subscribersMin"
                          type="number"
                          value={scenario.subscriberRangeMin}
                          onChange={(e) => updateScenarioField('subscriberRangeMin', Number(e.target.value) || 0)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="subscribersMax">Assinantes máximos</Label>
                        <Input
                          id="subscribersMax"
                          type="number"
                          value={scenario.subscriberRangeMax}
                          onChange={(e) => updateScenarioField('subscriberRangeMax', Number(e.target.value) || 0)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="labelsInput">Rótulos da série</Label>
                      <Textarea
                        id="labelsInput"
                        value={labelsInput}
                        onChange={(e) => syncSeriesInputs(e.target.value, revenueInput, subscribersInput)}
                        className="min-h-[72px]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="revenueInput">Série de receita</Label>
                      <Textarea
                        id="revenueInput"
                        value={revenueInput}
                        onChange={(e) => syncSeriesInputs(labelsInput, e.target.value, subscribersInput)}
                        className="min-h-[72px]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subscribersInput">Série de assinantes</Label>
                      <Textarea
                        id="subscribersInput"
                        value={subscribersInput}
                        onChange={(e) => syncSeriesInputs(labelsInput, revenueInput, e.target.value)}
                        className="min-h-[72px]"
                      />
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setScenario(defaultScenario)
                          syncSeriesInputs(
                            defaultScenario.monthlyLabels.join(', '),
                            defaultScenario.monthlyRevenue.join(', '),
                            defaultScenario.monthlySubscribers.join(', ')
                          )
                        }}
                      >
                        Restaurar padrão
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-6">
                <Card className={panelClass}>
                  <CardHeader>
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                      <CardTitle>Receita do cenário</CardTitle>
                      <ChartStylePicker value={revenueChartStyle} onChange={setRevenueChartStyle} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <MultiStyleChart
                      values={scenario.monthlyRevenue}
                      labels={scenario.monthlyLabels}
                      style={revenueChartStyle}
                      strokeColor="#10b981"
                      fillColor="#34d399"
                      formatter={formatCurrency}
                    />
                  </CardContent>
                </Card>

                <Card className={panelClass}>
                  <CardHeader>
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                      <CardTitle>Assinantes do cenário</CardTitle>
                      <ChartStylePicker value={subscriberChartStyle} onChange={setSubscriberChartStyle} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <MultiStyleChart
                      values={scenario.monthlySubscribers}
                      labels={scenario.monthlyLabels}
                      style={subscriberChartStyle}
                      strokeColor="#0ea5e9"
                      fillColor="#38bdf8"
                      formatter={formatCompactNumber}
                    />
                  </CardContent>
                </Card>

                <Card className={panelClass}>
                  <CardHeader>
                    <CardTitle>Leitura rápida</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <RangeMeter
                      current={scenario.totalRevenue}
                      min={scenario.revenueRangeMin}
                      max={scenario.revenueRangeMax}
                      label="Faixa de receita"
                      formatter={formatCurrency}
                      colorClass="bg-emerald-500"
                    />
                    <RangeMeter
                      current={scenario.totalSubscribers}
                      min={scenario.subscriberRangeMin}
                      max={scenario.subscriberRangeMax}
                      label="Faixa de assinantes"
                      formatter={formatCompactNumber}
                      colorClass="bg-cyan-500"
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
