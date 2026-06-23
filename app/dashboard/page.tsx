'use client'

import { useEffect, useState, useMemo } from 'react'
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
  ChevronDown,
  ChevronUp,
  Flame,
  BookOpen,
  Lightbulb,
  GraduationCap,
  Activity,
  HeartPulse,
  Heart,
  Download,
  Package,
} from 'lucide-react'
import { DoacaoContent } from '@/components/doacoes/doacao-content'
import { DoacaoRanking } from '@/components/doacoes/doacao-ranking'
import { DoacaoForm } from '@/components/doacoes/doacao-form'
import { PendingReviewReminder } from '@/components/reviews/pending-review-reminder'

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
const MOTIVATIONAL_PHRASES = [
  "Enquanto você hesita, alguém está revisando o que você ainda não estudou.",
  "Residência não cai do céu. Ela cai para quem fez o processo todo.",
  "A dúvida que você ignorou hoje vai ser a questão que você erra amanhã.",
  "Medicina não perdoa lacunas. Preencha as suas.",
  "O cansaço é real. A desistência é uma escolha.",
  "A consistência bate o talento quando o talento não é consistente.",
  "Não existe revisar depois. Existe revisar agora ou errar na hora H.",
  "Cada flashcard revisado é um passo que a maioria não deu.",
  "Você não está estudando para uma prova. Está estudando para ser bom.",
  "A prova vai chegar do mesmo jeito. A questão é: você vai estar pronto?",
  "Aprovação não é sorte. É o resultado de repetição honesta.",
  "Você não precisa de motivação. Você precisa de disciplina.",
  "Não compare sua jornada com a de ninguém. Compare com quem você era ontem.",
  "Cada vez que você abre esse app em vez de rolar o feed, você ganha.",
  "O candidato que passou não era mais inteligente. Era mais consistente.",
  "Estudar quando não tem vontade é o que separa aprovados dos que tentam de novo.",
  "A prova é justa. Ela mede exatamente o que você preparou.",
  "Nenhum aprovado ficou de fora do conteúdo que achou chato.",
  "Medicina não é só ciência. É comprometimento com o ser humano.",
  "O residente que você quer ser já está sendo construído agora.",
  "Não espere disposição para começar. Comece e a disposição aparece.",
  "Estudar com método é trabalhar com inteligência, não só com esforço.",
  "O seu eu de daqui a dois anos vai agradecer ou cobrar esse momento.",
  "Quando você domina o básico, o avançado vira consequência.",
  "A sua dedicação não precisa de público. Ela precisa de resultado.",
  "Medicina é para quem não desiste de entender.",
  "A questão que você acha impossível tem uma resposta. Encontre ela.",
  "Nenhum médico brilhante chegou lá sem noites assim.",
  "Você não sabe tudo ainda. Mas sabe mais do que ontem.",
  "A excelência é a soma de dias ordinários bem aproveitados.",
  "O que você aprende quando está com preguiça é o que te diferencia.",
  "Cada revisão fortalece o que já estava e ancora o que é novo.",
  "A pressão da prova é menor do que a pressão de não estar preparado.",
  "Estude como se o paciente do futuro dependesse disso. Porque depende.",
  "A motivação vai e vem. A rotina fica.",
  "Hoje é um dia que nunca vai voltar. Use-o.",
  "Cada área que você domina é uma frente de batalha que você fecha.",
  "Confiança vem de preparação, não de esperança.",
  "Você está construindo algo que ninguém pode tirar de você.",
  "A residência que você quer tem uma lista de aprovados. Esteja nela.",
  "Você decidiu ser médico. Decida ser preparado também.",
  "O candidato que passa estuda o que é difícil, não só o que gosta.",
  "Erro corrigido é progresso. Erro ignorado é armadilha.",
  "Quanto mais você entende, menos você precisa memorizar.",
  "O dia que você não tem vontade é o dia mais importante para estudar.",
  "Resultado é a soma do que você fez quando não estava afim.",
  "Não existe fase fácil no caminho certo. Só fases necessárias.",
  "A sua presença aqui já é um ato de disciplina. Continue.",
  "Você passou por dias piores do que esse. E chegou até aqui.",
  "Você não precisa de um dia perfeito. Precisa de um dia feito.",
  "Cansado é normal. Derrotado é uma narrativa que você pode reescrever.",
  "Cada sessão de estudo é um tijolo. A casa é o que você está construindo.",
  "A nota que você quer exige o esforço que você ainda não deu.",
  "Não existe 'não sou bom em fisiologia'. Existe 'ainda não estudei o suficiente'.",
  "Você não é a sua nota. Você é o que você faz depois dela.",
  "O estudante que você era no início do ano não conseguia o que você consegue agora.",
  "Conhecimento acumulado não desaparece. Continue acumulando.",
  "Abriu o material. Está presente. Já venceu o dia.",
  "Não subestime a revisão. É ela que transforma leitura em memória.",
  "Uma questão por vez. Um dia por vez. Uma semana por vez.",
  "A diferença entre você e quem passou antes: eles não pararam.",
  "Medicina é longa. Mas o caminho certo nunca é o mais curto.",
  "O seu futuro paciente merece que você estude esse conteúdo agora.",
  "Foco não é ausência de distração. É voltar quando você se distraiu.",
  "Cada erro no simulado é uma questão a menos para errar na real.",
  "Você tem o recurso. Você tem o tempo. Agora depende só de você.",
  "Não subestime uma hora de estudo focado. Ela faz diferença real.",
  "A anatomia que te travou agora vai estar na prova. Resolva isso hoje.",
  "A consistência de 30 dias supera a intensidade de 3 dias de surto.",
  "Todo mundo acha que vai estudar amanhã. Você estuda hoje.",
  "A prova não sabe que você estava cansado. Ela só vê o que você marcou.",
  "Você não precisa ser o mais inteligente da sala. Precisa ser o mais preparado.",
  "Revisar é entediante. Reprovar é pior.",
  "Sua próxima sessão pode ser a que clica tudo que estava travado.",
  "A medicina exige tudo de você. Dê tudo.",
  "Cada vez que você estuda o difícil, você fecha uma lacuna que pode custar caro.",
  "Não mude o objetivo. Mude a estratégia quando necessário.",
  "Você está no processo. O processo está funcionando.",
  "Não existe conhecimento pequeno em medicina. Tudo conecta.",
  "Cada página virada é território conquistado.",
  "A sequência importa. Não pule etapas.",
  "Você escolheu um caminho difícil. Isso prova que você aguenta um caminho difícil.",
  "Tudo que você aprende hoje reduz o que você precisa decorar amanhã.",
  "Estude uma coisa bem feita. Não mil coisas por cima.",
  "Passou uma hora estudando? Você venceu 60 minutos que não voltam.",
  "Não existe atalho para competência. Existe o caminho, e você nele.",
  "Cada questão respondida te coloca mais perto do estado de dominância.",
  "Você tem o mapa. Agora ande.",
  "Medicina é vocação e é técnica. Desenvolva os dois.",
  "O que você não revisou hoje vai estar na prova. Revise.",
  "Abrir o material foi a parte mais difícil. Você já fez isso.",
  "Biomédica, Médica, Psicossocial — domine as três ou pague o preço.",
  "A régua certa não é o quanto você estudou. É o quanto você reteve.",
  "Você está aqui. Isso já é mais do que a maioria faz.",
  "O seu esforço de hoje é o seu resultado de amanhã.",
  "Cinco anos de graduação passam. A residência que você escolher, fica.",
  "Decida o nível de excelência que você aceita e defenda ele todo dia.",
  "Questão difícil não é inimigo. É onde você cresce onde era fraco.",
  "Você tem tudo que precisa. Falta só usar.",
  "Seja o foco. Seja a referência. Seja o médico que o mundo precisa.",
]

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
  const [phraseIndex, setPhraseIndex] = useState(() =>
    Math.floor(Math.random() * MOTIVATIONAL_PHRASES.length)
  )

  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex(i => (i + 1) % MOTIVATIONAL_PHRASES.length)
    }, 7000)
    return () => clearInterval(interval)
  }, [])
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
      title: 'Flashcards IA',
      description: 'Gerados por IA, repeticao espacada',
      icon: Brain,
      href: '/flashcards/ia',
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

                {/* Rotating Motivational Phrase */}
                <div className="h-6 overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={phraseIndex}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.45, ease: 'easeInOut' }}
                      className="text-emerald-300/90 text-sm font-medium leading-6"
                    >
                      {MOTIVATIONAL_PHRASES[phraseIndex]}
                    </motion.p>
                  </AnimatePresence>
                </div>

                <p className="text-white/60 max-w-lg text-sm sm:text-base leading-relaxed">
                  Cronogramas, flashcards e provas com ementas completas de Ciências Médicas, Ciências Psicossociais, Ciências Biomédicas e Ciências Odontológicas.
                </p>

                {/* Academic Focus Badges */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-xs font-medium border border-white/10">
                    <GraduationCap className="h-3.5 w-3.5" />
                    Ciências Médicas
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-xs font-medium border border-white/10">
                    <BookOpen className="h-3.5 w-3.5" />
                    Ciências Psicossociais
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-xs font-medium border border-white/10">
                    <BookOpen className="h-3.5 w-3.5" />
                    Ciências Biomédicas
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-xs font-medium border border-white/10">
                    <BookOpen className="h-3.5 w-3.5" />
                    Ciências Odontológicas
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

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.55 }}
        >
          <PendingReviewReminder />
        </motion.div>

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
            6. MEUS MATERIAIS
           ═══════════════════════════════════════════════════════ */}
        <MeusMaterialsWidget />

        {/* ═══════════════════════════════════════════════════════
            7. DOAÇÕES PIX — Apoie o DomineAqui
           ═══════════════════════════════════════════════════════ */}
        <DashboardDoacaoSection />
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

function MeusMaterialsWidget() {
  const router = useRouter()
  const [materials, setMaterials] = useState<DashMaterial[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    fetch('/api/materiais', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : { materials: [] })
      .then(d => {
        const mine = (d.materials || []).filter((m: DashMaterial) => m._hasAccess)
        setMaterials(mine)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (!loading && materials.length === 0) return null

  const visible = expanded ? materials : materials.slice(0, 4)

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.78 }}
    >
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="glass-stat rounded-2xl p-3 animate-pulse">
                    <div className="h-20 rounded-xl bg-muted mb-2" />
                    <div className="h-3 bg-muted rounded w-3/4" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {visible.map((m, i) => (
                    <motion.div
                      key={m._id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.2 }}
                    >
                      <Link
                        href={`/materiais/${m._id}`}
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
                    </motion.div>
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
    </motion.section>
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
