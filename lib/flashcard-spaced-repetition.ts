import type { FlashcardManualCard, FlashcardSpacedProgress, FlashcardSpacedRating } from './types'

/**
 * Motor de repetição espaçada dos flashcards.
 *
 * O agendamento segue o FSRS (Free Spaced Repetition Scheduler), o mesmo
 * modelo usado hoje pelo Anki: em vez de multiplicar um intervalo por um
 * "fator de facilidade" — o SM-2 dos anos 80, que era o que existia aqui —,
 * ele mantém dois números por card e prevê quando a lembrança vai cair para o
 * nível de retenção desejado.
 *
 *   • estabilidade (S): em quantos dias a chance de lembrar cai para 90%.
 *   • dificuldade (D): de 1 a 10, o quanto ESTE card resiste a ficar estável.
 *
 * A partir daí o intervalo não é um chute: é a data em que a retenção prevista
 * encosta na meta (`retention`). Quem estuda para uma prova aperta a meta e
 * revisa mais; quem está em manutenção afrouxa e revisa menos.
 *
 * Duas decisões importantes deste arquivo:
 *
 *  1. Ele roda igual no servidor e no navegador. O cliente calcula o mesmo
 *     agendamento na hora da avaliação (por isso o card avança na hora, sem
 *     esperar a rede) e o servidor recalcula para gravar. O embaralhamento do
 *     intervalo é determinístico (semente = card + número da revisão), então
 *     os dois chegam exatamente ao mesmo dia — nunca aparece uma data na tela
 *     e outra no banco.
 *
 *  2. Ele conhece passos curtos. Um card que você errou não volta "amanhã":
 *     volta em minutos, ainda na mesma sessão, que é o que realmente fixa.
 */

export const FLASHCARD_SPACED_PROGRESS_COLLECTION = 'flashcardSpacedProgress'

export const FLASHCARD_SPACED_RATINGS: FlashcardSpacedRating[] = ['FACIL', 'MEDIO', 'DIFICIL']

/** Rótulos que aparecem para o usuário — a fonte única desses três nomes. */
export const FLASHCARD_RATING_LABELS: Record<FlashcardSpacedRating, string> = {
  FACIL: 'Fácil',
  MEDIO: 'Médio',
  DIFICIL: 'Difícil',
}

/** Valores gravados na coleção de sessões desde a primeira versão do recurso. */
export type LegacyFlashcardRating = 'facil' | 'equilibrado' | 'porrada'

/** Estado de agendamento do card (o "onde ele está na fila"). */
export type FlashcardSpacedState = 'learning' | 'review' | 'relearning'

/**
 * Aceita todos os nomes que já circularam pelo produto: os atuais
 * (FACIL/MEDIO/DIFICIL), os antigos do banco (SUAVE/NO_PONTO/PORRETE) e os
 * das sessões (facil/equilibrado/porrada). Nada disso exige migração: o dado
 * velho continua sendo lido, e o novo é gravado com o nome novo.
 */
export function normalizeSpacedRating(rating: unknown): FlashcardSpacedRating | null {
  if (typeof rating !== 'string') return null
  const value = rating.trim().toUpperCase()
  if (value === 'FACIL' || value === 'FÁCIL' || value === 'SUAVE' || value === 'EASY') return 'FACIL'
  if (value === 'MEDIO' || value === 'MÉDIO' || value === 'NO_PONTO' || value === 'EQUILIBRADO' || value === 'GOOD') return 'MEDIO'
  if (value === 'DIFICIL' || value === 'DIFÍCIL' || value === 'PORRETE' || value === 'PORRADA' || value === 'AGAIN' || value === 'HARD') return 'DIFICIL'
  return null
}

export function toLegacyRating(rating: FlashcardSpacedRating): LegacyFlashcardRating {
  if (rating === 'FACIL') return 'facil'
  if (rating === 'MEDIO') return 'equilibrado'
  return 'porrada'
}

// ─── Parâmetros do modelo ─────────────────────────────────────────────────────

/**
 * Pesos padrão do FSRS-5 (os mesmos que o Anki usa antes de otimizar com o
 * histórico do usuário). Foram ajustados sobre centenas de milhões de revisões
 * reais; mexer neles sem dados é piorar.
 */
