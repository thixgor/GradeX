import { HighlightColor, HighlightType } from '@/lib/types'

export interface ManualHighlight {
  id: string
  startOffset: number
  endOffset: number
  type: HighlightType
  color?: HighlightColor
  customColor?: string
}

/** Per-slug store: fieldName → highlights */
export type SlugHighlights = Record<string, ManualHighlight[]>

const PREFIX = 'mc-hl-'

export function loadHighlights(slug: string): SlugHighlights {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(PREFIX + slug)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function saveHighlights(slug: string, data: SlugHighlights) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(PREFIX + slug, JSON.stringify(data))
  } catch {}
}

export function clearAllManualHighlights() {
  if (typeof window === 'undefined') return
  try {
    Object.keys(localStorage)
      .filter(k => k.startsWith(PREFIX))
      .forEach(k => localStorage.removeItem(k))
  } catch {}
}

export function hasAnyManualHighlights(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return Object.keys(localStorage).some(k => k.startsWith(PREFIX))
  } catch {
    return false
  }
}
