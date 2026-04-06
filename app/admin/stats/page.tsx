'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ThemeToggle } from '@/components/theme-toggle'
import {
  ArrowLeft, Users, FileText, CheckCircle, TrendingUp, Award, Clock,
  BarChart3, Eye, Search, ChevronDown, ChevronRight, Activity,
  UserCheck, UserX, Calendar, Zap, Target, Download, BookOpen, Stethoscope
} from 'lucide-react'

// ─── Types ─────────────────────────────────────────────────────

interface UserDetailed {
  _id: string
  name: string
  email: string
  accountType: string
  createdAt: string
  lastLoginAt?: string
  banned?: boolean
  totalSubmissions: number
  averageScore: number | null
  bestScore: number | null
  lastActivity: string | null
  recentExams: { examId: string; title: string }[]
}

interface ExamDetailed {
  _id: string
  title: string
  scoringMethod: string
  numberOfQuestions: number
  createdAt: string
  createdBy: string
  isHidden: boolean
  isPracticeExam?: boolean
  submissionCount: number
  averageScore: number | null
  bestScore: number | null
  worstScore: number | null
}

interface Stats {
  totalExams: number
  totalUsers: number
  totalSubmissions: number
  averageScore: number
  examsThisMonth: number
  usersThisMonth: number
  submissionsThisMonth: number
  popularExams: { _id: string; title: string; submissionCount: number; averageScore: number; lastSubmission: string; scoringMethod: string; numberOfQuestions: number }[]
  topUsers: { _id: string; name: string; email: string; submissionCount: number; averageScore: number; lastSubmission: string; bestScore: number; worstScore: number; accountType: string }[]
  recentActivity: { date: string; dateKey: string; examsCreated: number; usersRegistered: number; submissionsCompleted: number }[]
  accountTypeDistribution: { gratuito: number; trial: number; premium: number; essential: number }
  examTypeDistribution: { normal: number; tri: number; discursive: number }
  scoreDistribution: { label: string; count: number }[]
  peakHours: { hour: number; count: number }[]
  submissionsByDayOfWeek: { day: string; count: number }[]
  userGrowth: { _id: string; count: number }[]
  allUsersDetailed: UserDetailed[]
  allExamsDetailed: ExamDetailed[]
  inactiveUsers: number
  activeLast7d: number
  activeLast30d: number
  // Manual Clínico
  totalPatologias: number
  patologiasByArea: { _id: string; count: number }[]
  patologiasBySistema: { _id: string; count: number }[]
  // Downloads
  totalDownloads: number
  downloadsByType: Record<string, number>
  topDownloadedExams: { _id: string; title: string; count: number; lastDownload: string }[]
  topDownloadedPatologias: { _id: string; title: string; count: number; lastDownload: string }[]
  downloadsByUser: { _id: string; userName: string; userEmail: string; count: number; lastDownload: string }[]
  recentDownloads: { userId: string; userName: string; userEmail: string; type: string; resourceTitle: string; downloadedAt: string }[]
  manualCompletoDownloads: number
}

// ─── Helpers ───────────────────────────────────────────────────

