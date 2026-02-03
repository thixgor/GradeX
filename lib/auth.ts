import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { getDb } from './mongodb'
import { User } from './types'
import { ObjectId } from 'mongodb'

// Configuracoes de segurança da sessao
const JWT_CONFIG = {
  // Duracao do token de acesso (mais curto para maior segurança)
  ACCESS_TOKEN_EXPIRY: process.env.NODE_ENV === 'production' ? '24h' : '7d',
  // Duracao maxima do cookie
  COOKIE_MAX_AGE: process.env.NODE_ENV === 'production' ? 60 * 60 * 24 : 60 * 60 * 24 * 7, // 24h em prod, 7d em dev
  // SameSite mais restritivo em producao
  SAME_SITE: (process.env.NODE_ENV === 'production' ? 'strict' : 'lax') as 'strict' | 'lax' | 'none'
}

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-this'
)

// Verificar se JWT_SECRET esta configurado em producao
if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your-secret-key-change-this')) {
  console.error('SECURITY WARNING: JWT_SECRET nao esta configurado corretamente em producao!')
}

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

export async function hashPassword(password: string): Promise<string> {
  // Usar fator de custo maior para maior segurança
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export async function createToken(payload: TokenPayload): Promise<string> {
  // Gerar ID unico para o token (permite invalidacao futura)
  const tokenId = crypto.randomUUID()

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

export async function getSession(): Promise<TokenPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')

  if (!token) return null

  const payload = await verifyToken(token.value)
  if (!payload) return null

  // Verificar se o usuário está banido no banco de dados
  try {
    const db = await getDb()
    const usersCollection = db.collection<User>('users')
    const user = await usersCollection.findOne({ _id: new ObjectId(payload.userId) })

    // Se usuário não existe ou está banido, invalida a sessão
    if (!user || user.banned) {
      // Remove o cookie para forçar logout
      await removeAuthCookie()
      return null
    }

    return {
      ...payload,
      emailVerified: !!user.emailVerified
    }
  } catch (error) {
    console.error('Error checking user ban status:', error)
    // Em caso de erro, permite a sessão continuar (fail-safe)
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
