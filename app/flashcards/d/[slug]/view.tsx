'use client'

import { avisarXp } from '@/lib/xp/cliente'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  Edit3,
  Heart,
  Share2,
  Lock,
  CheckCircle2,
  EyeOff,
  Globe,
  Link as LinkIcon,
  Trophy,
  Sparkles,
  Users,
  Crown,
  RotateCcw,
  Play,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Trash2,
  Square,
  CheckSquare,
  Loader2,
  Brain,
  CalendarClock,
  BarChart3,
  Flame,
  Leaf,
  AlertTriangle,
  Download,
  X,
  Maximize2,
  Minimize2,
  Mic,
  MicOff,
  Undo2,
  Gift,
  Zap,
  Gauge,
  Check,
  CloudOff,
  Timer,
  Star,
} from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { ToastAlert } from '@/components/ui/toast-alert'
import { PackageUpsellModal, UpsellPackage } from '@/components/materiais/package-upsell-modal'
import { FlashcardCardView } from '@/components/flashcards/flashcard-card'
import { FlashcardTour } from '@/components/flashcards/flashcard-tour'
import { cn } from '@/lib/utils'
import {
  describePdfDownloadFailure,
  downloadPdfResponse,
} from '@/lib/material-download-client'
import type { FlashcardManualCard, FlashcardManualDeck, FlashcardSpacedRating, FlashcardSpacedState } from '@/lib/types'
import {
  DEFAULT_PUBLIC_METRIC_SETTINGS,
  type PublicMetricSettings,
} from '@/lib/display-settings'
import { ReviewsSection } from '@/components/reviews/reviews-section'
import type { ReviewSummary } from '@/lib/reviews-shared'
import { useConviteDeAvaliacao } from '@/lib/reviews-prompt'

/**
 * Recusa vinda do servidor (403, 429, 404...), que já traz uma mensagem
 * escrita para o usuário. Marcá-la com um tipo próprio evita que ela seja
 * confundida com uma falha de transferência e reescrita.
 */
class RespostaRecusada extends Error {}
import {
  loadProgress,
  saveProgress,
  clearProgress,
  type FlashcardProgress,
} from '@/lib/flashcard-progress'
import {
  FLASHCARD_RATING_LABELS,
  RETENTION_PRESETS,
  buildSpacedQueue,
  calculateNextSpacedReview,
  formatIntervalLabel,
  getReviewFeedbackMessage,
  toLegacyRating,
  type RetentionPreset,
} from '@/lib/flashcard-spaced-repetition'
import { createReviewSync, type ReviewSyncHandle, type ReviewSyncStatus } from '@/lib/flashcard-review-queue'
import { useFlashcardVoice } from '@/hooks/use-flashcard-voice'
import {
  PricingEventCountdown,
  type PricingEventStatePayload,
} from '@/components/pricing-events/PricingEventCountdown'
import { PricingEventBadge } from '@/components/pricing-events/PricingEventBadge'
import { PLUS_LABEL } from '@/lib/account-tier'
import {
  TimedAccessBanner,
  TimedAccessPill,
  type TimedAccessView,
} from '@/components/materiais/timed-access'
import { DeckListingNote } from '@/components/flashcards/deck-listing-note'
import type { DeckListingStatus } from '@/lib/flashcard-manual'
import { FundoIos } from '@/components/materiais/fundo-ios'
import { AnelProgresso, Confete } from '@/components/flashcards/pecas-ios'
import { lerErrosLocais, marcarErroLocal } from '@/lib/flashcard-caderno-de-erros'
import { lerMetaDiaria, lerSequencia, registrarDiaDeEstudo } from '@/lib/flashcard-ritmo'
import { reagirDom } from '@/lib/dom/reacoes'

interface AccessFlags {
  hasAccess: boolean
  isOwner: boolean
  isPurchased: boolean
  hasGroupAccess: boolean
  hasShareAccess: boolean
  /** Assinante Plus+ leva sem custo, mas ainda precisa resgatar. */
  includedInPlus: boolean
  reasons: string[]
  /** Prazo restante quando a compra foi de uma versão por tempo limitado. */
  timedAccess?: TimedAccessView | null
}

interface DeckResponse {
  deck: FlashcardManualDeck & { _id: string }
  cards: (FlashcardManualCard & { _id: string; spacedProgress?: SpacedProgressResponse | null })[]
  spacedRepetition?: {
    stats: SpacedRepetitionStats
  }
  access: AccessFlags & { canManage: boolean }
  viewer: { isAuthenticated: boolean; isAdmin: boolean; userId: string | null; emailVerified: boolean }
  pricingEventState?: PricingEventStatePayload | null
  /** Só vem para quem administra o deck. */
  listing?: DeckListingStatus | null
}

type StudyMode = 'normal' | 'spaced'

/** O placar que a tela de fim de sessão mostra. */
interface SessionSummary {
  /** Cards distintos avaliados. */
  rated: number
  /** Toques em cada nota, contando as voltas da fila. */
  counts: Record<FlashcardSpacedRating, number>
  /** Cards que terminaram a sessão ainda errados — vão para o caderno. */
  errorIds: string[]
  /** Numa revisão do caderno: quantos saíram dele. */
  fixedErrors: number
  durationMs: number
  bestCombo: number
  errorsReview: boolean
}

interface SpacedProgressResponse {
  _id?: string
  userId: string
  cardId: string
  deckId: string
  rating: FlashcardSpacedRating
  reviewCount: number
  correctStreak: number
  easeFactor: number
  intervalDays: number
  stability?: number
  difficulty?: number
  state?: FlashcardSpacedState
  learningStep?: number
  lapses?: number
  retention?: number
  nextReviewAt: string | null
  lastReviewedAt: string | null
  createdAt: string | null
  updatedAt: string | null
}

interface SpacedRepetitionStats {
  dueToday: number
  newCards: number
  mastered: number
  difficult: number
  learning?: number
  scheduled?: number
  total?: number
}

type DeckCard = FlashcardManualCard & { _id: string; spacedProgress?: SpacedProgressResponse | null }

const FULLSCREEN_HINT_KEY = 'gdx:flashcard-fullscreen-hint'
const FULLSCREEN_PREF_KEY = 'gdx:flashcard-fullscreen-pref'
const VOICE_PREF_KEY = 'gdx:flashcard-voice-pref'
/** Último modo escolhido (normal / espaçado) — decide como o deck abre. */
const STUDY_MODE_PREF_KEY = 'gdx:flashcard-study-mode'
/** Intensidade da repetição espaçada: leve, padrão ou prova. */
const RETENTION_PREF_KEY = 'gdx:flashcard-retention'
/** Faixa que apresenta a repetição espaçada a quem nunca reparou nela. */
const SPACED_HINT_KEY = 'gdx:flashcard-spaced-hint'

/** Teto de cards inéditos por sessão — evita a sessão que nunca acaba. */
const NEW_CARDS_PER_SESSION = 20
/** Quantos cards separam um card errado da sua volta na mesma sessão. */
const REQUEUE_GAP = 4
/** Nunca mais de 3 aparições do mesmo card na mesma sessão. */
const MAX_REQUEUES_PER_CARD = 2

// Quanto tempo o aviso "Ouvi: X" fica na tela — é também a janela para desfazer
// uma avaliação que o reconhecimento entendeu errado.
const VOICE_UNDO_MS = 2600

function progressMapOf(cards: DeckCard[]): Map<string, any> {
  const map = new Map<string, any>()
  for (const card of cards) {
    if (card.spacedProgress) map.set(String(card._id), card.spacedProgress)
  }
  return map
}

/**
 * Fila da sessão. No modo normal é o baralho inteiro na ordem do deck; na
 * repetição espaçada é só o que vence hoje (mais um punhado de inéditos), que
 * é a diferença entre "revisar 14 cards" e "arrastar 300".
 *
 * O cálculo é local e determinístico: depende apenas do progresso que já veio
 * junto com os cards, então o estudo começa no clique, sem uma ida ao servidor
 * antes do primeiro card aparecer.
 */
function buildStudyQueue(
  cards: DeckCard[],
  mode: StudyMode,
  opts: { ahead?: boolean } = {}
): { cards: DeckCard[]; counts: { learning: number; due: number; newCards: number; future: number; heldBack: number } } {
  if (mode !== 'spaced') {
    return { cards, counts: { learning: 0, due: 0, newCards: cards.length, future: 0, heldBack: 0 } }
  }
  const queue = buildSpacedQueue(cards as any, progressMapOf(cards) as any, {
    newCardLimit: opts.ahead ? null : NEW_CARDS_PER_SESSION,
    includeFuture: !!opts.ahead,
  })
  return { cards: queue.cards as DeckCard[], counts: queue.counts }
}

/**
 * As três avaliações. Os nomes são o que o aluno usa para descrever o próprio
 * esforço — "foi fácil", "foi médio", "foi difícil" —, não gíria interna: a
 * palavra precisa ser óbvia no primeiro card, sem tutorial.
 */
const RATINGS: {
  value: FlashcardSpacedRating
  label: string
  hint: string
  color: string
  shortcut: string
}[] = [
  {
    value: 'FACIL',
    label: FLASHCARD_RATING_LABELS.FACIL,
    hint: 'Lembrei na hora',
    color: 'from-emerald-500 to-emerald-600',
    shortcut: '1',
  },
  {
    value: 'MEDIO',
    label: FLASHCARD_RATING_LABELS.MEDIO,
    hint: 'Lembrei com esforço',
    color: 'from-amber-500 to-amber-600',
    shortcut: '2',
  },
  {
    value: 'DIFICIL',
    label: FLASHCARD_RATING_LABELS.DIFICIL,
    hint: 'Travei ou errei',
    color: 'from-rose-500 to-orange-600',
    shortcut: '3',
  },
]

const RETENTION_OPTIONS: { value: RetentionPreset; label: string; description: string }[] = [
  { value: 'leve', label: 'Leve', description: 'Menos revisões, mais espaço entre elas.' },
  { value: 'padrao', label: 'Padrão', description: 'O equilíbrio recomendado para o dia a dia.' },
  { value: 'prova', label: 'Prova', description: 'Cobra mais vezes. Para a semana da prova.' },
]

// Skeleton de carregamento — reserva o mesmo espaço do hero + conteúdo real
// para eliminar o "salto" de layout e reduzir a percepção de espera.
function DeckPageSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-3 sm:px-6 sm:pt-5 lg:px-8" aria-hidden>
      <div className="ios-esqueleto mb-4 h-7 w-28 rounded-full" />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px] xl:gap-8">
        <div className="space-y-6">
          <div className="ios-esqueleto rounded-[22px] sm:rounded-[28px]" style={{ aspectRatio: '16/9' }} />
          <div className="ios-esqueleto hidden h-24 rounded-[18px] xl:block" />
        </div>
        <div className="ios-painel space-y-3">
          <div className="ios-esqueleto h-8 w-11/12 rounded-full" />
          <div className="ios-esqueleto h-4 w-1/2 rounded-full" />
          <div className="ios-esqueleto mt-6 h-[50px] w-full rounded-full" />
          <div className="ios-esqueleto h-[50px] w-full rounded-full" />
        </div>
      </div>
    </div>
  )
}

