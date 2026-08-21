import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { getDb } from './mongodb'
import { User } from './types'
import { ObjectId } from 'mongodb'

// Configuracoes de segurança da sessao
const JWT_CONFIG = {
  // Duracao do token de acesso (7 dias em prod e dev)
  ACCESS_TOKEN_EXPIRY: process.env.NODE_ENV === 'production' ? '7d' : '7d',
  // Duracao maxima do cookie
  COOKIE_MAX_AGE: process.env.NODE_ENV === 'production' ? 60 * 60 * 24 * 7 : 60 * 60 * 24 * 7, // 7d em prod e dev
  // 'lax' em vez de 'strict': no PWA instalado na tela de início do iPhone
  // (display: standalone), o WebKit trata o app como um container de
  // armazenamento à parte do Safari normal e é notoriamente inconsistente em
  // preservar cookies 'strict' nessa navegação "de fora" — resultado: o app
  // pedia login toda vez que era reaberto. 'lax' ainda bloqueia o cookie em
  // POST/requisição de outro site (a proteção que importa contra CSRF); só
  // passa a valer também na navegação de topo normal, que é o caso do ícone.
  SAME_SITE: 'lax' as 'strict' | 'lax' | 'none'
}

// CRÍTICO: Verificar JWT_SECRET em produção
const DEFAULT_SECRET = 'your-secret-key-change-this'
const jwtSecretValue = process.env.JWT_SECRET || DEFAULT_SECRET

// Em produção, FALHA se JWT_SECRET não estiver configurado corretamente
if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === DEFAULT_SECRET) {
    console.error('='.repeat(60))
    console.error('ERRO CRÍTICO DE SEGURANÇA!')
    console.error('JWT_SECRET não está configurado corretamente em produção!')
    console.error('Configure a variável de ambiente JWT_SECRET antes de executar.')
    console.error('='.repeat(60))
    // Em produção, isso vai causar erro na inicialização, forçando a configuração
    throw new Error('JWT_SECRET must be configured in production environment')
  }

  // Verificar se o secret é forte o suficiente (mínimo 32 caracteres)
  if (process.env.JWT_SECRET.length < 32) {
    console.error('AVISO DE SEGURANÇA: JWT_SECRET deve ter no mínimo 32 caracteres!')
  }
}

const secret = new TextEncoder().encode(jwtSecretValue)

export interface TokenPayload {
  userId: string
  email: string
  name: string
  role: 'admin' | 'user'
  emailVerified: boolean
  // Token ID para invalidacao (opcional)
  jti?: string
  [key: string]: any
}

// Fator de custo do bcrypt. 10 é o padrão recomendado e ainda seguro,
// custando ~4x menos CPU que 12 por hash/compare — relevante porque login,
// registro e reset de senha rodam em funções serverless (Fluid Active CPU).
// Ajustável por env sem novo deploy.
const BCRYPT_ROUNDS = (() => {
  const value = Number(process.env.BCRYPT_ROUNDS)
  if (!Number.isInteger(value) || value < 8 || value > 14) return 10
  return value
})()

// E-mail é o identificador de conta, então precisa de uma forma canônica
// única: sem isso, "Nome@gmail.com" e "nome@gmail.com" viram duas contas
// (o cadastro/login comparava a string exata digitada, sem normalizar).
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function generateSessionId(): string {
  return crypto.randomUUID()
}

export async function createToken(payload: TokenPayload): Promise<string> {
  // Usa o jti fornecido (para vincular a uma sessão de dispositivo) ou gera um.
  const tokenId = payload.jti || crypto.randomUUID()

  return new SignJWT({ ...payload, jti: tokenId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_CONFIG.ACCESS_TOKEN_EXPIRY)
    .sign(secret)
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as TokenPayload
  } catch {
    return null
  }
}

// ============================================================
// Session cache — evita um findOne no Mongo a CADA request.
// Antes desta cache, getSession() era chamado em quase todas
// as rotas (auth/me, bootstrap, notifications, materiais,
// exams, etc.) e cada chamada custava ~10-20ms de CPU ativa
// somente para checar `banned`. Em ~3.000 invocations/dia isso
// representava a fatia mais cara do Fluid Active CPU.
//
// TTL curto (60s) garante que ban/email-verify se propagam em
// até 1min — aceitável vs. o custo. Logout/ban explícito chama
// invalidateSessionCache(userId) para efeito imediato.
// ============================================================

