import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { getDb } from './mongodb'
import { User } from './types'
import { ObjectId } from 'mongodb'

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-this'
)

export interface TokenPayload {
  userId: string
  email: string
  name: string
  role: 'admin' | 'user'
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export async function createToken(payload: TokenPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
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

    return payload
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
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 dias
    path: '/',
  })
}

export async function removeAuthCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete('auth-token')
}
