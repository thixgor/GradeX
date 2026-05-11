import type { FlashcardManualCard, FlashcardSpacedProgress, FlashcardSpacedRating } from './types'

export const FLASHCARD_SPACED_PROGRESS_COLLECTION = 'flashcardSpacedProgress'

export const FLASHCARD_SPACED_RATINGS: FlashcardSpacedRating[] = ['SUAVE', 'NO_PONTO', 'PORRETE']

export type LegacyFlashcardRating = 'facil' | 'equilibrado' | 'porrada'

export function normalizeSpacedRating(rating: unknown): FlashcardSpacedRating | null {
  if (rating === 'SUAVE' || rating === 'facil') return 'SUAVE'
  if (rating === 'NO_PONTO' || rating === 'equilibrado') return 'NO_PONTO'
  if (rating === 'PORRETE' || rating === 'porrada') return 'PORRETE'
  return null
}

export function toLegacyRating(rating: FlashcardSpacedRating): LegacyFlashcardRating {
  if (rating === 'SUAVE') return 'facil'
  if (rating === 'NO_PONTO') return 'equilibrado'
  return 'porrada'
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000)
}

export interface SpacedReviewResult {
  rating: FlashcardSpacedRating
  reviewCount: number
  correctStreak: number
  easeFactor: number
  intervalDays: number
  nextReviewAt: Date
  lastReviewedAt: Date
}

export function calculateNextSpacedReview(
  previous: Partial<FlashcardSpacedProgress> | null | undefined,
  rating: FlashcardSpacedRating,
  reviewedAt = new Date()
): SpacedReviewResult {
  const reviewCount = (previous?.reviewCount || 0) + 1
  const currentStreak = previous?.correctStreak || 0
  const currentEase = previous?.easeFactor || 2.5
  const currentInterval = previous?.intervalDays || 0

  let correctStreak = currentStreak
  let easeFactor = currentEase
  let intervalDays = 0
  let nextReviewAt = reviewedAt

  if (rating === 'PORRETE') {
    correctStreak = 0
    easeFactor = clamp(currentEase - 0.2, 1.3, 3.2)
    intervalDays = 0
    nextReviewAt = addMinutes(reviewedAt, 10)
  } else if (rating === 'NO_PONTO') {
    correctStreak = currentStreak + 1
    easeFactor = clamp(currentEase + 0.03, 1.3, 3.2)
    if (correctStreak <= 1) intervalDays = 1
    else if (correctStreak === 2) intervalDays = 3
    else if (correctStreak === 3) intervalDays = 7
    else intervalDays = clamp(Math.round(Math.max(currentInterval, 7) * easeFactor * 0.75), 7, 45)
    nextReviewAt = addDays(reviewedAt, intervalDays)
  } else {
    correctStreak = currentStreak + 1
    easeFactor = clamp(currentEase + 0.15, 1.3, 3.2)
    if (correctStreak <= 1) intervalDays = 3
    else if (correctStreak === 2) intervalDays = 7
    else if (correctStreak === 3) intervalDays = 15
    else if (correctStreak === 4) intervalDays = 30
    else intervalDays = clamp(Math.round(Math.max(currentInterval, 30) * easeFactor), 30, 120)
    nextReviewAt = addDays(reviewedAt, intervalDays)
  }

  return {
    rating,
    reviewCount,
    correctStreak,
    easeFactor: Number(easeFactor.toFixed(2)),
    intervalDays,
    nextReviewAt,
    lastReviewedAt: reviewedAt,
  }
}

export function getReviewFeedbackMessage(result: SpacedReviewResult): string {
  if (result.rating === 'PORRETE') return 'Esse card voltará em breve para reforço.'
  if (result.intervalDays <= 1) return 'Card agendado para revisão amanhã.'
  return `Card agendado para revisão em ${result.intervalDays} dias.`
}

export function getRelativeReviewLabel(date: Date, now = new Date()): string {
  const diffMs = date.getTime() - now.getTime()
  if (diffMs <= 0) return 'vencido agora'
  const minutes = Math.ceil(diffMs / 60000)
  if (minutes < 60) return `em ${minutes} min`
  const hours = Math.ceil(minutes / 60)
  if (hours < 24) return `em ${hours} h`
  const days = Math.ceil(hours / 24)
  if (days === 1) return 'amanha'
  return `em ${days} dias`
}

export function normalizeSpacedProgressForResponse(progress: FlashcardSpacedProgress & { _id?: any }) {
  return {
    ...progress,
    _id: progress._id ? String(progress._id) : undefined,
    nextReviewAt: progress.nextReviewAt ? new Date(progress.nextReviewAt).toISOString() : null,
    lastReviewedAt: progress.lastReviewedAt ? new Date(progress.lastReviewedAt).toISOString() : null,
    createdAt: progress.createdAt ? new Date(progress.createdAt).toISOString() : null,
    updatedAt: progress.updatedAt ? new Date(progress.updatedAt).toISOString() : null,
  }
}

export interface SpacedRepetitionStats {
  dueToday: number
  newCards: number
  mastered: number
  difficult: number
}

export function calculateSpacedStats(
  cards: Array<FlashcardManualCard & { _id?: any }>,
  progressByCardId: Map<string, FlashcardSpacedProgress>,
  now = new Date()
): SpacedRepetitionStats {
  return cards.reduce<SpacedRepetitionStats>((stats, card) => {
    const cardId = String(card._id)
    const progress = progressByCardId.get(cardId)
    if (!progress) {
      stats.newCards += 1
      return stats
    }

    if (new Date(progress.nextReviewAt).getTime() <= now.getTime()) stats.dueToday += 1
    if (progress.correctStreak >= 3 && progress.intervalDays >= 15 && progress.rating !== 'PORRETE') stats.mastered += 1
    if (progress.rating === 'PORRETE' || progress.easeFactor < 2 || (progress.reviewCount > 0 && progress.correctStreak === 0)) {
      stats.difficult += 1
    }
    return stats
  }, { dueToday: 0, newCards: 0, mastered: 0, difficult: 0 })
}

function getCardPriority(card: FlashcardManualCard & { _id?: any }, progressByCardId: Map<string, FlashcardSpacedProgress>, now: Date): [number, number, number] {
  const progress = progressByCardId.get(String(card._id))
  if (!progress) return [2, card.index || 0, 0]

  const dueAt = new Date(progress.nextReviewAt).getTime()
  const ratingPriority = progress.rating === 'PORRETE' ? 0 : progress.rating === 'NO_PONTO' ? 1 : 2
  if (dueAt <= now.getTime()) return [0, ratingPriority, dueAt]
  return [3, ratingPriority, dueAt]
}

export function sortCardsForSpacedRepetition<T extends FlashcardManualCard & { _id?: any }>(
  cards: T[],
  progressByCardId: Map<string, FlashcardSpacedProgress>,
  now = new Date()
): T[] {
  return [...cards].sort((a, b) => {
    const priorityA = getCardPriority(a, progressByCardId, now)
    const priorityB = getCardPriority(b, progressByCardId, now)
    for (let i = 0; i < priorityA.length; i += 1) {
      if (priorityA[i] !== priorityB[i]) return priorityA[i] - priorityB[i]
    }
    return 0
  })
}
