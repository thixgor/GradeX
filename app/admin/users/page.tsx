'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeToggle } from '@/components/theme-toggle'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { ToastAlert } from '@/components/ui/toast-alert'
import { User, BanReason, BanReasonLabels, AccountType, TrialPlanType, PremiumPlanType } from '@/lib/types'
import { ArrowLeft, Trash2, Ban, CheckCircle, AlertTriangle, Shield, Crown, Timer, Settings, Info, Zap, Activity, Users, UserCheck, Clock, Search, RefreshCw, Mail, CalendarDays } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type OnlineUser = {
  id?: string
  name: string
  email: string
  lastLoginAt?: string
}

type UserSortMode = 'lastLogin' | 'createdAt' | 'name'
type UserActivityFilter = 'all' | 'online' | 'active7d' | 'never'
type UserPlanFilter = 'all' | AccountType | 'admin' | 'banned'

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

export default function AdminUsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
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
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [banReason, setBanReason] = useState<BanReason>('other')
  const [banDetails, setBanDetails] = useState('')
  const [selectedAccountType, setSelectedAccountType] = useState<AccountType>('gratuito')
  const [selectedTrialSubtype, setSelectedTrialSubtype] = useState<TrialPlanType>('7dias')
  const [selectedPremiumSubtype, setSelectedPremiumSubtype] = useState<PremiumPlanType>('mensal')
  const [examsQuota, setExamsQuota] = useState(0)
  const [toastOpen, setToastOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'error' | 'success' | 'info'>('error')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortMode, setSortMode] = useState<UserSortMode>('lastLogin')
  const [activityFilter, setActivityFilter] = useState<UserActivityFilter>('all')
  const [planFilter, setPlanFilter] = useState<UserPlanFilter>('all')

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

  const dashboardStats = useMemo(() => {
    const now = Date.now()
    const onlineUsersCount = users.filter(isRecentlyOnline).length
    const activeLast7Days = users.filter((user) => {
      const lastLogin = getUserDateValue(user.lastLoginAt)
      return lastLogin && now - lastLogin <= ACTIVE_7D_THRESHOLD_MS && !user.banned
    }).length
    const neverLoggedIn = users.filter((user) => !getUserDateValue(user.lastLoginAt)).length
    const admins = users.filter((user) => user.role === 'admin').length
    const banned = users.filter((user) => user.banned).length

    return {
      total: users.length,
      onlineUsersCount,
      activeLast7Days,
      neverLoggedIn,
      admins,
      banned,
    }
  }, [users])

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
        return `${user.name} ${user.email}`.toLowerCase().includes(normalizedSearch)
      })
      .filter((user) => {
        if (planFilter === 'all') return true
        if (planFilter === 'admin') return user.role === 'admin'
        if (planFilter === 'banned') return !!user.banned
        return (user.accountType || 'gratuito') === planFilter && user.role !== 'admin'
      })
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
        return getUserDateValue(b.lastLoginAt) - getUserDateValue(a.lastLoginAt)
      })
  }, [activityFilter, planFilter, searchTerm, sortMode, users])

  async function loadUsers() {
    try {
      const res = await fetch('/api/users')
      const data = await res.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
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
          premiumPlanType: selectedAccountType === 'premium' ? selectedPremiumSubtype : undefined
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

  function getAccountTypeBadge(user: User) {
    const accountType = user.accountType || 'gratuito'

    switch (accountType) {
      case 'premium':
        return (
          <span className="text-xs bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-2 py-1 rounded flex items-center gap-1 w-fit">
            <Crown className="h-3 w-3" />
            Premium
          </span>
        )
      case 'essential':
        return (
          <span className="text-xs bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-2 py-1 rounded flex items-center gap-1 w-fit">
            <Zap className="h-3 w-3" />
            Essential
          </span>
        )
      case 'trial':
        return (
          <span className="text-xs bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-2 py-1 rounded flex items-center gap-1 w-fit">
            <Timer className="h-3 w-3" />
            Trial
          </span>
        )
      default:
        return (
          <span className="text-xs bg-gray-500 text-white px-2 py-1 rounded w-fit">
            Gratuito
          </span>
        )
    }
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
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Total
                  </CardDescription>
                  <CardTitle className="text-2xl">{dashboardStats.total}</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  {dashboardStats.admins} admin(s)
                </CardContent>
              </Card>

              <Card className="cursor-pointer transition-colors hover:bg-muted/40" onClick={openOnlineUsersDialog}>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-emerald-500" />
                    Online agora
                  </CardDescription>
                  <CardTitle className="text-2xl">
                    {onlineCount === null ? dashboardStats.onlineUsersCount : onlineCount}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  Ativos nos últimos 10 min
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-blue-500" />
                    Ativos 7 dias
                  </CardDescription>
                  <CardTitle className="text-2xl">{dashboardStats.activeLast7Days}</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  Com atividade recente
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-500" />
                    Nunca acessaram
                  </CardDescription>
                  <CardTitle className="text-2xl">{dashboardStats.neverLoggedIn}</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  Sem atividade registrada
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    <Ban className="h-4 w-4 text-red-500" />
                    Banidos
                  </CardDescription>
                  <CardTitle className="text-2xl">{dashboardStats.banned}</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  Acesso bloqueado
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

            <Card>
              <CardHeader>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <CardTitle>Todos os usuários</CardTitle>
                    <CardDescription>
                      {filteredUsers.length} de {users.length} usuário(s) exibidos
                    </CardDescription>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[240px_180px_180px_180px]">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar nome ou email"
                        className="pl-9"
                      />
                    </div>
                    <Select value={sortMode} onValueChange={(value) => setSortMode(value as UserSortMode)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Ordenar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lastLogin">Mais recentes</SelectItem>
                        <SelectItem value="createdAt">Cadastro recente</SelectItem>
                        <SelectItem value="name">Nome</SelectItem>
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
                    <Select value={planFilter} onValueChange={(value) => setPlanFilter(value as UserPlanFilter)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Plano" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os planos</SelectItem>
                        <SelectItem value="admin">Admins</SelectItem>
                        <SelectItem value="gratuito">Gratuito</SelectItem>
                        <SelectItem value="trial">Trial</SelectItem>
                        <SelectItem value="essential">Essential</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                        <SelectItem value="banned">Banidos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {filteredUsers.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">Nenhum usuário encontrado com os filtros atuais.</p>
                </CardContent>
              </Card>
            ) : filteredUsers.map((user) => (
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

                  <div className="mb-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
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
                    <div className="rounded-lg border bg-muted/20 p-3 sm:col-span-2 lg:col-span-1">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <Settings className="h-3.5 w-3.5" />
                        Plano atual
                      </div>
                      <div className="mt-1 capitalize text-foreground">
                        {user.role === 'admin' ? 'Admin' : user.accountType || 'gratuito'}
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
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={selectedAccountType === 'gratuito' ? 'default' : 'outline'}
                  onClick={() => setSelectedAccountType('gratuito')}
                  className="h-auto py-3 flex-col gap-1"
                  size="sm"
                >
                  <div className="font-semibold">Gratuito</div>
                  <div className="text-xs opacity-80">Padrão</div>
                </Button>
                <Button
                  variant={selectedAccountType === 'trial' ? 'default' : 'outline'}
                  onClick={() => setSelectedAccountType('trial')}
                  className="h-auto py-3 flex-col gap-1"
                  size="sm"
                >
                  <Timer className="h-4 w-4" />
                  <div className="font-semibold">Trial</div>
                  <div className="text-xs opacity-80">Temporário</div>
                </Button>
                <Button
                  variant={selectedAccountType === 'premium' ? 'default' : 'outline'}
                  onClick={() => setSelectedAccountType('premium')}
                  className="h-auto py-3 flex-col gap-1"
                  size="sm"
                >
                  <Crown className="h-4 w-4" />
                  <div className="font-semibold">Premium</div>
                  <div className="text-xs opacity-80">Vitalício</div>
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <Button
                  variant={selectedAccountType === 'essential' ? 'default' : 'outline'}
                  onClick={() => setSelectedAccountType('essential')}
                  className="h-auto py-3 flex-col gap-1"
                  size="sm"
                >
                  <Zap className="h-4 w-4" />
                  <div className="font-semibold">Essential</div>
                  <div className="text-xs opacity-80">Sem Aulas</div>
                </Button>
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

            {selectedAccountType === 'premium' && (
              <div className="space-y-2">
                <Label>Subtipo de Premium</Label>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            </div>

            <div className="rounded-xl border bg-muted/40 p-4 min-w-0">
              <p className="text-xs font-semibold text-muted-foreground">Estudante de Ciências Médicas</p>
              <p className="mt-2 text-sm">
                {selectedUser?.isAfyaMedicineStudent ? (
                  <span className="text-green-600 dark:text-green-400 font-medium">✓ Sim</span>
                ) : (
                  <span className="text-gray-600 dark:text-gray-400">Não</span>
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
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInfoDialog(false)}>
              Fechar
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

      <ToastAlert
        open={toastOpen}
        onOpenChange={setToastOpen}
        message={toastMessage}
        type={toastType}
      />
    </div >
  )
}
