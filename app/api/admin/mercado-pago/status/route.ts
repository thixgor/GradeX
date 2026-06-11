import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getPaymentConfig, maskToken } from '@/lib/payments'
import { getMarketplaceConnection } from '@/lib/payments/mercado-pago/marketplace-store'

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
  const conn = await getMarketplaceConnection()

  return NextResponse.json({
    configured: !!cfg.mp.accessToken,
    env: cfg.mp.env,
    publicKey: cfg.mp.publicKey || null,
    accessTokenMasked: maskToken(cfg.mp.accessToken),
    webhookUrl,
    webhookSecretConfigured: !!cfg.mp.webhookSecret,
    split: {
      enabled: cfg.mp.split.enabled,
      // % que vai para o sócio (application_fee); o restante fica na conta principal.
      partnerPercent: cfg.mp.split.partnerPercent,
      mainPercent: cfg.mp.split.enabled
        ? Math.round((100 - cfg.mp.split.partnerPercent) * 100) / 100
        : 100,
    },
    marketplace: {
      // Há credenciais OAuth da aplicação do sócio configuradas?
      oauthConfigured: !!cfg.mp.oauth.clientId && !!cfg.mp.oauth.clientSecret,
      redirectUri: cfg.mp.oauth.redirectUri,
      // A conta já foi conectada via OAuth?
      connected: !!conn?.accessToken,
      collectorId: conn?.collectorId ?? null,
      connectedAt: conn?.connectedAt ?? null,
      // Em qual conta os pagamentos serão processados (token efetivo).
      effectiveTokenMasked: maskToken(conn?.accessToken || cfg.mp.accessToken),
      effectiveSource: conn?.accessToken ? 'marketplace' : 'env',
    },
  })
}
