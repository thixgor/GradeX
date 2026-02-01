interface RecaptchaResponse {
  success: boolean
  score?: number
  'error-codes'?: string[]
  challenge_ts?: string
  hostname?: string
}

export async function verifyRecaptcha(token: string): Promise<{ success: boolean; score?: number; error?: string }> {
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

    const score = data.score ?? 0
    const MIN_SCORE = 0.5

    if (score < MIN_SCORE) {
      return {
        success: false,
        error: `Score do reCAPTCHA muito baixo (${score.toFixed(2)}). Mínimo requerido: ${MIN_SCORE}`,
        score,
      }
    }

    return { success: true, score }
  } catch (error) {
    console.error('Erro ao verificar reCAPTCHA:', error)
    return { success: false, error: 'Erro ao verificar reCAPTCHA' }
  }
}
