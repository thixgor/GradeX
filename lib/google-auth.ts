import { createRemoteJWKSet, jwtVerify } from 'jose'

/**
 * Verificação do ID token do Google Identity Services.
 *
 * Antes, as rotas de login/cadastro com Google só faziam `base64.decode` do
 * miolo do JWT e confiavam no que viesse — quem soubesse o endpoint podia
 * montar um token com qualquer e-mail e entrar como qualquer pessoa. Aqui a
 * assinatura é conferida contra as chaves públicas do Google e o `aud` contra
 * o client id da plataforma, que é o que amarra o token a este site.
 */

const GOOGLE_ISSUERS = ['https://accounts.google.com', 'accounts.google.com']
const GOOGLE_JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs'

// O JWKS é cacheado pelo próprio `createRemoteJWKSet` (respeita o cache-control
// do Google), então mantemos uma única instância por processo.
let jwks: ReturnType<typeof createRemoteJWKSet> | null = null

function getJwks() {
  if (!jwks) jwks = createRemoteJWKSet(new URL(GOOGLE_JWKS_URL))
  return jwks
}

export interface GoogleIdentity {
  email: string
  emailVerified: boolean
  name?: string
  picture?: string
  googleId: string
}

export class GoogleAuthError extends Error {
  status: number
  constructor(message: string, status = 401) {
    super(message)
    this.name = 'GoogleAuthError'
    this.status = status
  }
}

export async function verifyGoogleIdToken(idToken: unknown): Promise<GoogleIdentity> {
  if (!idToken || typeof idToken !== 'string') {
    throw new GoogleAuthError('Token do Google ausente ou inválido', 400)
  }

  const clientId =
    process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  if (!clientId) {
    // Falha fechada: sem client id não há como saber se o token é deste site.
    throw new GoogleAuthError('Login com Google não está configurado', 503)
  }

  let payload: Record<string, unknown>
  try {
    const verified = await jwtVerify(idToken, getJwks(), {
      issuer: GOOGLE_ISSUERS,
      audience: clientId,
    })
    payload = verified.payload as Record<string, unknown>
  } catch {
    throw new GoogleAuthError('Não foi possível validar sua conta Google. Tente novamente.')
  }

  const email = typeof payload.email === 'string' ? payload.email.toLowerCase().trim() : ''
  const googleId = typeof payload.sub === 'string' ? payload.sub : ''

  if (!email || !googleId) {
    throw new GoogleAuthError('A conta Google não retornou um e-mail válido.')
  }

  // Conta Google sem e-mail verificado não serve para identificar ninguém.
  if (payload.email_verified === false) {
    throw new GoogleAuthError('Verifique seu e-mail no Google antes de continuar.', 403)
  }

  return {
    email,
    emailVerified: payload.email_verified !== false,
    name: typeof payload.name === 'string' ? payload.name : undefined,
    picture: typeof payload.picture === 'string' ? payload.picture : undefined,
    googleId,
  }
}