const W = [
  0.40255, 1.18385, 3.173, 15.69105, 7.1949, 0.5345, 1.4604, 0.0046, 1.54575,
  0.1192, 1.01925, 1.9395, 0.11, 0.29605, 2.2698, 0.2315, 2.9898, 0.51655, 0.6621,
]

/** Curva de esquecimento do FSRS: R(t) = (1 + FACTOR·t/S)^DECAY. */
const DECAY = -0.5
const FACTOR = Math.pow(0.9, 1 / DECAY) - 1 // = 19/81

/** Teto de intervalo. Acima disso o card vira enfeite na agenda. */
const MAX_INTERVAL_DAYS = 365
const MIN_STABILITY = 0.01
const MAX_STABILITY = 36500

/**
 * Metas de retenção. É o único botão que o usuário mexe: quanto maior a meta,
 * mais cedo o card volta (mais trabalho, menos esquecimento).
 */
export const RETENTION_PRESETS = {
  leve: 0.85,
  padrao: 0.9,
  prova: 0.95,
} as const

export type RetentionPreset = keyof typeof RETENTION_PRESETS

export const DEFAULT_RETENTION = RETENTION_PRESETS.padrao

export function clampRetention(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(parsed)) return DEFAULT_RETENTION
  return clamp(Math.round(parsed * 100) / 100, 0.8, 0.97)
}

/**
 * Passos curtos, em minutos. Um card novo ou errado precisa voltar ainda na
 * mesma sessão — é aí que a memória de trabalho vira memória de verdade. O
 * FSRS cuida do longo prazo; estes passos cuidam dos primeiros minutos.
 */
/** Errou um card que ainda está sendo aprendido. */
const AGAIN_STEP_MINUTES = 5
/** Acertou com esforço um card inédito: um passo antes de graduar. */
const LEARNING_STEP_MINUTES = 10
/** Errou um card que já estava graduado — a recaída volta em minutos. */
const RELEARNING_STEP_MINUTES = 10

/** A partir de quantos tropeços o card é tratado como problema de redação. */
export const LEECH_LAPSES_THRESHOLD = 6

// ─── Utilitários ──────────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000)
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000)
}

/** DIFICIL = errou (1), MEDIO = lembrou com esforço (3), FACIL = de bandeja (4). */
function gradeOf(rating: FlashcardSpacedRating): 1 | 3 | 4 {
  if (rating === 'DIFICIL') return 1
  if (rating === 'MEDIO') return 3
  return 4
}

// ─── Núcleo do FSRS ───────────────────────────────────────────────────────────

/** Chance de lembrar depois de `elapsedDays` com estabilidade `stability`. */
export function retrievability(elapsedDays: number, stability: number): number {
  if (stability <= 0) return 0
  return Math.pow(1 + (FACTOR * Math.max(elapsedDays, 0)) / stability, DECAY)
}

/** Dias até a retenção prevista encostar na meta. */
function intervalFromStability(stability: number, retention: number): number {
  return (stability / FACTOR) * (Math.pow(retention, 1 / DECAY) - 1)
}

function initialStability(grade: number): number {
  return clamp(W[grade - 1], MIN_STABILITY, MAX_STABILITY)
}

function initialDifficulty(grade: number): number {
  return clamp(W[4] - Math.exp(W[5] * (grade - 1)) + 1, 1, 10)
}

function nextDifficulty(difficulty: number, grade: number): number {
  // Amortecimento linear: quanto mais perto de 10, menos o card ainda piora.
  const delta = -W[6] * (grade - 3)
  const damped = difficulty + delta * ((10 - difficulty) / 9)
  // Reversão à média: sem isso um card marcado "difícil" uma vez ficaria
  // difícil para sempre, mesmo depois de dez acertos seguidos.
  return clamp(W[7] * initialDifficulty(4) + (1 - W[7]) * damped, 1, 10)
}

function nextStabilityOnSuccess(difficulty: number, stability: number, r: number, grade: number): number {
  const easyBonus = grade === 4 ? W[16] : 1
  const gain =
    Math.exp(W[8]) *
    (11 - difficulty) *
    Math.pow(stability, -W[9]) *
    (Math.exp(W[10] * (1 - r)) - 1) *
    easyBonus
  return clamp(stability * (1 + gain), MIN_STABILITY, MAX_STABILITY)
}

