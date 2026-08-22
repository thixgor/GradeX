import { AccountType } from './types'
import { normalizeAccountType } from './account-tier'

export interface FlashcardTierLimits {
  dailyDecks: number
  maxActiveDecks: number | null
  cardsPerDeck: number
  totalCardsLifetime: number
  totalDecksLifetime: number
}

/** Plus+ gera flashcards por IA sem teto. */
const PLUS_FLASHCARD_LIMITS: FlashcardTierLimits = {
  dailyDecks: Infinity,
  maxActiveDecks: null,
  cardsPerDeck: Infinity,
  totalCardsLifetime: Infinity,
  totalDecksLifetime: Infinity,
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
  // Quest paga pelo Banco de Questões, não pelo gerador de IA: mesmo teto do
  // gratuito.
  quest: {
    dailyDecks: Infinity,
    maxActiveDecks: 10,
    cardsPerDeck: 5,
    totalCardsLifetime: Infinity,
    totalDecksLifetime: 5,
  },
  plus: PLUS_FLASHCARD_LIMITS,
  essential: PLUS_FLASHCARD_LIMITS,
  premium: PLUS_FLASHCARD_LIMITS,
  admin: {
    dailyDecks: Infinity,
    maxActiveDecks: null,
    cardsPerDeck: Infinity,
    totalCardsLifetime: Infinity,
    totalDecksLifetime: Infinity,
  },
}

export function getFlashcardLimits(accountType?: AccountType | string, isAdmin?: boolean): FlashcardTierLimits {
  if (isAdmin) {
    return FLASHCARD_LIMITS.admin
  }

  return FLASHCARD_LIMITS[normalizeAccountType(accountType)] || FLASHCARD_LIMITS.gratuito
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

/** Plus+ monta decks manuais sem teto. */
const PLUS_MANUAL_LIMITS: FlashcardManualTierLimits = {
  maxDecks: Infinity,
  cardsPerDeck: Infinity,
  maxFolders: Infinity,
  maxImageSizeMB: 15,
  canSetVisibilityPublic: true,
  canShare: true,
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
  // Idem: fora do Banco, Quest vale uma conta gratuita.
  quest: {
    maxDecks: 5,
    cardsPerDeck: 30,
    maxFolders: 3,
    maxImageSizeMB: 2,
    canSetVisibilityPublic: true,
    canShare: true,
  },
  plus: PLUS_MANUAL_LIMITS,
  essential: PLUS_MANUAL_LIMITS,
  premium: PLUS_MANUAL_LIMITS,
  admin: {
    maxDecks: Infinity,
    cardsPerDeck: Infinity,
    maxFolders: Infinity,
    maxImageSizeMB: 25,
    canSetVisibilityPublic: true,
    canShare: true,
  },
}

export function getFlashcardManualLimits(accountType?: AccountType | string, isAdmin?: boolean): FlashcardManualTierLimits {
  if (isAdmin) return FLASHCARD_MANUAL_LIMITS.admin
  return FLASHCARD_MANUAL_LIMITS[normalizeAccountType(accountType)] || FLASHCARD_MANUAL_LIMITS.gratuito
}
