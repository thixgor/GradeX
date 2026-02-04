'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppShell, useAppShell } from '@/components/app-shell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PlanLimitsCard } from '@/components/plan-limits-card'
import { AccountType } from '@/lib/types'
import {
  FileText,
  Brain,
  BookMarked,
  Video,
  MessageCircle,
  User,
  Sparkles,
  ArrowRight,
  Trophy,
  Clock,
  TrendingUp,
  Calendar,
  Star,
  Zap
} from 'lucide-react'

// Inner component that uses AppShell context
function DashboardContent() {
  const router = useRouter()
  const { user, isAdmin, accountType } = useAppShell()

  const [stats, setStats] = useState({
    questionsAnswered: 0,
    examsCompleted: 0,
    flashcardsStudied: 0,
    streakDays: 0,
  })
  const [recentExams, setRecentExams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userStats, setUserStats] = useState({
    cronogramasCreated: 0,
    flashcardsCreated: 0,
    personalExamsCreated: 0,
  })

  useEffect(() => {
    loadDashboardData()
  }, [])

  async function loadDashboardData() {
    try {
      const [statsRes, examsRes, cronogramasRes] = await Promise.all([
        fetch('/api/user/statistics'),
        fetch('/api/exams?limit=3'),
        fetch('/api/cronogramas'),
      ])

      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats({
          questionsAnswered: data.questionsAnswered || 0,
          examsCompleted: data.examsCompleted || 0,
          flashcardsStudied: data.flashcardsStudied || 0,
          streakDays: data.streakDays || 0,
        })
      }

      if (examsRes.ok) {
        const data = await examsRes.json()
        setRecentExams((data.exams || []).slice(0, 3))
      }

      if (cronogramasRes.ok) {
        const data = await cronogramasRes.json()
        const cronogramas = data.cronogramas || []
        setUserStats(prev => ({ ...prev, cronogramasCreated: cronogramas.length }))
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const quickStats = [
    {
      label: 'Questões Respondidas',
      value: stats.questionsAnswered,
      icon: <FileText className="h-5 w-5" />,
      color: 'text-[#468152]',
    },
    {
      label: 'Provas Realizadas',
      value: stats.examsCompleted,
      icon: <Trophy className="h-5 w-5" />,
      color: 'text-[#E2A43E]',
    },
    {
      label: 'Flashcards Estudados',
      value: stats.flashcardsStudied,
      icon: <Brain className="h-5 w-5" />,
      color: 'text-purple-500',
    },
    {
      label: 'Dias de Estudo',
      value: stats.streakDays,
      icon: <Zap className="h-5 w-5" />,
      color: 'text-orange-500',
    },
  ]

  const quickActions = [
    {
      title: 'Provas',
      description: 'Simulados e provas pessoais',
      icon: <FileText className="h-6 w-6" />,
      href: '/provas',
      color: 'text-[#468152]',
      bgColor: 'bg-[#468152]/10 hover:bg-[#468152]/20 border-[#468152]/20',
    },
    {
      title: 'Flashcards',
      description: 'Estude com repetição espaçada',
      icon: <Brain className="h-6 w-6" />,
      href: '/flashcards',
      color: 'text-purple-600',
      bgColor: 'bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/20',
    },
    {
      title: 'Aulas',
      description: 'Vídeo-aulas e materiais',
      icon: <Video className="h-6 w-6" />,
      href: '/aulas',
      color: 'text-blue-600',
      bgColor: 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20',
    },
    {
      title: 'Cronogramas',
      description: 'Planeje seus estudos',
      icon: <BookMarked className="h-6 w-6" />,
      href: '/cronogramas',
      color: 'text-[#E2A43E]',
      bgColor: 'bg-[#E2A43E]/10 hover:bg-[#E2A43E]/20 border-[#E2A43E]/20',
    },
    {
      title: 'Fórum',
      description: 'Discussões e materiais',
      icon: <MessageCircle className="h-6 w-6" />,
      href: '/forum',
      color: 'text-pink-600',
      bgColor: 'bg-pink-500/10 hover:bg-pink-500/20 border-pink-500/20',
    },
    {
      title: 'Meu Perfil',
      description: 'Configurações e histórico',
      icon: <User className="h-6 w-6" />,
      href: '/profile',
      color: 'text-slate-600',
      bgColor: 'bg-slate-500/10 hover:bg-slate-500/20 border-slate-500/20',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Welcome Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#468152] to-[#E2A43E] p-6 sm:p-8 text-white">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5" />
            <span className="text-sm font-medium opacity-90">Bem-vindo de volta!</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">
            Seja o Foco. Seja a Referência.
          </h1>
          <p className="text-white/80 max-w-xl mb-4">
            Continue sua jornada de estudos. Escolha por onde começar hoje.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full text-sm">
            <span>Foco em Medicina AFYA</span>
            <span className="opacity-60">|</span>
            <span>SOI e HAM - 1° ao 5° Período</span>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4" />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => (
          <Card key={index} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                  {stat.icon}
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Plan Limits Card - Only show for free users */}
      {accountType === 'gratuito' && !loading && (
        <PlanLimitsCard
          accountType={accountType as AccountType}
          isAdmin={isAdmin}
          cronogramasCreated={userStats.cronogramasCreated}
          flashcardsCreated={userStats.flashcardsCreated}
          personalExamsCreated={userStats.personalExamsCreated}
          showUpgradeButton
        />
      )}

      {/* Quick Actions Grid */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Acesso Rápido</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={() => router.push(action.href)}
              className={`group relative p-5 rounded-xl border text-left transition-all duration-200 ${action.bgColor}`}
            >
              <div className={`mb-3 ${action.color}`}>
                {action.icon}
              </div>
              <h3 className="font-semibold mb-1">{action.title}</h3>
              <p className="text-sm text-muted-foreground">{action.description}</p>
              <ArrowRight className="absolute bottom-4 right-4 h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </button>
          ))}
        </div>
      </div>

      {/* Recent Exams */}
      {recentExams.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Provas Recentes</h2>
            <Button variant="ghost" size="sm" onClick={() => router.push('/provas')}>
              Ver todas
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {recentExams.map((exam) => (
              <Card
                key={exam._id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => router.push(`/exam/${exam._id}`)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base line-clamp-1">{exam.title}</CardTitle>
                      <CardDescription className="text-xs">
                        {exam.numberOfQuestions} questões
                      </CardDescription>
                    </div>
                    {exam.isPersonalExam ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
                        Pessoal
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                        Geral
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>
                      {new Date(exam.startTime).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Study Tips */}
      <Card className="border-[#468152]/20 bg-[#468152]/5">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-[#468152]/10">
              <Star className="h-6 w-6 text-[#468152]" />
            </div>
            <div>
              <h3 className="font-semibold text-[#468152] mb-1">Dica do Dia</h3>
              <p className="text-sm text-muted-foreground">
                Estudos mostram que a repetição espaçada aumenta a retenção em até 200%.
                Use os <span className="font-medium text-foreground">Flashcards</span> diariamente para maximizar seu aprendizado!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Main page component - wraps content in AppShell
export default function DashboardPage() {
  return (
    <AppShell>
      <DashboardContent />
    </AppShell>
  )
}
