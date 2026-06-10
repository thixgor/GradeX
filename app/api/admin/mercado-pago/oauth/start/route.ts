import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/auth'
import { getPaymentConfig } from '@/lib/payments'
import { getAuthorizationUrl } from '@/lib/payments/mercado-pago/oauth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const STATE_COOKIE = 'mp_oauth_state'

/**
 * Inicia o fluxo OAuth de marketplace: gera um `state` (anti-CSRF), guarda-o
 * num cookie e redireciona o admin para a tela de autorização do Mercado Pago.
 * Esta rota deve ser acessada por navegação (não via fetch).
 */
export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const cfg = getPaymentConfig()
  if (!cfg.mp.oauth.clientId) {
    return NextResponse.json(
      {
        error:
          'MERCADOPAGO_CLIENT_ID não configurado. Cole o Client ID da aplicação de marketplace do sócio nas variáveis de ambiente.',
      },
      { status: 400 }
    )
  }

  const state = randomUUID()
  const cookieStore = await cookies()
  cookieStore.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', // 'lax' para sobreviver ao redirect de volta do MP
    maxAge: 600, // 10 minutos
    path: '/',
  })

  const url = getAuthorizationUrl({
    clientId: cfg.mp.oauth.clientId,
    redirectUri: cfg.mp.oauth.redirectUri,
    state,
  })

  return NextResponse.redirect(url)
}
