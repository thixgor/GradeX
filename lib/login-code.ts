import crypto from 'crypto'
import { User } from './types'

// 2FA por email para contas de administrador. Bloqueia força-bruta de senha:
// mesmo com a senha correta, o acesso só é concedido após digitar o código de
// 6 dígitos enviado ao email do admin.

export const LOGIN_CODE_TTL_MS = 10 * 60 * 1000 // 10 minutos
export const LOGIN_CODE_MAX_ATTEMPTS = 5
export const LOGIN_CODE_RESEND_COOLDOWN_MS = 60 * 1000 // 1 min entre reenvios

/** Define quais contas exigem o código por email no login. */
export function requiresEmailLoginCode(user: Pick<User, 'role'>): boolean {
  return user.role === 'admin'
}

/** Gera um código numérico de 6 dígitos sem viés. */
export function generateLoginCode(): string {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0')
}

/**
 * Hash do código (HMAC-SHA256 com o JWT_SECRET). Hash rápido é adequado: o
 * código nunca é exposto e o brute-force pela API é limitado por tentativas +
 * expiração. Não armazenamos o código em texto puro no banco.
 */
export function hashLoginCode(code: string): string {
  const secret = process.env.JWT_SECRET || 'your-secret-key-change-this'
  return crypto.createHmac('sha256', secret).update(code).digest('hex')
}

/** Comparação em tempo constante entre o código digitado e o hash armazenado. */
export function verifyLoginCode(code: string, storedHash?: string | null): boolean {
  if (!storedHash) return false
  const computed = hashLoginCode(code)
  const a = Buffer.from(computed)
  const b = Buffer.from(storedHash)
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}
