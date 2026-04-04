type InterstitialContext = 'manual-clinico' | 'exam'

// Sem cooldown — mostra sempre que o usuário acessa
export function shouldShowInterstitial(_context: InterstitialContext): boolean {
  return typeof window !== 'undefined'
}

// Mantido para compatibilidade (não faz nada)
export function markInterstitialShown(_context: InterstitialContext): void {}