function nextStabilityOnLapse(difficulty: number, stability: number, r: number): number {
  const recovered =
    W[11] *
    Math.pow(difficulty, -W[12]) *
    (Math.pow(stability + 1, W[13]) - 1) *
    Math.exp(W[14] * (1 - r))
  // Errar nunca pode deixar o card MAIS estável do que ele já era.
  return clamp(Math.min(recovered, stability), MIN_STABILITY, MAX_STABILITY)
}

/**
 * Revisão no mesmo dia (os passos curtos). A fórmula longa pressupõe que houve
 * esquecimento entre as revisões; sem tempo decorrido ela explodiria o
 * intervalo só porque o usuário viu o card duas vezes seguidas.
 */
function shortTermStability(stability: number, grade: number): number {
  return clamp(stability * Math.exp(W[17] * (grade - 3 + W[18])), MIN_STABILITY, MAX_STABILITY)
}

/**
 * Espalha os intervalos em ±5% para que cards estudados no mesmo dia não
 * voltem todos no mesmo dia pelo resto da vida.
 *
 * A semente é o par (card, número da revisão): o mesmo cálculo feito no
 * navegador e no servidor dá o mesmo dia, então a data que aparece na tela é
 * exatamente a que vai para o banco.
 */
function fuzzInterval(intervalDays: number, seed: string): number {
  if (intervalDays < 2.5) return Math.round(intervalDays)
  let hash = 2166136261
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  const unit = ((hash >>> 0) % 10000) / 10000 // 0 … 0,9999
  const spread = Math.max(1, intervalDays * 0.05)
  const fuzzed = intervalDays + (unit * 2 - 1) * spread
  return Math.round(clamp(fuzzed, 1, MAX_INTERVAL_DAYS))
}

/** Traduz o fator de facilidade do SM-2 antigo para a dificuldade do FSRS. */
function difficultyFromLegacyEase(easeFactor: number | undefined): number {
  if (!easeFactor || !Number.isFinite(easeFactor)) return initialDifficulty(3)
  // 1,3 (o pior do SM-2) → 10; 3,2 (o melhor) → 1.
  return clamp(10 - ((easeFactor - 1.3) * 9) / 1.9, 1, 10)
}

/** E o caminho de volta, só para manter o campo antigo legível em telas velhas. */
function legacyEaseFromDifficulty(difficulty: number): number {
  return Number(clamp(3.2 - ((difficulty - 1) * 1.9) / 9, 1.3, 3.2).toFixed(2))
}

// ─── Estado anterior ──────────────────────────────────────────────────────────

interface MemoryState {
  stability: number
  difficulty: number
  state: FlashcardSpacedState
  learningStep: number
  lapses: number
  reviewCount: number
  correctStreak: number
  lastReviewedAt: Date | null
}

/**
 * Lê o progresso gravado — inclusive o formato antigo, que só tinha
 * easeFactor/intervalDays — e devolve o estado de memória do FSRS.
 */
function readPreviousState(previous: Partial<FlashcardSpacedProgress> | null | undefined): MemoryState | null {
  if (!previous || !previous.reviewCount) return null

  const intervalDays = Number(previous.intervalDays) || 0
  const stability = Number.isFinite(Number(previous.stability)) && Number(previous.stability) > 0
    ? Number(previous.stability)
    : Math.max(intervalDays, 0.5)
  const difficulty = Number.isFinite(Number(previous.difficulty)) && Number(previous.difficulty) > 0
    ? clamp(Number(previous.difficulty), 1, 10)
    : difficultyFromLegacyEase(previous.easeFactor)

  const state: FlashcardSpacedState =
    previous.state === 'learning' || previous.state === 'relearning' || previous.state === 'review'
      ? previous.state
      : intervalDays >= 1
        ? 'review'
        : 'learning'

  return {
    stability,
    difficulty,
    state,
    learningStep: Number(previous.learningStep) || 0,
    lapses: Number(previous.lapses) || 0,
    reviewCount: Number(previous.reviewCount) || 0,
    correctStreak: Number(previous.correctStreak) || 0,
    lastReviewedAt: previous.lastReviewedAt ? new Date(previous.lastReviewedAt) : null,
  }
}

