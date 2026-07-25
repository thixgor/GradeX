'use client'

import { useCallback, useEffect, useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { AppShell, useAppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { PlanLimitsCard } from '@/components/plan-limits-card'
import { AccountType } from '@/lib/types'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText,
  Brain,
  BookMarked,
  Sparkles,
  ArrowRight,
  Trophy,
  Clock,
  Target,
  Play,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Flame,
  Activity,
  Package,
  Quote,
} from 'lucide-react'
import { PendingReviewReminder } from '@/components/reviews/pending-review-reminder'
import { QuestaoDoDiaCard } from '@/components/retencao/questao-do-dia-card'
import { ExperienceCarousel } from '@/components/dashboard/experience-carousel'

// O overlay carrega o acervo completo de frases; fora do chunk inicial.
const PhrasesOverlay = dynamic(() => import('@/components/dashboard/phrases-overlay'), { ssr: false })

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

// ─── Motivational Phrases ───────────────────────────────────────
// Semente mínima para a primeira pintura. O acervo completo (~43 KB) é
// carregado por `import()` quando o aparelho estiver ocioso — antes ele
// viajava inteiro no chunk inicial da tela mais visitada do app.
const PHRASE_SEED = [
  "Consistência não é fazer o máximo todos os dias. É fazer o suficiente mesmo quando tudo em você pede para parar. O médico que você quer ser foi construído exatamente nos dias em que você não tinha vontade nenhuma de abrir um livro.",
  "Você não precisa de um mês perfeito. Você precisa de um mês feito. A diferença entre os dois é que o primeiro existe só na sua cabeça, e o segundo existe no seu histórico de estudo — e é esse que vai aparecer no resultado.",
  "O foco não vem antes da ação. Vem durante. Você não espera ter vontade de estudar para começar a estudar — você começa, e depois de alguns minutos o foco aparece. Quem espera o estado ideal para começar nunca começa de verdade.",
]

// ─── Dashboard Content ──────────────────────────────────────────
function DashboardContent() {
  const router = useRouter()
  const { user, isAdmin, accountType } = useAppShell()

  const [stats, setStats] = useState({
    questionsAnswered: 0,
    examsCompleted: 0,
    // Aproveitamento no banco de questões. Antes esse cartão mostrava
    // "Flashcards Estudados", um campo que /api/user/statistics nunca devolveu
    // — ou seja, um zero permanente na cara de todo mundo.
    accuracyRate: 0,
    streakDays: 0,
  })
  const [recentExams, setRecentExams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Acervo de frases: começa com a semente e é trocado pelo conjunto completo
  // assim que o aparelho fica ocioso.
  const [phrases, setPhrases] = useState<string[]>(PHRASE_SEED)
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [showLyrics, setShowLyrics] = useState(false)

  useEffect(() => {
    let cancelled = false
    const load = () => {
      import('@/lib/motivational-phrases')
        .then(m => {
          if (cancelled) return
          setPhrases(m.MOTIVATIONAL_PHRASES)
          setPhraseIndex(Math.floor(Math.random() * m.MOTIVATIONAL_PHRASES.length))
        })
        .catch(() => {})
    }
    const idle = (window as any).requestIdleCallback
    const handle = idle ? idle(load, { timeout: 3000 }) : window.setTimeout(load, 1200)
    return () => {
      cancelled = true
      const cancelIdle = (window as any).cancelIdleCallback
      if (idle && cancelIdle) cancelIdle(handle)
      else window.clearTimeout(handle)
    }
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex(i => (i + 1) % phrases.length)
    }, 12000)
    return () => clearInterval(interval)
  }, [phrases.length])

  const [userStats, setUserStats] = useState({
    cronogramasCreated: 0,
    flashcardsCreated: 0,
    personalExamsCreated: 0,
    materialsOwned: 0,
  })

  const registerMaterialsOwned = useCallback((count: number) => {
    setUserStats(prev => (prev.materialsOwned === count ? prev : { ...prev, materialsOwned: count }))
  }, [])

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
          accuracyRate: Math.round(data.bankAccuracyRate || 0),
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
  // `ring` só onde a porcentagem é real: para contagens não existe teto, e o
  // anel antigo (max = Math.max(valor, 100)) ficava cheio a partir de 100 —
  // parecia meta cumprida sem medir nada.
  const quickStats = [
    {
      label: 'Questões respondidas',
      value: stats.questionsAnswered,
      icon: FileText,
      color: '#468152',
      iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      ring: false,
      suffix: '',
    },
    {
      label: 'Provas realizadas',
      value: stats.examsCompleted,
      icon: Trophy,
      color: '#E2A43E',
      iconBg: 'bg-amber-500/10 dark:bg-amber-500/20',
      ring: false,
      suffix: '',
    },
    {
      label: 'Aproveitamento no banco',
      value: stats.accuracyRate,
      icon: Target,
      color: '#8b5cf6',
      iconBg: 'bg-violet-500/10 dark:bg-violet-500/20',
      ring: true,
      suffix: '%',
    },
    {
      label: 'Dias de estudo',
      value: stats.streakDays,
      icon: Flame,
      color: '#f97316',
      iconBg: 'bg-orange-500/10 dark:bg-orange-500/20',
      ring: false,
      suffix: '',
    },
  ]

  // ─── Smart study insights ─────────────────────────────────────
  // Só o que vem de dado real do usuário. A dica genérica fixa ("revise antes
  // de dormir") saiu: aparecia para todo mundo, todo dia, sem nunca mudar.
  const insights = useMemo(() => {
    const items: { icon: typeof Flame; color: string; title: string; description: string }[] = []

    if (stats.streakDays >= 7) {
      items.push({
        icon: Flame,
        color: '#f97316',
        title: `${stats.streakDays} dias seguidos`,
        description: 'Consistência é o que converte esforço em resultado. Continue assim.',
      })
    } else if (stats.streakDays > 0) {
      items.push({
        icon: Target,
        color: '#468152',
        title: 'Construa sua sequência',
        description: `Você tem ${stats.streakDays} dia${stats.streakDays > 1 ? 's' : ''} de estudo. Tente chegar a 7.`,
      })
    }

    if (stats.questionsAnswered >= 20 && stats.accuracyRate > 0) {
      items.push(
        stats.accuracyRate >= 70
          ? {
              icon: Target,
              color: '#8b5cf6',
              title: `${stats.accuracyRate}% de acerto`,
              description: 'Bom domínio no banco de questões. Avance para os assuntos que ainda evita.',
            }
          : {
              icon: Target,
              color: '#8b5cf6',
              title: `${stats.accuracyRate}% de acerto`,
              description: 'Revise os erros antes de responder mais: a lacuna se fecha na revisão, não no volume.',
            },
      )
    }

    if (stats.examsCompleted === 0 && stats.questionsAnswered > 0) {
      items.push({
        icon: Trophy,
        color: '#E2A43E',
        title: 'Faça sua primeira prova',
        description: 'Responder questões soltas treina conteúdo; a prova treina tempo e pressão.',
      })
    }

    return items.slice(0, 3)
  }, [stats])

  return (
    <div className="surface-page">

      {/* Overlay das frases — componente carregado sob demanda. */}
      {showLyrics && (
        <PhrasesOverlay
          index={phraseIndex}
          onSelect={setPhraseIndex}
          onClose={() => setShowLyrics(false)}
        />
      )}

      <div className="mx-auto max-w-7xl space-y-5 p-4 pb-24 sm:space-y-6 sm:p-6 sm:pb-8 lg:p-8 lg:pb-10">

        {/* ═══════════════════════════════════════════════════════
            1. HERO FOCUS SECTION
           ═══════════════════════════════════════════════════════ */}
        <section className="dash-rise relative overflow-hidden rounded-lg hero-gradient">
          <div className="relative z-10 p-4 sm:p-7 lg:p-9">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              {/* Esquerda: saudação + frase */}
              <div className="min-w-0 flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#E2A43E]" />
                  <span className="font-clinical text-[11px] font-semibold uppercase tracking-[0.14em] text-[#F0EBE0]/70">
                    {greeting}
                  </span>
                </div>
                <h1 className="font-heading text-2xl font-semibold leading-tight tracking-tight text-[#F0EBE0] sm:text-3xl lg:text-[2.15rem]">
                  {firstName ? `${firstName}, ` : ''}
                  <em className="not-italic text-[#6BA876]">seja o foco.</em>
                </h1>

                {/* Frase rotativa com ALTURA RESERVADA. Antes ela vivia num
                    `motion.div layout` e as frases variam de 200 a 400
                    caracteres: a cada 12 segundos a página inteira mudava de
                    altura sozinha, empurrando o conteúdo enquanto se lia. */}
                <div className="flex max-w-lg items-start gap-3">
                  <div className="relative min-h-[5.5rem] flex-1 pl-4 sm:min-h-[4.5rem]">
                    <span className="absolute bottom-0 left-0 top-0 w-0.5 rounded-full bg-gradient-to-b from-emerald-400/80 to-amber-400/50" />
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.p
                        key={phraseIndex}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.55, ease: 'easeInOut' }}
                        className="line-clamp-4 text-sm font-medium italic leading-relaxed text-emerald-50/90 sm:line-clamp-3 sm:text-[15px]"
                      >
                        {phrases[phraseIndex] ?? phrases[0]}
                      </motion.p>
                    </AnimatePresence>
                  </div>
                  <button
                    onClick={() => setShowLyrics(true)}
                    aria-label="Ver todas as frases"
                    title="Ver todas as frases"
                    className="mt-0.5 inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/40 transition-all duration-200 active:scale-95 hover:border-white/20 hover:bg-white/15 hover:text-emerald-300"
                  >
                    <Quote className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Direita: ação principal */}
              <div className="flex flex-col items-stretch gap-3 sm:items-end">
                <Button
                  onClick={() => router.push('/provas')}
                  className="group h-11 rounded-md border-0 bg-[#CE5929] px-5 text-sm font-semibold text-white shadow-[0_8px_20px_-10px_rgba(206,89,41,0.6)] hover:bg-[#CE5929]/90"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Continuar estudando
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Button>

                {stats.streakDays > 0 && (
                  <div className="flex items-center gap-2 text-sm text-white/50 sm:justify-end">
                    <Flame className="h-4 w-4 text-orange-400" />
                    <span>{stats.streakDays} dias consecutivos</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Textura de pontos */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '22px 22px',
            }}
          />

          {/* Orbes decorativos */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-violet-500/8 blur-3xl" />
        </section>

        {/* ═══════════════════════════════════════════════════════
            1.5 QUESTÃO DO DIA (gatilho de retorno diário)
           ═══════════════════════════════════════════════════════ */}
        <QuestaoDoDiaCard />

        {/* ═══════════════════════════════════════════════════════
            2. PERFORMANCE OVERVIEW CARDS
           ═══════════════════════════════════════════════════════ */}
        <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {quickStats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div
                key={stat.label}
                // Entrada em CSS: eram quatro `motion.div` com spring próprio
                // só para aparecer. E saiu o `stat-card-glow`, cujo brilho
                // rodava `infinite` — composição contínua numa tela parada.
                className="glass-stat dash-rise hover-glow-brand hover-lift group relative cursor-default rounded-2xl p-4 transition-all duration-300 sm:p-5"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <div
                  className="absolute left-0 right-0 top-0 h-[3px] rounded-t-2xl opacity-70 transition-opacity duration-300 group-hover:opacity-100"
                  style={{ background: `linear-gradient(90deg, transparent, ${stat.color}, transparent)` }}
                />
                <div className="mb-3 flex items-start justify-between">
                  <div className={`rounded-xl p-2.5 ${stat.iconBg} transition-transform duration-300 group-hover:scale-110`}>
                    <Icon className="h-5 w-5" style={{ color: stat.color }} />
                  </div>
                  {/* Anel só onde 0-100% significa alguma coisa. */}
                  {stat.ring && (
                    <ProgressRing value={stat.value} max={100} size={36} strokeWidth={3} color={stat.color} />
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold tracking-tight sm:text-3xl">
                    <AnimatedNumber value={stat.value} delay={150 + index * 80} />
                    {stat.suffix}
                  </p>
                  <p className="text-xs leading-tight text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            )
          })}
        </section>

        {/* ═══════════════════════════════════════════════════════
            3. EXPERIÊNCIAS DO SITE (carrossel deslizável)
           ═══════════════════════════════════════════════════════ */}
        <ExperienceCarousel
          stats={{
            examsCompleted: stats.examsCompleted,
            questionsAnswered: stats.questionsAnswered,
            cronogramasCreated: userStats.cronogramasCreated,
            materialsOwned: userStats.materialsOwned,
          }}
        />

        {/* Plan Limits Card - Free users */}
        {accountType === 'gratuito' && !loading && (
          <div className="dash-rise">
            <PlanLimitsCard
              accountType={accountType as AccountType}
              isAdmin={isAdmin}
              cronogramasCreated={userStats.cronogramasCreated}
              flashcardsCreated={userStats.flashcardsCreated}
              personalExamsCreated={userStats.personalExamsCreated}
              showUpgradeButton
            />
          </div>
        )}

        <div className="dash-rise">
          <PendingReviewReminder />
        </div>

        {/* ═══════════════════════════════════════════════════════
            4. RECENT ACTIVITY TIMELINE
           ═══════════════════════════════════════════════════════ */}
        {recentExams.length > 0 && (
          <section className="dash-rise">
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
            <div className="scrollbar-hide fade-scroll-x flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain scroll-px-4 pb-2 -mx-4 px-4 sm:mx-0 sm:scroll-px-0 sm:gap-4 sm:px-0">
              {recentExams.map((exam, index) => (
                <Link
                  key={exam._id}
                  href={`/exam/${exam._id}`}
                  style={{ animationDelay: `${index * 50}ms`, touchAction: 'manipulation' }}
                  className="glass-stat dash-rise hover-glow-green hover-lift group block min-w-[260px] flex-shrink-0 snap-start rounded-2xl p-5 transition-all duration-300 sm:min-w-[300px]"
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
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 font-medium flex-shrink-0 ml-2 inline-flex items-center gap-1">
                        <Sparkles className="h-2.5 w-2.5" />
                        Pessoal IA
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
                </Link>
              ))}

              {/* "See more" card */}
              <Link
                href="/provas"
                style={{ touchAction: 'manipulation' }}
                className="group flex min-w-[140px] flex-shrink-0 snap-start flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border/50 p-5 transition-all duration-300 hover:border-primary/30 hover:bg-primary/5"
              >
                <div className="p-2 rounded-full bg-muted group-hover:bg-primary/10 transition-colors">
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <span className="text-xs text-muted-foreground group-hover:text-primary font-medium transition-colors">
                  Ver todas
                </span>
              </Link>
            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════
            5. SMART STUDY INSIGHTS
           ═══════════════════════════════════════════════════════ */}
        {insights.length > 0 && (
          <section className="dash-rise">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <h2 className="text-lg font-semibold tracking-tight">Insights de estudo</h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {insights.map((insight, index) => {
                const Icon = insight.icon
                return (
                  <div
                    key={index}
                    style={{ animationDelay: `${index * 60}ms` }}
                    className="glass-stat dash-rise hover-glow-orange hover-lift group cursor-default rounded-2xl p-5 transition-all duration-300"
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className="flex-shrink-0 rounded-xl p-2.5 transition-transform duration-300 group-hover:scale-110"
                        style={{ backgroundColor: `${insight.color}15` }}
                      >
                        <Icon className="h-5 w-5" style={{ color: insight.color }} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="mb-1 text-sm font-semibold">{insight.title}</h3>
                        <p className="text-xs leading-relaxed text-muted-foreground">{insight.description}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════
            6. MEUS MATERIAIS
           ═══════════════════════════════════════════════════════ */}
        <MeusMaterialsWidget onCount={registerMaterialsOwned} />
      </div>
    </div>
  )
}

// ─── Meus Materiais Widget ──────────────────────────────────────
interface DashMaterial {
  _id: string
  title: string
  coverImage?: string
  type: string
  pricing: string
  _hasAccess?: boolean
  _isPurchased?: boolean
  _hasGroupAccess?: boolean
}

const TYPE_ICON_MAP: Record<string, React.ReactNode> = {
  pdf: <FileText className="h-4 w-4" />,
  video: <Play className="h-4 w-4" />,
  video_embed: <Play className="h-4 w-4" />,
  flashcard_deck: <Brain className="h-4 w-4" />,
}

function MeusMaterialsWidget({ onCount }: { onCount?: (count: number) => void }) {
  const [materials, setMaterials] = useState<DashMaterial[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    fetch('/api/materiais', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : { materials: [] })
      .then(d => {
        const mine = (d.materials || []).filter((m: DashMaterial) => m._hasAccess)
        setMaterials(mine)
        onCount?.(mine.length)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [onCount])

  if (!loading && materials.length === 0) return null

  const visible = expanded ? materials : materials.slice(0, 4)

  return (
    <section className="dash-rise">
      {/* Header */}
      <button
        className="w-full flex items-center justify-between mb-3 group"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-2">
          <BookMarked className="h-4 w-4 text-primary" />
          <h2 className="text-lg font-semibold tracking-tight">Meus Materiais</h2>
          {!loading && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
              {materials.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/materiais?tab=mine"
            onClick={e => e.stopPropagation()}
            className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 group/link"
          >
            Ver todos
            <ArrowRight className="h-3 w-3 group-hover/link:translate-x-0.5 transition-transform" />
          </Link>
          {expanded
            ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
            : <ChevronDown className="h-4 w-4 text-muted-foreground" />
          }
        </div>
      </button>

      {/* Content */}
      <AnimatePresence initial={false}>
        {(expanded || true) && (
          <motion.div
            key="meus-materiais-content"
            initial={false}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            {loading ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="glass-stat rounded-2xl p-3 animate-pulse">
                    <div className="h-20 rounded-xl bg-muted mb-2" />
                    <div className="h-3 bg-muted rounded w-3/4" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                {/* Trilho deslizante no celular, grade a partir do tablet —
                    mesmo tato do carrossel de experiências. */}
                <div className="scrollbar-hide fade-scroll-x flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain scroll-px-4 -mx-4 px-4 sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0">
                  {visible.map((m, i) => (
                    <div
                      key={m._id}
                      className="dash-rise w-[44%] shrink-0 snap-start sm:w-auto"
                      style={{ animationDelay: `${i * 40}ms` }}
                    >
                      <Link
                        href={`/materiais/${m._id}`}
                        style={{ touchAction: 'manipulation' }}
                        className="group block glass-stat rounded-2xl overflow-hidden hover-lift transition-all duration-300 hover:shadow-lg hover:shadow-primary/10"
                      >
                        <div className="relative h-20 bg-muted/40">
                          {m.coverImage ? (
                            <Image
                              src={m.coverImage}
                              alt={m.title}
                              fill
                              className="object-cover transition-transform duration-500 group-hover:scale-105"
                              sizes="(max-width: 640px) 50vw, 25vw"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
                              {TYPE_ICON_MAP[m.type] ?? <Package className="h-4 w-4 text-muted-foreground" />}
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                          <div className="absolute bottom-1.5 left-2">
                            <span className="text-[9px] font-bold text-white/80 uppercase tracking-wide">
                              {m.type === 'flashcard_deck' ? 'Flashcard' : m.type === 'video_embed' ? 'Vídeo' : m.type?.toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="p-2.5">
                          <p className="text-xs font-semibold line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                            {m.title}
                          </p>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
                {materials.length > 4 && (
                  <button
                    onClick={() => setExpanded(e => !e)}
                    className="mt-3 w-full py-2 rounded-xl border border-dashed border-border/50 hover:border-primary/30 text-xs text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-1.5"
                  >
                    {expanded
                      ? <><ChevronUp className="h-3 w-3" /> Ver menos</>
                      : <><ChevronDown className="h-3 w-3" /> Ver mais {materials.length - 4} materiais</>
                    }
                  </button>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
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
