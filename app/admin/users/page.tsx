'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeToggle } from '@/components/theme-toggle'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { ToastAlert } from '@/components/ui/toast-alert'
import { User, BanReason, BanReasonLabels, AccountType, TrialPlanType, PremiumPlanType } from '@/lib/types'
import { ArrowLeft, Trash2, Ban, CheckCircle, AlertTriangle, Shield, Crown, Timer, Settings, Info, Zap, Activity, Users, UserCheck, Clock, Search, RefreshCw, Mail, CalendarDays, ShoppingBag, FileDown, Package as PackageIcon, FileText as FileTextIcon, Receipt, GraduationCap, MonitorSmartphone, Wifi, LogOut, Phone, MapPin, Stethoscope, BookOpen, TrendingUp, Wallet, CalendarClock, AlertCircle, Repeat, Sparkles, Infinity as InfinityIcon, Target } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PERIODO_OPTIONS, computeCurrentPeriodo, formatPeriodoLabel } from '@/lib/user-periodo'
import { formatStateLabel } from '@/lib/brazil-states'
import { isPlusAccount, normalizeAccountType, PLUS_LABEL, QUEST_LABEL } from '@/lib/account-tier'
import { useCargos } from '@/hooks/use-cargos'
import { SeloDeCargo, iconeDoCargo } from '@/components/cargo-badge'
import { AdminSecurityPanel } from '@/components/admin/admin-security-panel'
import {
  buildAdminUserInsights,
  describeAccountRole,
  formatMoney,
  formatSubscriptionEndDate,
  formatSubscriptionRemaining,
  matchesCycleFilter,
  matchesExpiryFilter,
  matchesSubscriptionFilter,
  nextExpiryValue,
  CYCLE_FILTER_OPTIONS,
  EXPIRING_SOON_DAYS,
  resolvePlanLabel,
  type AdminSubscriptionInfo,
  type AdminUserRow,
  type ExpiryFilter,
  type ProductInsights,
  type SubscriptionFilter,
} from '@/lib/admin-user-insights'

const PROFESSION_LABELS: Record<string, string> = {
  medico: 'Médico',
  academico: 'Acadêmico',
  residente: 'Residente',
}

type OnlineUser = {
  id?: string
  name: string
  email: string
  lastLoginAt?: string
}

type UserSortMode = 'lastLogin' | 'createdAt' | 'name' | 'expiresAt' | 'spend'
type UserActivityFilter = 'all' | 'online' | 'active7d' | 'never'
type UserPlanFilter = 'all' | AccountType | 'admin' | 'banned' | 'monitor'

const ONLINE_THRESHOLD_MS = 10 * 60 * 1000
const ACTIVE_7D_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000

function getUserDateValue(value?: Date | string | null) {
  if (!value) return 0
  const time = new Date(value).getTime()
  return Number.isNaN(time) ? 0 : time
}

function formatDateTime(value?: Date | string | null) {
  const time = getUserDateValue(value)
  if (!time) return 'Nunca'

  return new Date(time).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatRelativeActivity(value?: Date | string | null) {
  const time = getUserDateValue(value)
  if (!time) return 'Nunca acessou'

  const diffMs = Date.now() - time
  if (diffMs < 60 * 1000) return 'Agora'

  const diffMinutes = Math.floor(diffMs / (60 * 1000))
  if (diffMinutes < 60) return `${diffMinutes} min atrás`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours} h atrás`

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) return 'Ontem'
  if (diffDays < 30) return `${diffDays} dias atrás`

  return formatDateTime(value)
}

function isRecentlyOnline(user: User) {
  const time = getUserDateValue(user.lastLoginAt)
  return !!time && Date.now() - time <= ONLINE_THRESHOLD_MS && !user.banned
}

function formatPercent(value: number) {
  return `${value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`
}

/** Card compacto de número + contexto usado na faixa de indicadores. */
function StatCard({
  icon,
  label,
  value,
  hint,
  onClick,
  tone,
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
  hint?: React.ReactNode
  onClick?: () => void
  tone?: 'default' | 'warning' | 'danger' | 'success'
}) {
  const toneClass =
    tone === 'warning' ? 'border-amber-300/70 dark:border-amber-800'
      : tone === 'danger' ? 'border-red-300/70 dark:border-red-900'
      : tone === 'success' ? 'border-emerald-300/70 dark:border-emerald-900'
      : ''

  return (
    <Card
      className={`${toneClass} ${onClick ? 'cursor-pointer transition-colors hover:bg-muted/40' : ''}`}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <CardDescription className="flex items-center gap-2">{icon}{label}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
      {hint ? <CardContent className="text-xs text-muted-foreground">{hint}</CardContent> : null}
    </Card>
  )
}

/**
 * Distribuição dos assinantes ativos por ciclo contratado. Responde de bate
 * pronto "quantos são mensais, semestrais, anuais" — a pergunta que motivou
 * boa parte desta tela.
 */
function CycleBreakdown({
  insights,
  accent,
  onSelectCycle,
}: {
  insights: ProductInsights
  accent: string
  onSelectCycle?: (cycle: string) => void
}) {
  if (insights.cycles.length === 0) {
    return <p className="text-xs text-muted-foreground">Nenhum assinante ativo no momento.</p>
  }
  const max = Math.max(...insights.cycles.map(c => c.count), 1)

  return (
    <div className="space-y-2">
      {insights.cycles.map(cycle => (
        <button
          key={cycle.key}
          type="button"
          onClick={onSelectCycle ? () => onSelectCycle(cycle.key) : undefined}
          className={`w-full text-left ${onSelectCycle ? 'cursor-pointer' : 'cursor-default'}`}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium">{cycle.label}</span>
            <span className="text-muted-foreground">
              {cycle.count} ({formatPercent((cycle.count / insights.active) * 100)})
            </span>
          </div>
          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full ${accent}`}
              style={{ width: `${Math.max(4, (cycle.count / max) * 100)}%` }}
            />
          </div>
        </button>
      ))}
    </div>
  )
}

/*
 * Identidade visual por produto, igual à do selo de cargo: Plus+ é a coroa
 * âmbar, Quest+ é o alvo esmeralda, Manual Clínico é o livro azul. O card lia
 * só `product === 'plus'`, então a assinatura Quest+ — que mora nos mesmos
 * campos do usuário — vinha com a coroa e o rótulo do Plus+.
 */
const PRODUCT_STYLES = {
  plus: { Icon: Crown, iconClass: 'text-amber-500', bar: 'bg-gradient-to-r from-yellow-500 to-orange-500' },
  quest: { Icon: Target, iconClass: 'text-emerald-500', bar: 'bg-emerald-500' },
  manual_clinico: { Icon: BookOpen, iconClass: 'text-sky-500', bar: 'bg-sky-500' },
} as const

/**
 * Bloco de uma assinatura no card do usuário: o que comprou, até quando vale e
 * quanto falta. Também aparece para assinatura vencida — é a fila do
 * rebaixamento, e escondê-la esconderia o problema.
 */