// ─── Resultado ────────────────────────────────────────────────────────────────

export interface SpacedReviewResult {
  rating: FlashcardSpacedRating
  state: FlashcardSpacedState
  reviewCount: number
  correctStreak: number
  lapses: number
  learningStep: number
  stability: number
  difficulty: number
  /** Espelho do modelo antigo — mantido só para leitura/compatibilidade. */
  easeFactor: number
  /** Dias até a próxima revisão. 0 quando o retorno é em minutos. */
  intervalDays: number
  /** Minutos até a próxima revisão quando ela ainda cabe nesta sessão. */
  scheduledMinutes: number
  nextReviewAt: Date
  lastReviewedAt: Date
  retention: number
  isLeech: boolean
  /** true quando o card volta ainda nesta sessão de estudo. */
  returnsThisSession: boolean
}

export interface CalculateReviewOptions {
  /** Meta de retenção (0,80–0,97). Padrão: 0,90. */
  retention?: number
  /** Semente do embaralhamento — na prática, o id do card. */
  seed?: string
}

/**
 * Calcula o próximo agendamento de um card a partir da avaliação do usuário.
 * Função pura: mesmos argumentos, mesmo resultado, no servidor ou no cliente.
 */
export function calculateNextSpacedReview(
  previous: Partial<FlashcardSpacedProgress> | null | undefined,
  rating: FlashcardSpacedRating,
  reviewedAt = new Date(),
  options: CalculateReviewOptions = {}
): SpacedReviewResult {
  const retention = clampRetention(options.retention ?? DEFAULT_RETENTION)
  const grade = gradeOf(rating)
  const prev = readPreviousState(previous)

  const reviewCount = (prev?.reviewCount || 0) + 1
  const seed = `${options.seed || 'card'}:${reviewCount}`

  let stability: number
  let difficulty: number
  let lapses = prev?.lapses || 0
  let correctStreak = prev?.correctStreak || 0
  let state: FlashcardSpacedState
  let learningStep = prev?.learningStep || 0

  if (!prev) {
    // Primeira vez que o card é visto.
    stability = initialStability(grade)
    difficulty = initialDifficulty(grade)
    state = 'learning'
    learningStep = 0
    correctStreak = grade === 1 ? 0 : 1
    if (grade === 1) lapses = 0
  } else {
    const elapsedDays = prev.lastReviewedAt
      ? Math.max((reviewedAt.getTime() - prev.lastReviewedAt.getTime()) / (24 * 60 * 60 * 1000), 0)
      : 0
    const r = retrievability(elapsedDays, prev.stability)
    const sameDay = elapsedDays < 1

    difficulty = nextDifficulty(prev.difficulty, grade)

    if (grade === 1) {
      stability = sameDay
        ? shortTermStability(prev.stability, grade)
        : nextStabilityOnLapse(prev.difficulty, prev.stability, r)
      // Só conta como tropeço quem já tinha saído da fase de aprendizado —
      // errar um card novo é o esperado, não uma recaída.
      if (prev.state === 'review') lapses += 1
      correctStreak = 0
      state = prev.state === 'review' ? 'relearning' : 'learning'
      learningStep = 0
    } else {
      stability = sameDay
        ? shortTermStability(prev.stability, grade)
        : nextStabilityOnSuccess(prev.difficulty, prev.stability, r, grade)
      correctStreak += 1
      state = prev.state
      learningStep = prev.learningStep
    }
  }

  // ── Agendamento ────────────────────────────────────────────────────────────
  // O FSRS diz o quanto a memória aguenta; os passos curtos decidem se o card
  // ainda volta hoje. "Fácil" sempre gradua: se foi de bandeja, insistir na
  // mesma sessão é desperdício de tempo de estudo.
  let intervalDays = 0
  let scheduledMinutes = 0
  let nextReviewAt: Date

  // "Médio" num card inédito cumpre UM passo curto antes de graduar; quem
  // estava reaprendendo depois de errar gradua já no primeiro acerto — senão o
  // card fica preso num carrossel de minutos.
  const needsShortStep = grade === 3 && state === 'learning' && learningStep < 1

  if (grade === 1) {
    scheduledMinutes = state === 'relearning' ? RELEARNING_STEP_MINUTES : AGAIN_STEP_MINUTES
    nextReviewAt = addMinutes(reviewedAt, scheduledMinutes)
    learningStep = 0
  } else if (needsShortStep) {
    scheduledMinutes = LEARNING_STEP_MINUTES
    nextReviewAt = addMinutes(reviewedAt, scheduledMinutes)
    learningStep = 1
  } else {
    // Graduou: daqui para frente quem manda é a curva de esquecimento.
    state = 'review'
    learningStep = 0
    const raw = intervalFromStability(stability, retention)
    intervalDays = clamp(fuzzInterval(raw, seed), 1, MAX_INTERVAL_DAYS)
    nextReviewAt = addDays(reviewedAt, intervalDays)
  }

  return {
    rating,
    state,
    reviewCount,
    correctStreak,
    lapses,
    learningStep,
    stability: Number(stability.toFixed(4)),
    difficulty: Number(difficulty.toFixed(4)),
    easeFactor: legacyEaseFromDifficulty(difficulty),
    intervalDays,
    scheduledMinutes,
    nextReviewAt,
    lastReviewedAt: reviewedAt,
    retention,
    isLeech: lapses >= LEECH_LAPSES_THRESHOLD,
    returnsThisSession: intervalDays === 0,
  }
}

