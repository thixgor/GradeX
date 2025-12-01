import { AccountType } from './types'

export interface FlashcardTierLimits {
  dailyDecks: number
  maxActiveDecks: number | null
  cardsPerDeck: number
}

const FLASHCARD_LIMITS: Record<AccountType | 'admin', FlashcardTierLimits> = {
  gratuito: {
    dailyDecks: 3,
    maxActiveDecks: 10,
    cardsPerDeck: 5,
  },
  trial: {
    dailyDecks: 10,
    maxActiveDecks: 10,
    cardsPerDeck: 10,
  },
  premium: {
    dailyDecks: 25,
    maxActiveDecks: null,
    cardsPerDeck: 20,
  },
  admin: {
    dailyDecks: Infinity,
    maxActiveDecks: null,
    cardsPerDeck: Infinity,
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