function SubscriptionTile({ info }: { info: AdminSubscriptionInfo }) {
  const style = PRODUCT_STYLES[info.product] ?? PRODUCT_STYLES.plus
  const state = info.lifetime
    ? { label: 'Vitalício', className: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300' }
    : info.expired
      ? { label: 'Expirado', className: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' }
      : info.expiringSoon
        ? { label: `Vence em ${info.daysRemaining}d`, className: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' }
        : { label: 'Ativo', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' }

  const barClass = info.expired
    ? 'bg-red-500'
    : info.expiringSoon
      ? 'bg-amber-500'
      : style.bar

  return (
    <div className="rounded-lg border bg-muted/20 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <style.Icon className={`h-3.5 w-3.5 ${style.iconClass}`} />
          {info.productLabel}
        </div>
        <span className={`rounded px-2 py-0.5 text-[11px] font-medium ${state.className}`}>
          {state.label}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-foreground">{info.planLabel}</span>
        {info.autoRenew && (
          <span className="flex items-center gap-1 rounded bg-blue-100 px-1.5 py-0.5 text-[11px] text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            <Repeat className="h-3 w-3" />
            Recorrente
          </span>
        )}
        {info.price ? (
          <span className="text-[11px] text-muted-foreground">{formatMoney(info.price)}</span>
        ) : null}
      </div>

      <div className="mt-2 space-y-1 text-xs">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <CalendarClock className="h-3.5 w-3.5 shrink-0" />
          {info.lifetime ? 'Sem data de término' : `Termina em ${formatSubscriptionEndDate(info)}`}
        </div>
        <div
          className={`font-medium ${
            info.expired
              ? 'text-red-600 dark:text-red-400'
              : info.expiringSoon
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-foreground'
          }`}
        >
          {formatSubscriptionRemaining(info)}
        </div>
        {info.startedAt && (
          <div className="text-muted-foreground">
            Comprado em {new Date(info.startedAt).toLocaleDateString('pt-BR')}
          </div>
        )}
      </div>

      {info.elapsedRatio !== null && !info.lifetime && (
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div className={`h-full rounded-full ${barClass}`} style={{ width: `${info.elapsedRatio * 100}%` }} />
        </div>
      )}
    </div>
  )
}

export default function AdminUsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<AdminUserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [onlineCount, setOnlineCount] = useState<number | null>(null)
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const [onlineLoading, setOnlineLoading] = useState(false)
  const [showOnlineDialog, setShowOnlineDialog] = useState(false)
  const [showBanDialog, setShowBanDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showTierDialog, setShowTierDialog] = useState(false)
  const [showQuotaDialog, setShowQuotaDialog] = useState(false)
  const [showInfoDialog, setShowInfoDialog] = useState(false)
  const [showMonitorDialog, setShowMonitorDialog] = useState(false)
  const [showAdminDialog, setShowAdminDialog] = useState(false)
  const [showPeriodoDialog, setShowPeriodoDialog] = useState(false)
  const [selectedPeriodo, setSelectedPeriodo] = useState<string>('')
  const [showPurchasesDialog, setShowPurchasesDialog] = useState(false)
  const [purchasesLoading, setPurchasesLoading] = useState(false)
  const [purchasesData, setPurchasesData] = useState<{
    user: { id: string; name: string; email: string }
    purchases: Array<{
      _id: string
      itemTitle: string
      itemType: 'material' | 'package'
      price: number
      purchasedAt: string
      providerPaymentId?: string
    }>
    totalAmount: number
    count: number
  } | null>(null)
  const [generatingPurchasesPdf, setGeneratingPurchasesPdf] = useState(false)
  const [showSessionsDialog, setShowSessionsDialog] = useState(false)
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [sessionsData, setSessionsData] = useState<{
    activeCount: number
    sessions: Array<{
      id: string
      ip: string
      deviceName: string
      userAgent: string
      createdAt?: string
      lastActiveAt?: string
      revoked: boolean
      revokedBy?: string
      online: boolean
    }>
  } | null>(null)
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<AdminUserRow | null>(null)
  const [banReason, setBanReason] = useState<BanReason>('other')
  const [banDetails, setBanDetails] = useState('')
  const [selectedAccountType, setSelectedAccountType] = useState<AccountType>('gratuito')
  const [selectedTrialSubtype, setSelectedTrialSubtype] = useState<TrialPlanType>('7dias')
  const [selectedPremiumSubtype, setSelectedPremiumSubtype] = useState<PremiumPlanType>('mensal')

  /*
   * O registro de cargos alimenta o seletor do diálogo de plano.
   *
   * `cargosDisponiveis` é a lista inteira — inclusive os criados pelo admin —,
   * e `cargoSelecionadoEhPago` decide se o seletor de duração aparece. É a
   * mesma pergunta que a rota faz ao gravar (`cargo.pago`), então a tela e o
   * servidor não podem discordar sobre o que é uma assinatura.
   */
  const { cargos: cargosDisponiveis, acharCargo } = useCargos()
  const cargoSelecionadoEhPago = !!acharCargo(selectedAccountType)?.pago
  const [examsQuota, setExamsQuota] = useState(0)
  const [toastOpen, setToastOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'error' | 'success' | 'info'>('error')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortMode, setSortMode] = useState<UserSortMode>('lastLogin')
  const [activityFilter, setActivityFilter] = useState<UserActivityFilter>('all')
  const [planFilter, setPlanFilter] = useState<UserPlanFilter>('all')
  const [subscriptionFilter, setSubscriptionFilter] = useState<SubscriptionFilter>('all')
  const [cycleFilter, setCycleFilter] = useState<string>('all')
  const [expiryFilter, setExpiryFilter] = useState<ExpiryFilter>('all')
  const [visibleCount, setVisibleCount] = useState(30)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [showManualDialog, setShowManualDialog] = useState(false)
  const [manualPlanKey, setManualPlanKey] = useState<'semestral' | 'anual' | 'vitalicio'>('anual')
  const [manualSaving, setManualSaving] = useState(false)

  useEffect(() => {
    loadUsers()
    loadOnlineCount()
    // CHANGED: Polling reduced from 30s to 60s to reduce serverless invocations
    const intervalId = setInterval(() => {
      loadOnlineCount()
    }, 60000)

    return () => clearInterval(intervalId)
  }, [])

  const showToastMessage = (message: string, type: 'error' | 'success' | 'info' = 'error') => {
    setToastMessage(message)
    setToastType(type)
    setToastOpen(true)
  }

  // Todos os indicadores saem do mesmo módulo que a rota usa para montar as
  // assinaturas, então o que o card diz e o que a lista mostra nunca divergem.
  const insights = useMemo(() => buildAdminUserInsights(users), [users])

  const recentUsers = useMemo(() => {
    return [...users]
      .filter((user) => getUserDateValue(user.lastLoginAt))
      .sort((a, b) => getUserDateValue(b.lastLoginAt) - getUserDateValue(a.lastLoginAt))
      .slice(0, 6)
  }, [users])

  const filteredUsers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    const now = Date.now()

    return users
      .filter((user) => {
        if (!normalizedSearch) return true
        // Busca também por telefone e CPF: o suporte costuma chegar com o dado
        // que o usuário informou no atendimento, não com o e-mail.
        return `${user.name} ${user.email} ${user.phone || ''} ${user.cpf || ''}`
          .toLowerCase()
          .includes(normalizedSearch)
      })
      .filter((user) => {
        if (planFilter === 'all') return true
        if (planFilter === 'admin') return user.role === 'admin'
        if (planFilter === 'banned') return !!user.banned
        if (planFilter === 'monitor') return user.secondaryRole === 'monitor'
        // Normaliza para que o filtro "Plus+" também pegue as contas legadas
        // ainda gravadas como premium/essential.
        return normalizeAccountType(user.accountType) === planFilter && user.role !== 'admin'
      })
      .filter((user) => matchesSubscriptionFilter(user, subscriptionFilter))
      .filter((user) => matchesCycleFilter(user, cycleFilter))
      .filter((user) => matchesExpiryFilter(user, expiryFilter))
      .filter((user) => {
        const lastLogin = getUserDateValue(user.lastLoginAt)
        if (activityFilter === 'all') return true
        if (activityFilter === 'online') return isRecentlyOnline(user)
        if (activityFilter === 'active7d') return !!lastLogin && now - lastLogin <= ACTIVE_7D_THRESHOLD_MS
        if (activityFilter === 'never') return !lastLogin
        return true
      })
      .sort((a, b) => {
        if (sortMode === 'name') return a.name.localeCompare(b.name, 'pt-BR')
        if (sortMode === 'createdAt') return getUserDateValue(b.createdAt) - getUserDateValue(a.createdAt)
        if (sortMode === 'spend') return (b.spend?.total || 0) - (a.spend?.total || 0)
        if (sortMode === 'expiresAt') return nextExpiryValue(a) - nextExpiryValue(b)
        return getUserDateValue(b.lastLoginAt) - getUserDateValue(a.lastLoginAt)
      })
  }, [activityFilter, cycleFilter, expiryFilter, planFilter, searchTerm, sortMode, subscriptionFilter, users])

  const visibleUsers = useMemo(
    () => filteredUsers.slice(0, visibleCount),
    [filteredUsers, visibleCount],
  )

  // Qualquer mudança de filtro recomeça a paginação — senão o admin filtra e
  // continua vendo a página 4 de um resultado que agora tem 3 itens.
  useEffect(() => {
    setVisibleCount(30)
  }, [activityFilter, cycleFilter, expiryFilter, planFilter, searchTerm, sortMode, subscriptionFilter])

  /** Atalho dos cards de indicador: aplica um recorte e limpa os concorrentes. */
  function applyQuickFilter(next: {
    subscription?: SubscriptionFilter
    expiry?: ExpiryFilter
    cycle?: string
    plan?: UserPlanFilter
    activity?: UserActivityFilter
    sort?: UserSortMode
  }) {
    setSearchTerm('')
    setPlanFilter(next.plan ?? 'all')
    setActivityFilter(next.activity ?? 'all')
    setSubscriptionFilter(next.subscription ?? 'all')
    setCycleFilter(next.cycle ?? 'all')
    setExpiryFilter(next.expiry ?? 'all')
    if (next.sort) setSortMode(next.sort)
    if (typeof window !== 'undefined') {
      document.getElementById('lista-usuarios')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  function resetFilters() {
    setSearchTerm('')
    setPlanFilter('all')
    setActivityFilter('all')
    setSubscriptionFilter('all')
    setCycleFilter('all')
    setExpiryFilter('all')
    setSortMode('lastLogin')
  }

  const hasActiveFilters =
    !!searchTerm ||
    planFilter !== 'all' ||
    activityFilter !== 'all' ||
    subscriptionFilter !== 'all' ||
    cycleFilter !== 'all' ||
    expiryFilter !== 'all'

  /**
   * Exporta exatamente o recorte que está na tela. O admin filtra "anuais que
   * vencem em 30 dias" e leva a lista pronta para a campanha de renovação.
   */
  function handleExportCsv() {
    if (filteredUsers.length === 0) {
      showToastMessage('Nenhum usuário no filtro atual para exportar.', 'info')
      return
    }

    const header = [
      'Nome', 'Email', 'Telefone', 'Cargo', 'Periodo', 'Profissao', 'Estado',
      // "Produto" antes do plano: a coluna dizia "Plus" para toda assinatura,
      // e a planilha do suporte contava Quest+ como assinante da plataforma.
      'Cargo pago - produto', 'Cargo pago - plano', 'Cargo pago - situacao',
      'Cargo pago - termina em', 'Cargo pago - dias restantes',
      'Manual Clinico - plano', 'Manual Clinico - situacao', 'Manual Clinico - termina em', 'Manual Clinico - dias restantes',
      'Total gasto (R$)', 'Compras', 'Cadastro', 'Ultimo acesso',
    ]

    const situation = (info: AdminSubscriptionInfo | null) =>
      !info ? '' : info.lifetime ? 'Vitalicio' : info.expired ? 'Expirado' : 'Ativo'
    const endDate = (info: AdminSubscriptionInfo | null) =>
      !info || info.lifetime ? '' : formatSubscriptionEndDate(info)
    const daysLeft = (info: AdminSubscriptionInfo | null) =>
      !info || info.daysRemaining === null ? '' : String(info.daysRemaining)

    const rows = filteredUsers.map((user) => [
      user.name || '',
      user.email || '',
      user.phone || '',
      describeAccountRole(user),
      formatPeriodoLabel(computeCurrentPeriodo(user.periodoBase, user.periodoBaseRef)),
      user.profession ? PROFESSION_LABELS[user.profession] || user.profession : '',
      user.state || '',
      user.paidSubscription?.productLabel || '',
      user.paidSubscription?.planLabel || '',
      situation(user.paidSubscription),
      endDate(user.paidSubscription),
      daysLeft(user.paidSubscription),
      user.manualSubscription?.planLabel || '',
      situation(user.manualSubscription),
      endDate(user.manualSubscription),
      daysLeft(user.manualSubscription),
      (user.spend?.total || 0).toFixed(2).replace('.', ','),
      String(user.spend?.count || 0),
      user.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : '',
      user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString('pt-BR') : '',
    ])

    const escape = (value: string) => `"${String(value).replace(/"/g, '""')}"`
    const csv = [header, ...rows].map(row => row.map(escape).join(';')).join('\r\n')
    // BOM: sem ele o Excel em pt-BR abre os acentos quebrados.
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `usuarios-gradex-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
    showToastMessage(`${filteredUsers.length} usuário(s) exportado(s).`, 'success')
  }

  async function loadUsers() {
    try {
      // `/api/admin/users/overview` devolve o mesmo documento do usuário que
      // `/api/users`, já com as assinaturas (Plus+ e Manual Clínico) e o gasto
      // acumulado resolvidos no servidor.
      const res = await fetch('/api/admin/users/overview', { cache: 'no-store' })
      if (!res.ok) throw new Error('Falha ao carregar usuários')
      const data = await res.json()
      setUsers(Array.isArray(data.users) ? data.users : [])
      setLoadError(null)
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
      // Erro de carga fica fixo na tela, e não num toast: a lista continua
      // vazia (ou velha) até alguém tentar de novo, e isso precisa ser visível.
      setLoadError('Não foi possível carregar a lista de usuários.')
    } finally {
      setLoading(false)
    }
  }

  async function loadOnlineCount() {
    try {
      const res = await fetch('/api/admin/users/online/count')
      if (!res.ok) {
        setOnlineCount(null)
        return
      }
      const data = await res.json()
      setOnlineCount(typeof data.count === 'number' ? data.count : 0)
    } catch {
      setOnlineCount(null)
    }
  }

  async function openOnlineUsersDialog() {
    setShowOnlineDialog(true)
    setOnlineLoading(true)
    try {
      const res = await fetch('/api/admin/users/online/list')
      if (!res.ok) {
        throw new Error('Erro ao buscar usuários online')
      }
      const data = await res.json()
      setOnlineUsers(Array.isArray(data.users) ? data.users : [])
    } catch (e: any) {
      setOnlineUsers([])
      showToastMessage(e?.message || 'Erro ao buscar usuários online')
    } finally {
      setOnlineLoading(false)
    }
  }

  async function handleBan() {
    if (!selectedUser) return

    try {
      const res = await fetch(`/api/users/${selectedUser._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ban',
          banReason,
          banDetails
        })
      })

      if (!res.ok) throw new Error('Erro ao banir usuário')

      const data = await res.json()
      showToastMessage(data.message, 'success')
      setShowBanDialog(false)
      setBanDetails('')
      loadUsers()
    } catch (error: any) {
      showToastMessage(error.message)
    }
  }

  async function handleUnban(userId: string) {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unban' })
      })

      if (!res.ok) throw new Error('Erro ao desbanir usuário')

      const data = await res.json()
      showToastMessage(data.message, 'success')
      loadUsers()
    } catch (error: any) {
      showToastMessage(error.message)
    }
  }

  async function handleDelete() {
    if (!selectedUser) return

    try {
      const res = await fetch(`/api/users/${selectedUser._id}`, {
        method: 'DELETE'
      })

      if (!res.ok) throw new Error('Erro ao deletar usuário')

      const data = await res.json()
      showToastMessage(data.message, 'success')
      setShowDeleteDialog(false)
      loadUsers()
    } catch (error: any) {
      showToastMessage(error.message)
    }
  }

  async function handleUpdateTier() {
    if (!selectedUser) return

    try {
      const res = await fetch(`/api/users/${selectedUser._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_tier',
          accountType: selectedAccountType,
          trialPlanType: selectedAccountType === 'trial' ? selectedTrialSubtype : undefined,
          premiumPlanType: cargoSelecionadoEhPago ? selectedPremiumSubtype : undefined,
        })
      })

      if (!res.ok) throw new Error('Erro ao atualizar tier do usuário')

      const data = await res.json()
      showToastMessage(data.message, 'success')
      setShowTierDialog(false)
      loadUsers()
    } catch (error: any) {
      showToastMessage(error.message)
    }
  }

  async function handleUpdateQuota() {
    if (!selectedUser) return

    try {
      const res = await fetch(`/api/users/${selectedUser._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_quota',
          dailyPersonalExamsCreated: examsQuota
        })
      })

      if (!res.ok) throw new Error('Erro ao atualizar quota do usuário')

      const data = await res.json()
      showToastMessage(data.message, 'success')
      setShowQuotaDialog(false)
      loadUsers()
    } catch (error: any) {
      showToastMessage(error.message)
    }
  }

  async function handleToggleMonitor() {
    if (!selectedUser) return

    try {
      const isMonitor = selectedUser.secondaryRole === 'monitor'
      const res = await fetch(`/api/users/${selectedUser._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_monitor',
          secondaryRole: isMonitor ? undefined : 'monitor'
        })
      })

      if (!res.ok) throw new Error('Erro ao atualizar cargo do usuário')

      const data = await res.json()
      showToastMessage(data.message, 'success')
      setShowMonitorDialog(false)
      loadUsers()
    } catch (error: any) {
      showToastMessage(error.message)
    }
  }

  async function handleToggleAdmin() {
    if (!selectedUser) return

    try {
      const isAdmin = selectedUser.role === 'admin'
      const res = await fetch(`/api/users/${selectedUser._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_admin',
          role: isAdmin ? 'user' : 'admin'
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Erro ao atualizar cargo de administrador')

      showToastMessage(data.message, 'success')
      setShowAdminDialog(false)
      loadUsers()
    } catch (error: any) {
      showToastMessage(error.message)
    }
  }

  async function handleUpdatePeriodo() {
    if (!selectedUser) return

    try {
      const res = await fetch(`/api/users/${selectedUser._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_periodo',
          // string vazia => remove o período; número => define (ancora no semestre atual)
          periodo: selectedPeriodo === '' ? null : Number(selectedPeriodo),
        })
      })

      if (!res.ok) throw new Error('Erro ao atualizar período do usuário')

      const data = await res.json()
      showToastMessage(data.message, 'success')
      setShowPeriodoDialog(false)
      loadUsers()
    } catch (error: any) {
      showToastMessage(error.message)
    }
  }

  /**
   * Concede o Manual Clínico pela mesma rota que o painel do produto usa —
   * ela grava a compra, calcula o vencimento do plano e dispara o e-mail de
   * confirmação para o usuário.
   */
  async function handleGrantManual() {
    if (!selectedUser) return
    setManualSaving(true)
    try {
      const res = await fetch('/api/admin/manual-clinico/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser._id?.toString(), planKey: manualPlanKey }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Erro ao conceder acesso ao Manual Clínico')

      showToastMessage('Acesso ao Manual Clínico concedido.', 'success')
      setShowManualDialog(false)
      loadUsers()
    } catch (error: any) {
      showToastMessage(error?.message || 'Erro ao conceder acesso ao Manual Clínico')
    } finally {
      setManualSaving(false)
    }
  }

  async function handleRevokeManual() {
    if (!selectedUser) return
    setManualSaving(true)
    try {
      const res = await fetch('/api/admin/manual-clinico/access', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser._id?.toString() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Erro ao revogar acesso ao Manual Clínico')

      showToastMessage(`${data.revokedCount || 0} acesso(s) revogado(s).`, 'success')
      setShowManualDialog(false)
      loadUsers()
    } catch (error: any) {
      showToastMessage(error?.message || 'Erro ao revogar acesso ao Manual Clínico')
    } finally {
      setManualSaving(false)
    }
  }

  async function openPurchasesDialog(user: AdminUserRow) {
    setSelectedUser(user)
    setShowPurchasesDialog(true)
    setPurchasesData(null)
    setPurchasesLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${user._id}/purchases`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || 'Erro ao buscar compras')
      }
      const data = await res.json()
      setPurchasesData(data)
    } catch (error: any) {
      showToastMessage(error?.message || 'Erro ao buscar compras')
      setShowPurchasesDialog(false)
    } finally {
      setPurchasesLoading(false)
    }
  }

  async function handleGeneratePurchasesPdf() {
    if (!purchasesData) return
    setGeneratingPurchasesPdf(true)
    try {
      const { generatePurchaseReceiptPDF, downloadPDF } = await import('@/lib/pdf-generator')
      const blob = await generatePurchaseReceiptPDF(
        purchasesData.purchases.map(p => ({
          _id: p._id,
          itemTitle: p.itemTitle,
          itemType: p.itemType,
          price: Number(p.price || 0),
          purchasedAt: p.purchasedAt,
          status: 'completed',
        })),
        {
          id: purchasesData.user.id,
          name: purchasesData.user.name,
          email: purchasesData.user.email,
        }
      )
      const slug = (purchasesData.user.name || purchasesData.user.email || 'usuario')
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, '-').replace(/(^-|-$)/g, '').toLowerCase() || 'usuario'
      const filename = `Compras-${slug}-${new Date().toISOString().slice(0, 10)}.pdf`
      downloadPDF(blob, filename, {
        type: 'exam_pdf',
        resourceId: purchasesData.user.id,
        resourceTitle: `Compras de ${purchasesData.user.name}`,
      })
    } catch (error: any) {
      showToastMessage('Erro ao gerar PDF: ' + (error?.message || 'desconhecido'))
    } finally {
      setGeneratingPurchasesPdf(false)
    }
  }

  async function openSessionsDialog(user: AdminUserRow) {
    setSelectedUser(user)
    setShowSessionsDialog(true)
    setSessionsData(null)
    setSessionsLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${user._id}/sessions`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || 'Erro ao buscar dispositivos')
      }
      const data = await res.json()
      setSessionsData(data)
    } catch (error: any) {
      showToastMessage(error?.message || 'Erro ao buscar dispositivos')
      setShowSessionsDialog(false)
    } finally {
      setSessionsLoading(false)
    }
  }

  async function refreshSessions() {
    if (!selectedUser) return
    try {
      const res = await fetch(`/api/admin/users/${selectedUser._id}/sessions`)
      if (res.ok) setSessionsData(await res.json())
    } catch {
      // silencioso
    }
  }

  async function handleRevokeSession(sessionId: string) {
    if (!selectedUser) return
    setRevokingSessionId(sessionId)
    try {
      const res = await fetch(
        `/api/admin/users/${selectedUser._id}/sessions?sessionId=${sessionId}`,
        { method: 'DELETE' }
      )
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || 'Erro ao revogar dispositivo')
      }
      showToastMessage('Dispositivo desconectado.', 'success')
      await refreshSessions()
    } catch (error: any) {
      showToastMessage(error?.message || 'Erro ao revogar dispositivo')
    } finally {
      setRevokingSessionId(null)
    }
  }

  async function handleRevokeAllSessions() {
    if (!selectedUser) return
    setRevokingSessionId('__all__')
    try {
      const res = await fetch(
        `/api/admin/users/${selectedUser._id}/sessions?all=true`,
        { method: 'DELETE' }
      )
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || 'Erro ao desconectar dispositivos')
      }
      const data = await res.json()
      showToastMessage(`${data.revoked || 0} dispositivo(s) desconectado(s).`, 'success')
      await refreshSessions()
    } catch (error: any) {
      showToastMessage(error?.message || 'Erro ao desconectar dispositivos')
    } finally {
      setRevokingSessionId(null)
    }
  }

  /*
   * O selo sai do registro de cargos, não de um `switch` local.
   *
   * A versão anterior tinha um ramo por cargo — e o Quest passou meses fora
   * dela, aparecendo como "Gratuito" na lista para contas que tinham pago.
   * Com o componente compartilhado, um cargo criado em `/admin/cargos` já
   * aparece certo aqui, com o nome e a cor que o admin escolheu.
   */
  function getAccountTypeBadge(user: User) {
    return <SeloDeCargo accountType={user.accountType || 'gratuito'} tamanho="sm" />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Gerenciar Usuários</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {loadError && (
          <Card className="mb-6 border-red-300 dark:border-red-900">
            <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-center gap-2 text-sm text-red-700 dark:text-red-300">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {loadError}
              </p>
              <Button variant="outline" size="sm" onClick={loadUsers}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Tentar novamente
              </Button>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="text-center py-12">Carregando...</div>
        ) : users.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Nenhum usuário encontrado</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              <StatCard
                icon={<Users className="h-4 w-4" />}
                label="Total"
                value={insights.total}
                hint={`${insights.admins} admin(s) · ${insights.monitors} monitor(es)`}
                onClick={() => applyQuickFilter({})}
              />
              <StatCard
                icon={<Activity className="h-4 w-4 text-emerald-500" />}
                label="Online agora"
                value={onlineCount === null ? insights.onlineNow : onlineCount}
                hint="Ativos nos últimos 10 min"
                onClick={openOnlineUsersDialog}
              />
              <StatCard
                icon={<UserCheck className="h-4 w-4 text-blue-500" />}
                label="Ativos 7 dias"
                value={insights.activeLast7Days}
                hint={`${insights.newLast7Days} novo(s) na semana`}
                onClick={() => applyQuickFilter({ activity: 'active7d' })}
              />
              <StatCard
                icon={<Clock className="h-4 w-4 text-amber-500" />}
                label="Nunca acessaram"
                value={insights.neverLoggedIn}
                hint="Sem atividade registrada"
                onClick={() => applyQuickFilter({ activity: 'never' })}
              />
              <StatCard
                icon={<Ban className="h-4 w-4 text-red-500" />}
                label="Banidos"
                value={insights.banned}
                hint="Acesso bloqueado"
                onClick={() => applyQuickFilter({ plan: 'banned' })}
              />
            </section>

            {/* ── Assinaturas ─────────────────────────────────────────────── */}
            {/* Sete cards: o Quest+ é um produto à parte, e somá-lo ao Plus+
                fazia o painel anunciar assinantes da plataforma inteira que só
                tinham comprado o Banco de Questões. */}
            <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <StatCard
                icon={<Crown className="h-4 w-4 text-amber-500" />}
                label={`${PLUS_LABEL} ativos`}
                value={insights.plus.active}
                hint={`${insights.plus.lifetime} vitalício(s) · ${insights.plus.expiringSoon} vencem em ${EXPIRING_SOON_DAYS}d`}
                onClick={() => applyQuickFilter({ subscription: 'plus_active', sort: 'expiresAt' })}
                tone="success"
              />
              <StatCard
                icon={<Target className="h-4 w-4 text-emerald-500" />}
                label={`${QUEST_LABEL} ativos`}
                value={insights.quest.active}
                hint={`${insights.quest.lifetime} vitalício(s) · ${insights.quest.expiringSoon} vencem em ${EXPIRING_SOON_DAYS}d`}
                onClick={() => applyQuickFilter({ subscription: 'quest_active', sort: 'expiresAt' })}
                tone="success"
              />
              <StatCard
                icon={<BookOpen className="h-4 w-4 text-sky-500" />}
                label="Manual Clínico"
                value={insights.manual.active}
                hint={`${insights.manual.lifetime} vitalício(s) · ${insights.manual.expiringSoon} vencem em ${EXPIRING_SOON_DAYS}d`}
                onClick={() => applyQuickFilter({ subscription: 'manual_active', sort: 'expiresAt' })}
                tone="success"
              />
              <StatCard
                icon={<Sparkles className="h-4 w-4 text-violet-500" />}
                label="Assinantes únicos"
                value={insights.payingUsers}
                hint={`${insights.bothProducts} com os dois produtos`}
                onClick={() => applyQuickFilter({ subscription: 'any', sort: 'expiresAt' })}
              />
              <StatCard
                icon={<CalendarClock className="h-4 w-4 text-amber-500" />}
                label="Vencem em 30 dias"
                value={insights.plus.expiringMonth + insights.quest.expiringMonth + insights.manual.expiringMonth}
                hint="Janela de renovação"
                onClick={() => applyQuickFilter({ expiry: 'expiring30', sort: 'expiresAt' })}
                tone="warning"
              />
              <StatCard
                icon={<AlertCircle className="h-4 w-4 text-red-500" />}
                label="Expirados"
                value={insights.plus.expired + insights.quest.expired + insights.manual.expired}
                hint="Ainda com o acesso — fila do rebaixamento"
                onClick={() => applyQuickFilter({ expiry: 'expired', sort: 'expiresAt' })}
                tone="danger"
              />
              <StatCard
                icon={<Target className="h-4 w-4 text-emerald-500" />}
                label="Conversão"
                value={formatPercent(insights.conversionRate)}
                hint="Assinantes ativos ÷ contas de usuário"
              />
            </section>

            <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Crown className="h-5 w-5 text-amber-500" />
                    Planos {PLUS_LABEL}
                  </CardTitle>
                  <CardDescription>
                    {insights.plus.active} assinante(s) ativo(s) por ciclo contratado.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CycleBreakdown
                    insights={insights.plus}
                    accent="bg-gradient-to-r from-yellow-500 to-orange-500"
                    onSelectCycle={(cycle) =>
                      applyQuickFilter({ subscription: 'plus_active', cycle, sort: 'expiresAt' })
                    }
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Target className="h-5 w-5 text-emerald-500" />
                    Planos {QUEST_LABEL}
                  </CardTitle>
                  <CardDescription>
                    {insights.quest.active} assinante(s) ativo(s) por ciclo contratado.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CycleBreakdown
                    insights={insights.quest}
                    accent="bg-emerald-500"
                    onSelectCycle={(cycle) =>
                      applyQuickFilter({ subscription: 'quest_active', cycle, sort: 'expiresAt' })
                    }
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BookOpen className="h-5 w-5 text-sky-500" />
                    Planos Manual Clínico
                  </CardTitle>
                  <CardDescription>
                    {insights.manual.active} assinante(s) ativo(s) por ciclo contratado.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CycleBreakdown
                    insights={insights.manual}
                    accent="bg-sky-500"
                    onSelectCycle={(cycle) =>
                      applyQuickFilter({ subscription: 'manual_active', cycle, sort: 'expiresAt' })
                    }
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Wallet className="h-5 w-5 text-emerald-500" />
                    Receita
                  </CardTitle>
                  <CardDescription>
                    Compras concluídas somadas por conta.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total arrecadado</span>
                    <span className="font-semibold">{formatMoney(insights.revenueTotal)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Compradores</span>
                    <span className="font-semibold">{insights.buyers}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Ticket médio</span>
                    <span className="font-semibold">{formatMoney(insights.averageTicket)}</span>
                  </div>
                  <div className="flex items-center justify-between border-t pt-3">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <TrendingUp className="h-4 w-4" />
                      MRR estimado
                    </span>
                    <span className="font-semibold">{formatMoney(insights.estimatedMrr)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    O MRR divide o valor de cada assinatura ativa pela duração do ciclo.
                    Vitalícios e planos sem preço registrado ficam de fora.
                  </p>
                </CardContent>
              </Card>
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Receipt className="h-5 w-5" />
                    Maiores clientes
                  </CardTitle>
                  <CardDescription>Contas que mais gastaram na plataforma.</CardDescription>
                </CardHeader>
                <CardContent>
                  {insights.topSpenders.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhuma compra registrada ainda.</p>
                  ) : (
                    <div className="space-y-2">
                      {insights.topSpenders.map((spender, index) => (
                        <button
                          key={spender.id}
                          type="button"
                          onClick={() => {
                            resetFilters()
                            setSearchTerm(spender.email)
                          }}
                          className="flex w-full items-center justify-between gap-3 rounded-lg border bg-muted/20 p-2.5 text-left transition-colors hover:bg-muted/50"
                        >
                          <div className="flex min-w-0 items-center gap-2">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                              {index + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{spender.name}</p>
                              <p className="truncate text-xs text-muted-foreground">{spender.email}</p>
                            </div>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-sm font-semibold">{formatMoney(spender.total)}</p>
                            <p className="text-xs text-muted-foreground">{spender.count} compra(s)</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Zap className="h-5 w-5" />
                    Atalhos de gestão
                  </CardTitle>
                  <CardDescription>Recortes que costumam virar ação.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-2 sm:grid-cols-2">
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => applyQuickFilter({ expiry: 'expiring7', sort: 'expiresAt' })}
                  >
                    <CalendarClock className="mr-2 h-4 w-4 text-amber-500" />
                    Vencem em 7 dias (
                    {insights.plus.expiringSoon + insights.quest.expiringSoon + insights.manual.expiringSoon})
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => applyQuickFilter({ expiry: 'expired', sort: 'expiresAt' })}
                  >
                    <AlertCircle className="mr-2 h-4 w-4 text-red-500" />
                    Expirados (
                    {insights.plus.expired + insights.quest.expired + insights.manual.expired})
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => applyQuickFilter({ subscription: 'both', sort: 'spend' })}
                  >
                    <Sparkles className="mr-2 h-4 w-4 text-violet-500" />
                    {PLUS_LABEL} + Manual ({insights.bothProducts})
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => applyQuickFilter({ subscription: 'paid_recurring', sort: 'expiresAt' })}
                  >
                    <Repeat className="mr-2 h-4 w-4 text-blue-500" />
                    Assinaturas recorrentes
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => applyQuickFilter({ subscription: 'plus_lifetime' })}
                  >
                    <InfinityIcon className="mr-2 h-4 w-4 text-violet-500" />
                    Vitalícios {PLUS_LABEL} ({insights.plus.lifetime})
                  </Button>
                  <Button variant="outline" className="justify-start" onClick={handleExportCsv}>
                    <FileDown className="mr-2 h-4 w-4" />
                    Exportar filtro (CSV)
                  </Button>
                </CardContent>
              </Card>
            </section>

            <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Activity className="h-5 w-5" />
                    Usuários mais recentes
                  </CardTitle>
                  <CardDescription>
                    Últimos acessos registrados na plataforma.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {recentUsers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Ainda não há acessos registrados.</p>
                  ) : (
                    <div className="grid gap-3 md:grid-cols-2">
                      {recentUsers.map((user) => (
                        <button
                          key={`recent-${user._id?.toString()}`}
                          type="button"
                          onClick={() => {
                            setSearchTerm(user.email)
                            setSortMode('lastLogin')
                            setActivityFilter('all')
                            setPlanFilter('all')
                          }}
                          className="min-w-0 rounded-lg border bg-muted/20 p-3 text-left transition-colors hover:bg-muted/50"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{user.name}</p>
                              <p className="mt-1 truncate text-xs text-muted-foreground">{user.email}</p>
                            </div>
                            {isRecentlyOnline(user) && (
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                Online
                              </span>
                            )}
                          </div>
                          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            {formatRelativeActivity(user.lastLoginAt)}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <RefreshCw className="h-5 w-5" />
                    Monitoramento
                  </CardTitle>
                  <CardDescription>
                    A contagem online atualiza automaticamente.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button type="button" variant="outline" className="w-full justify-start" onClick={openOnlineUsersDialog}>
                    <Activity className="mr-2 h-4 w-4" />
                    Ver usuários online
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      loadUsers()
                      loadOnlineCount()
                    }}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Atualizar lista
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    O campo de atividade vem do último login ou da checagem autenticada mais recente.
                  </p>
                </CardContent>
              </Card>
            </section>

            <AdminSecurityPanel onNotify={showToastMessage} />

            <Card id="lista-usuarios">
              <CardHeader className="space-y-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <CardTitle>Todos os usuários</CardTitle>
                    <CardDescription>
                      {filteredUsers.length} de {users.length} usuário(s) exibidos
                      {filteredUsers.length > 0 && (
                        <> · {formatMoney(filteredUsers.reduce((sum, u) => sum + (u.spend?.total || 0), 0))} no recorte</>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={handleExportCsv}>
                      <FileDown className="mr-2 h-4 w-4" />
                      Exportar CSV
                    </Button>
                    {hasActiveFilters && (
                      <Button variant="ghost" size="sm" onClick={resetFilters}>
                        Limpar filtros
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
                  <div className="relative sm:col-span-2 xl:col-span-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Nome, email, telefone ou CPF"
                      className="pl-9"
                    />
                  </div>

                  <Select value={subscriptionFilter} onValueChange={(value) => setSubscriptionFilter(value as SubscriptionFilter)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Assinatura" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as assinaturas</SelectItem>
                      <SelectItem value="any">Qualquer assinatura ativa</SelectItem>
                      <SelectItem value="none">Sem assinatura ativa</SelectItem>
                      <SelectItem value="plus_active">{PLUS_LABEL} — ativos</SelectItem>
                      <SelectItem value="plus_lifetime">{PLUS_LABEL} — vitalícios</SelectItem>
                      <SelectItem value="plus_recurring">{PLUS_LABEL} — recorrentes</SelectItem>
                      <SelectItem value="plus_expired">{PLUS_LABEL} — expirados</SelectItem>
                      <SelectItem value="plus">{PLUS_LABEL} — histórico completo</SelectItem>
                      <SelectItem value="quest_active">{QUEST_LABEL} — ativos</SelectItem>
                      <SelectItem value="quest_expired">{QUEST_LABEL} — expirados</SelectItem>
                      <SelectItem value="quest">{QUEST_LABEL} — histórico completo</SelectItem>
                      <SelectItem value="manual_active">Manual Clínico — ativos</SelectItem>
                      <SelectItem value="manual_lifetime">Manual Clínico — vitalícios</SelectItem>
                      <SelectItem value="manual_expired">Manual Clínico — expirados</SelectItem>
                      <SelectItem value="manual">Manual Clínico — histórico completo</SelectItem>
                      <SelectItem value="both">{PLUS_LABEL} + Manual Clínico</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={cycleFilter} onValueChange={setCycleFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Ciclo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os ciclos</SelectItem>
                      {CYCLE_FILTER_OPTIONS.map((cycle) => (
                        <SelectItem key={cycle} value={cycle}>{resolvePlanLabel(cycle)}</SelectItem>
                      ))}
                      <SelectItem value="outro">Outros/personalizados</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={expiryFilter} onValueChange={(value) => setExpiryFilter(value as ExpiryFilter)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Vencimento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Qualquer vencimento</SelectItem>
                      <SelectItem value="expiring7">Vencem em 7 dias</SelectItem>
                      <SelectItem value="expiring15">Vencem em 15 dias</SelectItem>
                      <SelectItem value="expiring30">Vencem em 30 dias</SelectItem>
                      <SelectItem value="expired">Já expirados</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={planFilter} onValueChange={(value) => setPlanFilter(value as UserPlanFilter)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Cargo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os cargos</SelectItem>
                      <SelectItem value="admin">Admins</SelectItem>
                      <SelectItem value="monitor">Monitores</SelectItem>
                      <SelectItem value="gratuito">Gratuito</SelectItem>
                      <SelectItem value="trial">Trial</SelectItem>
                      <SelectItem value="quest">{QUEST_LABEL}</SelectItem>
                      <SelectItem value="plus">{PLUS_LABEL}</SelectItem>
                      <SelectItem value="banned">Banidos</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={activityFilter} onValueChange={(value) => setActivityFilter(value as UserActivityFilter)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Atividade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toda atividade</SelectItem>
                      <SelectItem value="online">Online agora</SelectItem>
                      <SelectItem value="active7d">Ativos 7 dias</SelectItem>
                      <SelectItem value="never">Nunca acessaram</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={sortMode} onValueChange={(value) => setSortMode(value as UserSortMode)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Ordenar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lastLogin">Atividade recente</SelectItem>
                      <SelectItem value="createdAt">Cadastro recente</SelectItem>
                      <SelectItem value="expiresAt">Vence primeiro</SelectItem>
                      <SelectItem value="spend">Maior gasto</SelectItem>
                      <SelectItem value="name">Nome</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
            </Card>

            {filteredUsers.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">Nenhum usuário encontrado com os filtros atuais.</p>
                </CardContent>
              </Card>
            ) : visibleUsers.map((user) => (
              <Card key={user._id?.toString()}>
                <CardHeader>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle>{user.name}</CardTitle>
                        {isRecentlyOnline(user) && (
                          <span className="text-xs bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2 py-1 rounded flex items-center gap-1">
                            <Activity className="h-3 w-3" />
                            Online
                          </span>
                        )}
                        {user.role === 'admin' && (
                          <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                            <Shield className="h-3 w-3 inline mr-1" />
                            Admin
                          </span>
                        )}
                        {user.role !== 'admin' && getAccountTypeBadge(user)}
                        {/* Ciclo contratado direto no título: é a primeira coisa
                            que o suporte precisa saber ao abrir a conta. O
                            produto sai da própria assinatura — escrito fixo,
                            uma conta Quest+ aparecia aqui como "Plus+". */}
                        {user.paidSubscription?.active && (
                          <span
                            className={
                              user.paidSubscription.product === 'quest'
                                ? 'rounded bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'rounded bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            }
                          >
                            {user.paidSubscription.productLabel} {user.paidSubscription.planLabel}
                          </span>
                        )}
                        {user.manualSubscription?.active && (
                          <span className="flex items-center gap-1 rounded bg-sky-100 px-2 py-1 text-xs font-medium text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                            <BookOpen className="h-3 w-3" />
                            Manual {user.manualSubscription.planLabel}
                          </span>
                        )}
                        {user.secondaryRole === 'monitor' && (
                          <span className="rounded bg-yellow-100 px-2 py-1 text-xs text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300">
                            <Zap className="h-3 w-3 inline mr-1" />
                            Monitor
                          </span>
                        )}
                        {user.banned && (
                          <span className="text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-2 py-1 rounded">
                            <Ban className="h-3 w-3 inline mr-1" />
                            Banido
                          </span>
                        )}
                      </div>
                      <CardDescription className="flex min-w-0 items-center gap-1.5 break-words">
                        <Mail className="h-3.5 w-3.5 shrink-0" />
                        {user.email}
                      </CardDescription>
                    </div>
                    <div className="text-left text-xs text-muted-foreground sm:text-right">
                      <div className="font-medium text-foreground">{formatRelativeActivity(user.lastLoginAt)}</div>
                      <div>Última atividade</div>
                      {(user.spend?.total || 0) > 0 && (
                        <div className="mt-1 font-medium text-emerald-600 dark:text-emerald-400">
                          {formatMoney(user.spend.total)} em {user.spend.count} compra(s)
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {user.banned && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
                      <p className="text-sm font-medium text-red-800 dark:text-red-200">
                        Motivo: {BanReasonLabels[user.banReason!]}
                      </p>
                      {user.banDetails && (
                        <p className="text-xs text-red-700 dark:text-red-300 mt-1">{user.banDetails}</p>
                      )}
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                        Banido em: {new Date(user.bannedAt!).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  )}

                  {(user.paidSubscription || user.manualSubscription) && (
                    <div className="mb-4 grid gap-3 sm:grid-cols-2">
                      {user.paidSubscription && <SubscriptionTile info={user.paidSubscription} />}
                      {user.manualSubscription && <SubscriptionTile info={user.manualSubscription} />}
                    </div>
                  )}

                  <div className="mb-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        Última atividade
                      </div>
                      <div className="mt-1 text-foreground">{formatDateTime(user.lastLoginAt)}</div>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <CalendarDays className="h-3.5 w-3.5" />
                        Cadastro
                      </div>
                      <div className="mt-1 text-foreground">{formatDateTime(user.createdAt)}</div>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <Settings className="h-3.5 w-3.5" />
                        Cargo
                      </div>
                      <div className="mt-1 text-foreground">{describeAccountRole(user)}</div>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <GraduationCap className="h-3.5 w-3.5" />
                        Período
                      </div>
                      <div className="mt-1 text-foreground">
                        {formatPeriodoLabel(computeCurrentPeriodo(user.periodoBase, user.periodoBaseRef))}
                      </div>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <Stethoscope className="h-3.5 w-3.5" />
                        Profissão
                      </div>
                      <div className="mt-1 text-foreground">
                        {user.profession ? PROFESSION_LABELS[user.profession] : '—'}
                      </div>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        Estado
                      </div>
                      <div className="mt-1 text-foreground">
                        {user.state || '—'}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedUser(user)
                        setShowInfoDialog(true)
                      }}
                      title="Ver informações pessoais"
                    >
                      <Info className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openPurchasesDialog(user)}
                      title="Histórico de compras"
                    >
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      Compras
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openSessionsDialog(user)}
                      title="Dispositivos e sessões ativas"
                    >
                      <MonitorSmartphone className="h-4 w-4 mr-2" />
                      Dispositivos
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedUser(user)
                        setShowAdminDialog(true)
                      }}
                      className={user.role === 'admin' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : ''}
                      title={user.role === 'admin' ? 'Remover acesso de administrador' : 'Promover a administrador'}
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      {user.role === 'admin' ? 'Remover Admin' : 'Tornar Admin'}
                    </Button>

                    {user.role !== 'admin' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user)
                            setShowMonitorDialog(true)
                          }}
                          className={user.secondaryRole === 'monitor' ? 'border-yellow-500 text-yellow-600 dark:text-yellow-400' : ''}
                        >
                          <Zap className="h-4 w-4 mr-2" />
                          {user.secondaryRole === 'monitor' ? 'Remover Monitor' : 'Tornar Monitor'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user)
                            setSelectedAccountType(user.accountType || 'gratuito')
                            setSelectedTrialSubtype(user.trialPlanType || '7dias')
                            setSelectedPremiumSubtype(user.premiumPlanType || 'mensal')
                            setShowTierDialog(true)
                          }}
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Gerenciar Plano
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user)
                            setManualPlanKey(
                              (user.manualSubscription?.planKey as 'semestral' | 'anual' | 'vitalicio') || 'anual',
                            )
                            setShowManualDialog(true)
                          }}
                          className={user.manualSubscription?.active ? 'border-sky-500 text-sky-600 dark:text-sky-400' : ''}
                        >
                          <BookOpen className="h-4 w-4 mr-2" />
                          Manual Clínico
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user)
                            setSelectedPeriodo(user.periodoBase ? String(user.periodoBase) : '')
                            setShowPeriodoDialog(true)
                          }}
                        >
                          <GraduationCap className="h-4 w-4 mr-2" />
                          Período
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user)
                            // Se admin setou um valor, usar esse
                            // Caso contrário, calcular baseado em criadas
                            const remaining = user.dailyPersonalExamsRemaining !== undefined
                              ? user.dailyPersonalExamsRemaining
                              : (() => {
                                const accountType = user.accountType || 'gratuito'
                                const tierLimits = {
                                  gratuito: 3,
                                  trial: 5,
                                  premium: 10
                                }
                                const limit = tierLimits[accountType as keyof typeof tierLimits] || 3
                                const examsCreated = user.dailyPersonalExamsCreated || 0
                                return Math.max(0, limit - examsCreated)
                              })()
                            setExamsQuota(remaining)
                            setShowQuotaDialog(true)
                          }}
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Gerenciar Quotas
                        </Button>
                      </>
                    )}

                    {user.banned ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnban(user._id!.toString())}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Desbanir
                      </Button>
                    ) : (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user)
                          setShowBanDialog(true)
                        }}
                        disabled={user.role === 'admin'}
                      >
                        <Ban className="h-4 w-4 mr-2" />
                        Banir
                      </Button>
                    )}

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setSelectedUser(user)
                        setShowDeleteDialog(true)
                      }}
                      disabled={user.role === 'admin'}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Deletar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* A base inteira vem de uma vez, mas renderizar milhares de cards
                de uma vez trava a tela — o resto entra sob demanda. */}
            {filteredUsers.length > visibleUsers.length && (
              <Card>
                <CardContent className="flex flex-col items-center gap-3 py-6">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {visibleUsers.length} de {filteredUsers.length} usuário(s) do filtro.
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setVisibleCount((count) => count + 30)}>
                      Carregar mais 30
                    </Button>
                    <Button variant="ghost" onClick={() => setVisibleCount(filteredUsers.length)}>
                      Mostrar todos
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>

      {/* Dialog de Banimento */}
      <Dialog open={showBanDialog} onOpenChange={setShowBanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Banir Usuário</DialogTitle>
            <DialogDescription>
              Você está prestes a banir <strong>{selectedUser?.name}</strong>.
              O usuário não poderá mais acessar a plataforma.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Motivo do Banimento</Label>
              <select
                value={banReason}
                onChange={(e) => setBanReason(e.target.value as BanReason)}
                className="w-full p-2 border rounded-md bg-background"
              >
                {Object.entries(BanReasonLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Detalhes (opcional)</Label>
              <Textarea
                value={banDetails}
                onChange={(e) => setBanDetails(e.target.value)}
                placeholder="Informações adicionais sobre o banimento..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBanDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleBan}>
              <Ban className="h-4 w-4 mr-2" />
              Banir Usuário
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Delete */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-300" />
            </div>
            <DialogTitle className="text-center">Deletar Usuário?</DialogTitle>
            <DialogDescription className="text-center">
              Você está prestes a deletar permanentemente <strong>{selectedUser?.name}</strong>.
              <br /><br />
              Todas as submissões deste usuário também serão deletadas.
              <br /><br />
              Esta ação <strong>NÃO pode ser desfeita</strong>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Sim, Deletar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Gerenciamento de Plano */}
      <Dialog open={showTierDialog} onOpenChange={setShowTierDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerenciar Plano do Usuário</DialogTitle>
            <DialogDescription>
              Alterar o plano de <strong>{selectedUser?.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tipo de Conta</Label>
              {/*
                A grade sai do registro de cargos: um cargo criado em
                `/admin/cargos` aparece aqui na hora, sem que ninguém precise
                voltar neste arquivo para adicionar mais um botão. Era isso que
                a lista escrita à mão custava — o Quest exigiu editar este bloco,
                e o próximo cargo exigiria de novo.
              */}
              <div className="grid grid-cols-2 gap-2">
                {cargosDisponiveis.map(cargo => {
                  const Icone = iconeDoCargo(cargo.icone)
                  const selecionado = normalizeAccountType(selectedAccountType) === cargo.id
                  return (
                    <Button
                      key={cargo.id}
                      variant={selecionado ? 'default' : 'outline'}
                      onClick={() => setSelectedAccountType(cargo.id)}
                      className="h-auto py-3 flex-col gap-1"
                      size="sm"
                    >
                      {Icone ? <Icone className="h-4 w-4" /> : null}
                      <div className="font-semibold">{cargo.nome}</div>
                      <div className="text-xs opacity-80 line-clamp-2">
                        {cargo.descricao || (cargo.pago ? 'Cargo pago' : 'Sem cobrança')}
                      </div>
                    </Button>
                  )
                })}
              </div>
            </div>

            {selectedAccountType === 'trial' && (
              <div className="space-y-2">
                <Label>Subtipo de Trial</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={selectedTrialSubtype === 'teste' ? 'default' : 'outline'}
                    onClick={() => setSelectedTrialSubtype('teste')}
                    className="h-auto py-3 flex-col gap-1"
                    size="sm"
                  >
                    <div className="font-semibold text-sm">Teste Dev</div>
                    <div className="text-xs opacity-80">2 minutos</div>
                  </Button>
                  <Button
                    variant={selectedTrialSubtype === '7dias' ? 'default' : 'outline'}
                    onClick={() => setSelectedTrialSubtype('7dias')}
                    className="h-auto py-3 flex-col gap-1"
                    size="sm"
                  >
                    <div className="font-semibold text-sm">7 Dias</div>
                    <div className="text-xs opacity-80">Uma semana</div>
                  </Button>
                </div>
              </div>
            )}

            {/* Todo cargo pago usa a mesma tabela de duração — é o mesmo campo
                de prazo no usuário, e é o que o cron varre para rebaixar. */}
            {cargoSelecionadoEhPago && (
              <div className="space-y-2">
                <Label>Subtipo de assinatura</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={selectedPremiumSubtype === 'teste' ? 'default' : 'outline'}
                    onClick={() => setSelectedPremiumSubtype('teste')}
                    className="h-auto py-3 flex-col gap-1"
                    size="sm"
                  >
                    <div className="font-semibold text-sm">Teste Dev</div>
                    <div className="text-xs opacity-80">2 minutos</div>
                  </Button>
                  <Button
                    variant={selectedPremiumSubtype === 'mensal' ? 'default' : 'outline'}
                    onClick={() => setSelectedPremiumSubtype('mensal')}
                    className="h-auto py-3 flex-col gap-1"
                    size="sm"
                  >
                    <div className="font-semibold text-sm">Mensal</div>
                    <div className="text-xs opacity-80">1 mês</div>
                  </Button>
                  <Button
                    variant={selectedPremiumSubtype === 'trimestral' ? 'default' : 'outline'}
                    onClick={() => setSelectedPremiumSubtype('trimestral')}
                    className="h-auto py-3 flex-col gap-1"
                    size="sm"
                  >
                    <div className="font-semibold text-sm">Trimestral</div>
                    <div className="text-xs opacity-80">3 meses</div>
                  </Button>
                  <Button
                    variant={selectedPremiumSubtype === 'semestral' ? 'default' : 'outline'}
                    onClick={() => setSelectedPremiumSubtype('semestral')}
                    className="h-auto py-3 flex-col gap-1"
                    size="sm"
                  >
                    <div className="font-semibold text-sm">Semestral</div>
                    <div className="text-xs opacity-80">6 meses</div>
                  </Button>
                  <Button
                    variant={selectedPremiumSubtype === 'anual' ? 'default' : 'outline'}
                    onClick={() => setSelectedPremiumSubtype('anual')}
                    className="h-auto py-3 flex-col gap-1"
                    size="sm"
                  >
                    <div className="font-semibold text-sm">Anual</div>
                    <div className="text-xs opacity-80">12 meses</div>
                  </Button>
                  <Button
                    variant={selectedPremiumSubtype === 'vitalicio' ? 'default' : 'outline'}
                    onClick={() => setSelectedPremiumSubtype('vitalicio')}
                    className="h-auto py-3 flex-col gap-1"
                    size="sm"
                  >
                    <div className="font-semibold text-sm">Vitalício</div>
                    <div className="text-xs opacity-80">Para sempre</div>
                  </Button>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTierDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateTier}>
              <Settings className="h-4 w-4 mr-2" />
              Atualizar Plano
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog do Manual Clínico */}
      <Dialog open={showManualDialog} onOpenChange={setShowManualDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manual Clínico</DialogTitle>
            <DialogDescription>
              Acesso ao Manual Clínico de <strong>{selectedUser?.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="rounded-lg border bg-muted/30 p-3 text-sm">
              <p className="text-xs font-semibold text-muted-foreground">Situação atual</p>
              {selectedUser?.manualSubscription ? (
                <div className="mt-2 space-y-1">
                  <p className="font-medium">
                    {selectedUser.manualSubscription.planLabel}
                    {selectedUser.manualSubscription.expired ? ' — expirado' : ''}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedUser.manualSubscription.lifetime
                      ? 'Sem data de término'
                      : `Termina em ${formatSubscriptionEndDate(selectedUser.manualSubscription)}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatSubscriptionRemaining(selectedUser.manualSubscription)}
                  </p>
                </div>
              ) : (
                <p className="mt-2 text-muted-foreground">Nunca contratou o Manual Clínico.</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Conceder plano</Label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { key: 'semestral', label: 'Semestral', hint: '6 meses' },
                  { key: 'anual', label: 'Anual', hint: '12 meses' },
                  { key: 'vitalicio', label: 'Vitalício', hint: 'Para sempre' },
                ] as const).map((plan) => (
                  <Button
                    key={plan.key}
                    variant={manualPlanKey === plan.key ? 'default' : 'outline'}
                    onClick={() => setManualPlanKey(plan.key)}
                    className="h-auto py-3 flex-col gap-1"
                    size="sm"
                  >
                    <div className="font-semibold text-sm">{plan.label}</div>
                    <div className="text-xs opacity-80">{plan.hint}</div>
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                A concessão registra a compra com preço zero e envia ao usuário o e-mail de
                confirmação do Manual Clínico. O prazo passa a contar a partir de agora.
              </p>
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setShowManualDialog(false)} disabled={manualSaving}>
              Cancelar
            </Button>
            {selectedUser?.manualSubscription?.active && (
              <Button variant="destructive" onClick={handleRevokeManual} disabled={manualSaving}>
                <Ban className="h-4 w-4 mr-2" />
                Revogar acesso
              </Button>
            )}
            <Button onClick={handleGrantManual} disabled={manualSaving}>
              <BookOpen className="h-4 w-4 mr-2" />
              {manualSaving ? 'Salvando...' : 'Conceder acesso'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Gerenciamento de Quotas */}
      <Dialog open={showQuotaDialog} onOpenChange={setShowQuotaDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerenciar Quotas de Provas Pessoais</DialogTitle>
            <DialogDescription>
              Ajustar quotas de provas pessoais para <strong>{selectedUser?.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="exams-quota">Provas Pessoais Restantes</Label>
              <Input
                id="exams-quota"
                type="number"
                min="0"
                max="999"
                value={examsQuota}
                onChange={(e) => setExamsQuota(parseInt(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">
                Número de provas que o usuário pode criar nas próximas 24 horas
              </p>
            </div>
            <div className="bg-muted rounded-lg p-3">
              <p className="text-sm font-medium">Status Atual:</p>
              <p className="text-sm text-muted-foreground mt-1">
                {(() => {
                  const accountType = selectedUser?.accountType || 'gratuito'
                  const tierLimits = {
                    gratuito: 3,
                    trial: 5,
                    premium: 10
                  }
                  const limit = tierLimits[accountType as keyof typeof tierLimits] || 3
                  const examsCreated = selectedUser?.dailyPersonalExamsCreated || 0
                  const remaining = selectedUser?.dailyPersonalExamsRemaining !== undefined
                    ? selectedUser.dailyPersonalExamsRemaining
                    : Math.max(0, limit - examsCreated)

                  return remaining === limit
                    ? '✓ Quota disponível'
                    : `⚠ ${examsCreated} provas criadas hoje (${remaining} restantes)`
                })()}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQuotaDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateQuota}>
              <Settings className="h-4 w-4 mr-2" />
              Atualizar Quotas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Informações Pessoais */}
      <Dialog open={showInfoDialog} onOpenChange={setShowInfoDialog}>
        <DialogContent className="max-w-2xl overflow-x-hidden">
          <DialogHeader>
            <DialogTitle>Informações Pessoais</DialogTitle>
            <DialogDescription className="break-words">
              Dados de <strong className="break-words">{selectedUser?.name}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4 overflow-x-hidden">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="rounded-xl border bg-muted/40 p-4 min-w-0">
                <p className="text-xs font-semibold text-muted-foreground">CPF</p>
                <p className="mt-2 font-mono text-sm break-words">
                  {selectedUser?.cpf
                    ? selectedUser.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
                    : <span className="text-muted-foreground italic">Não informado</span>}
                </p>
              </div>

              <div className="rounded-xl border bg-muted/40 p-4 min-w-0">
                <p className="text-xs font-semibold text-muted-foreground">Data de Nascimento</p>
                <p className="mt-2 text-sm break-words">
                  {selectedUser?.dateOfBirth
                    ? new Date(selectedUser.dateOfBirth).toLocaleDateString('pt-BR')
                    : <span className="text-muted-foreground italic">Não informado</span>}
                </p>
              </div>

              <div className="rounded-xl border bg-muted/40 p-4 min-w-0">
                <p className="text-xs font-semibold text-muted-foreground">Telefone</p>
                <p className="mt-2 text-sm break-words">
                  {selectedUser?.phone
                    ? selectedUser.phone
                    : <span className="text-muted-foreground italic">Não informado</span>}
                </p>
              </div>

              <div className="rounded-xl border bg-muted/40 p-4 min-w-0">
                <p className="text-xs font-semibold text-muted-foreground">Estado</p>
                <p className="mt-2 text-sm break-words">
                  {selectedUser?.state
                    ? formatStateLabel(selectedUser.state)
                    : <span className="text-muted-foreground italic">Não informado</span>}
                </p>
              </div>

              <div className="rounded-xl border bg-muted/40 p-4 min-w-0">
                <p className="text-xs font-semibold text-muted-foreground">Período</p>
                <p className="mt-2 text-sm break-words">
                  {selectedUser?.periodoBase
                    ? formatPeriodoLabel(computeCurrentPeriodo(selectedUser.periodoBase, selectedUser.periodoBaseRef))
                    : <span className="text-muted-foreground italic">Não informado</span>}
                </p>
              </div>
            </div>

            <div className="rounded-xl border bg-muted/40 p-4 min-w-0">
              <p className="text-xs font-semibold text-muted-foreground">Profissão</p>

              {selectedUser?.profession ? (
                <>
                  <p className="mt-2 text-sm break-words font-medium">
                    {PROFESSION_LABELS[selectedUser.profession] || selectedUser.profession}
                  </p>

                  {selectedUser.profession === 'medico' && (
                    <div className="mt-4">
                      <p className="text-xs font-semibold text-muted-foreground">Especialidade</p>
                      <p className="mt-2 text-sm break-words">
                        {selectedUser.specialty
                          ? selectedUser.specialty
                          : <span className="text-muted-foreground italic">Não informado</span>}
                      </p>
                    </div>
                  )}

                  {selectedUser.profession === 'residente' && (
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground">Área da Residência</p>
                        <p className="mt-2 text-sm break-words">
                          {selectedUser.residencySpecialty
                            ? selectedUser.residencySpecialty
                            : <span className="text-muted-foreground italic">Não informado</span>}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground">Ano</p>
                        <p className="mt-2 text-sm break-words">
                          {selectedUser.residencyYear
                            ? selectedUser.residencyYear
                            : <span className="text-muted-foreground italic">Não informado</span>}
                        </p>
                      </div>
                      <div className="sm:col-span-2">
                        <p className="text-xs font-semibold text-muted-foreground">Hospital da Residência</p>
                        <p className="mt-2 text-sm break-words">
                          {selectedUser.residencyHospital
                            ? selectedUser.residencyHospital
                            : <span className="text-muted-foreground italic">Não informado</span>}
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedUser.profession === 'academico' && (
                    <div className="mt-4">
                      <p className="text-xs font-semibold text-muted-foreground">Unidade</p>
                      <p className="mt-2 text-sm break-words">
                        {selectedUser.afyaUnit
                          ? selectedUser.afyaUnit
                          : <span className="text-muted-foreground italic">Não informado</span>}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <p className="mt-2 text-sm">
                    {selectedUser?.isAfyaMedicineStudent ? (
                      <span className="text-green-600 dark:text-green-400 font-medium">✓ Estudante de Ciências Médicas</span>
                    ) : (
                      <span className="text-muted-foreground italic">Não informado (cadastro antigo)</span>
                    )}
                  </p>

                  {selectedUser?.isAfyaMedicineStudent && (
                    <div className="mt-4">
                      <p className="text-xs font-semibold text-muted-foreground">Unidade</p>
                      <p className="mt-2 text-sm break-words">
                        {selectedUser?.afyaUnit
                          ? selectedUser.afyaUnit
                          : <span className="text-muted-foreground italic">Não informado</span>}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInfoDialog(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Período */}
      <Dialog open={showPeriodoDialog} onOpenChange={setShowPeriodoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerenciar Período do Usuário</DialogTitle>
            <DialogDescription>
              Defina o período acadêmico de <strong>{selectedUser?.name}</strong>. Ele avança
              automaticamente a cada virada de semestre (janeiro e julho) a partir do período definido.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Período</Label>
              <Select value={selectedPeriodo || 'none'} onValueChange={(v) => setSelectedPeriodo(v === 'none' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem período</SelectItem>
                  {PERIODO_OPTIONS.map((p) => (
                    <SelectItem key={p} value={String(p)}>{formatPeriodoLabel(p)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedUser?.periodoBase ? (
              <p className="text-xs text-muted-foreground">
                Período atual (com avanço automático):{' '}
                <strong>{formatPeriodoLabel(computeCurrentPeriodo(selectedUser.periodoBase, selectedUser.periodoBaseRef))}</strong>
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPeriodoDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdatePeriodo}>
              <GraduationCap className="h-4 w-4 mr-2" />
              Salvar Período
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Monitor */}
      <Dialog open={showMonitorDialog} onOpenChange={setShowMonitorDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedUser?.secondaryRole === 'monitor' ? 'Remover Monitor' : 'Tornar Monitor'}
            </DialogTitle>
            <DialogDescription>
              {selectedUser?.secondaryRole === 'monitor'
                ? `Tem certeza que deseja remover o cargo de Monitor de ${selectedUser?.name}?`
                : `Tem certeza que deseja tornar ${selectedUser?.name} um Monitor? Ele poderá gerenciar aulas, tópicos, subtópicos e módulos.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowMonitorDialog(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleToggleMonitor}
              className={selectedUser?.secondaryRole === 'monitor' ? 'bg-red-600 hover:bg-red-700' : 'bg-yellow-600 hover:bg-yellow-700'}
            >
              {selectedUser?.secondaryRole === 'monitor' ? 'Remover Monitor' : 'Tornar Monitor'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Administrador */}
      <Dialog open={showAdminDialog} onOpenChange={setShowAdminDialog}>
        <DialogContent>
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-blue-600 dark:text-blue-300" />
            </div>
            <DialogTitle className="text-center">
              {selectedUser?.role === 'admin' ? 'Remover Administrador' : 'Tornar Administrador'}
            </DialogTitle>
            <DialogDescription className="text-center">
              {selectedUser?.role === 'admin' ? (
                <>
                  Tem certeza que deseja remover o acesso de administrador de <strong>{selectedUser?.name}</strong>?
                  <br /><br />
                  Ele perderá acesso ao painel admin. O efeito ocorre quando ele deslogar e logar novamente.
                </>
              ) : (
                <>
                  Tem certeza que deseja tornar <strong>{selectedUser?.name}</strong> um administrador?
                  <br /><br />
                  Ele terá acesso <strong>total</strong> ao painel admin (usuários, planos, conteúdo, pagamentos, etc.).
                  <br /><br />
                  Importante: ele precisa <strong>deslogar e logar novamente</strong> para o acesso de admin valer.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdminDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleToggleAdmin}
              className={selectedUser?.role === 'admin' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}
            >
              <Shield className="h-4 w-4 mr-2" />
              {selectedUser?.role === 'admin' ? 'Remover Admin' : 'Tornar Admin'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Usuários Online */}
      <Dialog
        open={showOnlineDialog}
        onOpenChange={(open) => {
          setShowOnlineDialog(open)
          if (!open) {
            setOnlineUsers([])
            setOnlineLoading(false)
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Usuários Online</DialogTitle>
            <DialogDescription>
              Lista de usuários com atividade recente.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {onlineLoading ? (
              <div className="text-sm text-muted-foreground">Carregando...</div>
            ) : onlineUsers.length === 0 ? (
              <div className="text-sm text-muted-foreground">Nenhum usuário online no momento.</div>
            ) : (
              <div className="space-y-3">
                {onlineUsers.map((u) => (
                  <div key={u.id || u.email} className="rounded-lg border bg-muted/30 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium break-words">{u.name}</div>
                        <div className="text-xs text-muted-foreground break-words mt-1">{u.email}</div>
                      </div>
                      <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                        Online
                      </span>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {formatRelativeActivity(u.lastLoginAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowOnlineDialog(false)
              }}
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Histórico de Compras */}
      <Dialog
        open={showPurchasesDialog}
        onOpenChange={(open) => {
          setShowPurchasesDialog(open)
          if (!open) {
            setPurchasesData(null)
            setPurchasesLoading(false)
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Histórico de Compras
            </DialogTitle>
            <DialogDescription className="break-words">
              Compras concluídas de <strong>{selectedUser?.name}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {purchasesLoading ? (
              <div className="text-sm text-muted-foreground py-8 text-center">Carregando compras...</div>
            ) : !purchasesData ? (
              <div className="text-sm text-muted-foreground py-8 text-center">Não foi possível carregar os dados.</div>
            ) : purchasesData.count === 0 ? (
              <div className="text-sm text-muted-foreground py-8 text-center">
                Este usuário ainda não realizou nenhuma compra.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">Total de itens</p>
                    <p className="text-2xl font-bold">{purchasesData.count}</p>
                  </div>
                  <div className="rounded-lg border bg-emerald-50 dark:bg-emerald-950/30 p-3">
                    <p className="text-xs text-muted-foreground">Total investido</p>
                    <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                      R$ {purchasesData.totalAmount.toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                  {purchasesData.purchases.map((p) => (
                    <div
                      key={p._id}
                      className="flex items-start gap-3 rounded-lg border bg-muted/20 p-3"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                        {p.itemType === 'package'
                          ? <PackageIcon className="h-5 w-5" />
                          : <FileTextIcon className="h-5 w-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">
                          {p.itemType === 'package' ? 'Pacote' : 'Material'}
                        </p>
                        <p className="text-sm font-semibold break-words">{p.itemTitle}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(p.purchasedAt).toLocaleDateString('pt-BR', {
                            day: '2-digit', month: '2-digit', year: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                          {p.price <= 0 ? 'Grátis' : `R$ ${Number(p.price).toFixed(2).replace('.', ',')}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPurchasesDialog(false)}>
              Fechar
            </Button>
            <Button
              onClick={handleGeneratePurchasesPdf}
              disabled={generatingPurchasesPdf || !purchasesData || purchasesData.count === 0}
            >
              <FileDown className="h-4 w-4 mr-2" />
              {generatingPurchasesPdf ? 'Gerando PDF...' : 'Baixar PDF'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Dispositivos / Sessões ativas */}
      <Dialog
        open={showSessionsDialog}
        onOpenChange={(open) => {
          setShowSessionsDialog(open)
          if (!open) {
            setSessionsData(null)
            setSessionsLoading(false)
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MonitorSmartphone className="h-5 w-5" />
              Dispositivos conectados
            </DialogTitle>
            <DialogDescription className="break-words">
              Sessões da conta de <strong>{selectedUser?.name}</strong>. Use para
              detectar compartilhamento de conta e desconectar aparelhos.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {sessionsLoading ? (
              <div className="text-sm text-muted-foreground py-8 text-center">Carregando dispositivos...</div>
            ) : !sessionsData ? (
              <div className="text-sm text-muted-foreground py-8 text-center">Não foi possível carregar os dados.</div>
            ) : sessionsData.sessions.length === 0 ? (
              <div className="text-sm text-muted-foreground py-8 text-center">
                Nenhuma sessão registrada para esta conta.
                <br />
                <span className="text-xs">
                  (Logins anteriores a esta funcionalidade não aparecem aqui.)
                </span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="rounded-lg border bg-muted/30 px-3 py-2">
                    <span className="text-xs text-muted-foreground">Dispositivos ativos: </span>
                    <span className={`text-sm font-bold ${sessionsData.activeCount > 2 ? 'text-amber-600 dark:text-amber-400' : ''}`}>
                      {sessionsData.activeCount}
                    </span>
                  </div>
                  {sessionsData.activeCount > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-950/30"
                      onClick={handleRevokeAllSessions}
                      disabled={revokingSessionId === '__all__'}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      {revokingSessionId === '__all__' ? 'Desconectando...' : 'Desconectar todos'}
                    </Button>
                  )}
                </div>

                <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                  {sessionsData.sessions.map((s) => (
                    <div
                      key={s.id}
                      className={`flex items-start gap-3 rounded-lg border p-3 ${s.revoked ? 'bg-muted/10 opacity-60' : 'bg-muted/20'}`}
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                        <MonitorSmartphone className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold break-words">{s.deviceName}</p>
                          {s.online && !s.revoked && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Online
                            </span>
                          )}
                          {s.revoked && (
                            <span className="text-[10px] font-semibold text-red-500">
                              Desconectado{s.revokedBy === 'limit' ? ' (limite)' : s.revokedBy === 'user' ? ' (logout)' : ''}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Wifi className="h-3 w-3" /> IP: {s.ip}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Última atividade:{' '}
                          {s.lastActiveAt
                            ? new Date(s.lastActiveAt).toLocaleString('pt-BR', {
                                day: '2-digit', month: '2-digit', year: 'numeric',
                                hour: '2-digit', minute: '2-digit',
                              })
                            : '—'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Conectado em:{' '}
                          {s.createdAt
                            ? new Date(s.createdAt).toLocaleString('pt-BR', {
                                day: '2-digit', month: '2-digit', year: 'numeric',
                                hour: '2-digit', minute: '2-digit',
                              })
                            : '—'}
                        </p>
                      </div>
                      {!s.revoked && (
                        <div className="shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-950/30"
                            onClick={() => handleRevokeSession(s.id)}
                            disabled={revokingSessionId === s.id}
                          >
                            <LogOut className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSessionsDialog(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ToastAlert
        open={toastOpen}
        onOpenChange={setToastOpen}
        message={toastMessage}
        type={toastType}
      />
    </div >
  )
}
