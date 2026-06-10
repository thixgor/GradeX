/**
 * Fluxo OAuth do Mercado Pago (modelo marketplace / split de pagamentos).
 *
 * A conta que PROCESSA os pagamentos (você) autoriza a APLICAÇÃO do sócio.
 * O Mercado Pago devolve um access token vinculado a esse marketplace — é com
 * ele que os pagamentos passam a ser criados, e o `application_fee` (a parte do
 * sócio) é creditado automaticamente na conta dona da aplicação.
 *
 * Docs: https://www.mercadopago.com.br/developers/pt/docs/security/oauth/introduction
 */

const AUTH_BASE_URL = 'https://auth.mercadopago.com.br/authorization'
const TOKEN_URL = 'https://api.mercadopago.com/oauth/token'

export interface MpOAuthTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  scope?: string
  /** ID numérico da conta que autorizou (o "collector_id"). */
  user_id: number
  refresh_token: string
  public_key?: string
  live_mode?: boolean
}

/**
 * Monta a URL para a qual o admin é redirecionado para autorizar a aplicação
 * do sócio. O `state` protege contra CSRF (deve ser validado no callback).
 */
export function getAuthorizationUrl(params: {
  clientId: string
  redirectUri: string
  state: string
}): string {
  const qs = new URLSearchParams({
    client_id: params.clientId,
    response_type: 'code',
    platform_id: 'mp',
    redirect_uri: params.redirectUri,
    state: params.state,
  })
  return `${AUTH_BASE_URL}?${qs.toString()}`
}

/** Troca o `code` recebido no callback por um access token de marketplace. */
export async function exchangeCodeForToken(params: {
  clientId: string
  clientSecret: string
  code: string
  redirectUri: string
}): Promise<MpOAuthTokenResponse> {
  return postToken({
    client_id: params.clientId,
    client_secret: params.clientSecret,
    grant_type: 'authorization_code',
    code: params.code,
    redirect_uri: params.redirectUri,
  })
}

/** Renova o access token usando o refresh token (tokens expiram em ~180 dias). */
export async function refreshAccessToken(params: {
  clientId: string
  clientSecret: string
  refreshToken: string
}): Promise<MpOAuthTokenResponse> {
  return postToken({
    client_id: params.clientId,
    client_secret: params.clientSecret,
    grant_type: 'refresh_token',
    refresh_token: params.refreshToken,
  })
}

async function postToken(body: Record<string, string>): Promise<MpOAuthTokenResponse> {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  })

  const text = await res.text()
  let data: any
  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    data = { raw: text }
  }

  if (!res.ok || !data?.access_token) {
    const msg = data?.message || data?.error || text || `HTTP ${res.status}`
    throw new Error(`Falha no OAuth do Mercado Pago: ${msg}`)
  }

  return data as MpOAuthTokenResponse
}