function formatDate(d: string | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatScore(s: number | null | undefined) {
  if (s == null) return '—'
  return s.toFixed(1)
}

const ACCOUNT_COLORS: Record<string, string> = {
  gratuito: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  trial: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  premium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  essential: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
}

const METHOD_LABELS: Record<string, string> = {
  normal: 'Normal',
  tri: 'TRI',
  discursive: 'Discursiva',
}

const DOWNLOAD_TYPE_LABELS: Record<string, string> = {
  exam_pdf: 'Prova (PDF)',
  gabarito_pdf: 'Gabarito',
  exam_answers_pdf: 'Prova + Gabarito',
  group_pdf: 'Grupo (PDF)',
  patologia_pdf: 'Patologia (PDF)',
  manual_completo_pdf: 'Manual Completo',
  student_answers_pdf: 'Minhas Respostas',
  annotations_pdf: 'Anotações',
}

// ─── Bar component ─────────────────────────────────────────────

function Bar({ value, max, color = 'bg-primary' }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="w-full bg-muted rounded-full h-2.5">
      <div className={`${color} h-2.5 rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────

export default function AdminStatsPage() {
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // User table state
  const [userSearch, setUserSearch] = useState('')
  const [userFilter, setUserFilter] = useState('all')
  const [userSort, setUserSort] = useState<'submissions' | 'score' | 'recent' | 'name'>('submissions')
  const [expandedUser, setExpandedUser] = useState<string | null>(null)
  const [userPage, setUserPage] = useState(0)

  // Exam table state
  const [examSearch, setExamSearch] = useState('')
  const [examFilter, setExamFilter] = useState('all')
  const [examSort, setExamSort] = useState<'submissions' | 'score' | 'recent' | 'name'>('submissions')
  const [examPage, setExamPage] = useState(0)

  const PAGE_SIZE = 25

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/stats')
        if (!res.ok) throw new Error('Erro ao carregar estatísticas')
        const data = await res.json()
        setStats(data.stats)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  // ─── Filtered/Sorted users ────────────────────────────────────
  const filteredUsers = useMemo(() => {
    if (!stats) return []
    let users = [...stats.allUsersDetailed]
    // Filter
    if (userFilter === 'active') users = users.filter(u => u.totalSubmissions > 0)
    else if (userFilter === 'inactive') users = users.filter(u => u.totalSubmissions === 0)
    else if (userFilter === 'premium') users = users.filter(u => u.accountType === 'premium')
    else if (userFilter === 'trial') users = users.filter(u => u.accountType === 'trial')
    else if (userFilter === 'gratuito') users = users.filter(u => ['gratuito', undefined].includes(u.accountType))
    else if (userFilter === 'banned') users = users.filter(u => u.banned)
    // Search
    if (userSearch) {
      const q = userSearch.toLowerCase()
      users = users.filter(u => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q))
    }
    // Sort
    users.sort((a, b) => {
      if (userSort === 'submissions') return b.totalSubmissions - a.totalSubmissions
      if (userSort === 'score') return (b.averageScore ?? -1) - (a.averageScore ?? -1)
      if (userSort === 'recent') return (b.lastActivity ? new Date(b.lastActivity).getTime() : 0) - (a.lastActivity ? new Date(a.lastActivity).getTime() : 0)
      return (a.name || '').localeCompare(b.name || '')
    })
    return users
  }, [stats, userSearch, userFilter, userSort])

  // ─── Filtered/Sorted exams ────────────────────────────────────
  const filteredExams = useMemo(() => {
    if (!stats) return []
    let exams = [...stats.allExamsDetailed]
    if (examFilter !== 'all') exams = exams.filter(e => e.scoringMethod === examFilter)
    if (examSearch) {
      const q = examSearch.toLowerCase()
      exams = exams.filter(e => e.title?.toLowerCase().includes(q))
    }
    exams.sort((a, b) => {
      if (examSort === 'submissions') return b.submissionCount - a.submissionCount
      if (examSort === 'score') return (b.averageScore ?? -1) - (a.averageScore ?? -1)
      if (examSort === 'recent') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      return (a.title || '').localeCompare(b.title || '')
    })
    return exams
  }, [stats, examSearch, examFilter, examSort])

  // Reset page on filter change
  useEffect(() => { setUserPage(0) }, [userSearch, userFilter, userSort])
  useEffect(() => { setExamPage(0) }, [examSearch, examFilter, examSort])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-lg">Carregando estatísticas...</span>
        </div>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-red-600">Erro</CardTitle>
            <CardDescription>{error || 'Erro ao carregar estatísticas'}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/admin')}>Voltar ao Admin</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const maxScoreDist = Math.max(...stats.scoreDistribution.map(s => s.count), 1)
  const maxPeakHour = Math.max(...stats.peakHours.map(h => h.count), 1)
  const maxDow = Math.max(...stats.submissionsByDayOfWeek.map(d => d.count), 1)

  const pagedUsers = filteredUsers.slice(userPage * PAGE_SIZE, (userPage + 1) * PAGE_SIZE)
  const totalUserPages = Math.ceil(filteredUsers.length / PAGE_SIZE)

  const pagedExams = filteredExams.slice(examPage * PAGE_SIZE, (examPage + 1) * PAGE_SIZE)
  const totalExamPages = Math.ceil(filteredExams.length / PAGE_SIZE)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <Button variant="ghost" size="icon" onClick={() => router.push('/admin')} className="shrink-0 h-8 w-8 sm:h-9 sm:w-9">
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold truncate">Estatísticas e Relatórios</h1>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Análises detalhadas da plataforma</p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-2 sm:px-4 py-6 sm:py-8 max-w-[1400px]">
        {/* ─── Summary Cards ────────────────────────────────────── */}
        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
          <Card className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white border-0">
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs sm:text-sm font-medium">Provas</CardTitle>
                <FileText className="h-4 w-4 opacity-80" />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-2xl sm:text-3xl font-bold">{stats.totalExams}</div>
              <p className="text-[10px] sm:text-xs mt-1 opacity-90">+{stats.examsThisMonth} este mês</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-pink-500 text-white border-0">
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs sm:text-sm font-medium">Usuários</CardTitle>
                <Users className="h-4 w-4 opacity-80" />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-2xl sm:text-3xl font-bold">{stats.totalUsers}</div>
              <p className="text-[10px] sm:text-xs mt-1 opacity-90">+{stats.usersThisMonth} este mês</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-emerald-500 text-white border-0">
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs sm:text-sm font-medium">Submissões</CardTitle>
                <CheckCircle className="h-4 w-4 opacity-80" />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-2xl sm:text-3xl font-bold">{stats.totalSubmissions}</div>
              <p className="text-[10px] sm:text-xs mt-1 opacity-90">+{stats.submissionsThisMonth} este mês</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-red-500 text-white border-0">
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs sm:text-sm font-medium">Média Geral</CardTitle>
                <TrendingUp className="h-4 w-4 opacity-80" />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-2xl sm:text-3xl font-bold">{stats.averageScore.toFixed(1)}</div>
              <p className="text-[10px] sm:text-xs mt-1 opacity-90">Pontos</p>
            </CardContent>
          </Card>
        </div>

        {/* ─── Engagement Mini Cards ────────────────────────────── */}
        <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4 mb-6">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="p-2 rounded-lg bg-green-500/10"><UserCheck className="h-4 w-4 text-green-600" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Ativos 7d</p>
                <p className="text-lg font-bold">{stats.activeLast7d}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="p-2 rounded-lg bg-blue-500/10"><Activity className="h-4 w-4 text-blue-600" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Ativos 30d</p>
                <p className="text-lg font-bold">{stats.activeLast30d}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="p-2 rounded-lg bg-red-500/10"><UserX className="h-4 w-4 text-red-600" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Inativos</p>
                <p className="text-lg font-bold">{stats.inactiveUsers}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="p-2 rounded-lg bg-purple-500/10"><Target className="h-4 w-4 text-purple-600" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Retenção 7d</p>
                <p className="text-lg font-bold">
                  {stats.totalUsers > 0 ? ((stats.activeLast7d / stats.totalUsers) * 100).toFixed(1) : 0}%
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ─── TABS ─────────────────────────────────────────────── */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 h-auto">
            <TabsTrigger value="overview" className="text-xs sm:text-sm py-2">Visão Geral</TabsTrigger>
            <TabsTrigger value="users" className="text-xs sm:text-sm py-2">Usuários</TabsTrigger>
            <TabsTrigger value="exams" className="text-xs sm:text-sm py-2">Provas</TabsTrigger>
            <TabsTrigger value="manual" className="text-xs sm:text-sm py-2">Manual Clínico</TabsTrigger>
            <TabsTrigger value="downloads" className="text-xs sm:text-sm py-2">Downloads</TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs sm:text-sm py-2">Analytics</TabsTrigger>
          </TabsList>

          {/* ══════════════════════════════════════════════════════
              TAB: VISÃO GERAL
              ══════════════════════════════════════════════════════ */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
              {/* Provas mais populares */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">Top 10 Provas</CardTitle>
                  </div>
                  <CardDescription>Por número de submissões</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats.popularExams.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nenhuma prova com submissões</p>
                    ) : stats.popularExams.map((exam, i) => (
                      <div key={exam._id} className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-bold text-primary">{i + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{exam.title}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>{exam.submissionCount} sub.</span>
                            <span>Média: {formatScore(exam.averageScore)}</span>
                            {exam.scoringMethod && <Badge variant="outline" className="text-[10px] px-1 py-0">{METHOD_LABELS[exam.scoringMethod] || exam.scoringMethod}</Badge>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Usuários mais ativos */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">Top 10 Usuários</CardTitle>
                  </div>
                  <CardDescription>Mais provas realizadas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats.topUsers.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nenhum usuário com submissões</p>
                    ) : stats.topUsers.map((user, i) => (
                      <div key={user._id} className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-purple-500/10 flex items-center justify-center">
                          <span className="text-xs font-bold text-purple-600 dark:text-purple-400">{i + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium truncate">{user.name}</p>
                            <Badge variant="outline" className={`text-[10px] px-1 py-0 ${ACCOUNT_COLORS[user.accountType] || ''}`}>
                              {user.accountType || 'gratuito'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>{user.submissionCount} provas</span>
                            <span>Média: {formatScore(user.averageScore)}</span>
                            <span>Melhor: {formatScore(user.bestScore)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Distributions */}
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Tipos de Conta</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(stats.accountTypeDistribution).map(([key, val]) => (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium capitalize">{key}</span>
                        <span className="text-sm text-muted-foreground">{val} ({stats.totalUsers > 0 ? ((val / stats.totalUsers) * 100).toFixed(1) : 0}%)</span>
                      </div>
                      <Bar value={val} max={stats.totalUsers} color={key === 'premium' ? 'bg-yellow-500' : key === 'trial' ? 'bg-purple-500' : key === 'essential' ? 'bg-blue-500' : 'bg-gray-400'} />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Métodos de Avaliação</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(stats.examTypeDistribution).map(([key, val]) => (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{METHOD_LABELS[key] || key}</span>
                        <span className="text-sm text-muted-foreground">{val} ({stats.totalExams > 0 ? ((val / stats.totalExams) * 100).toFixed(1) : 0}%)</span>
                      </div>
                      <Bar value={val} max={stats.totalExams} color={key === 'normal' ? 'bg-green-500' : key === 'tri' ? 'bg-orange-500' : 'bg-cyan-500'} />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* 30-day Activity Table */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">Atividade (Últimos 30 Dias)</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 font-medium">Data</th>
                        <th className="text-center py-2 font-medium">Provas</th>
                        <th className="text-center py-2 font-medium">Usuários</th>
                        <th className="text-center py-2 font-medium">Submissões</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recentActivity.map((a, i) => {
                        const total = a.examsCreated + a.usersRegistered + a.submissionsCompleted
                        return (
                          <tr key={i} className={`border-b last:border-0 ${total === 0 ? 'opacity-40' : ''}`}>
                            <td className="py-2">{a.date}</td>
                            <td className="text-center">{a.examsCreated || <span className="text-muted-foreground">—</span>}</td>
                            <td className="text-center">{a.usersRegistered || <span className="text-muted-foreground">—</span>}</td>
                            <td className="text-center font-medium">{a.submissionsCompleted || <span className="text-muted-foreground">—</span>}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ══════════════════════════════════════════════════════
              TAB: USUÁRIOS DETALHADO
              ══════════════════════════════════════════════════════ */}
          <TabsContent value="users" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome ou email..."
                      value={userSearch}
                      onChange={e => setUserSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={userFilter} onValueChange={setUserFilter}>
                    <SelectTrigger className="w-full sm:w-[160px]">
                      <SelectValue placeholder="Filtrar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos ({stats.totalUsers})</SelectItem>
                      <SelectItem value="active">Ativos ({stats.totalUsers - stats.inactiveUsers})</SelectItem>
                      <SelectItem value="inactive">Inativos ({stats.inactiveUsers})</SelectItem>
                      <SelectItem value="premium">Premium ({stats.accountTypeDistribution.premium})</SelectItem>
                      <SelectItem value="trial">Trial ({stats.accountTypeDistribution.trial})</SelectItem>
                      <SelectItem value="gratuito">Gratuito ({stats.accountTypeDistribution.gratuito})</SelectItem>
                      <SelectItem value="banned">Banidos</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={userSort} onValueChange={v => setUserSort(v as any)}>
                    <SelectTrigger className="w-full sm:w-[160px]">
                      <SelectValue placeholder="Ordenar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="submissions">Mais provas</SelectItem>
                      <SelectItem value="score">Maior média</SelectItem>
                      <SelectItem value="recent">Mais recente</SelectItem>
                      <SelectItem value="name">Nome A-Z</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-muted-foreground mt-2">{filteredUsers.length} usuário(s) encontrado(s)</p>
              </CardContent>
            </Card>

            {/* User Table */}
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left py-3 px-4 font-medium w-8"></th>
                        <th className="text-left py-3 px-4 font-medium">Usuário</th>
                        <th className="text-center py-3 px-2 font-medium hidden sm:table-cell">Plano</th>
                        <th className="text-center py-3 px-2 font-medium">Provas</th>
                        <th className="text-center py-3 px-2 font-medium hidden md:table-cell">Média</th>
                        <th className="text-center py-3 px-2 font-medium hidden md:table-cell">Melhor</th>
                        <th className="text-center py-3 px-2 font-medium hidden lg:table-cell">Última Ativ.</th>
                        <th className="text-center py-3 px-2 font-medium hidden lg:table-cell">Cadastro</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedUsers.map(user => (
                        <>
                          <tr
                            key={user._id}
                            className={`border-b cursor-pointer hover:bg-muted/30 transition-colors ${expandedUser === user._id ? 'bg-muted/20' : ''}`}
                            onClick={() => setExpandedUser(expandedUser === user._id ? null : user._id)}
                          >
                            <td className="py-3 px-4">
                              {user.recentExams.length > 0 ? (
                                expandedUser === user._id
                                  ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                  : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              ) : <span className="h-4 w-4 block" />}
                            </td>
                            <td className="py-3 px-4">
                              <div>
                                <p className="font-medium truncate max-w-[200px]">
                                  {user.name || 'Sem nome'}
                                  {user.banned && <Badge variant="destructive" className="ml-2 text-[10px] px-1 py-0">BAN</Badge>}
                                </p>
                                <p className="text-xs text-muted-foreground truncate max-w-[200px]">{user.email}</p>
                              </div>
                            </td>
                            <td className="text-center py-3 px-2 hidden sm:table-cell">
                              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${ACCOUNT_COLORS[user.accountType] || ''}`}>
                                {user.accountType || 'gratuito'}
                              </Badge>
                            </td>
                            <td className="text-center py-3 px-2 font-medium">{user.totalSubmissions}</td>
                            <td className="text-center py-3 px-2 hidden md:table-cell">{formatScore(user.averageScore)}</td>
                            <td className="text-center py-3 px-2 hidden md:table-cell">{formatScore(user.bestScore)}</td>
                            <td className="text-center py-3 px-2 hidden lg:table-cell text-xs">{formatDate(user.lastActivity)}</td>
                            <td className="text-center py-3 px-2 hidden lg:table-cell text-xs">{formatDate(user.createdAt)}</td>
                          </tr>
                          {expandedUser === user._id && user.recentExams.length > 0 && (
                            <tr key={`${user._id}-detail`} className="bg-muted/10">
                              <td colSpan={8} className="px-4 py-3">
                                <div className="ml-8">
                                  <p className="text-xs font-medium text-muted-foreground mb-2">Últimas provas realizadas ({user.recentExams.length}):</p>
                                  <div className="grid gap-1.5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                                    {user.recentExams.map((exam, i) => (
                                      <div key={i} className="flex items-center gap-2 text-xs bg-background rounded px-2 py-1.5 border">
                                        <FileText className="h-3 w-3 text-muted-foreground shrink-0" />
                                        <span className="truncate">{exam.title}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      ))}
                      {pagedUsers.length === 0 && (
                        <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">Nenhum usuário encontrado</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {/* Pagination */}
                {totalUserPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t">
                    <p className="text-xs text-muted-foreground">
                      {userPage * PAGE_SIZE + 1}–{Math.min((userPage + 1) * PAGE_SIZE, filteredUsers.length)} de {filteredUsers.length}
                    </p>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" disabled={userPage === 0} onClick={() => setUserPage(p => p - 1)}>Anterior</Button>
                      <Button variant="outline" size="sm" disabled={userPage >= totalUserPages - 1} onClick={() => setUserPage(p => p + 1)}>Próxima</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ══════════════════════════════════════════════════════
              TAB: PROVAS DETALHADO
              ══════════════════════════════════════════════════════ */}
          <TabsContent value="exams" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar prova por título..."
                      value={examSearch}
                      onChange={e => setExamSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={examFilter} onValueChange={setExamFilter}>
                    <SelectTrigger className="w-full sm:w-[160px]">
                      <SelectValue placeholder="Método" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos ({stats.totalExams})</SelectItem>
                      <SelectItem value="normal">Normal ({stats.examTypeDistribution.normal})</SelectItem>
                      <SelectItem value="tri">TRI ({stats.examTypeDistribution.tri})</SelectItem>
                      <SelectItem value="discursive">Discursiva ({stats.examTypeDistribution.discursive})</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={examSort} onValueChange={v => setExamSort(v as any)}>
                    <SelectTrigger className="w-full sm:w-[160px]">
                      <SelectValue placeholder="Ordenar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="submissions">Mais submissões</SelectItem>
                      <SelectItem value="score">Maior média</SelectItem>
                      <SelectItem value="recent">Mais recente</SelectItem>
                      <SelectItem value="name">Título A-Z</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-muted-foreground mt-2">{filteredExams.length} prova(s) encontrada(s)</p>
              </CardContent>
            </Card>

            {/* Exam Table */}
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left py-3 px-4 font-medium">Prova</th>
                        <th className="text-center py-3 px-2 font-medium">Método</th>
                        <th className="text-center py-3 px-2 font-medium">Questões</th>
                        <th className="text-center py-3 px-2 font-medium">Submissões</th>
                        <th className="text-center py-3 px-2 font-medium hidden sm:table-cell">Média</th>
                        <th className="text-center py-3 px-2 font-medium hidden md:table-cell">Melhor</th>
                        <th className="text-center py-3 px-2 font-medium hidden md:table-cell">Pior</th>
                        <th className="text-center py-3 px-2 font-medium hidden lg:table-cell">Criada em</th>
                        <th className="text-center py-3 px-2 font-medium hidden lg:table-cell">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedExams.map(exam => (
                        <tr key={exam._id} className="border-b hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-4">
                            <p className="font-medium truncate max-w-[250px]">{exam.title || 'Sem título'}</p>
                          </td>
                          <td className="text-center py-3 px-2">
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              {METHOD_LABELS[exam.scoringMethod] || exam.scoringMethod}
                            </Badge>
                          </td>
                          <td className="text-center py-3 px-2">{exam.numberOfQuestions || '—'}</td>
                          <td className="text-center py-3 px-2 font-medium">{exam.submissionCount}</td>
                          <td className="text-center py-3 px-2 hidden sm:table-cell">{formatScore(exam.averageScore)}</td>
                          <td className="text-center py-3 px-2 hidden md:table-cell text-green-600">{formatScore(exam.bestScore)}</td>
                          <td className="text-center py-3 px-2 hidden md:table-cell text-red-500">{formatScore(exam.worstScore)}</td>
                          <td className="text-center py-3 px-2 hidden lg:table-cell text-xs">{formatDate(exam.createdAt)}</td>
                          <td className="text-center py-3 px-2 hidden lg:table-cell">
                            <div className="flex items-center justify-center gap-1">
                              {exam.isHidden && <Badge variant="secondary" className="text-[10px] px-1 py-0">Oculta</Badge>}
                              {exam.isPracticeExam && <Badge variant="secondary" className="text-[10px] px-1 py-0">Treino</Badge>}
                              {!exam.isHidden && !exam.isPracticeExam && <span className="text-xs text-muted-foreground">—</span>}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {pagedExams.length === 0 && (
                        <tr><td colSpan={9} className="text-center py-8 text-muted-foreground">Nenhuma prova encontrada</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {/* Pagination */}
                {totalExamPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t">
                    <p className="text-xs text-muted-foreground">
                      {examPage * PAGE_SIZE + 1}–{Math.min((examPage + 1) * PAGE_SIZE, filteredExams.length)} de {filteredExams.length}
                    </p>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" disabled={examPage === 0} onClick={() => setExamPage(p => p - 1)}>Anterior</Button>
                      <Button variant="outline" size="sm" disabled={examPage >= totalExamPages - 1} onClick={() => setExamPage(p => p + 1)}>Próxima</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ══════════════════════════════════════════════════════
              TAB: MANUAL CLÍNICO
              ══════════════════════════════════════════════════════ */}
          <TabsContent value="manual" className="space-y-6">
            {/* Summary cards */}
            <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 mb-2">
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="p-2 rounded-lg bg-emerald-500/10"><Stethoscope className="h-4 w-4 text-emerald-600" /></div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Patologias</p>
                    <p className="text-lg font-bold">{stats.totalPatologias}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="p-2 rounded-lg bg-blue-500/10"><Download className="h-4 w-4 text-blue-600" /></div>
                  <div>
                    <p className="text-xs text-muted-foreground">PDFs Individuais</p>
                    <p className="text-lg font-bold">{stats.downloadsByType.patologia_pdf || 0}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="p-2 rounded-lg bg-purple-500/10"><BookOpen className="h-4 w-4 text-purple-600" /></div>
                  <div>
                    <p className="text-xs text-muted-foreground">Manual Completo</p>
                    <p className="text-lg font-bold">{stats.manualCompletoDownloads}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
              {/* By area */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Patologias por Área</CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.patologiasByArea.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sem dados</p>
                  ) : (
                    <div className="space-y-2">
                      {stats.patologiasByArea.map(a => (
                        <div key={a._id} className="flex items-center gap-3">
                          <span className="text-sm font-medium w-32 truncate">{a._id}</span>
                          <div className="flex-1"><Bar value={a.count} max={stats.patologiasByArea[0]?.count || 1} color="bg-emerald-500" /></div>
                          <span className="text-xs text-muted-foreground w-8 text-right">{a.count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* By sistema */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Patologias por Sistema</CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.patologiasBySistema.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sem dados</p>
                  ) : (
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {stats.patologiasBySistema.map(s => (
                        <div key={s._id} className="flex items-center gap-3">
                          <span className="text-xs font-medium w-40 truncate">{s._id}</span>
                          <div className="flex-1"><Bar value={s.count} max={stats.patologiasBySistema[0]?.count || 1} color="bg-teal-500" /></div>
                          <span className="text-xs text-muted-foreground w-8 text-right">{s.count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Top downloaded patologias */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Download className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">Patologias Mais Baixadas (PDF)</CardTitle>
                </div>
                <CardDescription>Ranking por número de downloads</CardDescription>
              </CardHeader>
              <CardContent>
                {stats.topDownloadedPatologias.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum download registrado ainda. Os dados aparecerão conforme os usuários baixarem PDFs.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-left py-2 px-3 font-medium w-8">#</th>
                          <th className="text-left py-2 px-3 font-medium">Patologia</th>
                          <th className="text-center py-2 px-3 font-medium">Downloads</th>
                          <th className="text-center py-2 px-3 font-medium hidden sm:table-cell">Último</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.topDownloadedPatologias.map((p, i) => (
                          <tr key={p._id} className="border-b last:border-0">
                            <td className="py-2 px-3 text-muted-foreground">{i + 1}</td>
                            <td className="py-2 px-3 font-medium truncate max-w-[250px]">{p.title}</td>
                            <td className="py-2 px-3 text-center font-bold">{p.count}</td>
                            <td className="py-2 px-3 text-center text-xs hidden sm:table-cell">{formatDate(p.lastDownload)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ══════════════════════════════════════════════════════
              TAB: DOWNLOADS
              ══════════════════════════════════════════════════════ */}
          <TabsContent value="downloads" className="space-y-6">
            {/* Summary */}
            <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4 mb-2">
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="p-2 rounded-lg bg-blue-500/10"><Download className="h-4 w-4 text-blue-600" /></div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Downloads</p>
                    <p className="text-lg font-bold">{stats.totalDownloads}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="p-2 rounded-lg bg-green-500/10"><FileText className="h-4 w-4 text-green-600" /></div>
                  <div>
                    <p className="text-xs text-muted-foreground">Provas (PDF)</p>
                    <p className="text-lg font-bold">{(stats.downloadsByType.exam_pdf || 0) + (stats.downloadsByType.group_pdf || 0)}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="p-2 rounded-lg bg-orange-500/10"><Stethoscope className="h-4 w-4 text-orange-600" /></div>
                  <div>
                    <p className="text-xs text-muted-foreground">Manual Clínico</p>
                    <p className="text-lg font-bold">{(stats.downloadsByType.patologia_pdf || 0) + (stats.downloadsByType.manual_completo_pdf || 0)}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="p-2 rounded-lg bg-purple-500/10"><BarChart3 className="h-4 w-4 text-purple-600" /></div>
                  <div>
                    <p className="text-xs text-muted-foreground">Gabaritos</p>
                    <p className="text-lg font-bold">{(stats.downloadsByType.gabarito_pdf || 0) + (stats.downloadsByType.exam_answers_pdf || 0)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Downloads by type */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Downloads por Tipo</CardTitle>
              </CardHeader>
              <CardContent>
                {stats.totalDownloads === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum download registrado ainda. Os dados aparecerão conforme os usuários baixarem PDFs.</p>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(stats.downloadsByType)
                      .sort(([, a], [, b]) => b - a)
                      .map(([type, count]) => (
                        <div key={type} className="flex items-center gap-3">
                          <span className="text-sm font-medium w-36 truncate">{DOWNLOAD_TYPE_LABELS[type] || type}</span>
                          <div className="flex-1"><Bar value={count} max={Math.max(...Object.values(stats.downloadsByType), 1)} color="bg-primary" /></div>
                          <span className="text-xs text-muted-foreground w-10 text-right">{count}</span>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
              {/* Top downloaded exams */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">Provas Mais Baixadas</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {stats.topDownloadedExams.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sem downloads registrados</p>
                  ) : (
                    <div className="space-y-3">
                      {stats.topDownloadedExams.map((e, i) => (
                        <div key={e._id} className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-500/10 flex items-center justify-center">
                            <span className="text-xs font-bold text-blue-600">{i + 1}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{e.title}</p>
                            <p className="text-xs text-muted-foreground">{e.count} downloads</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Top downloaders */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">Quem Mais Baixou</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {stats.downloadsByUser.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sem downloads registrados</p>
                  ) : (
                    <div className="space-y-3">
                      {stats.downloadsByUser.map((u, i) => (
                        <div key={u._id} className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-purple-500/10 flex items-center justify-center">
                            <span className="text-xs font-bold text-purple-600 dark:text-purple-400">{i + 1}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{u.userName || 'Desconhecido'}</p>
                            <p className="text-xs text-muted-foreground truncate">{u.userEmail} — {u.count} downloads</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent downloads */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">Downloads Recentes</CardTitle>
                </div>
                <CardDescription>Últimos 50 downloads na plataforma</CardDescription>
              </CardHeader>
              <CardContent>
                {stats.recentDownloads.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum download registrado ainda.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-left py-2 px-3 font-medium">Usuário</th>
                          <th className="text-left py-2 px-3 font-medium">Tipo</th>
                          <th className="text-left py-2 px-3 font-medium">Recurso</th>
                          <th className="text-center py-2 px-3 font-medium hidden sm:table-cell">Data</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.recentDownloads.map((d, i) => (
                          <tr key={i} className="border-b last:border-0">
                            <td className="py-2 px-3">
                              <p className="font-medium truncate max-w-[150px]">{d.userName || 'Desconhecido'}</p>
                              <p className="text-xs text-muted-foreground truncate max-w-[150px]">{d.userEmail}</p>
                            </td>
                            <td className="py-2 px-3">
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                {DOWNLOAD_TYPE_LABELS[d.type] || d.type}
                              </Badge>
                            </td>
                            <td className="py-2 px-3 truncate max-w-[200px]">{d.resourceTitle || '—'}</td>
                            <td className="py-2 px-3 text-center text-xs hidden sm:table-cell">{formatDate(d.downloadedAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ══════════════════════════════════════════════════════
              TAB: ANALYTICS
              ══════════════════════════════════════════════════════ */}
          <TabsContent value="analytics" className="space-y-6">
            {/* Score Distribution */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">Distribuição de Notas</CardTitle>
                </div>
                <CardDescription>Quantidade de submissões por faixa de nota</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-1 sm:gap-2 h-40">
                  {stats.scoreDistribution.map((bucket, i) => {
                    const pct = maxScoreDist > 0 ? (bucket.count / maxScoreDist) * 100 : 0
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[10px] text-muted-foreground">{bucket.count}</span>
                        <div className="w-full bg-muted rounded-t relative" style={{ height: `${Math.max(pct, 2)}%` }}>
                          <div className={`absolute inset-0 rounded-t ${i < 4 ? 'bg-red-400' : i < 6 ? 'bg-yellow-400' : i < 8 ? 'bg-blue-400' : 'bg-green-400'}`} />
                        </div>
                        <span className="text-[9px] sm:text-[10px] text-muted-foreground whitespace-nowrap">{bucket.label}</span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
              {/* Peak Hours */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">Horários de Pico</CardTitle>
                  </div>
                  <CardDescription>Submissões por hora do dia (UTC)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-12 gap-1">
                    {stats.peakHours.map(h => {
                      const intensity = maxPeakHour > 0 ? h.count / maxPeakHour : 0
                      return (
                        <div key={h.hour} className="flex flex-col items-center gap-1" title={`${h.hour}h: ${h.count} submissões`}>
                          <div
                            className="w-full aspect-square rounded transition-colors"
                            style={{
                              backgroundColor: intensity > 0.75 ? 'rgb(34,197,94)' :
                                intensity > 0.5 ? 'rgb(74,222,128)' :
                                intensity > 0.25 ? 'rgb(187,247,208)' :
                                intensity > 0 ? 'rgb(220,252,231)' :
                                'rgb(243,244,246)',
                            }}
                          />
                          <span className="text-[8px] text-muted-foreground">{h.hour}</span>
                        </div>
                      )
                    })}
                  </div>
                  <div className="flex items-center justify-end gap-2 mt-3 text-[10px] text-muted-foreground">
                    <span>Menos</span>
                    <div className="flex gap-0.5">
                      {['rgb(243,244,246)', 'rgb(220,252,231)', 'rgb(187,247,208)', 'rgb(74,222,128)', 'rgb(34,197,94)'].map((c, i) => (
                        <div key={i} className="w-3 h-3 rounded" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                    <span>Mais</span>
                  </div>
                </CardContent>
              </Card>

              {/* Day of Week */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">Submissões por Dia da Semana</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {stats.submissionsByDayOfWeek.map(d => (
                      <div key={d.day} className="flex items-center gap-3">
                        <span className="text-sm font-medium w-8">{d.day}</span>
                        <div className="flex-1">
                          <Bar value={d.count} max={maxDow} color="bg-primary" />
                        </div>
                        <span className="text-xs text-muted-foreground w-12 text-right">{d.count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* User Growth */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">Crescimento de Usuários (12 meses)</CardTitle>
                </div>
                <CardDescription>Novos cadastros por mês</CardDescription>
              </CardHeader>
              <CardContent>
                {stats.userGrowth.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem dados</p>
                ) : (
                  <div className="flex items-end gap-1 sm:gap-2 h-32">
                    {stats.userGrowth.map((m, i) => {
                      const maxG = Math.max(...stats.userGrowth.map(x => x.count), 1)
                      const pct = (m.count / maxG) * 100
                      const [year, month] = m._id.split('-')
                      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-[10px] text-muted-foreground">{m.count}</span>
                          <div className="w-full rounded-t bg-primary/80" style={{ height: `${Math.max(pct, 4)}%` }} />
                          <span className="text-[9px] text-muted-foreground">{monthNames[parseInt(month) - 1]}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