// ─── Textos ───────────────────────────────────────────────────────────────────

/** "em 5 min", "amanhã", "em 12 dias" — a resposta curta que vai no rodapé. */
export function formatIntervalLabel(result: Pick<SpacedReviewResult, 'intervalDays' | 'scheduledMinutes'>): string {
  if (result.intervalDays <= 0) {
    const minutes = Math.max(1, Math.round(result.scheduledMinutes))
    return minutes < 60 ? `em ${minutes} min` : `em ${Math.round(minutes / 60)} h`
  }
  if (result.intervalDays === 1) return 'amanhã'
  if (result.intervalDays < 30) return `em ${result.intervalDays} dias`
  const months = Math.round(result.intervalDays / 30)
  if (months < 12) return `em ${months} ${months === 1 ? 'mês' : 'meses'}`
  const years = Math.round((result.intervalDays / 365) * 10) / 10
  return `em ${String(years).replace('.', ',')} ${years === 1 ? 'ano' : 'anos'}`
}

export function getReviewFeedbackMessage(result: SpacedReviewResult): string {
  if (result.intervalDays <= 0) return `Volta ainda nesta sessão · ${formatIntervalLabel(result)}`
  return `Volta ${formatIntervalLabel(result)}`
}

export function getRelativeReviewLabel(date: Date, now = new Date()): string {
  const diffMs = date.getTime() - now.getTime()
  if (diffMs <= 0) return 'vencido agora'
  const minutes = Math.ceil(diffMs / 60000)
  if (minutes < 60) return `em ${minutes} min`
  const hours = Math.ceil(minutes / 60)
  if (hours < 24) return `em ${hours} h`
  const days = Math.ceil(hours / 24)
  if (days === 1) return 'amanhã'
  return `em ${days} dias`
}

// ─── Serialização ─────────────────────────────────────────────────────────────

export function normalizeSpacedProgressForResponse(progress: FlashcardSpacedProgress & { _id?: any }) {
  return {
    ...progress,
    _id: progress._id ? String(progress._id) : undefined,
    rating: normalizeSpacedRating(progress.rating) || 'MEDIO',
    state: progress.state || (Number(progress.intervalDays) >= 1 ? 'review' : 'learning'),
    stability: Number(progress.stability) || Math.max(Number(progress.intervalDays) || 0, 0.5),
    difficulty: Number(progress.difficulty) || difficultyFromLegacyEase(progress.easeFactor),
    lapses: Number(progress.lapses) || 0,
    nextReviewAt: progress.nextReviewAt ? new Date(progress.nextReviewAt).toISOString() : null,
    lastReviewedAt: progress.lastReviewedAt ? new Date(progress.lastReviewedAt).toISOString() : null,
    createdAt: progress.createdAt ? new Date(progress.createdAt).toISOString() : null,
    updatedAt: progress.updatedAt ? new Date(progress.updatedAt).toISOString() : null,
  }
}

