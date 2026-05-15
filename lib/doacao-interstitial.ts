type InterstitialContext = 'manual-clinico' | 'exam'

const COUNT_PREFIX = 'gradex-doacao-interstitial-count'

function storageKey(context: InterstitialContext) {
  return `${COUNT_PREFIX}:${context}`
}

export function shouldShowInterstitial(_context: InterstitialContext): boolean {
  return typeof window !== 'undefined'
}

export function markInterstitialShown(context: InterstitialContext): number {
  if (typeof window === 'undefined') return 1

  try {
    const nextCount = Number(window.localStorage.getItem(storageKey(context)) || 0) + 1
    window.localStorage.setItem(storageKey(context), String(nextCount))
    return nextCount
  } catch {
    // Storage can be unavailable in private browsing; donation should never block study.
    return 1
  }
}
