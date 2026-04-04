'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { AppShell, useAppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { PlanLimitsCard } from '@/components/plan-limits-card'
import { AccountType } from '@/lib/types'
import { motion, AnimatePresence } from 'framer-motion'
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
  Zap,
  Target,
  BarChart3,
  Play,
  ChevronRight,
  Flame,
  BookOpen,
  Lightbulb,
  GraduationCap,
  Activity,
  HeartPulse,
  Heart,
} from 'lucide-react'
import { DoacaoContent } from '@/components/doacoes/doacao-content'
import { DoacaoRanking } from '@/components/doacoes/doacao-ranking'
import { DoacaoForm } from '@/components/doacoes/doacao-form'

// ─── Circular Progress Ring ─────────────────────────────────────
function ProgressRing({
  value,
  max,
  size = 48,
  strokeWidth = 4,
  color = '#468152',
}: {
  value: number
  max: number
  size?: number
  strokeWidth?: number
  color?: string
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const percent = max > 0 ? Math.min(value / max, 1) : 0
  const offset = circumference - percent * circumference

  return (
    <svg width={size} height={size} className="progress-ring">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-muted/30"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="progress-ring-circle"
      />
    </svg>
  )
}

// ─── Animated Counter ───────────────────────────────────────────
function AnimatedNumber({ value, delay = 0 }: { value: number; delay?: number }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const timeout = setTimeout(() => {
      const duration = 1000
      const start = Date.now()
      const step = () => {
        const elapsed = Date.now() - start
        const progress = Math.min(elapsed / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3) // easeOutCubic
        setDisplay(Math.round(eased * value))
        if (progress < 1) requestAnimationFrame(step)
      }
      requestAnimationFrame(step)
    }, delay)
    return () => clearTimeout(timeout)
  }, [value, delay])

  return <span>{display.toLocaleString('pt-BR')}</span>
}