// ─── Estatísticas e fila ──────────────────────────────────────────────────────

export interface SpacedRepetitionStats {
  /** Cards com data de retorno já vencida (o trabalho de hoje). */
  dueToday: number
  /** Nunca vistos. */
  newCards: number
  /** Estáveis o bastante para sair do caminho. */
  mastered: number
  /** Reaprendendo, com muitos tropeços ou dificuldade alta. */
  difficult: number
  /** Ainda nos passos curtos — voltam hoje mesmo. */
  learning: number
  /** Agendados para os próximos dias. */
  scheduled: number
  total: number
}

type CardLike = FlashcardManualCard & { _id?: any }
type ProgressMap = Map<string, FlashcardSpacedProgress>

function progressOf(card: CardLike, progressByCardId: ProgressMap) {
  return progressByCardId.get(String(card._id))
}

function isDue(progress: FlashcardSpacedProgress, now: Date): boolean {
  return new Date(progress.nextReviewAt).getTime() <= now.getTime()
}

function stabilityOf(progress: FlashcardSpacedProgress): number {
  const stability = Number(progress.stability)
  if (Number.isFinite(stability) && stability > 0) return stability
  return Math.max(Number(progress.intervalDays) || 0, 0.5)
}

function difficultyOf(progress: FlashcardSpacedProgress): number {
  const difficulty = Number(progress.difficulty)
  if (Number.isFinite(difficulty) && difficulty > 0) return difficulty
  return difficultyFromLegacyEase(progress.easeFactor)
}

function stateOf(progress: FlashcardSpacedProgress): FlashcardSpacedState {
  if (progress.state === 'learning' || progress.state === 'relearning' || progress.state === 'review') {
    return progress.state
  }
  return Number(progress.intervalDays) >= 1 ? 'review' : 'learning'
}

/** Um card é "difícil" quando ele custa caro: tropeça muito ou não estabiliza. */
export function isStrugglingProgress(progress: FlashcardSpacedProgress): boolean {
  return (
    stateOf(progress) === 'relearning' ||
    (Number(progress.lapses) || 0) >= 2 ||
    difficultyOf(progress) >= 7.5
  )
}

/** Dominado: aguenta semanas sem revisão e não está em recaída. */
export function isMasteredProgress(progress: FlashcardSpacedProgress): boolean {
  return stateOf(progress) === 'review' && stabilityOf(progress) >= 21 && !isStrugglingProgress(progress)
}

export function calculateSpacedStats(
  cards: CardLike[],
  progressByCardId: ProgressMap,
  now = new Date()
): SpacedRepetitionStats {
  return cards.reduce<SpacedRepetitionStats>(
    (stats, card) => {
      stats.total += 1
      const progress = progressOf(card, progressByCardId)
      if (!progress) {
        stats.newCards += 1
        return stats
      }
      const due = isDue(progress, now)
      const state = stateOf(progress)
      if (due) stats.dueToday += 1
      else stats.scheduled += 1
      if (state !== 'review') stats.learning += 1
      if (isMasteredProgress(progress)) stats.mastered += 1
      if (isStrugglingProgress(progress)) stats.difficult += 1
      return stats
    },
    { dueToday: 0, newCards: 0, mastered: 0, difficult: 0, learning: 0, scheduled: 0, total: 0 }
  )
}

/**
 * Urgência de um card vencido: quantas "vidas de memória" ele já passou do
 * ponto. Um card de 2 dias atrasado 4 dias corre muito mais risco de ter sido
 * esquecido do que um de 200 dias atrasado 4 — e por isso vem antes.
 */
function overdueRatio(progress: FlashcardSpacedProgress, now: Date): number {
  const due = new Date(progress.nextReviewAt).getTime()
  const overdueDays = Math.max((now.getTime() - due) / (24 * 60 * 60 * 1000), 0)
  return overdueDays / Math.max(stabilityOf(progress), 0.1)
}

export interface SpacedQueueOptions {
  now?: Date
  /** Teto de cards inéditos por sessão. `null` desliga o teto. */
  newCardLimit?: number | null
  /** Inclui os que ainda não venceram (estudo adiantado). */
  includeFuture?: boolean
}

