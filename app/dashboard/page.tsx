'use client'

import { useCallback, useEffect, useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { AppShell, useAppShell } from '@/components/app-shell'
import { readPageCache, writePageCache } from '@/lib/page-cache'
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
  Flame,
  Activity,
  Package,
  Quote,
  LayoutGrid,
  Gem,
} from 'lucide-react'
import { BuscaGlobal } from '@/components/busca/busca-global'
import { PendingReviewReminder } from '@/components/reviews/pending-review-reminder'
import { QuestaoDoDiaCard } from '@/components/retencao/questao-do-dia-card'
import { ContinueReading } from '@/components/materiais/continue-reading'
import { ComunidadeWhatsAppCard } from '@/components/comunidade-whatsapp'
import { ExperienceCarousel } from '@/components/dashboard/experience-carousel'
import { TourTrigger } from '@/components/dashboard/tour-trigger'
import { usePlatformTour } from '@/hooks/use-platform-tour'
import { CartaoDeFocoDoPainel, PainelDeDesempenho, type DiaDoPainel } from '@/components/dashboard/painel-de-desempenho'
import { GrupoDeSecoes, SecaoRecolhivel, useSecoesAbertas } from '@/components/dashboard/secoes-recolhiveis'
import type { ResumoDoPerfil } from '@/components/profile/overview-tab'

// O overlay carrega o acervo completo de frases; fora do chunk inicial.
const PhrasesOverlay = dynamic(() => import('@/components/dashboard/phrases-overlay'), { ssr: false })

// O tour só é baixado quando abre de fato — quem já fez nunca paga por ele.
const PlatformTour = dynamic(
  () => import('@/components/dashboard/platform-tour').then(m => m.PlatformTour),
  { ssr: false },
)

// ─── Motivational Phrases ───────────────────────────────────────
// Semente mínima para a primeira pintura. O acervo completo (~43 KB) é
// carregado por `import()` quando o aparelho estiver ocioso — antes ele
// viajava inteiro no chunk inicial da tela mais visitada do app.
const PHRASE_SEED = [
  "Consistência não é fazer o máximo todos os dias. É fazer o suficiente mesmo quando tudo em você pede para parar. O médico que você quer ser foi construído exatamente nos dias em que você não tinha vontade nenhuma de abrir um livro.",
  "Você não precisa de um mês perfeito. Você precisa de um mês feito. A diferença entre os dois é que o primeiro existe só na sua cabeça, e o segundo existe no seu histórico de estudo — e é esse que vai aparecer no resultado.",
  "O foco não vem antes da ação. Vem durante. Você não espera ter vontade de estudar para começar a estudar — você começa, e depois de alguns minutos o foco aparece. Quem espera o estado ideal para começar nunca começa de verdade.",
]

// Chaves do cache de página (lib/page-cache.ts). Nada aqui é sensível: são
// contadores de estudo e os títulos das últimas provas — dado que a própria
// pessoa acabou de ver. Limite de plano, crédito e assinatura continuam
// vindo frescos do /api/bootstrap, como manda o comentário daquele módulo.
const DASHBOARD_STATS_CACHE_KEY = 'dashboard:stats'
const DASHBOARD_EXAMS_CACHE_KEY = 'dashboard:recent-exams'
const DASHBOARD_MATERIALS_CACHE_KEY = 'dashboard:materials'

interface DashboardStats {
  questionsAnswered: number
  examsCompleted: number
  /** Acerto nas questões objetivas de todas as fontes (banco, provas, quiz). */
  accuracyRate: number
  streakDays: number
  resumo?: ResumoDoPerfil
  ultimos14?: DiaDoPainel[]
}