type CachedSessionEntry = {
  payload: TokenPayload | null   // null = usuário inexistente/banido (negative cache)
  expiresAt: number
}

const SESSION_CACHE_TTL_MS = 60 * 1000  // 60 segundos
const sessionCache = new Map<string, CachedSessionEntry>()

// Limpeza periódica para não vazar memória em runtime longo
let lastSweep = 0
function sweepSessionCache() {
  const now = Date.now()
  if (now - lastSweep < 60_000) return
  lastSweep = now
  for (const [key, entry] of sessionCache) {
    if (entry.expiresAt < now) sessionCache.delete(key)
  }
}

export function invalidateSessionCache(userId?: string): void {
  if (userId) {
    // Invalida todas as entradas desse usuário (uma por token)
    for (const key of sessionCache.keys()) {
      if (key.startsWith(userId + ':')) sessionCache.delete(key)
    }
  } else {
    sessionCache.clear()
  }
}

export async function getSession(): Promise<TokenPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')

  if (!token) {
    // Local UI testing without login (see lib/dev-auth.ts + DEV_BYPASS_AUTH)
    if (process.env.NODE_ENV !== 'production' && process.env.DEV_BYPASS_AUTH === 'true') {
      const { getDevMockSession } = await import('./dev-auth')
      return getDevMockSession()
    }
    return null
  }

  const payload = await verifyToken(token.value)
  if (!payload) {
    if (process.env.NODE_ENV !== 'production' && process.env.DEV_BYPASS_AUTH === 'true') {
      const { getDevMockSession } = await import('./dev-auth')
      return getDevMockSession()
    }
    return null
  }

  // Cache key vincula payload+token para evitar reuso após troca de conta
  // no mesmo browser, e usa só os últimos chars do token para limitar
  // tamanho do Map.
  const cacheKey = `${payload.userId}:${token.value.slice(-24)}`
  const now = Date.now()
  sweepSessionCache()

  const cached = sessionCache.get(cacheKey)
  if (cached && cached.expiresAt > now) {
    if (!cached.payload) {
      // Negative cache: usuário foi banido/deletado recentemente
      await removeAuthCookie()
      return null
    }
    return cached.payload
  }

  // Verificar se o usuário está banido no banco de dados (cache miss)
  try {
    const db = await getDb()
    const usersCollection = db.collection<User>('users')
    const user = await usersCollection.findOne(
      { _id: new ObjectId(payload.userId) },
      { projection: { banned: 1, emailVerified: 1 } } // projection reduz I/O
    )

    if (!user || user.banned) {
      sessionCache.set(cacheKey, { payload: null, expiresAt: now + SESSION_CACHE_TTL_MS })
      await removeAuthCookie()
      return null
    }

    // Validação de sessão de dispositivo: se este token (jti) corresponde a uma
    // sessão revogada (pelo admin ou pelo limite de dispositivos), desloga.
    // Import dinâmico evita dependência circular com lib/sessions.
    if (payload.jti) {
      const { getSessionState, touchSession } = await import('./sessions')
      const state = await getSessionState(payload.jti)
      if (state === 'revoked') {
        sessionCache.set(cacheKey, { payload: null, expiresAt: now + SESSION_CACHE_TTL_MS })
        await removeAuthCookie()
        return null
      }
      if (state === 'active') {
        // Atualiza atividade. Graças à cache de 60s, roda no máx. 1x/min por token.
        touchSession(payload.jti).catch(() => {})
      }
      // 'untracked' = login legado (anterior à feature): segue válido sem enforce.
    }

    const fresh: TokenPayload = {
      ...payload,
      emailVerified: !!user.emailVerified,
    }
    sessionCache.set(cacheKey, { payload: fresh, expiresAt: now + SESSION_CACHE_TTL_MS })
    return fresh
  } catch (error) {
    console.error('Error checking user ban status:', error)
    // Em caso de erro de DB, devolve payload do JWT sem cachear
    // (fail-safe: usuário não fica deslogado por intermitência)
    return payload
  }
}

export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: JWT_CONFIG.SAME_SITE,
    maxAge: JWT_CONFIG.COOKIE_MAX_AGE,
    path: '/',
  })
}

export async function removeAuthCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete('auth-token')
}