export interface SpacedQueue<T> {
  cards: T[]
  counts: {
    learning: number
    due: number
    newCards: number
    future: number
    /** Novos que ficaram de fora por causa do teto da sessão. */
    heldBack: number
  }
}

/**
 * Monta a fila da sessão.
 *
 * Ordem de prioridade:
 *   1. o que está em passo curto e já venceu (você errou há pouco);
 *   2. revisões vencidas, das mais em risco de esquecimento para as menos;
 *   3. cards novos, intercalados com as revisões e limitados por sessão;
 *   4. o que ainda não venceu — só quando a sessão pede estudo adiantado.
 *
 * Intercalar os novos entre as revisões é deliberado: uma sequência de 30
 * cards inéditos seguidos é a receita para abandonar a sessão no meio.
 */
export function buildSpacedQueue<T extends CardLike>(
  cards: T[],
  progressByCardId: ProgressMap,
  options: SpacedQueueOptions = {}
): SpacedQueue<T> {
  const now = options.now || new Date()
  const includeFuture = options.includeFuture !== false
  const newCardLimit = options.newCardLimit === undefined ? 20 : options.newCardLimit

  const learning: T[] = []
  const due: T[] = []
  const fresh: T[] = []
  const future: T[] = []

  for (const card of cards) {
    const progress = progressOf(card, progressByCardId)
    if (!progress) {
      fresh.push(card)
      continue
    }
    if (!isDue(progress, now)) {
      future.push(card)
      continue
    }
    if (stateOf(progress) === 'review') due.push(card)
    else learning.push(card)
  }

  const byDueDate = (a: T, b: T) => {
    const pa = progressOf(a, progressByCardId)
    const pb = progressOf(b, progressByCardId)
    return new Date(pa!.nextReviewAt).getTime() - new Date(pb!.nextReviewAt).getTime()
  }

  learning.sort(byDueDate)
  due.sort((a, b) => {
    const pa = progressOf(a, progressByCardId)!
    const pb = progressOf(b, progressByCardId)!
    const diff = overdueRatio(pb, now) - overdueRatio(pa, now)
    if (Math.abs(diff) > 1e-6) return diff
    return difficultyOf(pb) - difficultyOf(pa)
  })
  fresh.sort((a, b) => (a.index || 0) - (b.index || 0))
  future.sort(byDueDate)

  const takenNew = newCardLimit === null ? fresh : fresh.slice(0, Math.max(newCardLimit, 0))
  const heldBack = fresh.length - takenNew.length

  // Intercalação: reviews e novos entram alternados na proporção das duas
  // pilhas, então os inéditos ficam espalhados pela sessão inteira.
  const reviews = [...learning, ...due]
  const merged: T[] = []
  if (takenNew.length === 0) {
    merged.push(...reviews)
  } else if (reviews.length === 0) {
    merged.push(...takenNew)
  } else {
    const step = reviews.length / takenNew.length
    let nextNewAt = step
    let newIndex = 0
    for (let i = 0; i < reviews.length; i += 1) {
      merged.push(reviews[i])
      while (newIndex < takenNew.length && i + 1 >= nextNewAt) {
        merged.push(takenNew[newIndex])
        newIndex += 1
        nextNewAt += step
      }
    }
    while (newIndex < takenNew.length) {
      merged.push(takenNew[newIndex])
      newIndex += 1
    }
  }

  const tail: T[] = []
  if (includeFuture) tail.push(...future)
  if (newCardLimit !== null && heldBack > 0) tail.push(...fresh.slice(takenNew.length))

  return {
    cards: [...merged, ...tail],
    counts: {
      learning: learning.length,
      due: due.length,
      newCards: takenNew.length,
      future: future.length,
      heldBack: Math.max(heldBack, 0),
    },
  }
}

/**
 * Ordenação completa do baralho (nada fica de fora) — é o que a listagem do
 * deck usa. A fila de estudo de verdade sai de `buildSpacedQueue`.
 */
export function sortCardsForSpacedRepetition<T extends CardLike>(
  cards: T[],
  progressByCardId: ProgressMap,
  now = new Date()
): T[] {
  return buildSpacedQueue(cards, progressByCardId, { now, newCardLimit: null, includeFuture: true }).cards
}
