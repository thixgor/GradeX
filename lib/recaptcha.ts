interface RecaptchaResponse {
  success: boolean
  score?: number
  'error-codes'?: string[]
  challenge_ts?: string
  hostname?: string
  action?: string
}

// Scores minimos por tipo de acao
// Acoes mais sensiveis requerem scores mais altos
export const RECAPTCHA_MIN_SCORES = {
  // Acoes de alto risco (login, registro, reset senha)
  HIGH_RISK: 0.7,
  // Acoes de risco medio (submit forms, comentarios)
  MEDIUM_RISK: 0.5,
  // Acoes de baixo risco (leitura, navegacao)
  LOW_RISK: 0.3,
  // Score padrao
  DEFAULT: 0.5
} as const

export type RecaptchaRiskLevel = keyof typeof RECAPTCHA_MIN_SCORES

export async function verifyRecaptcha(
  token: string,
  riskLevel: RecaptchaRiskLevel = 'DEFAULT',
  expectedAction?: string
): Promise<{ success: boolean; score?: number; error?: string }> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY

  if (!secretKey) {
    console.error('RECAPTCHA_SECRET_KEY não configurada')
    return { success: false, error: 'Configuração do reCAPTCHA inválida' }
  }

  if (!token) {
    return { success: false, error: 'Token do reCAPTCHA não fornecido' }
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
      }),
    })

    const data: RecaptchaResponse = await response.json()

    if (!data.success) {
      return {
        success: false,
        error: data['error-codes']?.join(', ') || 'Falha na verificação do reCAPTCHA',
      }
    }

    // Verificar se a action corresponde (se especificada)
    if (expectedAction && data.action !== expectedAction) {
      return {
        success: false,
        error: 'Ação do reCAPTCHA não corresponde à esperada',
      }
    }

    const score = data.score ?? 0
    const minScore = RECAPTCHA_MIN_SCORES[riskLevel]

    if (score < minScore) {
      return {
        success: false,
        error: `Verificação de segurança falhou. Por favor, tente novamente.`,
        score,
      }
    }

    return { success: true, score }
  } catch (error) {
    console.error('Erro ao verificar reCAPTCHA:', error)
    return { success: false, error: 'Erro ao verificar reCAPTCHA' }
  }
}