// ─── Dashboard Content ──────────────────────────────────────────
function DashboardContent() {
  const router = useRouter()
  const { user, isAdmin, accountType, setSidebarOpen } = useAppShell()

  // Hidrata da última visita, de forma síncrona, no primeiro frame (ver
  // lib/page-cache.ts). A dashboard é a primeira tela depois do login e a mais
  // revisitada do app: sem isso, toda entrada mostrava 0 questões respondidas,
  // 0 provas, 0 dias de sequência e a lista de provas recentes vazia até as
  // três chamadas voltarem — um "carregando" disfarçado de dado zerado, que
  // depois pulava para o valor real. Agora os números da última visita
  // aparecem na hora e são corrigidos por baixo quando a resposta chega.
  /*
   * O cache é aplicado no efeito, e não no estado inicial: `readPageCache` lê
   * `sessionStorage`, que existe no navegador e não no servidor. Inicializando
   * o estado com ele, o HTML do servidor vinha zerado e o primeiro render do
   * cliente vinha com os números da última visita — a hidratação falha e o
   * React descarta a página (erro #422). O efeito roda antes de qualquer
   * pintura com dados, então os números da última visita continuam aparecendo
   * de imediato.
   */
  const [stats, setStats] = useState<DashboardStats>({
    questionsAnswered: 0,
    examsCompleted: 0,
    accuracyRate: 0,
    streakDays: 0,
  })
  const [recentExams, setRecentExams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const statsEmCache = readPageCache<DashboardStats>(DASHBOARD_STATS_CACHE_KEY)
    const provasEmCache = readPageCache<any[]>(DASHBOARD_EXAMS_CACHE_KEY)
    if (statsEmCache) {
      setStats(statsEmCache)
      setLoading(false)
    }
    if (provasEmCache) setRecentExams(provasEmCache)
  }, [])

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
        const proximo: DashboardStats = {
          questionsAnswered: data.questionsAnswered || 0,
          examsCompleted: data.examsCompleted || 0,
          accuracyRate: Math.round(data.accuracyRate || 0),
          streakDays: data.streakDays || 0,
          resumo: data.resumo,
          ultimos14: data.ultimos14,
        }
        setStats(proximo)
        writePageCache(DASHBOARD_STATS_CACHE_KEY, proximo)
      }

      if (examsRes.ok) {
        const data = await examsRes.json()
        const recentes = (data.exams || []).slice(0, 3)
        setRecentExams(recentes)
        writePageCache(DASHBOARD_EXAMS_CACHE_KEY, recentes)
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

  const firstName = user?.name?.split(' ')[0] || ''

  // ─── Tour interativo ───────────────────────────────────────────
  // Só arma a abertura automática depois que os dados chegam: o tour resolve
  // os passos contra o DOM, e disparar com a dashboard ainda em esqueleto
  // apagaria metade do roteiro por "alvo inexistente".
  const tour = usePlatformTour({ userId: user?.id, autoStart: !loading, autoStartDelayMs: 1200 })

  // O que fica guardado. Com o tour aberto, tudo abre: ele mede os alvos no
  // DOM, e um cartão dentro de uma linha fechada teria altura zero.
  const { abertas, alternar } = useSecoesAbertas({})
  const estaAberta = (id: string) => tour.open || !!abertas[id]
  const meusMateriais = useMeusMateriais(registerMaterialsOwned)

  // O menu lateral é overlay no celular: os passos que falam dele precisam
  // abri-lo antes de medir o alvo.
  const handleTourSidebar = useCallback(
    (open: boolean) => {
      if (typeof window === 'undefined' || window.innerWidth >= 1024) return
      setSidebarOpen(open)
    },
    [setSidebarOpen],
  )

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
              description: 'Bom domínio nas questões. Avance para os assuntos que ainda evita.',
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

      {/* Tour guiado da plataforma */}
      {tour.open && (
        <PlatformTour
          open={tour.open}
          initialStep={tour.initialStep}
          firstName={firstName}
          stats={{
            questionsAnswered: stats.questionsAnswered,
            examsCompleted: stats.examsCompleted,
            cronogramasCreated: userStats.cronogramasCreated,
          }}
          onSidebarRequest={handleTourSidebar}
          onDismiss={tour.dismiss}
          onFinish={tour.finish}
        />
      )}

      <div className="mx-auto max-w-7xl space-y-5 p-4 pb-24 sm:space-y-6 sm:p-6 sm:pb-8 lg:p-8 lg:pb-10">

        {/* ═══════════════════════════════════════════════════════
            0. BUSCA GLOBAL
            Primeira coisa da página: quem chega sabendo o que quer
            não deveria precisar caçar a área no menu.
           ═══════════════════════════════════════════════════════ */}
        {/* O atalho ⌘K vive na instância do menu lateral, que existe em todas
            as telas. Aqui ele fica desligado para o mesmo toque não abrir dois
            painéis sobrepostos. */}
        <BuscaGlobal
          className="dash-rise"
          atalhoGlobal={false}
          onAbrirTour={() => tour.start(tour.initialStep)}
        />

        {/* ═══════════════════════════════════════════════════════
            1. HERO FOCUS SECTION
           ═══════════════════════════════════════════════════════ */}
        {/* O "bom dia" saiu daqui: o cabeçalho já cumprimenta, e a mesma
            saudação duas vezes na primeira dobra era ruído. */}
        <section className="dash-rise relative overflow-hidden rounded-[24px] hero-gradient">
          <div className="relative z-10 p-5 sm:p-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              {/* Esquerda: nome + frase */}
              <div className="min-w-0 flex-1 space-y-3">
                <h1 className="font-heading text-2xl font-semibold leading-tight tracking-tight text-[#F0EBE0] sm:text-3xl lg:text-[2.15rem]">
                  {firstName ? `${firstName}, ` : ''}
                  <em className="not-italic text-[#6BA876]">seja o foco.</em>
                </h1>

                {/* Frase rotativa com ALTURA RESERVADA. Antes ela vivia num
                    `motion.div layout` e as frases variam de 200 a 400
                    caracteres: a cada 12 segundos a página inteira mudava de
                    altura sozinha, empurrando o conteúdo enquanto se lia. */}
                <div className="flex max-w-lg items-start gap-3">
                  <div className="relative min-h-[3rem] flex-1 pl-4">
                    <span className="absolute bottom-0 left-0 top-0 w-0.5 rounded-full bg-gradient-to-b from-emerald-400/80 to-amber-400/50" />
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.p
                        key={phraseIndex}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.55, ease: 'easeInOut' }}
                        className="line-clamp-2 text-sm font-medium italic leading-relaxed text-emerald-50/90 sm:text-[15px]"
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
                  data-tour="hero-cta"
                  onClick={() => router.push('/provas')}
                  className="dash-cta group h-11 rounded-full border-0 px-5 text-sm font-semibold text-white"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Continuar estudando
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Button>

                {/* Saída de emergência: quem não sabe o que fazer não precisa
                    descobrir sozinho. Fica colado na ação principal, na
                    primeira dobra, em todas as visitas. */}
                {tour.ready && (
                  <TourTrigger
                    status={tour.status}
                    pausedStep={tour.pausedStep}
                    onStart={() => tour.start(tour.initialStep)}
                  />
                )}

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
            1.6 CONTINUAR LENDO (retomada do PDF Viewer)
            Só aparece para quem tem leitura em andamento neste aparelho.
           ═══════════════════════════════════════════════════════ */}
        <ContinueReading className="dash-rise" />

        {/* ═══════════════════════════════════════════════════════
            1.7 COMUNIDADE NO WHATSAPP
            Ofertas, materiais gratuitos e simulados ao vivo. Some para
            quem já entrou; quem dispensa volta a ver semanas depois.
           ═══════════════════════════════════════════════════════ */}
        <ComunidadeWhatsAppCard className="dash-rise" />

        {/* ═══════════════════════════════════════════════════════
            2. DESEMPENHO + SESSÃO DE FOCO
            Todas as frentes de estudo, as duas últimas semanas e o
            caminho para os gráficos e o perfil; ao lado, o cronômetro —
            é aqui que o dia de estudo começa.
           ═══════════════════════════════════════════════════════ */}
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
          <PainelDeDesempenho
            resumo={stats.resumo ?? null}
            ultimos14={stats.ultimos14 ?? (loading ? null : [])}
          />
          <CartaoDeFocoDoPainel />
        </div>

        <div className="dash-rise">
          <PendingReviewReminder />
        </div>

        {/* ═══════════════════════════════════════════════════════
            3. MAIS PARA VOCÊ — o que é consulta, guardado.
            Cada linha diz o essencial fechada e abre ao toque (ver
            components/dashboard/secoes-recolhiveis.tsx).
           ═══════════════════════════════════════════════════════ */}
        <GrupoDeSecoes titulo="Mais para você">
          {recentExams.length > 0 && (
            <SecaoRecolhivel
              id="atividade"
              titulo="Atividade recente"
              resumo={`${recentExams[0].title}${recentExams.length > 1 ? ` e mais ${recentExams.length - 1}` : ''}`}
              icone={<Activity className="h-4 w-4" />}
              cor="provas"
              aberta={estaAberta('atividade')}
              onAlternar={() => alternar('atividade')}
              acao={{ rotulo: 'Ver todas', href: '/provas' }}
            >
              <div className="scrollbar-hide fade-scroll-x flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain scroll-px-4 pb-1 -mx-4 px-4 sm:mx-0 sm:scroll-px-0 sm:px-0">
                {recentExams.map((exam) => (
                  <Link
                    key={exam._id}
                    href={`/exam/${exam._id}`}
                    style={{ touchAction: 'manipulation' }}
                    className="dash-cartao group block min-w-[240px] flex-shrink-0 snap-start p-4 sm:min-w-[280px]"
                  >
                    <div className="mb-3 flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <h3 className="mb-1 line-clamp-1 text-sm font-semibold transition-colors group-hover:text-primary">
                          {exam.title}
                        </h3>
                        <p className="text-xs text-muted-foreground">{exam.numberOfQuestions} questões</p>
                      </div>
                      {exam.isPersonalExam ? (
                        <span className="ml-2 inline-flex flex-shrink-0 items-center gap-1 rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] font-medium text-violet-600 dark:text-violet-400">
                          <Sparkles className="h-2.5 w-2.5" />
                          Pessoal IA
                        </span>
                      ) : (
                        <span className="ml-2 flex-shrink-0 rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-600 dark:text-blue-400">
                          Geral
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>
                          {new Date(exam.startTime).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                        </span>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 transition-all group-hover:translate-x-0.5 group-hover:text-foreground" />
                    </div>
                  </Link>
                ))}
              </div>
            </SecaoRecolhivel>
          )}

          {insights.length > 0 && (
            <SecaoRecolhivel
              id="insights"
              titulo="Insights de estudo"
              resumo={insights.map((i) => i.title).join(' · ')}
              icone={<Sparkles className="h-4 w-4" />}
              cor="cronogramas"
              aberta={estaAberta('insights')}
              onAlternar={() => alternar('insights')}
            >
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {insights.map((insight, index) => {
                  const Icon = insight.icon
                  return (
                    <div key={index} className="dash-cartao flex items-start gap-3.5 p-4">
                      <div className="flex-shrink-0 rounded-xl p-2.5" style={{ backgroundColor: `${insight.color}15` }}>
                        <Icon className="h-5 w-5" style={{ color: insight.color }} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="mb-1 text-sm font-semibold">{insight.title}</h3>
                        <p className="text-xs leading-relaxed text-muted-foreground">{insight.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </SecaoRecolhivel>
          )}

          {(meusMateriais.loading || meusMateriais.materials.length > 0) && (
            <SecaoRecolhivel
              id="materiais"
              titulo="Meus materiais"
              resumo={
                meusMateriais.loading
                  ? 'Carregando sua estante…'
                  : `${meusMateriais.materials.length} ${meusMateriais.materials.length === 1 ? 'material' : 'materiais'} na sua estante`
              }
              icone={<BookMarked className="h-4 w-4" />}
              cor="materiais"
              aberta={estaAberta('materiais')}
              onAlternar={() => alternar('materiais')}
              acao={{ rotulo: 'Ver todos', href: '/materiais?tab=mine' }}
            >
              <GradeDeMateriais materials={meusMateriais.materials} loading={meusMateriais.loading} />
            </SecaoRecolhivel>
          )}

          <SecaoRecolhivel
            id="explorar"
            titulo="Explorar a plataforma"
            resumo="Todas as áreas de estudo, uma por cartão"
            icone={<LayoutGrid className="h-4 w-4" />}
            cor="bancoQuestoes"
            aberta={estaAberta('explorar')}
            onAlternar={() => alternar('explorar')}
          >
            <ExperienceCarousel
              cabecalho={false}
              stats={{
                examsCompleted: stats.examsCompleted,
                questionsAnswered: stats.questionsAnswered,
                cronogramasCreated: userStats.cronogramasCreated,
                materialsOwned: userStats.materialsOwned,
              }}
            />
          </SecaoRecolhivel>

          {accountType === 'gratuito' && !loading && (
            <SecaoRecolhivel
              id="plano"
              titulo="Seu plano"
              resumo="Gratuito — veja o que o Plus+ libera"
              icone={<Gem className="h-4 w-4" />}
              cor="upgrade"
              aberta={estaAberta('plano')}
              onAlternar={() => alternar('plano')}
            >
              <PlanLimitsCard
                accountType={accountType as AccountType}
                isAdmin={isAdmin}
                cronogramasCreated={userStats.cronogramasCreated}
                flashcardsCreated={userStats.flashcardsCreated}
                personalExamsCreated={userStats.personalExamsCreated}
                showUpgradeButton
              />
            </SecaoRecolhivel>
          )}
        </GrupoDeSecoes>
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

/**
 * A estante de materiais da pessoa: o que ela tem acesso, para a linha
 * "Meus materiais" (o resumo) e para a grade (o conteúdo).
 *
 * A estante abria em esqueleto a cada visita para redesenhar exatamente os
 * mesmos itens da visita anterior — por isso o cache. O veredito de acesso
 * continua sendo o do servidor; o cache só adianta o desenho.
 *
 * Ele entra no efeito, e não no estado inicial: `readPageCache` lê o
 * `sessionStorage`, que o servidor não tem, e inicializar o estado com ele
 * faz servidor e cliente renderizarem coisas diferentes na hidratação (erro
 * #422 do React).
 */
function useMeusMateriais(onCount?: (count: number) => void) {
  const [materials, setMaterials] = useState<DashMaterial[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const emCache = readPageCache<DashMaterial[]>(DASHBOARD_MATERIALS_CACHE_KEY)
    if (emCache) {
      setMaterials(emCache)
      setLoading(false)
      onCount?.(emCache.length)
    }
    fetch('/api/materiais', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : { materials: [] })
      .then(d => {
        const mine = (d.materials || []).filter((m: DashMaterial) => m._hasAccess)
        setMaterials(mine)
        writePageCache(DASHBOARD_MATERIALS_CACHE_KEY, mine)
        onCount?.(mine.length)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [onCount])

  return { materials, loading }
}

/** Até oito capas; o resto está a um "Ver todos" (o atalho da linha). */
function GradeDeMateriais({ materials, loading }: { materials: DashMaterial[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="dash-cartao animate-pulse p-3">
            <div className="mb-2 h-20 rounded-xl bg-muted" />
            <div className="h-3 w-3/4 rounded bg-muted" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {materials.slice(0, 8).map(m => (
        <Link
          key={m._id}
          href={`/materiais/${m._id}`}
          style={{ touchAction: 'manipulation' }}
          className="dash-cartao group block overflow-hidden"
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
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
                {TYPE_ICON_MAP[m.type] ?? <Package className="h-4 w-4 text-muted-foreground" />}
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-1.5 left-2">
              <span className="text-[9px] font-bold uppercase tracking-wide text-white/80">
                {m.type === 'flashcard_deck' ? 'Flashcard' : m.type === 'video_embed' ? 'Vídeo' : m.type?.toUpperCase()}
              </span>
            </div>
          </div>
          <div className="p-2.5">
            <p className="line-clamp-2 text-xs font-semibold leading-tight transition-colors group-hover:text-primary">
              {m.title}
            </p>
          </div>
        </Link>
      ))}
    </div>
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