export default function DeckPage() {
  const router = useRouter()
  const params = useParams<{ slug: string }>()
  const search = useSearchParams()
  const slug = params.slug

  const [data, setData] = useState<DeckResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [studying, setStudying] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const studyRef = useRef<HTMLDivElement>(null)
  const [studyModeChoice, setStudyModeChoice] = useState<StudyMode>('normal')
  const [activeStudyMode, setActiveStudyMode] = useState<StudyMode>('normal')
  // Ordem congelada no início da sessão: avaliar um card atualiza o progresso
  // dele e, sem isso, o baralho se reordenaria embaixo do usuário no meio do
  // estudo — o índice atual passaria a apontar para outro card.
  const [studyOrder, setStudyOrder] = useState<string[] | null>(null)
  const [fullscreenHint, setFullscreenHint] = useState(false)
  const [fullscreenPref, setFullscreenPref] = useState(false)
  const [spacedHint, setSpacedHint] = useState(false)
  // Marca que o modo de estudo já foi decidido (pelo usuário ou pelo padrão),
  // para o palpite automático não sobrescrever uma escolha explícita.
  const modePrefRef = useRef(false)
  const autoFullscreenRef = useRef(false)
  // Modo voz: ligado na página antes de iniciar e mantido durante a sessão.
  const [voicePref, setVoicePref] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const [voiceFeedback, setVoiceFeedback] = useState<
    { rating: FlashcardSpacedRating; heard: string; cardId: string } | null
  >(null)
  // O avanço automático vira um timer nomeado para que "Desfazer" consiga
  // cancelá-lo antes de o card trocar embaixo do usuário.
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [showComment, setShowComment] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [ratings, setRatings] = useState<Record<string, FlashcardSpacedRating>>({})
  const [scheduleFeedback, setScheduleFeedback] = useState<string | null>(null)
  // Intensidade da repetição espaçada (meta de retenção). É o único parâmetro
  // do algoritmo que o usuário controla — e o que mais muda a rotina dele.
  const [retentionPreset, setRetentionPreset] = useState<RetentionPreset>('padrao')
  // Estado do envio em segundo plano das avaliações. Só vira aviso na tela
  // quando alguma coisa realmente ficou para trás.
  const [syncStatus, setSyncStatus] = useState<ReviewSyncStatus>('idle')
  const [pendingReviews, setPendingReviews] = useState(0)
  const reviewSyncRef = useRef<ReviewSyncHandle | null>(null)
  // Quantos cards a sessão atual reuniu, por origem — alimenta o cabeçalho do
  // estudo ("12 vencidos · 5 novos") e a tela de fim de fila.
  const [queueCounts, setQueueCounts] = useState<{ learning: number; due: number; newCards: number; future: number; heldBack: number } | null>(null)
  const [studyingAhead, setStudyingAhead] = useState(false)
  const requeueCountRef = useRef<Record<string, number>>({})
  // Estado do card antes da última avaliação — o "Desfazer" do modo voz o usa
  // para devolver o agendamento junto com a marca.
  const undoSnapshotRef = useRef<{ cardId: string; progress: SpacedProgressResponse | null } | null>(null)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [toast, setToast] = useState<{ open: boolean; message: string; type?: 'success' | 'error' | 'info' }>({ open: false, message: '' })
  const [shareOpen, setShareOpen] = useState(false)
  const [purchasing, setPurchasing] = useState(false)
  const [claimingPlus, setClaimingPlus] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [folderPath, setFolderPath] = useState<string | null>(null)
  const [upsellPkg, setUpsellPkg] = useState<UpsellPackage | null>(null)
  const [showCards, setShowCards] = useState(false)
  const [reviewSummary, setReviewSummary] = useState<ReviewSummary | null>(null)
  const [metricSettings, setMetricSettings] = useState<PublicMetricSettings>(DEFAULT_PUBLIC_METRIC_SETTINGS)
  const [savedProgress, setSavedProgress] = useState<FlashcardProgress | null>(null)
  // Caderno de erros do modo "ordem do deck" (o do modo espaçado sai do
  // próprio progresso de cada card). Ver `lib/flashcard-caderno-de-erros.ts`.
  const [localErrors, setLocalErrors] = useState<Set<string>>(new Set())
  // A sessão em andamento é a revisão do caderno de erros?
  const [reviewingErrors, setReviewingErrors] = useState(false)
  // Placar da sessão: alimenta a sequência de acertos durante o estudo e a
  // tela de fim. Refs porque o fim pode vir de um timer, depois do último
  // render — e precisa ver a última nota.
  const ratingsRef = useRef<Record<string, FlashcardSpacedRating>>({})
  const sessionRef = useRef({
    startedAt: 0,
    counts: { FACIL: 0, MEDIO: 0, DIFICIL: 0 } as Record<FlashcardSpacedRating, number>,
    errorIds: new Set<string>(),
    bestCombo: 0,
  })
  const [combo, setCombo] = useState(0)
  const [summary, setSummary] = useState<SessionSummary | null>(null)
  const errorsParamHandledRef = useRef(false)

  const purchaseSuccess = search?.get('purchase') === 'success'
  const userKey = data?.viewer.userId || 'guest'

  // Cards da sessão: fora do estudo é a ordem do deck; dentro, a ordem que foi
  // congelada quando a sessão começou (resolvida por id para continuar válida
  // mesmo se o deck for recarregado no meio).
  const studyCards = useMemo<DeckCard[]>(() => {
    const all = (data?.cards ?? []) as DeckCard[]
    if (!studyOrder) return all
    const byId = new Map(all.map(card => [String(card._id), card]))
    const ordered = studyOrder
      .map(id => byId.get(id))
      .filter((card): card is DeckCard => !!card)
    // Fila explicitamente vazia (nada vencido hoje) é um resultado legítimo e
    // tem tela própria; cair no baralho inteiro só faz sentido quando os ids
    // deixaram de resolver — o deck mudou embaixo da sessão.
    if (studyOrder.length === 0) return []
    return ordered.length > 0 ? ordered : all
  }, [data?.cards, studyOrder])

  // Composição da próxima sessão espaçada — é o que o botão principal promete
  // ("Revisar 14 cards") e o que o painel de modos detalha.
  const spacedPreview = useMemo(
    () => (data?.cards?.length ? buildStudyQueue(data.cards as DeckCard[], 'spaced').counts : null),
    [data?.cards]
  )
  const dueNowCount = spacedPreview ? spacedPreview.due + spacedPreview.learning : 0
  const newNowCount = spacedPreview ? spacedPreview.newCards : 0

  // Caderno de erros do deck: todo card cuja última nota foi "Difícil" (no
  // progresso da repetição espaçada ou, no modo normal, guardado no aparelho).
  // Acertou depois, saiu — sem botão de "limpar".
  const errorCards = useMemo<DeckCard[]>(
    () => ((data?.cards ?? []) as DeckCard[]).filter(card =>
      card.spacedProgress?.rating === 'DIFICIL' || localErrors.has(String(card._id))
    ),
    [data?.cards, localErrors]
  )

  useEffect(() => {
    if (purchaseSuccess) {
      setToast({ open: true, message: 'Compra confirmada! O deck está liberado.', type: 'success' })
    }
  }, [purchaseSuccess])

  useEffect(() => {
    let cancelled = false
    fetch('/api/display-settings', { cache: 'no-store' })
      .then(res => res.ok ? res.json() : null)
      .then(json => {
        if (!cancelled && json?.settings) setMetricSettings(json.settings)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  // `silent` recarrega sem trocar a página pelo skeleton — usado quando já há
  // conteúdo na tela e a atualização é só para manter os dados frescos.
  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true)
    try {
      const url = new URL(`/api/flashcards/manual/${encodeURIComponent(slug)}`, window.location.origin)
      const res = await fetch(url.toString(), { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Erro ao carregar deck')
      // A recarga em segundo plano não pode atropelar uma avaliação que
      // acabou de acontecer e ainda está subindo na fila: quando o progresso
      // local é mais recente que o do servidor, ele é que vale.
      setData(prev => {
        if (!prev) return json
        const localByCardId = new Map(
          prev.cards.map(card => [String(card._id), card.spacedProgress])
        )
        return {
          ...json,
          cards: json.cards.map((card: DeckCard) => {
            const local = localByCardId.get(String(card._id))
            if (!local?.lastReviewedAt) return card
            const remoteAt = card.spacedProgress?.lastReviewedAt
            if (remoteAt && new Date(remoteAt).getTime() >= new Date(local.lastReviewedAt).getTime()) {
              return card
            }
            return { ...card, spacedProgress: local }
          }),
        }
      })
      setLikeCount(json.deck?.likeCount || 0)
      return true
    } catch (err: any) {
      setToast({ open: true, message: err.message || 'Erro ao carregar', type: 'error' })
      return false
    } finally {
      if (!opts?.silent) setLoading(false)
    }
  }, [slug])

  useEffect(() => { load() }, [load])

  const reload = useCallback(() => { load() }, [load])

  // Preferências de tela cheia (dica já dispensada / abrir sempre expandido).
  useEffect(() => {
    try {
      setFullscreenHint(window.localStorage.getItem(FULLSCREEN_HINT_KEY) !== 'dismissed')
      setFullscreenPref(window.localStorage.getItem(FULLSCREEN_PREF_KEY) === '1')
      setVoicePref(window.localStorage.getItem(VOICE_PREF_KEY) === '1')
      setSpacedHint(window.localStorage.getItem(SPACED_HINT_KEY) !== 'dismissed')
      const storedRetention = window.localStorage.getItem(RETENTION_PREF_KEY)
      if (storedRetention === 'leve' || storedRetention === 'padrao' || storedRetention === 'prova') {
        setRetentionPreset(storedRetention)
      }
      const storedMode = window.localStorage.getItem(STUDY_MODE_PREF_KEY)
      if (storedMode === 'normal' || storedMode === 'spaced') {
        setStudyModeChoice(storedMode)
        modePrefRef.current = true
      }
    } catch {
      setFullscreenHint(true)
    }
  }, [])

  /**
   * Modo de entrada do deck.
   *
   * A repetição espaçada era o recurso mais forte da tela e o mais escondido:
   * quem nunca reparou no seletor lá embaixo estudava para sempre na ordem do
   * baralho. Agora, quem tem acesso e nunca escolheu nada entra direto nela —
   * o modo normal continua a um toque de distância, no mesmo seletor.
   */
  useEffect(() => {
    if (modePrefRef.current || !data) return
    if (!data.viewer.isAuthenticated || !data.access.hasAccess) return
    modePrefRef.current = true
    setStudyModeChoice('spaced')
  }, [data])

  const chooseStudyMode = useCallback((mode: StudyMode) => {
    modePrefRef.current = true
    setStudyModeChoice(mode)
    try { window.localStorage.setItem(STUDY_MODE_PREF_KEY, mode) } catch {}
  }, [])

  const chooseRetention = useCallback((preset: RetentionPreset) => {
    setRetentionPreset(preset)
    try { window.localStorage.setItem(RETENTION_PREF_KEY, preset) } catch {}
  }, [])

  const dismissSpacedHint = useCallback(() => {
    setSpacedHint(false)
    try { window.localStorage.setItem(SPACED_HINT_KEY, 'dismissed') } catch {}
  }, [])

  /**
   * Fila de envio das avaliações. Vive fora do ciclo de render porque ela
   * sobrevive ao fim da sessão: o que não foi entregue fica no localStorage e
   * sai sozinho na próxima abertura do deck.
   */
  useEffect(() => {
    if (!data?.viewer.isAuthenticated || !data.access.hasAccess) return
    const sync = createReviewSync({
      slug,
      userKey,
      onStatus: (status, pending) => {
        setSyncStatus(status)
        setPendingReviews(pending)
      },
      onSynced: (progresses) => {
        // O servidor é a fonte da verdade: se o cálculo local divergiu (o card
        // foi avaliado em outro aparelho, por exemplo), o valor dele vale.
        setData(prev => {
          if (!prev) return prev
          const byCardId = new Map(progresses.map((p: any) => [String(p.cardId), p]))
          if (byCardId.size === 0) return prev
          return {
            ...prev,
            cards: prev.cards.map(card =>
              byCardId.has(String(card._id))
                ? { ...card, spacedProgress: byCardId.get(String(card._id)) }
                : card
            ),
          }
        })
      },
    })
    reviewSyncRef.current = sync
    return () => {
      sync.dispose()
      reviewSyncRef.current = null
    }
  }, [slug, userKey, data?.viewer.isAuthenticated, data?.access.hasAccess])

  const dismissFullscreenHint = useCallback(() => {
    setFullscreenHint(false)
    try { window.localStorage.setItem(FULLSCREEN_HINT_KEY, 'dismissed') } catch {}
  }, [])

  const toggleFullscreenPref = useCallback(() => {
    setFullscreenPref(prev => {
      const next = !prev
      try { window.localStorage.setItem(FULLSCREEN_PREF_KEY, next ? '1' : '0') } catch {}
      return next
    })
  }, [])

  const toggleVoicePref = useCallback(() => {
    setVoicePref(prev => {
      const next = !prev
      try { window.localStorage.setItem(VOICE_PREF_KEY, next ? '1' : '0') } catch {}
      // Ligar durante a sessão vale para a sessão em andamento também.
      setVoiceEnabled(next)
      return next
    })
  }, [])

  // `?erros=1` (vindo do painel "Hoje" de /flashcards) abre direto a revisão
  // do caderno, uma vez, e some do endereço.
  useEffect(() => {
    if (errorsParamHandledRef.current || !data || studying) return
    if (search?.get('erros') !== '1') return
    if (!data.access.hasAccess) return
    errorsParamHandledRef.current = true
    try {
      const url = new URL(window.location.href)
      url.searchParams.delete('erros')
      window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`)
    } catch {}
    // Espera o caderno local ser lido antes de montar a fila.
    const timer = setTimeout(() => startErrorsReview(), 60)
    return () => clearTimeout(timer)
  }, [data, studying, search]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!data) return
    setLocalErrors(lerErrosLocais(userKey, slug))
  }, [data?.deck?._id, userKey, slug]) // eslint-disable-line react-hooks/exhaustive-deps

  // Detect resumable progress whenever deck data refreshes.
  useEffect(() => {
    if (!data || studying) return
    const stored = loadProgress(slug, userKey)
    if (!stored || data.cards.length === 0) {
      setSavedProgress(null)
      return
    }
    // Clamp to current deck size in case cards were added/removed.
    const safeIndex = Math.min(Math.max(stored.index, 0), data.cards.length - 1)
    // Resumable only if user actually advanced or rated something.
    if (safeIndex === 0 && Object.keys(stored.ratings || {}).length === 0) {
      setSavedProgress(null)
      return
    }
    setSavedProgress({ ...stored, index: safeIndex, total: data.cards.length })
  }, [data, slug, userKey, studying])

  // Persist progress while the user is studying.
  useEffect(() => {
    // A revisão do caderno é uma fila avulsa: retomá-la como sessão do deck
    // abriria o baralho no índice errado.
    if (!studying || !data || reviewingErrors) return
    saveProgress(slug, userKey, {
      mode: activeStudyMode,
      index: currentIndex,
      total: studyCards.length,
      ratings,
    })
  }, [studying, currentIndex, ratings, activeStudyMode, data, slug, studyCards.length, userKey, reviewingErrors])

  // A revalidação em segundo plano pode voltar com menos cards (alguém apagou
  // um enquanto a sessão rodava) — o índice não pode ficar fora do baralho.
  useEffect(() => {
    if (!studying || studyCards.length === 0) return
    setCurrentIndex(i => (i > studyCards.length - 1 ? studyCards.length - 1 : i))
  }, [studying, studyCards.length])

  // Load folder path for deck breadcrumb
  useEffect(() => {
    const folderId = data?.deck?.folderId
    if (!folderId) { setFolderPath(null); return }
    fetch('/api/flashcards/manual/folders?scope=admin')
      .then(r => r.json())
      .then(j => {
        const folders: { _id: string; name: string; parentFolderId?: string | null }[] = j.folders || []
        const map = new Map(folders.map(f => [f._id, f]))
        function getPath(id: string): string {
          const f = map.get(id)
          if (!f) return ''
          if (!f.parentFolderId) return f.name
          const parent = getPath(f.parentFolderId)
          return parent ? `${parent} › ${f.name}` : f.name
        }
        const path = getPath(folderId as string)
        setFolderPath(path || null)
      })
      .catch(() => {})
  }, [data?.deck?.folderId])

  // Alterna o modo de expansão (tela cheia) do flashcard na resolução.
  // Tenta usar a Fullscreen API nativa; se indisponível, mantém um overlay
  // em CSS (fixed inset-0) como fallback.
  const toggleFullscreen = useCallback(() => {
    const el = studyRef.current
    const isNativeFs = typeof document !== 'undefined' && !!document.fullscreenElement
    if (!fullscreen) {
      setFullscreen(true)
      // Quem já usou a tela cheia não precisa mais da sugestão.
      dismissFullscreenHint()
      el?.requestFullscreen?.().catch(() => {})
    } else {
      setFullscreen(false)
      if (isNativeFs) document.exitFullscreen?.().catch(() => {})
    }
  }, [dismissFullscreenHint, fullscreen])

  // Sincroniza o estado quando o usuário sai da tela cheia nativa (ex.: Esc).
  useEffect(() => {
    function onFsChange() {
      if (typeof document !== 'undefined' && !document.fullscreenElement) {
        setFullscreen(false)
      }
    }
    document.addEventListener('fullscreenchange', onFsChange)
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  }, [])

  // Preferência "abrir em tela cheia": o pedido nativo precisa do elemento já
  // montado, então sai no primeiro frame do estudo — ainda dentro da janela de
  // ativação do clique. Se o navegador recusar, o overlay em CSS assume.
  useEffect(() => {
    if (!studying || !fullscreenPref || !fullscreen || autoFullscreenRef.current) return
    autoFullscreenRef.current = true
    if (typeof document !== 'undefined' && !document.fullscreenElement) {
      studyRef.current?.requestFullscreen?.().catch(() => {})
    }
  }, [studying, fullscreen, fullscreenPref])

  // Durante o estudo, avisos flutuantes do app (Modo Lite) saem da frente do
  // card — ver `.estudo-em-foco` no globals.css.
  useEffect(() => {
    if (!studying) return
    document.body.classList.add('estudo-em-foco')
    return () => document.body.classList.remove('estudo-em-foco')
  }, [studying])

  // Garante saída da tela cheia ao encerrar o estudo.
  useEffect(() => {
    if (studying) return
    setFullscreen(false)
    if (typeof document !== 'undefined' && document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {})
    }
  }, [studying])

  // Atalhos de teclado durante estudo
  useEffect(() => {
    if (!studying) return
    function onKey(e: KeyboardEvent) {
      if (e.key === ' ') { e.preventDefault(); setFlipped(f => !f) }
      else if (e.key === 'ArrowRight') goNext()
      else if (e.key === 'ArrowLeft') goPrev()
      else if (e.key === 'f' || e.key === 'F') { e.preventDefault(); toggleFullscreen() }
      else if (e.key === 'Escape' && fullscreen) { e.preventDefault(); toggleFullscreen() }
      else if (flipped) {
        if (e.key === '1') rate('FACIL')
        else if (e.key === '2') rate('MEDIO')
        else if (e.key === '3') rate('DIFICIL')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studying, currentIndex, flipped, data, fullscreen, toggleFullscreen])

  // Trocar de card cancela um avanço automático pendente e limpa o aviso do
  // modo voz — ele fala do card que ficou para trás.
  function resetCardTransientState() {
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current)
      advanceTimerRef.current = null
    }
    setFlipped(false); setShowComment(false); setShowHint(false)
    setVoiceFeedback(null)
    // `scheduleFeedback` NÃO é limpo aqui: ele é o recibo da avaliação que
    // acabou de acontecer e some sozinho, um instante depois. Limpá-lo junto
    // com a troca de card fazia a mensagem piscar e sumir antes de ser lida.
  }

  function goNext() {
    if (currentIndex < studyCards.length - 1) {
      setCurrentIndex(i => i + 1)
      resetCardTransientState()
    }
  }
  function goPrev() {
    if (currentIndex > 0) {
      setCurrentIndex(i => i - 1)
      resetCardTransientState()
    }
  }
  function goToIndex(index: number) {
    if (studyCards.length === 0) return
    const nextIndex = Math.max(0, Math.min(index, studyCards.length - 1))
    setCurrentIndex(nextIndex)
    resetCardTransientState()
  }

  // Entra no estudo imediatamente: a ordem é calculada aqui e os dados só são
  // revalidados em segundo plano. Antes isso disparava um fetch bloqueante que
  // trocava a página inteira pelo skeleton antes do primeiro card aparecer.
  function resetSessionScore() {
    sessionRef.current = {
      startedAt: Date.now(),
      counts: { FACIL: 0, MEDIO: 0, DIFICIL: 0 },
      errorIds: new Set(),
      bestCombo: 0,
    }
    ratingsRef.current = {}
    setCombo(0)
    setSummary(null)
  }

  function startStudy(mode: StudyMode, resumeFrom?: FlashcardProgress | null, opts?: { ahead?: boolean }) {
    if (!data || data.cards.length === 0) return
    resetSessionScore()
    setReviewingErrors(false)
    const effectiveMode: StudyMode = resumeFrom?.mode ?? mode
    const ahead = !!opts?.ahead
    const queue = buildStudyQueue(data.cards as DeckCard[], effectiveMode, { ahead })
    // Fila vazia significa "não há nada vencido hoje" — e isso é uma boa
    // notícia, não um erro. A tela de fim de fila cuida do resto.
    if (queue.cards.length === 0) {
      setQueueCounts(queue.counts)
      setStudyingAhead(false)
      setActiveStudyMode(effectiveMode)
      setStudyOrder([])
      setStudying(true)
      return
    }
    requeueCountRef.current = {}
    setQueueCounts(queue.counts)
    setStudyingAhead(ahead)
    setStudyOrder(queue.cards.map(card => String(card._id)))
    setActiveStudyMode(effectiveMode)
    setRatings(resumeFrom?.ratings ?? {})
    ratingsRef.current = { ...(resumeFrom?.ratings ?? {}) }
    // Retomar no modo espaçado começa do zero de propósito: a fila já é
    // exatamente o que falta (o que foi avaliado saiu dela ao ganhar data
    // futura). Pular para o índice antigo saltaria por cima de cards que
    // continuam pendentes.
    const resumeIndex = effectiveMode === 'spaced' ? 0 : Math.max(resumeFrom?.index ?? 0, 0)
    setCurrentIndex(Math.min(resumeIndex, Math.max(queue.cards.length - 1, 0)))
    setFlipped(false)
    setShowComment(false)
    setShowHint(false)
    setScheduleFeedback(null)
    setVoiceFeedback(null)
    setVoiceEnabled(voicePref)
    autoFullscreenRef.current = false
    if (fullscreenPref) setFullscreen(true)
    setStudying(true)
    load({ silent: true })
  }

  /**
   * Revisão do caderno de erros: uma sessão só com os cards errados — os do
   * deck inteiro, ou os de uma sessão que acabou de terminar. Logado, roda na
   * repetição espaçada: acertar aqui reagenda o card e o tira do caderno.
   */
  function startErrorsReview(ids?: string[]) {
    if (!data) return
    const byId = new Map((data.cards as DeckCard[]).map(card => [String(card._id), card]))
    // Relido do aparelho na hora: a chamada pode vir de um timer montado antes
    // de o caderno local entrar no estado.
    const locais = lerErrosLocais(userKey, slug)
    const doCaderno = (data.cards as DeckCard[])
      .filter(card => card.spacedProgress?.rating === 'DIFICIL' || locais.has(String(card._id)))
      .map(card => String(card._id))
    const source = (ids && ids.length > 0 ? ids : doCaderno)
      .map(id => byId.get(id))
      .filter((card): card is DeckCard => !!card)
      // Os que mais recaíram primeiro: é onde a memória está mais frágil.
      .sort((a, b) => (b.spacedProgress?.lapses || 0) - (a.spacedProgress?.lapses || 0))
    if (source.length === 0) {
      setToast({ open: true, message: 'Seu caderno de erros deste deck está vazio.', type: 'info' })
      return
    }
    resetSessionScore()
    requeueCountRef.current = {}
    setReviewingErrors(true)
    setQueueCounts(null)
    setStudyingAhead(false)
    setStudyOrder(source.map(card => String(card._id)))
    setActiveStudyMode(data.viewer.isAuthenticated ? 'spaced' : 'normal')
    setRatings({})
    setCurrentIndex(0)
    setFlipped(false)
    setShowComment(false)
    setShowHint(false)
    setScheduleFeedback(null)
    setVoiceFeedback(null)
    setVoiceEnabled(voicePref)
    autoFullscreenRef.current = false
    if (fullscreenPref) setFullscreen(true)
    setStudying(true)
  }

  function exitStudy(opts?: { semConvite?: boolean }) {
    // Fim do estudo: o melhor (e único) instante em que a opinião sobre o deck
    // existe de verdade. O convite só aparece se houve estudo suficiente —
    // e espera a tela de resultado fechar, quando há uma.
    if (!opts?.semConvite) convidarParaAvaliar()
    setReviewingErrors(false)
    setStudying(false)
    setStudyOrder(null)
    setVoiceEnabled(false)
    setVoiceFeedback(null)
    setScheduleFeedback(null)
    setStudyingAhead(false)
    requeueCountRef.current = {}
    // Sair do estudo é o melhor momento para despachar o que ainda está na
    // fila: a rede está livre e o usuário não está esperando nada.
    void reviewSyncRef.current?.flush()
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current)
      advanceTimerRef.current = null
    }
  }

  // Deslizar para trocar de card. Só entra em ação quando o gesto é claramente
  // horizontal, então a rolagem vertical da página continua intacta; o clique
  // que o navegador emite no fim do gesto é engolido para não virar o card.
  const swipeRef = useRef({ x: 0, y: 0, active: false })
  // Janela de tempo em vez de um booleano: trocar de card desmonta o alvo do
  // clique, então o evento pode nunca chegar — uma flag ficaria pendurada e
  // engoliria o próximo toque legítimo.
  const swallowClickUntilRef = useRef(0)

  function onCardPointerDown(e: React.PointerEvent) {
    if (e.pointerType === 'mouse') return
    swipeRef.current = { x: e.clientX, y: e.clientY, active: true }
  }

  function onCardPointerUp(e: React.PointerEvent) {
    const start = swipeRef.current
    if (!start.active) return
    swipeRef.current = { ...start, active: false }
    const dx = e.clientX - start.x
    const dy = e.clientY - start.y
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.4) return
    swallowClickUntilRef.current = Date.now() + 400
    if (dx < 0) goNext()
    else goPrev()
  }

  function onCardClickCapture(e: React.MouseEvent) {
    if (Date.now() > swallowClickUntilRef.current) return
    swallowClickUntilRef.current = 0
    e.preventDefault()
    e.stopPropagation()
  }

  function discardSavedProgress() {
    clearProgress(slug, userKey)
    setSavedProgress(null)
  }

  /**
   * Devolve o card errado para o fim da fila da própria sessão.
   *
   * É metade do valor da repetição espaçada: o card que travou não pode sumir
   * por um dia inteiro, ele precisa voltar em minutos, enquanto a resposta
   * ainda está fresca. O teto de repetições evita que um único card difícil
   * transforme a sessão num loop.
   */
  function requeueCard(cardId: string): boolean {
    const seen = requeueCountRef.current[cardId] || 0
    if (seen >= MAX_REQUEUES_PER_CARD) return false
    requeueCountRef.current[cardId] = seen + 1
    setStudyOrder(prev => {
      if (!prev) return prev
      const insertAt = Math.min(currentIndex + 1 + REQUEUE_GAP, prev.length)
      const next = [...prev]
      next.splice(insertAt, 0, cardId)
      return next
    })
    return true
  }

  /**
   * Avaliação de um card.
   *
   * Nada aqui espera a rede. O mesmo motor que roda no servidor calcula o
   * agendamento no navegador, a tela já mostra quando o card volta e o
   * registro sai por uma fila em segundo plano — que reenvia sozinha se a
   * conexão cair e retoma na próxima abertura do deck se a aba fechar.
   */
  function rate(value: FlashcardSpacedRating, opts?: { source?: 'voice' }) {
    if (!data) return
    const card = studyCards[currentIndex]
    if (!card) return
    const cardId = String(card._id)
    setRatings(prev => ({ ...prev, [cardId]: value }))
    ratingsRef.current = { ...ratingsRef.current, [cardId]: value }
    marcarCardAvaliado()
    registrarDiaDeEstudo()

    // Placar da sessão e a sequência de acertos — o "combo" que sobe a cada
    // card lembrado e zera no primeiro que travou.
    const score = sessionRef.current
    score.counts[value] += 1
    if (value === 'DIFICIL') {
      score.errorIds.add(cardId)
      setCombo(0)
    } else {
      setCombo(prev => {
        const next = prev + 1
        if (next > score.bestCombo) score.bestCombo = next
        return next
      })
    }
    // Caderno de erros local: errou entra, acertou sai (vale nos dois modos).
    setLocalErrors(marcarErroLocal(userKey, slug, cardId, value === 'DIFICIL'))
    // Um toque leve no celular: a resposta é sentida, não só vista.
    try {
      navigator.vibrate?.(value === 'DIFICIL' ? [14, 50, 14] : 9)
    } catch {}

    let requeued = false

    if (activeStudyMode === 'spaced') {
      const reviewedAt = new Date()
      const retention = RETENTION_PRESETS[retentionPreset]
      const result = calculateNextSpacedReview(card.spacedProgress as any, value, reviewedAt, {
        retention,
        seed: cardId,
      })

      setScheduleFeedback(getReviewFeedbackMessage(result))
      // Guarda o estado anterior para o "Desfazer" do modo voz conseguir
      // devolver o card ao ponto em que ele estava.
      undoSnapshotRef.current = { cardId, progress: card.spacedProgress ?? null }

      // Progresso otimista: o cálculo é determinístico e idêntico ao do
      // servidor, então isto não é um "quase" — é o mesmo agendamento.
      const optimistic: SpacedProgressResponse = {
        ...(card.spacedProgress || {}),
        userId: data.viewer.userId || '',
        cardId,
        deckId: String(data.deck._id),
        rating: result.rating,
        reviewCount: result.reviewCount,
        correctStreak: result.correctStreak,
        easeFactor: result.easeFactor,
        intervalDays: result.intervalDays,
        stability: result.stability,
        difficulty: result.difficulty,
        state: result.state,
        learningStep: result.learningStep,
        lapses: result.lapses,
        retention: result.retention,
        nextReviewAt: result.nextReviewAt.toISOString(),
        lastReviewedAt: reviewedAt.toISOString(),
        createdAt: card.spacedProgress?.createdAt || reviewedAt.toISOString(),
        updatedAt: reviewedAt.toISOString(),
      }
      setData(prev => prev ? {
        ...prev,
        cards: prev.cards.map(c => String(c._id) === cardId ? { ...c, spacedProgress: optimistic } : c),
      } : prev)

      reviewSyncRef.current?.push({
        cardId,
        rating: value,
        reviewedAt: reviewedAt.toISOString(),
        retention,
      })

      if (result.returnsThisSession) requeued = requeueCard(cardId)
    }

    // `requeued` conta: a fila cresceu neste mesmo instante, então mesmo no
    // último card ainda existe um próximo para onde ir.
    if (currentIndex < studyCards.length - 1 || requeued) {
      // Por voz o avanço espera a janela de "Desfazer" fechar — se o
      // reconhecimento errou, o card ainda está na tela para corrigir.
      // Fora dela, o atraso é só o suficiente para o toque ser visto.
      const delay = opts?.source === 'voice' ? VOICE_UNDO_MS : 160
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current)
      advanceTimerRef.current = setTimeout(() => {
        advanceTimerRef.current = null
        // Avanço por atualização funcional: o `goNext` deste render ainda vê a
        // fila de antes do `requeueCard`, e no último card ele achava que não
        // havia próximo — o card errado voltava para a fila e a tela travava.
        setCurrentIndex(i => i + 1)
        resetCardTransientState()
      }, delay)
    } else {
      // Último card avaliado: a sessão termina sozinha, com a tela de
      // resultado — sem obrigar a procurar o "Concluir".
      const delay = opts?.source === 'voice' ? VOICE_UNDO_MS : 420
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current)
      advanceTimerRef.current = setTimeout(() => {
        advanceTimerRef.current = null
        void finishSession()
      }, delay)
    }
  }

  // ─── Modo voz ──────────────────────────────────────────────────────────────
  // O microfone só existe enquanto o card está no verso e ainda não foi
  // avaliado. Fora disso (frente do card, navegando, fora do estudo) ele é
  // desligado de verdade — nada de gravação em segundo plano.
  const currentStudyCard = studyCards[currentIndex]
  const currentCardId = currentStudyCard ? String(currentStudyCard._id) : null

  /**
   * Quando cada resposta traz o card de volta, calculado ANTES de o usuário
   * escolher. É o que faz a repetição espaçada deixar de ser mágica: dá para
   * ver que "Fácil" joga o card para 12 dias e "Difícil" o traz em 5 minutos.
   */
  const ratingPreviews = useMemo(() => {
    if (activeStudyMode !== 'spaced' || !currentStudyCard) return null
    const now = new Date()
    const retention = RETENTION_PRESETS[retentionPreset]
    const previews: Partial<Record<FlashcardSpacedRating, string>> = {}
    for (const option of RATINGS) {
      previews[option.value] = formatIntervalLabel(
        calculateNextSpacedReview(currentStudyCard.spacedProgress as any, option.value, now, {
          retention,
          seed: String(currentStudyCard._id),
        })
      )
    }
    return previews
  }, [activeStudyMode, currentStudyCard, retentionPreset])
  const voiceListeningAllowed =
    studying && voiceEnabled && flipped && !!currentCardId && !ratings[currentCardId]

  const voice = useFlashcardVoice({
    enabled: voiceListeningAllowed,
    onRating: (rating: FlashcardSpacedRating, heard: string) => {
      if (!currentCardId) return
      setVoiceFeedback({ rating, heard, cardId: currentCardId })
      rate(rating, { source: 'voice' })
    },
  })

  // O recibo do agendamento ("Volta em 12 dias") é uma confirmação, não um
  // estado: aparece, é lido e sai — sem prender o avanço do card.
  useEffect(() => {
    if (!scheduleFeedback) return
    const timer = setTimeout(() => setScheduleFeedback(null), 1800)
    return () => clearTimeout(timer)
  }, [scheduleFeedback])

  // O aviso "Ouvi: X" se apaga sozinho quando a janela de desfazer termina.
  useEffect(() => {
    if (!voiceFeedback) return
    const timer = setTimeout(() => setVoiceFeedback(null), VOICE_UNDO_MS)
    return () => clearTimeout(timer)
  }, [voiceFeedback])

  // Permissão negada: não adianta insistir — desliga o modo e avisa o usuário.
  useEffect(() => {
    if (voice.status === 'denied' && voiceEnabled) {
      setVoiceEnabled(false)
      setToast({
        open: true,
        message: 'Microfone bloqueado. Libere o acesso ao microfone nas permissões do navegador para usar o modo voz.',
        type: 'error',
      })
    }
  }, [voice.status, voiceEnabled])

  // Nunca deixar um avanço automático pendurado ao desmontar a página.
  useEffect(() => () => {
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current)
  }, [])

  // Desfaz a avaliação marcada por voz: tira a marca, cancela o avanço e
  // devolve o card. No modo espaçado a revisão já foi gravada, mas a próxima
  // avaliação do mesmo card sobrescreve o agendamento no servidor.
  function undoVoiceRating() {
    const feedback = voiceFeedback
    if (!feedback) return
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current)
      advanceTimerRef.current = null
    }
    setRatings(prev => {
      const next = { ...prev }
      delete next[feedback.cardId]
      return next
    })
    const snapshot = undoSnapshotRef.current
    if (snapshot && snapshot.cardId === feedback.cardId) {
      setData(prev => prev ? {
        ...prev,
        cards: prev.cards.map(c => String(c._id) === snapshot.cardId
          ? { ...c, spacedProgress: snapshot.progress }
          : c),
      } : prev)
      undoSnapshotRef.current = null
    }
    setScheduleFeedback(null)
    setVoiceFeedback(null)
  }

  async function finishSession() {
    if (!data) return
    const finalRatings = ratingsRef.current
    const ratedCount = Object.keys(finalRatings).length
    try {
      // No modo espaçado cada avaliação já virou uma revisão gravada; mandar
      // as mesmas notas de novo só duplicaria o histórico. O que falta aqui é
      // registrar que o deck foi estudado.
      const entries = activeStudyMode === 'spaced'
        ? []
        : Object.entries(finalRatings).map(([cardId, rating]) => ({
            cardId,
            rating: toLegacyRating(rating),
            completedAt: new Date(),
          }))
      await fetch(`/api/flashcards/manual/${encodeURIComponent(slug)}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries, startedAt: new Date(sessionRef.current.startedAt || Date.now()) }),
      })
    } catch {}
    if (!reviewingErrors) {
      clearProgress(slug, userKey)
      setSavedProgress(null)
    }
    const score = sessionRef.current
    const wasErrorsReview = reviewingErrors
    exitStudy({ semConvite: ratedCount > 0 })
    if (ratedCount === 0) {
      setToast({ open: true, message: 'Sessão encerrada.', type: 'info' })
      return
    }
    // Erros que continuam errados no fim da sessão (um card que travou e
    // depois foi acertado na volta da fila não conta).
    const stillWrong = Array.from(score.errorIds).filter(id => finalRatings[id] === 'DIFICIL')
    setSummary({
      rated: ratedCount,
      counts: { ...score.counts },
      errorIds: stillWrong,
      fixedErrors: wasErrorsReview ? ratedCount - stillWrong.length : 0,
      durationMs: Date.now() - (score.startedAt || Date.now()),
      bestCombo: score.bestCombo,
      errorsReview: wasErrorsReview,
    })
  }

  function closeSummary() {
    setSummary(null)
    convidarParaAvaliar()
  }

  async function toggleLike() {
    if (!data?.viewer.isAuthenticated) {
      router.push(`/auth/login?redirect=${encodeURIComponent(`/flashcards/d/${slug}`)}`)
      return
    }
    try {
      const method = liked ? 'DELETE' : 'POST'
      const res = await fetch(`/api/flashcards/manual/${encodeURIComponent(slug)}/like`, { method })
      const json = await res.json()
      if (res.ok) {
        setLiked(!liked)
        setLikeCount(json.likeCount ?? likeCount + (liked ? -1 : 1))
      }
    } catch {}
  }

  /**
   * Resgate do deck pela assinatura Plus+ — mesmo endpoint usado em
   * /materiais e /pacotes. Não passa por carrinho nem checkout: grava a
   * aquisição do material vinculado direto e recarrega o deck.
   */
  async function claimWithPlus() {
    if (!data?.deck.linkedMaterialId) return
    if (!data.viewer.isAuthenticated) {
      router.push(`/auth/login?redirect=${encodeURIComponent(`/flashcards/d/${slug}`)}`)
      return
    }
    setClaimingPlus(true)
    try {
      const res = await fetch('/api/materiais/resgatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemType: 'material', itemId: data.deck.linkedMaterialId }),
      })
      if (res.ok) avisarXp('resgate')
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setToast({ open: true, message: json.error || 'Não foi possível resgatar este deck.', type: 'error' })
        return
      }
      setToast({ open: true, message: json.message || 'Deck resgatado!', type: 'success' })
      await load()
    } catch {
      setToast({ open: true, message: 'Não foi possível resgatar este deck. Tente novamente.', type: 'error' })
    } finally {
      setClaimingPlus(false)
    }
  }

  async function buy(skipUpsell = false) {
    if (!data?.deck.linkedMaterialId) {
      setToast({ open: true, message: 'Este deck ainda não tem produto vinculado. Contate o administrador.', type: 'error' })
      return
    }
    const materialId = data.deck.linkedMaterialId
    fetch('/api/analytics/checkout-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'buy_click',
        productId: materialId,
        productTitle: data.deck.title,
        productType: 'flashcard',
        amount: Number(data.deck.price || 0),
        source: 'Compra direta',
        metadata: { deckSlug: data.deck.slug },
      }),
      keepalive: true,
    }).catch(() => {})

    if (!data.viewer.isAuthenticated) {
      // Compra sem login via Serial Key (nome/e-mail/telefone no checkout).
      router.push(`/comprar?productType=flashcard&productId=${materialId}&itemType=material`)
      return
    }

    if (!skipUpsell) {
      try {
        const pkgsRes = await fetch('/api/materiais/packages?includeAccess=true', { cache: 'no-store' })
        if (pkgsRes.ok) {
          const pkgsJson = await pkgsRes.json()
          const pkgs: UpsellPackage[] = pkgsJson.packages || []
          const matchingPkg = pkgs.find((pkg: any) =>
            !pkg._isPurchased &&
            pkg.pricing === 'paid' &&
            (pkg.price ?? 0) > 0 &&
            !pkg._pricing?.ownedMaterialIds?.length &&
            pkg.materials?.some((m: any) => m._id === materialId)
          )
          if (matchingPkg) {
            setUpsellPkg(matchingPkg)
            return
          }
        }
      } catch {}
    }

    router.push(`/materiais/checkout?type=material&id=${materialId}`)
  }

  async function downloadDeckPdf() {
    if (!data) return
    if (data.deck.pdfDownloadEnabled !== true) {
      setToast({ open: true, message: 'PDF não está liberado para este deck.', type: 'info' })
      return
    }
    if (!data.viewer.isAuthenticated) {
      router.push(`/auth/login?redirect=${encodeURIComponent(`/flashcards/d/${data.deck.slug}`)}`)
      return
    }
    setDownloadingPdf(true)
    setToast({ open: true, message: 'Gerando PDF. Isso pode levar alguns segundos...', type: 'info' })
    try {
      const res = await fetch(`/api/flashcards/manual/${encodeURIComponent(data.deck.slug)}/pdf`, { cache: 'no-store' })
      if (!res.ok) {
        const json = await res.json().catch(() => null)
        throw new RespostaRecusada(json?.error || 'Não foi possível baixar o PDF')
      }
      const safeTitle = data.deck.title
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80) || 'flashcards'
      // O helper compartilhado confere se o corpo chegou inteiro antes de
      // salvar (uma resposta cortada no meio virava um PDF que não abre) e
      // só revoga o object URL depois que o download começou.
      await downloadPdfResponse(res, `${safeTitle}-DomineAqui.pdf`)
      setToast({ open: true, message: "PDF baixado com marca d'água.", type: 'success' })
    } catch (err: any) {
      // A recusa do servidor tem texto próprio ("sem acesso", "limite de
      // downloads") e é o que o usuário precisa ler. O resto é falha de
      // transferência, e aí quem sabe descrever é o helper — a mensagem antiga
      // culpava a internet de quem estava online.
      const message = err instanceof RespostaRecusada
        ? err.message
        : describePdfDownloadFailure(err)
      setToast({ open: true, message, type: 'error' })
    } finally {
      setDownloadingPdf(false)
    }
  }

  // Convite de avaliação ao fechar o deck — ver `lib/reviews-prompt.ts`.
  //
  // Aqui o gatilho principal não é navegar: sair do estudo é trocar de estado,
  // e a pessoa continua na mesma página. Por isso `exitStudy()` chama
  // `convidarParaAvaliar()` na mão. Cada card avaliado conta como sinal, o que
  // deixa quem de fato estudou passar do mínimo em poucos segundos — enquanto
  // quem só abriu a página do deck para olhar precisa dos dois minutos.
  const { registrarSinal: marcarCardAvaliado, convidar: convidarParaAvaliar } = useConviteDeAvaliacao({
    targetType: 'flashcard_deck',
    targetId: data?.deck?._id ? String(data.deck._id) : null,
    titulo: data?.deck?.title || 'este deck',
    capa: data?.deck?.coverImage || null,
    origem: 'flashcards',
    href: data?.deck?.slug ? `/flashcards/d/${data.deck.slug}` : null,
    habilitado: !!data?.access?.hasAccess,
    // Uma sessão de estudo real passa fácil dos 45s; três cards respondidos já
    // valem sozinhos (com 8s de piso). Os 120s originais eram um teste de
    // paciência: quem revisa cinco cards e sai — o uso mais comum de um deck —
    // nunca chegava lá.
    segundosMinimos: 45,
    sinaisMinimos: 3,
  })

  if (loading) {
    return (
      <AppShell allowGuest vidro>
        <FundoIos>
          <DeckPageSkeleton />
        </FundoIos>
      </AppShell>
    )
  }

  if (!data) {
    return (
      <AppShell allowGuest vidro>
        <FundoIos>
          <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
            <span className="ios-rotulo-2 mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--ios-preenchimento)]">
              <Lock className="h-7 w-7" />
            </span>
            <h1 className="text-[22px] font-bold tracking-[-0.02em]">Deck não encontrado</h1>
            <p className="ios-rotulo-2 mt-1.5 max-w-xs text-[15px]">Ele foi removido ou não está disponível para você.</p>
            <button type="button" onClick={() => router.push('/flashcards')} className="ios-botao mt-6">
              <ChevronLeft className="-ml-1 h-5 w-5" /> Voltar aos flashcards
            </button>
          </div>
        </FundoIos>
      </AppShell>
    )
  }

  const { deck, cards, access } = data
  const isLocked = !access.hasAccess
  const isPaid = deck.pricing === 'paid'
  const canDownloadPdf = !isLocked && deck.pdfDownloadEnabled === true

  // Lote dinâmico por evento
  const eventState = data.pricingEventState || null
  const tierPct = eventState?.activeTier?.discountPercent || 0
  const hasTier = isPaid && !!eventState?.activeTier && eventState.isActive !== false && tierPct > 0
  const originalDeckPrice = Number(deck.price || 0)
  const tierDeckPrice = hasTier
    ? Math.max(0, Math.round(originalDeckPrice * (1 - tierPct / 100) * 100) / 100)
    : originalDeckPrice

  // ── Resultado da sessão ────────────────────────────────────────────────────
  if (summary && !studying) {
    return (
      <AppShell allowGuest vidro>
        <FundoIos capa={deck.coverImage || null} capaSizes={HERO_SIZES}>
          <SessionResult
            summary={summary}
            deckTitle={deck.title}
            onReviewErrors={() => startErrorsReview(summary.errorIds)}
            onStudyMore={() => startStudy(studyModeChoice, null)}
            onClose={closeSummary}
            studyMoreLabel={
              studyModeChoice === 'spaced'
                ? dueNowCount + newNowCount > 0 ? `Continuar · ${dueNowCount + newNowCount} ${dueNowCount + newNowCount === 1 ? 'card' : 'cards'}` : null
                : 'Estudar de novo'
            }
          />
        </FundoIos>
        <ToastAlert open={toast.open} message={toast.message} type={toast.type} onOpenChange={(open) => setToast(t => ({ ...t, open }))} />
      </AppShell>
    )
  }

  if (studying && studyCards.length === 0 && activeStudyMode === 'spaced') {
    // Fim de fila: não sobrou nada vencido para hoje. Em vez de abrir uma
    // sessão vazia (ou pior, o baralho inteiro sem aviso), a tela diz o que
    // aconteceu e oferece as duas saídas possíveis.
    return (
      <AppShell allowGuest vidro>
        <FundoIos capa={deck.coverImage || null} capaSizes={HERO_SIZES}>
          <div className="mx-auto flex min-h-[75vh] max-w-md flex-col items-center justify-center px-6 py-10 text-center">
            <span className="ios-assenta mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--ios-tinta)] text-white shadow-[var(--ios-sombra-alta)]">
              <Check className="h-10 w-10" strokeWidth={3} />
            </span>
            <h1 className="ios-titulo-produto">Revisões de hoje em dia</h1>
            <p className="ios-rotulo-2 mt-2 text-[15px] leading-relaxed">
              Nenhum card deste deck venceu agora. O ganho está em revisar no limite do esquecimento —
              antes disso é esforço com pouco retorno.
              {queueCounts && queueCounts.future > 0 && (
                <> Os próximos {queueCounts.future} cards já têm data marcada.</>
              )}
            </p>
            <div className="mt-7 flex w-full flex-col gap-2">
              {errorCards.length > 0 && (
                <button type="button" onClick={() => startErrorsReview()} className="ios-botao-erro ios-botao-g w-full">
                  <RotateCcw className="h-[18px] w-[18px]" /> Refazer {errorCards.length} {errorCards.length === 1 ? 'erro' : 'erros'}
                </button>
              )}
              <button type="button" onClick={() => startStudy('spaced', null, { ahead: true })} className="ios-botao-cinza ios-botao-g w-full">
                <Zap className="h-[18px] w-[18px]" /> Adiantar revisões
              </button>
              <button type="button" onClick={() => exitStudy()} className="ios-tinta mt-1 h-11 text-[16px] font-semibold">
                Voltar ao deck
              </button>
            </div>
          </div>
        </FundoIos>
        <ToastAlert open={toast.open} message={toast.message} type={toast.type} onOpenChange={(open) => setToast(t => ({ ...t, open }))} />
      </AppShell>
    )
  }

  if (studying) {
    const card = studyCards[currentIndex]
    const total = studyCards.length
    const progress = total > 0 ? ((currentIndex + 1) / total) * 100 : 0
    return (
      <AppShell allowGuest vidro>
        <FundoIos>
        <div
          ref={studyRef}
          className={cn(
            fullscreen && 'fixed inset-0 z-[60] overflow-y-auto overscroll-contain bg-[var(--ios-chao)]',
          )}
          style={fullscreen ? {
            paddingTop: 'env(safe-area-inset-top)',
            paddingBottom: 'env(safe-area-inset-bottom)',
            paddingLeft: 'env(safe-area-inset-left)',
            paddingRight: 'env(safe-area-inset-right)',
          } : undefined}
        >
        <div className={cn(
          // `flashcard-estudo` é o gancho do CSS que aperta o supérfluo quando a
          // tela é baixa e deitada (tablet na horizontal). Ver globals.css.
          'flashcard-estudo mx-auto px-3 py-3 sm:px-4 sm:py-5',
          fullscreen ? 'flex min-h-full max-w-5xl flex-col lg:max-w-6xl' : 'max-w-3xl lg:max-w-5xl',
        )}>
          <div className={cn(
            'flashcard-estudo-topo mb-3 rounded-[20px] p-1.5',
            fullscreen ? '!bg-transparent' : 'ios-vidro',
          )}>
            <div className="relative flex items-center justify-between gap-2">
              {/* Logo DomineAqui — só na tela cheia, onde o cabeçalho do app some.
                  Centralizada e sem captura de clique para nunca cobrir os botões. */}
              {fullscreen && (
                <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-90">
                  <Logo variant="full" size="sm" className="hidden sm:block dark:sm:hidden" />
                  <Logo variant="dark" size="sm" className="hidden dark:sm:block" />
                  <Logo variant="icon" size="sm" className="sm:hidden" />
                </div>
              )}
              <button type="button" onClick={() => exitStudy()} className="ios-voltar">
                <ChevronLeft className="h-[22px] w-[22px] shrink-0" strokeWidth={2.5} /> Sair
              </button>
              <div className="flex min-w-0 items-center gap-1.5">
                {reviewingErrors ? (
                  <span className="ios-erro ios-erro-suave hidden items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-semibold sm:inline-flex">
                    <RotateCcw className="h-3.5 w-3.5" /> Caderno de erros
                  </span>
                ) : activeStudyMode === 'spaced' && !fullscreen ? (
                  <span
                    className="ios-tinta hidden items-center gap-1 rounded-full bg-[var(--ios-tinta-suave)] px-2.5 py-1 text-[12px] font-semibold sm:inline-flex"
                    title={queueCounts ? `${queueCounts.due + queueCounts.learning} para revisar · ${queueCounts.newCards} novos` : undefined}
                  >
                    <Brain className="h-3.5 w-3.5" />
                    Repetição espaçada
                    {studyingAhead && <span className="opacity-70">· adiantando</span>}
                  </span>
                ) : null}
                {/* Sequência de acertos: aparece a partir do 3º seguido e pula
                    a cada card lembrado. Zera no primeiro "Difícil". */}
                {combo >= 3 && (
                  <span
                    key={combo}
                    className="ios-pulo inline-flex items-center gap-1 rounded-full bg-[#f08a24]/15 px-2.5 py-1 text-[12px] font-bold tabular-nums text-[#c76a10] dark:text-[#ffb15e]"
                    aria-label={`${combo} acertos seguidos`}
                  >
                    <Flame className="h-3.5 w-3.5 fill-current" /> {combo}
                  </span>
                )}
                <span className="rounded-full bg-[var(--ios-preenchimento)] px-2.5 py-1 text-[13px] font-semibold tabular-nums">
                  {currentIndex + 1}<span className="ios-rotulo-3">/{total}</span>
                </span>
                {/* Modo voz — liga/desliga sem sair do estudo. Some de vez em
                    navegadores sem reconhecimento de fala. */}
                {voice.supported && (
                  <button
                    type="button"
                    onClick={() => setVoiceEnabled(v => !v)}
                    aria-pressed={voiceEnabled}
                    aria-label={voiceEnabled ? 'Desligar modo voz' : 'Ligar modo voz'}
                    title={voiceEnabled ? 'Modo voz ligado' : 'Ligar modo voz'}
                    className={cn('ios-icone-botao h-9 w-9', voiceEnabled && 'bg-[var(--ios-tinta)] text-white')}
                  >
                    {voiceEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                  </button>
                )}
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="ios-icone-botao !h-9 !w-9"
                  aria-label={fullscreen ? 'Sair da tela cheia' : 'Expandir para tela cheia'}
                  title={fullscreen ? 'Sair da tela cheia (F)' : 'Expandir para tela cheia (F)'}
                >
                  {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
          <div className="flashcard-estudo-progresso mb-3 h-1.5 overflow-hidden rounded-full bg-[var(--ios-preenchimento-forte)]">
            <motion.div
              className={cn('h-full rounded-full', reviewingErrors ? 'bg-[#e5484d]' : 'bg-[var(--ios-tinta)]')}
              animate={{ width: `${progress}%` }}
              transition={{ type: 'spring', stiffness: 160, damping: 26 }}
            />
          </div>
          <CardPager
            total={total}
            current={currentIndex}
            ratings={ratings}
            cards={studyCards}
            onJump={goToIndex}
          />

          {/* Sugestão de tela cheia — some para sempre assim que o usuário
              aceita ou dispensa. O botão de expandir continua no topo. */}
          {fullscreenHint && !fullscreen && (
            <div className="ios-lista mb-3">
              <div className="ios-linha !gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[var(--ios-tinta)] text-white">
                  <Maximize2 className="h-4 w-4" />
                </span>
                <p className="min-w-0 flex-1 text-[14px] leading-snug">
                  <strong className="font-semibold">Estude em tela cheia.</strong>{' '}
                  <span className="ios-rotulo-2">Só o card, sem distração.</span>
                </p>
                <button type="button" onClick={toggleFullscreen} className="ios-botao-suave ios-botao-p shrink-0">
                  Expandir
                </button>
                <button
                  type="button"
                  onClick={dismissFullscreenHint}
                  aria-label="Dispensar sugestão de tela cheia"
                  className="ios-rotulo-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-[var(--ios-preenchimento)]"
                >
                  <X className="h-4 w-4" strokeWidth={2.5} />
                </button>
              </div>
            </div>
          )}

          {card && (
            /* Em tela cheia, o card cresce e fica centralizado no espaço livre
               entre o cabeçalho e a barra de ações. Troca de card sem animação
               de wrapper: animar um ancestral do card 3D forçava
               re-rasterização (flicker) a cada navegação. */
            <div
              className={cn(fullscreen && 'flex flex-1 flex-col justify-center')}
              onPointerDown={onCardPointerDown}
              onPointerUp={onCardPointerUp}
              onPointerCancel={() => { swipeRef.current = { ...swipeRef.current, active: false } }}
              onClickCapture={onCardClickCapture}
            >
              <FlashcardCardView
                key={card._id}
                card={card}
                className={fullscreen ? 'max-w-3xl lg:max-w-5xl' : undefined}
                flipped={flipped}
                onFlip={() => setFlipped(f => !f)}
                showComment={showComment}
                onToggleComment={() => setShowComment(s => !s)}
                showHint={showHint}
                onToggleHint={() => setShowHint(s => !s)}
                marcaDagua
              />
            </div>
          )}

          {/* Barra de ações fixa — sempre acessível sem rolar a página. Fundo
              opaco e camada própria (translateZ): o desfoque recalculado a
              cada frame fazia o "Mostrar resposta" piscar ao rolar no celular. */}
          <div
            className="flashcard-estudo-barra sticky bottom-0 z-30 -mx-3 mt-4 space-y-2.5 bg-[var(--ios-chao)] px-3 pt-3 sm:-mx-4 sm:px-4"
            style={{
              paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))',
              transform: 'translateZ(0)',
              backfaceVisibility: 'hidden',
              boxShadow: '0 -18px 30px -24px rgba(0,0,0,0.35)',
            }}
          >
            {activeStudyMode === 'spaced' && (
              <AnimatePresence>
                {scheduleFeedback && (
                  <motion.div
                    key="schedule-feedback"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.14 }}
                    className="ios-tinta mx-auto flex w-fit max-w-md items-center justify-center gap-1.5 rounded-full bg-[var(--ios-tinta-suave)] px-4 py-1.5 text-center text-[13px] font-semibold"
                  >
                    <CalendarClock className="h-3.5 w-3.5 shrink-0" />
                    {scheduleFeedback}
                  </motion.div>
                )}
              </AnimatePresence>
            )}

            {/* Envio em segundo plano: a faixa só aparece quando a rede falhou
                e ainda há avaliações esperando. */}
            {activeStudyMode === 'spaced' && syncStatus === 'error' && pendingReviews > 0 && (
              <div className="ios-ambar mx-auto flex w-fit max-w-md items-center justify-center gap-2 rounded-full bg-[var(--ios-ambar-suave)] px-3 py-1.5 text-[12px] font-medium">
                <CloudOff className="h-3.5 w-3.5 shrink-0" />
                Sem conexão · {pendingReviews} {pendingReviews === 1 ? 'avaliação guardada' : 'avaliações guardadas'}. Elas sobem sozinhas.
              </div>
            )}

            {/* Modo voz: o que o microfone está fazendo e o que ele ouviu. */}
            {voiceEnabled && (
              <AnimatePresence mode="wait" initial={false}>
                {voiceFeedback ? (
                  <motion.div
                    key="voice-heard"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.16 }}
                    className="mx-auto flex max-w-md items-center gap-2 rounded-full bg-[var(--ios-tinta-suave)] py-1.5 pl-3 pr-1.5 text-[14px]"
                  >
                    <Mic className="ios-tinta h-4 w-4 shrink-0" />
                    <span className="min-w-0 flex-1 truncate">
                      Ouvi “{voiceFeedback.heard}” →{' '}
                      <strong className="font-bold">{RATINGS.find(r => r.value === voiceFeedback.rating)?.label}</strong>
                    </span>
                    <button type="button" onClick={undoVoiceRating} className="ios-botao-suave ios-botao-p shrink-0 !bg-[var(--ios-cartao-solido)]">
                      <Undo2 className="h-3.5 w-3.5" /> Desfazer
                    </button>
                  </motion.div>
                ) : voiceListeningAllowed ? (
                  <motion.div
                    key="voice-listening"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.16 }}
                    className="mx-auto flex max-w-md items-center gap-2 rounded-full bg-[var(--ios-tinta-suave)] py-1.5 pl-3 pr-1.5"
                  >
                    <span className="relative flex h-2.5 w-2.5 shrink-0">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--ios-tinta)] opacity-70" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[var(--ios-tinta)]" />
                    </span>
                    <span className="min-w-0 flex-1 text-[13px] font-medium leading-snug">
                      {voice.status === 'starting'
                        ? 'Abrindo o microfone...'
                        : voice.status === 'error'
                          ? 'Microfone instável — use os botões abaixo.'
                          : 'Ouvindo: diga fácil, médio ou difícil'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setVoiceEnabled(false)}
                      aria-label="Desligar modo voz"
                      title="Desligar modo voz"
                      className="ios-icone-botao !h-8 !w-8 !bg-transparent"
                    >
                      <MicOff className="h-4 w-4" />
                    </button>
                  </motion.div>
                ) : (
                  <motion.p
                    key="voice-idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="ios-rotulo-3 text-center text-[12px]"
                  >
                    Modo voz ligado · o microfone abre quando você virar o card
                  </motion.p>
                )}
              </AnimatePresence>
            )}

            {/* Ação principal: virar o card OU avaliar — troca no mesmo lugar */}
            <AnimatePresence mode="wait" initial={false}>
              {!flipped ? (
                <motion.button
                  key="reveal"
                  type="button"
                  onClick={() => setFlipped(true)}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.16 }}
                  className="flashcard-estudo-revelar ios-botao ios-botao-g w-full !text-[17px]"
                >
                  Mostrar resposta
                </motion.button>
              ) : (
                <motion.div
                  key="rate"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.16 }}
                >
                  <p className="flashcard-estudo-rotulo ios-rotulo-2 mb-2 text-center text-[13px] font-medium">
                    Como foi lembrar?
                  </p>
                  {/* A avaliação vale na hora e o registro sai por uma fila em
                      segundo plano. Embaixo de cada nota, quando o card volta. */}
                  <div className="grid grid-cols-3 gap-2">
                    {RATINGS.map(r => (
                      <button
                        key={r.value}
                        onClick={() => rate(r.value)}
                        title={`${r.label} — ${r.hint}`}
                        data-nota={r.value}
                        data-escolhida={ratings[card?._id] === r.value ? 'true' : 'false'}
                        className="flashcard-estudo-nota ios-nota"
                      >
                        <span>{r.label}</span>
                        {ratingPreviews?.[r.value] ? (
                          <small>{ratingPreviews[r.value]}</small>
                        ) : (
                          <small>{r.hint}</small>
                        )}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navegação compacta — anterior / próximo ou concluir */}
            <div className="flashcard-estudo-navegacao flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={goPrev}
                disabled={currentIndex === 0}
                className="ios-tinta inline-flex h-10 items-center gap-0.5 rounded-full px-2 text-[15px] font-semibold disabled:opacity-30"
              >
                <ChevronLeft className="h-5 w-5" /> Anterior
              </button>
              {currentIndex < total - 1 ? (
                <button
                  type="button"
                  onClick={goNext}
                  className="ios-tinta inline-flex h-10 items-center gap-0.5 rounded-full px-2 text-[15px] font-semibold"
                >
                  {flipped ? 'Pular' : 'Próximo'} <ChevronRight className="h-5 w-5" />
                </button>
              ) : (
                <button type="button" onClick={finishSession} className="ios-botao ios-botao-p">
                  <Trophy className="h-4 w-4" /> Concluir
                </button>
              )}
            </div>

            <p className="ios-rotulo-3 text-center text-[11px] sm:hidden">
              Deslize ← → para trocar · toque para virar
              {voiceEnabled && ' · fale fácil / médio / difícil'}
            </p>
            <p className="flashcard-estudo-atalhos ios-rotulo-3 hidden text-center text-[11px] sm:block">
              {fullscreen
                ? 'Espaço: virar · ← →: navegar · 1/2/3: avaliar · Esc ou F: sair da tela cheia'
                : 'Espaço: virar · ← →: navegar · 1/2/3: avaliar · F: tela cheia'}
              {voiceEnabled && ' · voz: fácil / médio / difícil'}
            </p>
          </div>
        </div>
        </div>
        </FundoIos>
        <ToastAlert open={toast.open} message={toast.message} type={toast.type} onOpenChange={(open) => setToast(t => ({ ...t, open }))} />
      </AppShell>
    )
  }

  // ── Página do deck ─────────────────────────────────────────────────────────
  const stats = data.spacedRepetition?.stats
  const reviewCount = reviewSummary?.count ?? 0
  const primaryLabel = savedProgress
    ? `Continuar · ${savedProgress.index + 1} de ${savedProgress.total}`
    : studyModeChoice === 'spaced'
      ? dueNowCount > 0
        ? `Revisar ${dueNowCount} ${dueNowCount === 1 ? 'card' : 'cards'}`
        : newNowCount > 0
          ? `Estudar ${newNowCount} ${newNowCount === 1 ? 'card novo' : 'cards novos'}`
          : 'Estudar com repetição espaçada'
      : 'Estudar na ordem do deck'

  // Faixa de informações (App Store): só o que tem número de verdade.
  const infoCells: { key: string; label: string; value: React.ReactNode; note: React.ReactNode; tone?: 'erro' | 'tinta' }[] = []
  if (reviewCount > 0 && reviewSummary) {
    infoCells.push({
      key: 'reviews',
      label: `${reviewCount} ${reviewCount === 1 ? 'avaliação' : 'avaliações'}`,
      value: reviewSummary.avg.toFixed(1).replace('.', ','),
      note: <StarRow value={reviewSummary.avg} />,
    })
  }
  infoCells.push({ key: 'cards', label: 'Deck', value: cards.length || deck.cardCount || 0, note: (cards.length || deck.cardCount) === 1 ? 'cartão' : 'cartões' })
  if (!isLocked && data.viewer.isAuthenticated) {
    infoCells.push({ key: 'due', label: 'Hoje', value: dueNowCount, note: dueNowCount === 1 ? 'para revisar' : 'para revisar', tone: dueNowCount > 0 ? 'tinta' : undefined })
    infoCells.push({ key: 'errors', label: 'Erros', value: errorCards.length, note: 'no caderno', tone: errorCards.length > 0 ? 'erro' : undefined })
    if (stats) {
      infoCells.push({ key: 'mastered', label: 'Dominados', value: stats.mastered, note: `de ${cards.length}` })
    }
  }
  if (metricSettings.flashcards.showViews) {
    infoCells.push({ key: 'views', label: 'Visualizações', value: compactNumber(deck.viewCount || 0), note: 'no total' })
  }
  infoCells.push({ key: 'author', label: 'Autor', value: deck.ownerType === 'admin' ? <Crown className="ios-ambar h-[22px] w-[22px]" /> : <Users className="h-[22px] w-[22px]" />, note: deck.ownerType === 'admin' ? 'Equipe' : (deck.ownerName || 'Comunidade') })

  return (
    <AppShell allowGuest vidro>
      <FundoIos capa={deck.coverImage || null} capaSizes={HERO_SIZES} className="pb-16">
      <div className="mx-auto max-w-6xl px-4 pt-3 sm:px-6 sm:pt-5 lg:px-8">
        <Link href="/flashcards" className="ios-voltar -ml-2.5 mb-3">
          <ChevronLeft className="h-[22px] w-[22px] shrink-0" strokeWidth={2.5} />
          <span className="truncate">{folderPath || 'Flashcards'}</span>
        </Link>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px] xl:gap-8">
          {/* ── Capa ── */}
          <div className="min-w-0 xl:col-start-1 xl:row-start-1">
            <div className="ios-assenta ios-capa relative w-full overflow-hidden rounded-[22px] shadow-[var(--ios-sombra-alta)] sm:rounded-[28px]" style={{ aspectRatio: '16/9' }}>
              {deck.coverImage ? (
                <Image src={deck.coverImage} alt="" fill priority className="object-cover" sizes={HERO_SIZES} />
              ) : (
                <div className="ios-capa-vazia flex h-full w-full items-center justify-center">
                  <span className="ios-tinta flex h-24 w-24 items-center justify-center rounded-[26px] bg-white/70 shadow-sm dark:bg-white/10">
                    <Brain className="h-11 w-11" />
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ── Título e ação: um painel só (no fluxo no celular, ao lado no desktop) ── */}
          <aside className="min-w-0 xl:col-start-2 xl:row-span-2 xl:row-start-1">
            <div className="space-y-4 xl:sticky xl:top-24">
              <div className="ios-painel">
                <div className="mb-2 flex flex-wrap items-center gap-1.5">
                  <VisibilityBadge visibility={deck.visibility} />
                  {deck.ownerType === 'admin' && (
                    <span className="ios-selo ios-selo-claro"><Crown className="h-3 w-3" /> Oficial</span>
                  )}
                  {access.isPurchased && (
                    access.timedAccess?.isTimed
                      ? <TimedAccessPill access={access.timedAccess} className="rounded-full px-2.5 py-0.5" />
                      : <span className="ios-tinta inline-flex h-6 items-center gap-1 rounded-full bg-[var(--ios-tinta-suave)] px-2.5 text-[11px] font-semibold"><Check className="h-3 w-3" strokeWidth={3} /> Adquirido</span>
                  )}
                </div>

                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h1 className="ios-titulo-produto">{deck.title}</h1>
                    <p className="ios-rotulo-2 mt-1 text-[15px]">
                      por {deck.ownerName} · {cards.length || deck.cardCount || 0} cartões
                    </p>
                  </div>
                  {metricSettings.flashcards.showLikes && (
                    <button
                      type="button"
                      onClick={toggleLike}
                      aria-pressed={liked}
                      aria-label={liked ? 'Descurtir deck' : 'Curtir deck'}
                      className={cn('ios-icone-botao ios-icone-botao-g -mr-1 flex-col gap-0 text-[10px] font-bold', liked && 'ios-erro ios-erro-suave')}
                    >
                      <Heart className={cn('h-[18px] w-[18px]', liked && 'fill-current')} />
                    </button>
                  )}
                </div>

                {reviewCount > 0 && (
                  <button
                    type="button"
                    onClick={() => document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                    className="ios-rotulo-2 mt-2 inline-flex items-center gap-1.5 text-[13px] font-medium"
                  >
                    <StarRow value={reviewSummary?.avg ?? 0} />
                    <span className="tabular-nums">{(reviewSummary?.avg ?? 0).toFixed(1).replace('.', ',')}</span>
                    <span>· {reviewCount} {reviewCount === 1 ? 'avaliação' : 'avaliações'}</span>
                  </button>
                )}

                {/* Para quem administra o deck: se ele está mesmo na lista de
                    /flashcards e, quando não está, o que falta. */}
                {access.canManage && !data.listing?.listedInCommunity && (
                  <DeckListingNote listing={data.listing} className="mt-3" />
                )}

                <div className="mt-5 space-y-2.5">
                  {isLocked && isPaid && access.includedInPlus ? (
                    <>
                      <p className="ios-ambar flex items-center gap-1.5 text-[15px] font-semibold">
                        <Crown className="h-4 w-4" /> Incluído no {PLUS_LABEL}
                      </p>
                      <button onClick={() => claimWithPlus()} disabled={claimingPlus} className="ios-botao-ambar ios-botao-g w-full">
                        {claimingPlus ? <Loader2 className="h-[18px] w-[18px] animate-spin" /> : <Gift className="h-[18px] w-[18px]" />}
                        Resgatar com o {PLUS_LABEL}
                      </button>
                    </>
                  ) : isLocked && isPaid ? (
                    <>
                      <div>
                        {hasTier && (
                          <p className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]">
                            <span className="ios-rotulo-3 tabular-nums line-through">{fmtBRL(originalDeckPrice)}</span>
                            <span className="ios-tinta font-semibold">−{Math.round(tierPct)}% no lote{eventState?.activeTier?.label ? ` ${eventState.activeTier.label}` : ''}</span>
                            <PricingEventBadge state={eventState} size="xs" />
                          </p>
                        )}
                        <p className="ios-preco">{fmtBRL(tierDeckPrice)}</p>
                        <p className="ios-rotulo-2 mt-1 text-[13px]">
                          {cards.length || deck.cardCount || 0} cartões com repetição espaçada · pagamento único
                        </p>
                      </div>
                      <button onClick={() => buy()} disabled={purchasing} className="ios-botao ios-botao-g w-full">
                        {purchasing ? <Loader2 className="h-[18px] w-[18px] animate-spin" /> : null}
                        Comprar deck
                      </button>
                    </>
                  ) : isLocked ? (
                    <>
                      <p className="ios-rotulo-2 text-[14px]">Entre na sua conta para estudar este deck e guardar o seu progresso.</p>
                      <button
                        onClick={() => router.push(`/auth/login?redirect=${encodeURIComponent(`/flashcards/d/${deck.slug}`)}`)}
                        className="ios-botao ios-botao-g w-full"
                      >
                        Entrar para estudar
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startStudy(studyModeChoice, savedProgress)}
                        disabled={cards.length === 0}
                        className="ios-botao ios-botao-g w-full !text-[17px]"
                      >
                        {savedProgress ? <RotateCcw className="h-[18px] w-[18px]" /> : <Play className="h-[18px] w-[18px] fill-current" />}
                        {primaryLabel}
                      </button>
                      {errorCards.length > 0 && (
                        <button type="button" onClick={() => startErrorsReview()} className="ios-botao-cinza ios-erro ios-erro-suave ios-botao-g w-full">
                          <RotateCcw className="h-[18px] w-[18px]" />
                          Refazer {errorCards.length} {errorCards.length === 1 ? 'erro' : 'erros'}
                        </button>
                      )}
                      {cards.length > 0 && (
                        <div className="overflow-hidden rounded-[16px] bg-[var(--ios-preenchimento)]">
                          {/* Como estudar: modo, tela cheia, voz — a decisão
                              fica ao lado do botão de começar. */}
                          {!savedProgress && (
                            <div className="p-1.5">
                              <div
                                className="ios-segmentado !bg-transparent !p-0"
                                style={{ ['--segmentos' as string]: 2, ['--indice' as string]: studyModeChoice === 'spaced' ? 0 : 1 }}
                                role="tablist"
                                aria-label="Modo de estudo"
                              >
                                <button type="button" role="tab" aria-selected={studyModeChoice === 'spaced'} onClick={() => chooseStudyMode('spaced')} className="ios-segmento !h-9 !text-[13px]">
                                  <Brain className="h-3.5 w-3.5" /> Espaçada
                                </button>
                                <button type="button" role="tab" aria-selected={studyModeChoice === 'normal'} onClick={() => chooseStudyMode('normal')} className="ios-segmento !h-9 !text-[13px]">
                                  Ordem do deck
                                </button>
                              </div>
                            </div>
                          )}
                          <ToggleRow
                            icon={<Maximize2 className="h-4 w-4" />}
                            label="Começar em tela cheia"
                            on={fullscreenPref}
                            onToggle={toggleFullscreenPref}
                          />
                          <ToggleRow
                            icon={voicePref && voice.supported ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                            label={voice.supported ? 'Avaliar falando' : 'Voz indisponível neste navegador'}
                            hint={voice.supported && voicePref ? 'Diga fácil, médio ou difícil' : undefined}
                            on={voicePref && voice.supported}
                            disabled={!voice.supported}
                            onToggle={toggleVoicePref}
                          />
                        </div>
                      )}
                    </>
                  )}
                  {isLocked && isPaid && (
                    <p className="ios-rotulo-3 text-center text-[12px]">Acesso liberado na hora, em qualquer aparelho.</p>
                  )}
                </div>

                {/* Ações de quem tem o deck */}
                {(access.isOwner || access.canManage || canDownloadPdf) && (
                  <div className="mt-4 flex flex-wrap gap-1.5 border-t border-[var(--ios-separador)] pt-4">
                    {access.isOwner && (
                      <button type="button" onClick={() => setShareOpen(true)} className="ios-pilula !h-9 !px-3 !text-[13px]">
                        <Share2 className="h-3.5 w-3.5" /> Compartilhar
                      </button>
                    )}
                    {access.canManage && (
                      <Link href={`/flashcards/d/${deck.slug}/editar`} className="ios-pilula !h-9 !px-3 !text-[13px]">
                        <Edit3 className="h-3.5 w-3.5" /> Editar
                      </Link>
                    )}
                    {canDownloadPdf && (
                      <button type="button" onClick={downloadDeckPdf} disabled={downloadingPdf} className="ios-pilula !h-9 !px-3 !text-[13px]">
                        {downloadingPdf ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                        {downloadingPdf ? 'Gerando...' : 'PDF'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* ── Conteúdo ── */}
          <div className="min-w-0 space-y-8 xl:col-start-1 xl:row-start-2">
            {/* Acesso por tempo limitado: o contador é o aviso. */}
            {!isLocked && access.timedAccess?.isTimed && (
              <TimedAccessBanner access={access.timedAccess} itemLabel="deck" />
            )}

            {hasTier && !access.includedInPlus && isLocked && eventState && (
              <PricingEventCountdown state={eventState} />
            )}

            <div className="ios-lista py-3.5">
              <div className="ios-faixa" role="list" aria-label="Informações do deck">
                {infoCells.map(cell => (
                  <div key={cell.key} role="listitem">
                    <span className="ios-faixa-rotulo">{cell.label}</span>
                    <span
                      className="ios-faixa-valor"
                      style={cell.tone === 'erro' ? { color: '#e5484d' } : cell.tone === 'tinta' ? { color: 'var(--ios-tinta-texto)' } : undefined}
                    >
                      {cell.value}
                    </span>
                    <span className="ios-faixa-nota max-w-[9rem] truncate">{cell.note}</span>
                  </div>
                ))}
              </div>
            </div>

            {deck.description && (
              <section>
                <h2 className="ios-titulo-secao mb-2.5">Sobre o deck</h2>
                <p className="max-w-[68ch] whitespace-pre-line text-[16px] leading-relaxed">{deck.description}</p>
                {(deck.tags || []).length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {(deck.tags || []).slice(0, 8).map(t => (
                      <span key={t} className="ios-rotulo-2 rounded-full bg-[var(--ios-preenchimento)] px-3 py-1 text-[13px] font-medium">#{t}</span>
                    ))}
                  </div>
                )}
              </section>
            )}

            {isLocked ? (
              <>
                <LockedPreview deck={deck} access={access} />
                {/* Quem ainda não tem acesso vê o estudo funcionando de verdade
                    num card de demonstração — é o único jeito de saber o que
                    está comprando. */}
                <FlashcardTour
                  variant="locked"
                  onBuyClick={isPaid ? (access.includedInPlus ? () => claimWithPlus() : () => buy()) : undefined}
                />
              </>
            ) : (
              <>
                <AnimatePresence>
                  {savedProgress && (
                    <ResumeBanner
                      progress={savedProgress}
                      onContinue={() => startStudy(savedProgress.mode, savedProgress)}
                      onRestart={() => {
                        discardSavedProgress()
                        startStudy(savedProgress.mode)
                      }}
                      onDismiss={discardSavedProgress}
                    />
                  )}
                </AnimatePresence>

                {errorCards.length > 0 && (
                  <ErrorNotebook
                    cards={errorCards}
                    onReview={() => startErrorsReview()}
                  />
                )}

                <StudyModePanel
                  selected={studyModeChoice}
                  stats={stats}
                  cards={cards}
                  retention={retentionPreset}
                  onRetentionChange={chooseRetention}
                  showHint={spacedHint}
                  onDismissHint={dismissSpacedHint}
                />

                <FlashcardTour variant="unlocked" />

                <section>
                  <button
                    onClick={() => setShowCards(s => !s)}
                    className="ios-lista ios-linha w-full justify-between text-left"
                    aria-expanded={showCards}
                  >
                    <span className="min-w-0">
                      <span className="block text-[15px] font-semibold">
                        {showCards ? 'Ocultar os cartões' : `Ver os ${cards.length} cartões`}
                      </span>
                      {!showCards && <span className="ios-rotulo-2 block text-[13px]">Fechado para não dar spoiler das respostas.</span>}
                    </span>
                    {showCards ? <ChevronUp className="ios-rotulo-3 h-5 w-5 shrink-0" /> : <ChevronDown className="ios-rotulo-3 h-5 w-5 shrink-0" />}
                  </button>
                  <AnimatePresence>
                    {showCards && (
                      <motion.div
                        key="cards-list"
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.18 }}
                        className="mt-3"
                      >
                        <CardsList
                          cards={cards}
                          canManage={access.canManage ?? access.isOwner}
                          slug={deck.slug}
                          onCardsDeleted={reload}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </section>
              </>
            )}

            {access.isOwner && shareOpen && (
              <ShareDialog deckSlug={deck.slug} onClose={() => setShareOpen(false)} onSuccess={() => setToast({ open: true, message: 'Compartilhado com sucesso', type: 'success' })} />
            )}

            <ReviewsSection
              id="reviews-section"
              targetType="flashcard_deck"
              targetId={String(deck._id)}
              onSummaryChange={setReviewSummary}
              purchaseCtaLabel={isPaid ? 'Comprar para avaliar' : 'Acessar para avaliar'}
              onPurchaseClick={() => {
                if (isPaid && isLocked) buy()
              }}
            />
          </div>
        </div>
      </div>
      </FundoIos>
      <ToastAlert open={toast.open} message={toast.message} type={toast.type} onOpenChange={(open) => setToast(t => ({ ...t, open }))} />

      {upsellPkg && data && (
        <PackageUpsellModal
          pkg={upsellPkg}
          item={{
            id: data.deck.linkedMaterialId ?? '',
            title: data.deck.title,
            price: data.deck.price,
            type: 'flashcard_deck',
          }}
          onBuyPackage={() => {
            setUpsellPkg(null)
            if (!data.viewer.isAuthenticated) {
              router.push(`/comprar?productType=package&productId=${upsellPkg._id}&itemType=package`)
              return
            }
            router.push(`/materiais/checkout?type=package&id=${upsellPkg._id}`)
          }}
          onBuyIndividual={() => {
            setUpsellPkg(null)
            buy(true)
          }}
          onClose={() => setUpsellPkg(null)}
        />
      )}
    </AppShell>
  )
}

const HERO_SIZES = '(max-width: 1280px) 100vw, 60vw'

/** `R$ 29,90` — pt-BR usa vírgula decimal. */
function fmtBRL(value: number): string {
  return `R$ ${Number(value || 0).toFixed(2).replace('.', ',')}`
}

function compactNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(value || 0))
}

/** Cinco estrelas, cheias até a média (arredondada para meia). */
function StarRow({ value }: { value: number }) {
  const rounded = Math.round(value * 2) / 2
  return (
    <span className="inline-flex items-center gap-[1px]" aria-label={`${value.toFixed(1)} de 5 estrelas`}>
      {[1, 2, 3, 4, 5].map(n => (
        <Star
          key={n}
          className={cn('h-3 w-3', rounded >= n ? 'fill-current' : rounded >= n - 0.5 ? 'fill-current opacity-60' : 'opacity-35')}
        />
      ))}
    </span>
  )
}

/** Linha com interruptor do sistema (tela cheia, voz). */
function ToggleRow({ icon, label, hint, on, disabled, onToggle }: {
  icon: React.ReactNode
  label: string
  hint?: string
  on: boolean
  disabled?: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={onToggle}
      className="flex w-full items-center gap-3 border-t border-[var(--ios-separador)] px-3.5 py-2.5 text-left disabled:opacity-50"
    >
      <span className="ios-rotulo-2 shrink-0">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-medium">{label}</span>
        {hint && <span className="ios-rotulo-2 block text-[12px]">{hint}</span>}
      </span>
      <span
        aria-hidden
        className={cn(
          'relative h-[26px] w-[44px] shrink-0 rounded-full transition-colors duration-200',
          on ? 'bg-[#34a853]' : 'bg-[var(--ios-preenchimento-forte)]',
        )}
      >
        <span
          className={cn(
            'absolute top-[2px] h-[22px] w-[22px] rounded-full bg-white shadow-[0_2px_4px_rgba(0,0,0,0.25)] transition-transform duration-200',
            on ? 'translate-x-[20px]' : 'translate-x-[2px]',
          )}
        />
      </span>
    </button>
  )
}

/**
 * Caderno de erros do deck: os cards que travaram, do mais recaído ao menos,
 * com o botão que transforma a lista numa sessão. Mostra só a pergunta — a
 * resposta é o que a pessoa vai tentar lembrar.
 */
function ErrorNotebook({ cards, onReview }: { cards: DeckCard[]; onReview: () => void }) {
  const [aberto, setAberto] = useState(false)
  const ordenados = useMemo(
    () => [...cards].sort((a, b) => (b.spacedProgress?.lapses || 0) - (a.spacedProgress?.lapses || 0)),
    [cards]
  )
  const visiveis = aberto ? ordenados : ordenados.slice(0, 4)
  return (
    <section aria-label="Caderno de erros">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="ios-titulo-secao flex items-center gap-2">
            Caderno de erros
            <span className="ios-erro ios-erro-suave rounded-full px-2 py-0.5 text-[13px] font-bold tabular-nums">{cards.length}</span>
          </h2>
          <p className="ios-rotulo-2 mt-0.5 text-[13px]">Tudo que você travou ou errou. Acertou, sai daqui.</p>
        </div>
        <button type="button" onClick={onReview} className="ios-botao-erro !h-9 shrink-0 !px-4 !text-[15px]">
          Refazer
        </button>
      </div>
      <ul className="ios-lista [--ios-recuo:52px]">
        {visiveis.map(card => {
          const lapses = card.spacedProgress?.lapses || 0
          const next = card.spacedProgress?.nextReviewAt ? new Date(card.spacedProgress.nextReviewAt) : null
          return (
            <li key={card._id}>
              <div className="ios-linha !gap-3 !py-3">
                <span className="ios-erro ios-erro-suave flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
                  <X className="h-4 w-4" strokeWidth={3} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2 block text-[15px] font-medium leading-snug">
                    {card.kind === 'hidden_word' && card.hiddenWord ? card.hiddenWord.phrase : (card.front?.text || 'Card com imagem')}
                  </span>
                  <span className="ios-rotulo-2 mt-0.5 block text-[12px]">
                    {lapses > 0 ? `${lapses} ${lapses === 1 ? 'recaída' : 'recaídas'}` : 'Errado na última vez'}
                    {next ? ` · volta ${next.getTime() <= Date.now() ? 'agora' : next.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}` : ''}
                  </span>
                </span>
              </div>
            </li>
          )
        })}
        {ordenados.length > 4 && (
          <li>
            <button type="button" onClick={() => setAberto(v => !v)} className="ios-linha ios-tinta w-full justify-center !py-2.5 text-[14px] font-semibold">
              {aberto ? 'Mostrar menos' : `Ver os ${ordenados.length}`}
            </button>
          </li>
        )}
      </ul>
    </section>
  )
}

/**
 * A tela de resultado. É a recompensa da sessão: o acerto num anel que enche,
 * o confete, a sequência de dias, e — logo abaixo — o que ficou errado, com o
 * botão para refazer agora, enquanto a resposta está fresca.
 */
function SessionResult({ summary, deckTitle, onReviewErrors, onStudyMore, onClose, studyMoreLabel }: {
  summary: SessionSummary
  deckTitle: string
  onReviewErrors: () => void
  onStudyMore: () => void
  onClose: () => void
  studyMoreLabel: string | null
}) {
  const [sequencia, setSequencia] = useState({ dias: 0, estudouHoje: false })
  const [meta, setMeta] = useState(20)
  useEffect(() => {
    const seq = lerSequencia()
    setSequencia(seq)
    setMeta(lerMetaDiaria())
    // O Dom comemora: marco de dias seguidos (3, 7, 30…) vence o "revisão feita".
    const t = setTimeout(() => {
      reagirDom(seq.dias === 3 || (seq.dias > 0 && seq.dias % 7 === 0) ? { tipo: 'sequenciaDias', dias: seq.dias } : { tipo: 'flashcards' })
    }, 1800)
    return () => clearTimeout(t)
  }, [])
  const totalNotes = summary.counts.FACIL + summary.counts.MEDIO + summary.counts.DIFICIL
  const acertos = summary.counts.FACIL + summary.counts.MEDIO
  const pct = totalNotes > 0 ? Math.round((acertos / totalNotes) * 100) : 0
  const minutos = Math.max(1, Math.round(summary.durationMs / 60000))
  const erros = summary.errorIds.length
  const titulo = summary.errorsReview
    ? summary.fixedErrors > 0
      ? `${summary.fixedErrors} ${summary.fixedErrors === 1 ? 'erro corrigido' : 'erros corrigidos'}!`
      : 'Revisão feita'
    : pct >= 90
      ? 'Mandou muito bem!'
      : pct >= 70
        ? 'Boa sessão!'
        : 'Sessão concluída'

  return (
    <div className="relative mx-auto max-w-lg px-4 pb-16 pt-6 sm:pt-10">
      {pct >= 70 && <Confete />}
      <div className="flex flex-col items-center text-center">
        <div className="ios-assenta">
          <AnelProgresso valor={acertos} total={totalNotes} tamanho={148} espessura={12} rotulo={`${pct}% de acerto`}>
            <span className="text-[38px] font-bold leading-none tracking-[-0.03em] tabular-nums">{pct}%</span>
            <span className="ios-rotulo-2 mt-1 text-[12px] font-semibold">de acerto</span>
          </AnelProgresso>
        </div>
        <h1 className="ios-titulo-produto mt-6">{titulo}</h1>
        <p className="ios-rotulo-2 mt-1.5 max-w-sm text-[15px]">
          {summary.rated} {summary.rated === 1 ? 'card' : 'cards'} em {minutos} min · {deckTitle}
        </p>
      </div>

      {/* Placar por nota */}
      <div className="mt-7 grid grid-cols-3 gap-2">
        {([
          ['FACIL', 'Fácil', 'text-[#2f8a4f] dark:text-[#7fd093]'],
          ['MEDIO', 'Médio', 'text-[#b8730c] dark:text-[#f2c063]'],
          ['DIFICIL', 'Difícil', 'ios-erro'],
        ] as const).map(([key, label, cor]) => (
          <div key={key} className="ios-cartao rounded-[18px] px-2 py-3 text-center">
            <p className={cn('text-[26px] font-bold leading-none tabular-nums', cor)}>{summary.counts[key]}</p>
            <p className="ios-rotulo-2 mt-1.5 text-[12px] font-semibold">{label}</p>
          </div>
        ))}
      </div>

      {/* Ritmo */}
      <div className="ios-lista mt-3">
        <div className="ios-linha !gap-3">
          <Flame className="ios-chama h-6 w-6 shrink-0" data-acesa={sequencia.estudouHoje ? 'true' : 'false'} />
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-semibold">
              {sequencia.dias} {sequencia.dias === 1 ? 'dia seguido' : 'dias seguidos'}
            </span>
            <span className="ios-rotulo-2 block text-[13px]">Volte amanhã para a chama crescer. Meta do dia: {meta} cards.</span>
          </span>
        </div>
        {summary.bestCombo >= 3 && (
          <div className="ios-linha !gap-3">
            <Zap className="h-6 w-6 shrink-0 fill-current text-[#e2a43e]" />
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-semibold">{summary.bestCombo} acertos seguidos</span>
              <span className="ios-rotulo-2 block text-[13px]">Sua melhor sequência nesta sessão.</span>
            </span>
          </div>
        )}
      </div>

      {/* O que ficou errado: o próximo passo mais valioso */}
      <div className="mt-6 space-y-2">
        {erros > 0 ? (
          <>
            <p className="ios-rotulo-2 text-center text-[14px]">
              {erros} {erros === 1 ? 'card foi' : 'cards foram'} para o caderno de erros. Refazer agora, com a resposta fresca, fixa muito mais.
            </p>
            <button type="button" onClick={onReviewErrors} className="ios-botao-erro ios-botao-g w-full">
              <RotateCcw className="h-[18px] w-[18px]" /> Refazer {erros} {erros === 1 ? 'erro' : 'erros'} agora
            </button>
          </>
        ) : studyMoreLabel ? (
          <button type="button" onClick={onStudyMore} className="ios-botao ios-botao-g w-full">
            <Play className="h-[18px] w-[18px] fill-current" /> {studyMoreLabel}
          </button>
        ) : null}
        <button type="button" onClick={onClose} className={cn(erros > 0 || studyMoreLabel ? 'ios-botao-cinza' : 'ios-botao', 'ios-botao-g w-full')}>
          Voltar ao deck
        </button>
      </div>
    </div>
  )
}

// Constrói os itens do paginador: sempre o primeiro e o último, mais uma
// janela ao redor do card atual, com reticências (…) preenchendo os saltos.
// Evita a régua horizontal infinita — funciona bem de 3 a 300+ cards.
function buildPagerItems(current: number, total: number): (number | 'gap')[] {
  const pages = new Set<number>()
  pages.add(0)
  pages.add(total - 1)
  for (let i = current - 1; i <= current + 1; i++) {
    if (i >= 0 && i < total) pages.add(i)
  }
  const sorted = Array.from(pages).sort((a, b) => a - b)
  const items: (number | 'gap')[] = []
  let prev = -1
  for (const p of sorted) {
    if (prev !== -1 && p - prev > 1) items.push('gap')
    items.push(p)
    prev = p
  }
  return items
}

// Navegação de cards — paginador enxuto no lugar do rolador horizontal.
// Setas ← → para passo a passo e números para saltar direto. Usado tanto no
// modo normal quanto na tela cheia, com a paleta verde do site.
function CardPager({
  total,
  current,
  ratings,
  cards,
  onJump,
}: {
  total: number
  current: number
  ratings: Record<string, FlashcardSpacedRating>
  cards: { _id: string }[]
  onJump: (index: number) => void
}) {
  if (total <= 1) return null
  const items = buildPagerItems(current, total)
  const stepClass = 'ios-icone-botao h-8 w-8 disabled:pointer-events-none'

  return (
    <nav
      aria-label="Navegação de cards"
      className="flashcard-estudo-pager mb-3 flex items-center justify-center gap-1.5"
    >
      <button
        type="button"
        onClick={() => onJump(current - 1)}
        disabled={current === 0}
        className={stepClass}
        aria-label="Card anterior"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {items.map((item, i) => {
        if (item === 'gap') {
          return (
            <span
              key={`gap-${i}`}
              className="ios-rotulo-3 select-none px-0.5 text-sm font-semibold"
            >
              …
            </span>
          )
        }
        const selected = item === current
        const rated = ratings[cards[item]?._id] != null
        return (
          <button
            key={item}
            type="button"
            onClick={() => onJump(item)}
            aria-current={selected ? 'true' : undefined}
            aria-label={`Ir para card ${item + 1}`}
            className={cn(
              'inline-flex h-8 min-w-8 items-center justify-center rounded-full px-2.5 text-[13px] font-semibold tabular-nums transition',
              selected
                ? 'bg-[var(--ios-rotulo)] text-[var(--ios-chao)]'
                : rated
                  ? 'ios-tinta bg-[var(--ios-tinta-suave)]'
                  : 'bg-[var(--ios-preenchimento)] hover:bg-[var(--ios-preenchimento-forte)]',
            )}
          >
            {item + 1}
          </button>
        )
      })}

      <button
        type="button"
        onClick={() => onJump(current + 1)}
        disabled={current === total - 1}
        className={stepClass}
        aria-label="Próximo card"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  )
}

/**
 * Seletor de modo de estudo.
 *
 * Este painel existia, mas era discreto demais: quem não reparasse nele
 * estudava para sempre na ordem do baralho, sem nunca descobrir que o deck
 * tinha repetição espaçada. Três coisas mudaram — o nome agora diz o que é
 * ("Repetição espaçada", não só "fixação intensa"), quem chega sem escolha
 * salva já entra nela, e o painel mostra na hora o que a próxima sessão vai
 * cobrar. A opção de estudar na ordem continua a um toque, do lado.
 */
function StudyModePanel({
  selected,
  stats,
  cards,
  retention,
  onRetentionChange,
  showHint,
  onDismissHint,
}: {
  selected: StudyMode
  stats?: SpacedRepetitionStats
  cards: (FlashcardManualCard & { _id: string; spacedProgress?: SpacedProgressResponse | null })[]
  retention: RetentionPreset
  onRetentionChange: (preset: RetentionPreset) => void
  showHint: boolean
  onDismissHint: () => void
}) {
  const [open, setOpen] = useState(false)
  const [explained, setExplained] = useState(false)
  const safeStats = stats || { dueToday: 0, newCards: cards.length, mastered: 0, difficult: 0 }

  // O que a próxima sessão vai trazer, calculado com o mesmo motor do estudo.
  const preview = useMemo(
    () => buildStudyQueue(cards as DeckCard[], 'spaced').counts,
    [cards]
  )
  const hasProgress = cards.some(card => !!card.spacedProgress)
  // A escolha do modo mora no painel de cima; aqui ficam os ajustes e o
  // desempenho, que só existem na repetição espaçada.
  if (selected !== 'spaced') return null

  return (
    <section aria-label="Repetição espaçada">
      <h2 className="ios-titulo-secao mb-1">Sua memória neste deck</h2>
      <p className="ios-rotulo-2 mb-3 text-[13px]">
        Cada card volta no dia em que você ia esquecê-lo — o mesmo método do Anki.
      </p>

      {/* Apresentação do recurso para quem nunca reparou nele. */}
      {showHint && !hasProgress && (
        <div className="ios-lista mb-3">
          <div className="ios-linha !gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[var(--ios-tinta)] text-white">
              <Brain className="h-[18px] w-[18px]" />
            </span>
            <p className="min-w-0 flex-1 text-[14px] leading-snug">
              <strong className="font-semibold">Em vez de reler tudo,</strong>{' '}
              <span className="ios-rotulo-2">você revisa só o que está prestes a esquecer. Dez minutos por dia rendem mais que uma maratona.</span>
            </p>
            <button
              type="button"
              onClick={onDismissHint}
              aria-label="Dispensar explicação"
              className="ios-rotulo-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-[var(--ios-preenchimento)]"
            >
              <X className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatTile icon={<CalendarClock className="h-4 w-4" />} label="Vencidos hoje" value={safeStats.dueToday} tone="emerald" />
        <StatTile icon={<Sparkles className="h-4 w-4" />} label="Novos" value={safeStats.newCards} tone="sky" />
        <StatTile icon={<BarChart3 className="h-4 w-4" />} label="Dominados" value={safeStats.mastered} tone="lime" />
        <StatTile icon={<Flame className="h-4 w-4" />} label="Difíceis" value={safeStats.difficult} tone="rose" />
      </div>

      <div className="ios-lista mt-3">
        {preview.due + preview.learning + preview.newCards > 0 && (
          <div className="ios-linha !gap-3">
            <Timer className="ios-tinta h-5 w-5 shrink-0" />
            <p className="min-w-0 flex-1 text-[14px]">
              Próxima sessão:{' '}
              <strong className="font-semibold">{preview.due + preview.learning} para revisar</strong>
              {preview.newCards > 0 && <> e <strong className="font-semibold">{preview.newCards} novos</strong></>}
              {preview.heldBack > 0 && (
                <span className="ios-rotulo-2"> · {preview.heldBack} inéditos ficam para depois</span>
              )}
            </p>
          </div>
        )}

        {/* Intensidade: o único parâmetro do algoritmo na mão do usuário. */}
        <div className="ios-linha !flex-col !items-stretch !gap-2 !py-3">
          <p className="flex items-center gap-2 text-[14px] font-medium">
            <Gauge className="ios-rotulo-2 h-4 w-4" /> Intensidade das revisões
          </p>
          <div
            className="ios-segmentado"
            role="radiogroup"
            aria-label="Intensidade das revisões"
            style={{ ['--segmentos' as string]: 3, ['--indice' as string]: Math.max(0, RETENTION_OPTIONS.findIndex(o => o.value === retention)) }}
          >
            {RETENTION_OPTIONS.map(option => (
              <button
                key={option.value}
                type="button"
                role="radio"
                onClick={() => onRetentionChange(option.value)}
                aria-checked={retention === option.value}
                title={option.description}
                className="ios-segmento !h-auto flex-col !gap-0 py-1.5"
              >
                <span className="text-[13px]">{option.label}</span>
                <span className="ios-rotulo-3 text-[10.5px] font-medium tabular-nums">
                  {Math.round(RETENTION_PRESETS[option.value] * 100)}% de acerto
                </span>
              </button>
            ))}
          </div>
          <p className="ios-rotulo-2 text-[12px] leading-snug">
            {RETENTION_OPTIONS.find(o => o.value === retention)?.description}
          </p>
        </div>

        <button type="button" onClick={() => setExplained(v => !v)} className="ios-linha w-full justify-between text-left" aria-expanded={explained}>
          <span className="flex items-center gap-3 text-[14px] font-medium">
            <Leaf className="ios-rotulo-2 h-4 w-4" /> Como funciona
          </span>
          {explained ? <ChevronUp className="ios-rotulo-3 h-4 w-4" /> : <ChevronDown className="ios-rotulo-3 h-4 w-4" />}
        </button>
        <AnimatePresence>
          {explained && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4">
                <p className="text-[14px] leading-relaxed">
                  Cada card guarda quanto tempo a sua memória dele aguenta. Depois de cada resposta esse prazo
                  é recalculado e o card volta no dia em que você estaria prestes a esquecê-lo — nem antes
                  (desperdício), nem depois (esquecimento).
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  <RatingExplain label={FLASHCARD_RATING_LABELS.FACIL} tone="emerald" text="Lembrou na hora. O prazo estica bastante." />
                  <RatingExplain label={FLASHCARD_RATING_LABELS.MEDIO} tone="amber" text="Lembrou com esforço. O prazo cresce menos." />
                  <RatingExplain label={FLASHCARD_RATING_LABELS.DIFICIL} tone="rose" text="Travou ou errou. Volta em minutos e vai para o caderno de erros." />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button type="button" onClick={() => setOpen(v => !v)} className="ios-linha w-full justify-between text-left" aria-expanded={open}>
          <span className="flex items-center gap-3 text-[14px] font-medium">
            <BarChart3 className="ios-rotulo-2 h-4 w-4" /> Desempenho por card
          </span>
          {open ? <ChevronUp className="ios-rotulo-3 h-4 w-4" /> : <ChevronDown className="ios-rotulo-3 h-4 w-4" />}
        </button>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              {cards.length === 0 ? (
                <p className="ios-rotulo-2 p-4 text-[14px]">Esse deck ainda não tem cartões.</p>
              ) : (
                <ul className="max-h-80 overflow-auto border-t border-[var(--ios-separador)]">
                  {cards.map((card, index) => (
                    <li key={card._id}>
                      <div className="ios-linha !gap-3 !py-2.5">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[14px] font-medium">
                            {index + 1}. {card.kind === 'hidden_word' && card.hiddenWord ? card.hiddenWord.phrase : (card.front?.text || '(sem texto)')}
                          </p>
                          <p className="ios-rotulo-2 mt-0.5 truncate text-[12px]">{formatProgressLine(card.spacedProgress)}</p>
                        </div>
                        <ProgressBadge progress={card.spacedProgress} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}

function RatingExplain({ label, text, tone }: { label: string; text: string; tone: 'emerald' | 'amber' | 'rose' }) {
  const cor = { emerald: 'bg-[#2f8a4f]', amber: 'bg-[#d98a12]', rose: 'bg-[#e5484d]' }
  return (
    <div className="rounded-[14px] bg-[var(--ios-preenchimento)] px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[13px] font-semibold">
        <span className={cn('h-2 w-2 rounded-full', cor[tone])} /> {label}
      </div>
      <p className="ios-rotulo-2 mt-1 text-[12px] leading-snug">{text}</p>
    </div>
  )
}

function StatTile({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: 'emerald' | 'sky' | 'lime' | 'rose' }) {
  const cor = {
    emerald: 'ios-tinta',
    sky: 'text-[#2f74d0] dark:text-[#7cb4ff]',
    lime: 'text-[#5b8a1f] dark:text-[#b4dd6b]',
    rose: 'ios-erro',
  }
  return (
    <div className="ios-cartao rounded-[18px] p-3">
      <div className={cn('flex items-center justify-between gap-2', cor[tone])}>
        <span className="opacity-80">{icon}</span>
        <span className="text-[24px] font-bold leading-none tabular-nums">{value}</span>
      </div>
      <p className="ios-rotulo-2 mt-2 text-[12px] font-semibold">{label}</p>
    </div>
  )
}

function formatProgressLine(progress?: SpacedProgressResponse | null): string {
  if (!progress) return 'Card novo, ainda sem primeira revisão.'
  const ratingLabel = FLASHCARD_RATING_LABELS[progress.rating] || 'Médio'
  const next = progress.nextReviewAt
    ? new Date(progress.nextReviewAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    : 'em breve'
  const parts = [
    `${progress.reviewCount} ${progress.reviewCount === 1 ? 'revisão' : 'revisões'}`,
    `última: ${ratingLabel}`,
    `volta ${next}`,
  ]
  // A estabilidade é o número que o algoritmo realmente persegue: quantos dias
  // a lembrança aguenta. Mostrar isso explica o intervalo sem jargão.
  if (progress.stability && progress.stability >= 1) {
    parts.push(`memória ~${Math.round(progress.stability)} ${Math.round(progress.stability) === 1 ? 'dia' : 'dias'}`)
  }
  if ((progress.lapses || 0) > 0) parts.push(`${progress.lapses} ${progress.lapses === 1 ? 'recaída' : 'recaídas'}`)
  return parts.join(' · ')
}

function ProgressBadge({ progress }: { progress?: SpacedProgressResponse | null }) {
  const base = 'inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-semibold'
  if (!progress) {
    return <span className={cn(base, 'bg-[#2f74d0]/12 text-[#2f74d0] dark:text-[#7cb4ff]')}><Sparkles className="h-3 w-3" /> Novo</span>
  }
  if (progress.rating === 'DIFICIL' || (progress.lapses || 0) >= 2 || (progress.difficulty || 0) >= 7.5) {
    return <span className={cn(base, 'ios-erro ios-erro-suave')}><AlertTriangle className="h-3 w-3" /> Difícil</span>
  }
  if ((progress.stability || 0) >= 21) {
    return <span className={cn(base, 'bg-[#5b8a1f]/14 text-[#4f7a18] dark:text-[#b4dd6b]')}><CheckCircle2 className="h-3 w-3" /> Dominado</span>
  }
  return <span className={cn(base, 'ios-tinta bg-[var(--ios-tinta-suave)]')}><CalendarClock className="h-3 w-3" /> Revisar</span>
}

function ResumeBanner({
  progress,
  onContinue,
  onRestart,
  onDismiss,
}: {
  progress: FlashcardProgress
  onContinue: () => void
  onRestart: () => void
  onDismiss: () => void
}) {
  const safeTotal = Math.max(progress.total, 1)
  const safeIndex = Math.min(progress.index, safeTotal - 1)
  const percent = Math.round(((safeIndex + 1) / safeTotal) * 100)
  const ratedCount = Object.keys(progress.ratings || {}).length
  const remaining = Math.max(safeTotal - (safeIndex + 1), 0)
  const savedAgo = formatRelativeTime(progress.savedAt)
  const isSpaced = progress.mode === 'spaced'

  return (
    <motion.section
      aria-label="Sessão pendente"
      initial={{ opacity: 0, y: -12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="ios-lista relative p-4"
    >
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Descartar progresso salvo"
        className="ios-rotulo-3 absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full hover:bg-[var(--ios-preenchimento)]"
      >
        <X className="h-4 w-4" strokeWidth={2.5} />
      </button>
      <div className="flex items-center gap-3 pr-8">
        <AnelProgresso valor={safeIndex + 1} total={safeTotal} tamanho={52} espessura={6} rotulo={`${percent}% da sessão feita`}>
          <span className="text-[13px] font-bold tabular-nums">{percent}%</span>
        </AnelProgresso>
        <div className="min-w-0">
          <h3 className="text-[17px] font-bold tracking-[-0.02em]">Você parou no card {safeIndex + 1} de {safeTotal}</h3>
          <p className="ios-rotulo-2 mt-0.5 text-[13px]">
            {isSpaced ? 'Repetição espaçada' : 'Ordem do deck'} · {ratedCount} avaliados · {remaining} restantes
            {savedAgo ? ` · ${savedAgo}` : ''}
          </p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button type="button" onClick={onContinue} className="ios-botao">
          <RotateCcw className="h-4 w-4" /> Continuar
        </button>
        <button type="button" onClick={onRestart} className="ios-botao-cinza">
          Recomeçar
        </button>
      </div>
    </motion.section>
  )
}

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp
  if (diff < 0) return ''
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'agora mesmo'
  if (minutes < 60) return `há ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `há ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `há ${days}d`
  const weeks = Math.floor(days / 7)
  return `há ${weeks}sem`
}

function VisibilityBadge({ visibility }: { visibility: string }) {
  if (visibility === 'public') {
    return <span className="ios-selo"><Globe className="h-3 w-3" /> Público</span>
  }
  if (visibility === 'unlisted') {
    return <span className="ios-selo"><LinkIcon className="h-3 w-3" /> Não listado</span>
  }
  return <span className="ios-selo"><EyeOff className="h-3 w-3" /> Privado</span>
}

function LockedPreview({ deck, access }: { deck: any; access: AccessFlags }) {
  return (
    <div className="ios-lista">
      <div className="ios-linha !gap-3 !py-4">
        <span className="ios-rotulo-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--ios-preenchimento)]">
          <Lock className="h-5 w-5" />
        </span>
        <p className="min-w-0 flex-1 text-[14px] leading-snug">
          <strong className="block text-[15px] font-semibold">Os cartões estão fechados</strong>
          <span className="ios-rotulo-2">
            {access.includedInPlus
              ? `Este deck faz parte do ${PLUS_LABEL}. Resgate para estudar todos os cartões.`
              : deck.pricing === 'paid'
                ? 'Adquira o deck para estudar todos os cartões com repetição espaçada.'
                : (deck.allowedGroups?.length ? 'Este deck é restrito a grupos específicos.' : 'Você ainda não tem acesso a este deck.')}
          </span>
        </p>
      </div>
    </div>
  )
}

function CardsList({
  cards, canManage, slug, onCardsDeleted,
}: { cards: any[]; canManage: boolean; slug: string; onCardsDeleted: () => void }) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const allSelected = cards.length > 0 && selected.size === cards.length
  const someSelected = selected.size > 0 && !allSelected

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(cards.map(c => c._id)))
    }
  }

  function toggleCard(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function deleteSelected() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/flashcards/manual/${encodeURIComponent(slug)}/cards`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardIds: Array.from(selected) }),
      })
      if (res.ok) {
        setSelected(new Set())
        setConfirmDelete(false)
        onCardsDeleted()
      }
    } finally {
      setDeleting(false)
    }
  }

  if (!cards.length) {
    return (
      <div className="ios-lista p-10 text-center">
        <Sparkles className="h-8 w-8 mx-auto text-slate-400 mb-3" />
        <p className="text-slate-500 dark:text-slate-400">Esse deck ainda não tem cartões.</p>
        {canManage && (
          <Link href={`/flashcards/d/${slug}/editar`} className="inline-block mt-4">
            <Button>Adicionar cartões</Button>
          </Link>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="ios-lista">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-border">
          {canManage && (
            <button
              type="button"
              onClick={toggleAll}
              className="shrink-0 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-300 transition-colors"
              aria-label={allSelected ? 'Desselecionar todos' : 'Selecionar todos'}
            >
              {allSelected ? (
                <CheckSquare className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
              ) : someSelected ? (
                <Square className="h-4 w-4 opacity-50" />
              ) : (
                <Square className="h-4 w-4" />
              )}
            </button>
          )}
          <h2 className="text-sm font-semibold text-slate-800 dark:text-foreground flex-1">{cards.length} cartões</h2>
          {canManage && (
            <Link href={`/flashcards/d/${slug}/editar`}>
              <Button variant="outline" size="sm"><Edit3 className="h-3.5 w-3.5 mr-1" />Editar deck</Button>
            </Link>
          )}
        </div>

        {/* Bulk action bar */}
        <AnimatePresence>
          {selected.size > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-3 px-5 py-3 bg-rose-50 dark:bg-rose-500/10 border-b border-rose-200 dark:border-rose-500/20">
                <span className="text-sm font-medium text-rose-700 dark:text-rose-300 flex-1">
                  {selected.size} {selected.size === 1 ? 'cartão selecionado' : 'cartões selecionados'}
                </span>
                <button
                  type="button"
                  onClick={() => setSelected(new Set())}
                  className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  Limpar
                </button>
                <Button
                  size="sm"
                  onClick={() => setConfirmDelete(true)}
                  className="bg-rose-600 hover:bg-rose-700 text-foreground gap-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Excluir selecionados
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cards list */}
        <ul className="divide-y divide-slate-100 dark:divide-white/5">
          {cards.map((c, i) => (
            <li
              key={c._id}
              className={cn(
                'flex items-start gap-3 px-5 py-3 transition-colors',
                selected.has(c._id)
                  ? 'bg-emerald-50 dark:bg-emerald-500/10'
                  : 'hover:bg-slate-50/60 dark:hover:bg-card',
                canManage && 'cursor-pointer'
              )}
              onClick={() => canManage && toggleCard(c._id)}
            >
              {canManage && (
                <div className="shrink-0 mt-0.5 text-slate-300 dark:text-slate-600">
                  {selected.has(c._id) ? (
                    <CheckSquare className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                </div>
              )}
              <span className="text-xs font-mono text-slate-400 mt-1 w-6 shrink-0">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-700 dark:text-slate-200 line-clamp-2">
                  {c.kind === 'hidden_word' && c.hiddenWord ? c.hiddenWord.phrase : (c.front?.text || '(sem texto)')}
                </p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                  {c.kind === 'hidden_word' ? `Palavra: ${c.hiddenWord?.word}` : (c.back?.text || '')}
                </p>
              </div>
              <div className="flex gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                {c.kind === 'hidden_word' && (
                  <span className="rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] px-2 py-0.5 font-medium">Palavra oculta</span>
                )}
                {c.comment && (
                  <span className="rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px] px-2 py-0.5 font-medium">Comentado</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Confirm delete dialog */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => !deleting && setConfirmDelete(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-border p-6 max-w-sm w-full shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-rose-100 dark:bg-rose-500/15 flex items-center justify-center shrink-0">
                  <Trash2 className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-foreground">Excluir cartões?</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {selected.size} {selected.size === 1 ? 'cartão será excluído' : 'cartões serão excluídos'} permanentemente.
                  </p>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" onClick={() => setConfirmDelete(false)} disabled={deleting}>
                  Cancelar
                </Button>
                <Button
                  onClick={deleteSelected}
                  disabled={deleting}
                  className="bg-rose-600 hover:bg-rose-700 text-foreground gap-1.5"
                >
                  {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  {deleting ? 'Excluindo...' : 'Excluir'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function ShareDialog({ deckSlug, onClose, onSuccess }: { deckSlug: string; onClose: () => void; onSuccess: () => void }) {
  const [query, setQuery] = useState('')
  const [users, setUsers] = useState<{ _id: string; name: string; emailMasked: string }[]>([])
  const [busy, setBusy] = useState(false)
  const [shared, setShared] = useState<string[]>([])
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle')

  useEffect(() => {
    if (query.length < 3) { setUsers([]); return }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/flashcards/manual/users/search?q=${encodeURIComponent(query)}`)
        const json = await res.json()
        setUsers(json.users || [])
      } catch {}
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  async function shareWith(userId: string) {
    setBusy(true)
    try {
      const res = await fetch(`/api/flashcards/manual/${encodeURIComponent(deckSlug)}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      if (res.ok) {
        setShared(s => [...s, userId])
        onSuccess()
      }
    } finally { setBusy(false) }
  }

  function copyLink() {
    const url = `${window.location.origin}/flashcards/d/${deckSlug}`
    navigator.clipboard.writeText(url).then(() => {
      setCopyState('copied')
      setTimeout(() => setCopyState('idle'), 1500)
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 w-full md:max-w-lg md:rounded-3xl rounded-t-3xl border border-slate-200 dark:border-border p-6" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-1">Compartilhar deck</h3>
        <p className="text-sm text-slate-500 mb-4">Convide outros usuários ou compartilhe o link.</p>

        <div className="rounded-2xl border border-slate-200 dark:border-border p-3 flex items-center gap-2 mb-4 bg-slate-50 dark:bg-card">
          <LinkIcon className="h-4 w-4 text-slate-500" />
          <span className="flex-1 text-xs text-slate-600 dark:text-slate-300 truncate">{`${typeof window !== 'undefined' ? window.location.origin : ''}/flashcards/d/${deckSlug}`}</span>
          <button onClick={copyLink} className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">
            {copyState === 'copied' ? 'Copiado!' : 'Copiar'}
          </button>
        </div>

        <input
          autoFocus
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar por nome ou email..."
          className="w-full rounded-2xl border border-slate-200 dark:border-border bg-white dark:bg-slate-800 px-4 py-2.5 text-sm"
        />

        <ul className="mt-3 space-y-2 max-h-64 overflow-auto">
          {users.map(u => (
            <li key={u._id} className="flex items-center justify-between rounded-2xl border border-slate-100 dark:border-border px-3 py-2">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{u.name}</p>
                <p className="text-xs text-slate-500">{u.emailMasked}</p>
              </div>
              <Button size="sm" onClick={() => shareWith(u._id)} disabled={busy || shared.includes(u._id)}>
                {shared.includes(u._id) ? 'Enviado' : 'Compartilhar'}
              </Button>
            </li>
          ))}
          {query.length >= 3 && users.length === 0 && <li className="text-sm text-slate-500 text-center py-4">Nenhum usuário encontrado</li>}
        </ul>

        <div className="mt-5 flex justify-end">
          <Button variant="ghost" onClick={onClose}>Fechar</Button>
        </div>
      </div>
    </div>
  )
}