// ─── Dashboard Content ──────────────────────────────────────────
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

  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Bom dia'
    if (hour < 18) return 'Boa tarde'
    return 'Boa noite'
  }, [])

  const firstName = user?.name?.split(' ')[0] || ''

  // ─── Stats Config ──────────────────────────────────────────────
  const quickStats = [
    {
      label: 'Questoes Respondidas',
      value: stats.questionsAnswered,
      icon: FileText,
      color: '#468152',
      gradient: 'from-emerald-500/20 to-emerald-600/5',
      iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    },
    {
      label: 'Provas Realizadas',
      value: stats.examsCompleted,
      icon: Trophy,
      color: '#E2A43E',
      gradient: 'from-amber-500/20 to-amber-600/5',
      iconBg: 'bg-amber-500/10 dark:bg-amber-500/20',
    },
    {
      label: 'Flashcards Estudados',
      value: stats.flashcardsStudied,
      icon: Brain,
      color: '#8b5cf6',
      gradient: 'from-violet-500/20 to-violet-600/5',
      iconBg: 'bg-violet-500/10 dark:bg-violet-500/20',
    },
    {
      label: 'Dias de Estudo',
      value: stats.streakDays,
      icon: Flame,
      color: '#f97316',
      gradient: 'from-orange-500/20 to-orange-600/5',
      iconBg: 'bg-orange-500/10 dark:bg-orange-500/20',
    },
  ]

  // ─── Quick Actions Config ──────────────────────────────────────
  const quickActions = [
    {
      title: 'Provas',
      description: 'Simulados e avaliacoes',
      icon: FileText,
      href: '/provas',
      color: '#468152',
      gradient: 'from-emerald-500/10 to-emerald-600/5',
      hoverGradient: 'hover:from-emerald-500/20 hover:to-emerald-600/10',
    },
    {
      title: 'Flashcards',
      description: 'Repeticao espacada',
      icon: Brain,
      href: '/flashcards',
      color: '#8b5cf6',
      gradient: 'from-violet-500/10 to-violet-600/5',
      hoverGradient: 'hover:from-violet-500/20 hover:to-violet-600/10',
    },
    {
      title: 'Aulas',
      description: 'Video-aulas e materiais',
      icon: Video,
      href: '/aulas',
      color: '#3b82f6',
      gradient: 'from-blue-500/10 to-blue-600/5',
      hoverGradient: 'hover:from-blue-500/20 hover:to-blue-600/10',
    },
    {
      title: 'Cronogramas',
      description: 'Planeje seus estudos',
      icon: Calendar,
      href: '/cronogramas',
      color: '#E2A43E',
      gradient: 'from-amber-500/10 to-amber-600/5',
      hoverGradient: 'hover:from-amber-500/20 hover:to-amber-600/10',
    },
    {
      title: 'Manual Clínico',
      description: 'Patologias e farmacologia',
      icon: HeartPulse,
      href: '/manual-clinico',
      color: '#ef4444',
      gradient: 'from-red-500/10 to-rose-600/5',
      hoverGradient: 'hover:from-red-500/20 hover:to-rose-600/10',
    },
    {
      title: 'Forum',
      description: 'Discussoes e ajuda',
      icon: MessageCircle,
      href: '/forum',
      color: '#ec4899',
      gradient: 'from-pink-500/10 to-pink-600/5',
      hoverGradient: 'hover:from-pink-500/20 hover:to-pink-600/10',
    },
    {
      title: 'Meu Perfil',
      description: 'Configuracoes e dados',
      icon: User,
      href: '/profile',
      color: '#64748b',
      gradient: 'from-slate-500/10 to-slate-600/5',
      hoverGradient: 'hover:from-slate-500/20 hover:to-slate-600/10',
    },
  ]

  // ─── Smart study insights ─────────────────────────────────────
  const insights = useMemo(() => {
    const items = []
    if (stats.streakDays >= 7) {
      items.push({
        icon: Flame,
        color: '#f97316',
        title: `${stats.streakDays} dias seguidos!`,
        description: 'Consistencia e o segredo. Continue assim!',
      })
    } else if (stats.streakDays > 0) {
      items.push({
        icon: Target,
        color: '#468152',
        title: 'Construa sua sequencia',
        description: `Voce tem ${stats.streakDays} dia${stats.streakDays > 1 ? 's' : ''} de estudo. Tente chegar a 7!`,
      })
    } else {
      items.push({
        icon: Sparkles,
        color: '#8b5cf6',
        title: 'Comece sua jornada hoje',
        description: 'Estude um pouco todos os dias para construir uma sequencia.',
      })
    }

    if (stats.flashcardsStudied > 0 && stats.questionsAnswered > 0) {
      const ratio = stats.flashcardsStudied / stats.questionsAnswered
      if (ratio < 0.5) {
        items.push({
          icon: Brain,
          color: '#8b5cf6',
          title: 'Reforce com Flashcards',
          description: 'A repeticao espacada aumenta a retencao em ate 200%.',
        })
      }
    }

    items.push({
      icon: Lightbulb,
      color: '#E2A43E',
      title: 'Dica de estudo',
      description: 'Revise conteudos dificeis antes de dormir para melhor consolidacao.',
    })

    return items.slice(0, 3)
  }, [stats])

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">

        {/* ═══════════════════════════════════════════════════════
            1. HERO FOCUS SECTION
           ═══════════════════════════════════════════════════════ */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-2xl hero-gradient text-white"
        >
          <div className="relative z-10 p-6 sm:p-8 lg:p-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              {/* Left: Greeting + Context */}
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-sm font-medium text-white/70 tracking-wide uppercase">
                    {greeting}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
                  {firstName}, seja o foco.
                </h1>
                <p className="text-white/60 max-w-lg text-sm sm:text-base leading-relaxed">
                  Cronogramas, flashcards e provas com ementas completas de Medicina, Psicologia, Biomedicina e Odontologia AFYA.
                </p>

                {/* Academic Focus Badges */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-xs font-medium border border-white/10">
                    <GraduationCap className="h-3.5 w-3.5" />
                    Medicina AFYA
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-xs font-medium border border-white/10">
                    <BookOpen className="h-3.5 w-3.5" />
                    Psicologia AFYA
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-xs font-medium border border-white/10">
                    <BookOpen className="h-3.5 w-3.5" />
                    Biomedicina AFYA
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-xs font-medium border border-white/10">
                    <BookOpen className="h-3.5 w-3.5" />
                    Odontologia AFYA
                  </span>
                </div>
              </div>

              {/* Right: Quick Resume Button */}
              <div className="flex flex-col items-start sm:items-end gap-3">
                <Button
                  onClick={() => router.push('/provas')}
                  className="bg-white/15 hover:bg-white/25 text-white border border-white/20 backdrop-blur-sm rounded-xl px-6 h-12 text-sm font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-white/5 group"
                >
                  <Play className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                  Continuar Estudando
                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>

                {/* Streak Indicator */}
                {stats.streakDays > 0 && (
                  <div className="flex items-center gap-2 text-sm text-white/50">
                    <Flame className="h-4 w-4 text-orange-400" />
                    <span>{stats.streakDays} dias consecutivos</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Decorative Orbs */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-violet-500/8 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        </motion.section>

        {/* ═══════════════════════════════════════════════════════
            2. PERFORMANCE OVERVIEW CARDS
           ═══════════════════════════════════════════════════════ */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {quickStats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 + index * 0.08 }}
                className={`
                  glass-stat stat-card-glow rounded-2xl p-4 sm:p-5
                  hover-glow-brand hover-lift
                  transition-all duration-300 cursor-default group
                `}
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className={`
                      p-2.5 rounded-xl ${stat.iconBg}
                      group-hover:scale-110 transition-transform duration-300
                    `}
                  >
                    <Icon className="h-5 w-5" style={{ color: stat.color }} />
                  </div>
                  <ProgressRing
                    value={stat.value}
                    max={Math.max(stat.value, 100)}
                    size={36}
                    strokeWidth={3}
                    color={stat.color}
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-2xl sm:text-3xl font-bold tracking-tight">
                    <AnimatedNumber value={stat.value} delay={200 + index * 100} />
                  </p>
                  <p className="text-xs text-muted-foreground leading-tight">
                    {stat.label}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </section>

        {/* Plan Limits Card - Free users */}
        {accountType === 'gratuito' && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
          >
            <PlanLimitsCard
              accountType={accountType as AccountType}
              isAdmin={isAdmin}
              cronogramasCreated={userStats.cronogramasCreated}
              flashcardsCreated={userStats.flashcardsCreated}
              personalExamsCreated={userStats.personalExamsCreated}
              showUpgradeButton
            />
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════
            3. QUICK ACTION HUB
           ═══════════════════════════════════════════════════════ */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold tracking-tight">Acesso Rapido</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon
              return (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.35, delay: 0.15 + index * 0.06 }}
                  onClick={() => router.push(action.href)}
                  className={`
                    glass-action group relative p-5 sm:p-6 rounded-2xl text-left
                    transition-all duration-300 hover-glow-green hover-lift
                    hover:scale-[1.02] active:scale-[0.98]
                    bg-gradient-to-br ${action.gradient} ${action.hoverGradient}
                  `}
                >
                  {/* Icon */}
                  <div
                    className="mb-4 p-2.5 rounded-xl w-fit transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg"
                    style={{
                      backgroundColor: `${action.color}15`,
                      boxShadow: 'none',
                    }}
                  >
                    <Icon
                      className="h-5 w-5 sm:h-6 sm:w-6 transition-colors duration-300"
                      style={{ color: action.color }}
                    />
                  </div>

                  {/* Title + Description */}
                  <h3 className="font-semibold text-sm sm:text-base mb-1">{action.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {action.description}
                  </p>

                  {/* Arrow indicator */}
                  <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-0 group-hover:translate-x-0">
                    <ChevronRight
                      className="h-4 w-4 text-muted-foreground"
                    />
                  </div>
                </motion.button>
              )
            })}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            4. RECENT ACTIVITY TIMELINE
           ═══════════════════════════════════════════════════════ */}
        {recentExams.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.6 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-lg font-semibold tracking-tight">Atividade Recente</h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/provas')}
                className="text-xs text-muted-foreground hover:text-foreground gap-1 group"
              >
                Ver todas
                <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </div>

            {/* Horizontal scroll cards */}
            <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
              {recentExams.map((exam, index) => (
                <motion.div
                  key={exam._id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, delay: 0.65 + index * 0.08 }}
                  onClick={() => router.push(`/exam/${exam._id}`)}
                  className="
                    glass-stat min-w-[260px] sm:min-w-[300px] flex-shrink-0 p-5 rounded-2xl
                    cursor-pointer group hover-glow-green hover-lift
                    transition-all duration-300
                  "
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm line-clamp-1 mb-1 group-hover:text-primary transition-colors">
                        {exam.title}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {exam.numberOfQuestions} questoes
                      </p>
                    </div>
                    {exam.isPersonalExam ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 font-medium flex-shrink-0 ml-2">
                        Pessoal
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium flex-shrink-0 ml-2">
                        Geral
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>
                        {new Date(exam.startTime).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                        })}
                      </span>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                  </div>
                </motion.div>
              ))}

              {/* "See more" card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, delay: 0.85 }}
                onClick={() => router.push('/provas')}
                className="
                  min-w-[140px] flex-shrink-0 p-5 rounded-2xl
                  cursor-pointer group transition-all duration-300
                  border border-dashed border-border/50 hover:border-primary/30
                  flex flex-col items-center justify-center gap-2
                  hover:bg-primary/5
                "
              >
                <div className="p-2 rounded-full bg-muted group-hover:bg-primary/10 transition-colors">
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <span className="text-xs text-muted-foreground group-hover:text-primary font-medium transition-colors">
                  Ver todas
                </span>
              </motion.div>
            </div>
          </motion.section>
        )}

        {/* ═══════════════════════════════════════════════════════
            5. SMART STUDY INSIGHTS
           ═══════════════════════════════════════════════════════ */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.7 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <h2 className="text-lg font-semibold tracking-tight">Insights de Estudo</h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {insights.map((insight, index) => {
              const Icon = insight.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.75 + index * 0.08 }}
                  className="
                    glass-stat p-5 rounded-2xl
                    hover-glow-orange hover-lift
                    transition-all duration-300
                    group cursor-default
                  "
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="p-2.5 rounded-xl flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
                      style={{ backgroundColor: `${insight.color}15` }}
                    >
                      <Icon className="h-5 w-5" style={{ color: insight.color }} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm mb-1">{insight.title}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {insight.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.section>

        {/* ═══════════════════════════════════════════════════════
            6. DOAÇÕES PIX — Apoie o DomineAqui
           ═══════════════════════════════════════════════════════ */}
        <DashboardDoacaoSection />
      </div>
    </div>
  )
}

// ─── Dashboard Donation Section ─────────────────────────────────
function DashboardDoacaoSection() {
  const [formOpen, setFormOpen] = useState(false)

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.9 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Heart className="h-4 w-4 text-rose-500 fill-rose-500" />
          <h2 className="text-lg font-semibold tracking-tight">Apoie o DomineAqui</h2>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
          {/* Conteúdo de doação (compacto) */}
          <DoacaoContent compact onDonateClick={() => setFormOpen(true)} />

          {/* Ranking lateral */}
          <div className="glass-stat rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <h3 className="text-sm font-semibold">Top Doadores</h3>
            </div>
            <DoacaoRanking compact />
          </div>
        </div>
      </motion.section>

      <DoacaoForm open={formOpen} onClose={() => setFormOpen(false)} />
    </>
  )
}

// ─── Main Page Component ────────────────────────────────────────
export default function DashboardPage() {
  return (
    <AppShell>
      <DashboardContent />
    </AppShell>
  )
}
