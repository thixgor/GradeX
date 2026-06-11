import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/auth'
import { getPaymentConfig } from '@/lib/payments'
import { exchangeCodeForToken } from '@/lib/payments/mercado-pago/oauth'
import { saveMarketplaceConnection } from '@/lib/payments/mercado-pago/marketplace-store'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const STATE_COOKIE = 'mp_oauth_state'
const SETTINGS_PATH = '/admin/settings'

function redirectToSettings(req: NextRequest, params: Record<string, string>) {
  const url = new URL(SETTINGS_PATH, req.nextUrl.origin)
  url.searchParams.set('tab', 'pagamentos')
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  return NextResponse.redirect(url)
}

/**
 * Callback do OAuth de marketplace. O Mercado Pago redireciona para cá com
 * `code` e `state`. Validamos o state, trocamos o code por um access token e
 * salvamos a conexão no banco. A partir daí o split passa a valer.
 */
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const cookieStore = await cookies()
  const expectedState = cookieStore.get(STATE_COOKIE)?.value
  cookieStore.delete(STATE_COOKIE)

  const code = req.nextUrl.searchParams.get('code')
  const state = req.nextUrl.searchParams.get('state')
  const error = req.nextUrl.searchParams.get('error')

  if (error) {
    return redirectToSettings(req, { mp_oauth: 'error', reason: error })
  }
  if (!code) {
    return redirectToSettings(req, { mp_oauth: 'error', reason: 'sem_code' })
  }
  if (!expectedState || !state || state !== expectedState) {
    return redirectToSettings(req, { mp_oauth: 'error', reason: 'state_invalido' })
  }

  const cfg = getPaymentConfig()
  if (!cfg.mp.oauth.clientId || !cfg.mp.oauth.clientSecret) {
    return redirectToSettings(req, { mp_oauth: 'error', reason: 'credenciais_ausentes' })
  }

  try {
    const token = await exchangeCodeForToken({
      clientId: cfg.mp.oauth.clientId,
      clientSecret: cfg.mp.oauth.clientSecret,
      code,
      redirectUri: cfg.mp.oauth.redirectUri,
    })
    await saveMarketplaceConnection(token, session.userId)
    return redirectToSettings(req, { mp_oauth: 'connected' })
  } catch (err: any) {
    console.error('[payments] OAuth callback MP falhou:', err)
    return redirectToSettings(req, {
      mp_oauth: 'error',
      reason: String(err?.message || 'falha_troca_token').slice(0, 120),
    })
  }
}
