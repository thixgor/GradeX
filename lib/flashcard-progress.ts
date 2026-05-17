// Lightweight localStorage-backed progress tracker for flashcard study sessions.
// Saved per (user, deck) so the user can resume where they left off.

const KEY_PREFIX = 'gdx:flashcard-progress:'
const STALE_MS = 14 * 24 * 60 * 60 * 1000 // 14 days

export type StoredRating = 'facil' | 'equilibrado' | 'porrada'
export type StoredMode = 'normal' | 'spaced'

export interface FlashcardProgress {
  mode: StoredMode
  index: number
  total: number
  ratings: Record<string, StoredRating>
  savedAt: number
}

function getKey(slug: string, userKey: string) {
  return `${KEY_PREFIX}${userKey || 'guest'}:${slug}`
}

export function loadProgress(slug: string, userKey: string): FlashcardProgress | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(getKey(slug, userKey))
    if (!raw) return null
    const parsed = JSON.parse(raw) as FlashcardProgress
    if (
      !parsed ||
      typeof parsed.index !== 'number' ||
      typeof parsed.total !== 'number' ||
      typeof parsed.savedAt !== 'number' ||
      (parsed.mode !== 'normal' && parsed.mode !== 'spaced')
    ) {
      return null
    }
    if (Date.now() - parsed.savedAt > STALE_MS) {
      window.localStorage.removeItem(getKey(slug, userKey))
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function saveProgress(
  slug: string,
  userKey: string,
  data: Omit<FlashcardProgress, 'savedAt'>,
) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(
      getKey(slug, userKey),
      JSON.stringify({ ...data, savedAt: Date.now() }),
    )
  } catch {
    // localStorage may be unavailable (quota, private mode) — silently ignore.
  }
}

export function clearProgress(slug: string, userKey: string) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(getKey(slug, userKey))
  } catch {}
}
