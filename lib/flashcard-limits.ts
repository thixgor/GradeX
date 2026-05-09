import { AccountType } from './types'

export interface FlashcardTierLimits {
  dailyDecks: number
  maxActiveDecks: number | null
  cardsPerDeck: number
  totalCardsLifetime: number
  totalDecksLifetime: number
}

const FLASHCARD_LIMITS: Record<AccountType | 'admin', FlashcardTierLimits> = {
  gratuito: {
    dailyDecks: Infinity,
    maxActiveDecks: 10,
    cardsPerDeck: 5,
    totalCardsLifetime: Infinity,
    totalDecksLifetime: 5,
  },
  trial: {
    dailyDecks: 10,
    maxActiveDecks: 10,
    cardsPerDeck: 10,
    totalCardsLifetime: Infinity,
    totalDecksLifetime: Infinity,
  },
  essential: {
    dailyDecks: 15,
    maxActiveDecks: 15,
    cardsPerDeck: 15,
    totalCardsLifetime: Infinity,
    totalDecksLifetime: Infinity,
  },
  premium: {
    dailyDecks: 25,
    maxActiveDecks: null,
    cardsPerDeck: 20,
    totalCardsLifetime: Infinity,
    totalDecksLifetime: Infinity,
  },
  admin: {
    dailyDecks: Infinity,
    maxActiveDecks: null,
    cardsPerDeck: Infinity,
    totalCardsLifetime: Infinity,
    totalDecksLifetime: Infinity,
  },
}

export function getFlashcardLimits(accountType?: AccountType, isAdmin?: boolean): FlashcardTierLimits {
  if (isAdmin) {
    return FLASHCARD_LIMITS.admin
  }

  if (!accountType) {
    return FLASHCARD_LIMITS.gratuito
  }

  return FLASHCARD_LIMITS[accountType]
}

// ─── Limites de Flashcards Manuais ────────────────────────────────────────────
// Sistema separado do gerador de IA. Aqui o limite é por deck/cartões totais
// criados manualmente pelo usuário (não diário, pois criar é trabalhoso).

export interface FlashcardManualTierLimits {
  maxDecks: number // Total de decks ativos que o usuário pode ter
  cardsPerDeck: number // Quantos cartões cabem em um deck
  maxFolders: number
  maxImageSizeMB: number
  canSetVisibilityPublic: boolean // sempre true (mas exige email verificado)
  canShare: boolean
}

const FLASHCARD_MANUAL_LIMITS: Record<AccountType | 'admin', FlashcardManualTierLimits> = {
  gratuito: {
    maxDecks: 5,
    cardsPerDeck: 30,
    maxFolders: 3,
    maxImageSizeMB: 2,
    canSetVisibilityPublic: true,
    canShare: true,
  },
  trial: {
    maxDecks: 15,
    cardsPerDeck: 60,
    maxFolders: 8,
    maxImageSizeMB: 4,
    canSetVisibilityPublic: true,
    canShare: true,
  },
  essential: {
    maxDecks: 30,
    cardsPerDeck: 120,
    maxFolders: 20,
    maxImageSizeMB: 6,
    canSetVisibilityPublic: true,
    canShare: true,
  },
  premium: {
    maxDecks: Infinity,
    cardsPerDeck: 500,
    maxFolders: Infinity,
    maxImageSizeMB: 10,
    canSetVisibilityPublic: true,
    canShare: true,
  },
  admin: {
    maxDecks: Infinity,
    cardsPerDeck: Infinity,
    maxFolders: Infinity,
    maxImageSizeMB: 25,
    canSetVisibilityPublic: true,
    canShare: true,
  },
}

export function getFlashcardManualLimits(accountType?: AccountType, isAdmin?: boolean): FlashcardManualTierLimits {
  if (isAdmin) return FLASHCARD_MANUAL_LIMITS.admin
  if (!accountType) return FLASHCARD_MANUAL_LIMITS.gratuito
  return FLASHCARD_MANUAL_LIMITS[accountType]
}
