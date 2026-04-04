const COOLDOWN_MS = 24 * 60 * 60 * 1000 // 24 horas

type InterstitialContext = 'manual-clinico' | 'exam'

function getKey(context: InterstitialContext): string {
  return `doacao_interstitial_${context}_last`
}

export function shouldShowInterstitial(context: InterstitialContext): boolean {
  if (typeof window === 'undefined') return false
  const lastShown = localStorage.getItem(getKey(context))
  if (!lastShown) return true
  return Date.now() - parseInt(lastShown, 10) > COOLDOWN_MS
}

export function markInterstitialShown(context: InterstitialContext): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(getKey(context), Date.now().toString())
}
