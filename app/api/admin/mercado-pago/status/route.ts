import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getPaymentConfig, maskToken } from '@/lib/payments'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Retorna o status (mascarado) da integração MP para o painel admin.
 * Nunca retorna o access token completo.
 */
export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  let cfg
  try {
    cfg = getPaymentConfig()
  } catch (err: any) {
    return NextResponse.json({
      configured: false,
      error: err?.message || 'Configuração inválida',
    })
  }

  const webhookUrl = cfg.mp.notificationUrl

  return NextResponse.json({
    configured: !!cfg.mp.accessToken,
    env: cfg.mp.env,
    publicKey: cfg.mp.publicKey || null,
    accessTokenMasked: maskToken(cfg.mp.accessToken),
    webhookUrl,
    webhookSecretConfigured: !!cfg.mp.webhookSecret,
  })
}
