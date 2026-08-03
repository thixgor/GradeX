import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/auth'
import { checkRateLimitSync } from '@/lib/api-security'
import { logAdminSecurityEvent } from '@/lib/admin-audit'
import { getClientIp, parseDeviceName } from '@/lib/sessions'
import {
  ADMIN_GATE_COOKIE,
  adminGateCookieOptions,
  getAdminGateIdleSeconds,
  isAdminSecurityCodeValid,
  issueAdminGateToken,
  verifyAdminGateToken,
} from '@/lib/admin-gate'

export const dynamic = 'force-dynamic'

// Esta rota é a única de /api/admin isenta do gate (senão não haveria como
// destravá-lo). Por isso ela repete a checagem de admin por conta própria e
// aplica um rate limit próprio, bem mais apertado que o ADMIN padrão.
const UNLOCK_RATE_LIMIT = { limit: 6, windowMs: 10 * 60 * 1000 }

async function requireAdmin() {
  const session = await getSession()
  if (!session || session.role !== 'admin') return null
  return session
}

function deviceFrom(request: NextRequest) {
  const userAgent = request.headers.get('user-agent')
  return { ip: getClientIp(request), deviceName: parseDeviceName(userAgent) }
}

// GET — estado atual da trava (usado pelo painel para mostrar quanto falta).
export async function GET(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const cookieStore = await cookies()
  const gate = await verifyAdminGateToken(cookieStore.get(ADMIN_GATE_COOKIE)?.value, {
    userId: session.userId,
    sessionJti: session.jti || '',
  })

  if (!gate.valid) {
    return NextResponse.json({ unlocked: false, reason: gate.reason })
  }

  const nowSeconds = Math.floor(Date.now() / 1000)
  return NextResponse.json({
    unlocked: true,
    expiresInSeconds: Math.max(0, (gate.payload.exp || 0) - nowSeconds),
    absoluteExpiresInSeconds: Math.max(0, gate.payload.abs - nowSeconds),
    idleWindowSeconds: getAdminGateIdleSeconds(),
  })
}

// POST — destrava o painel com o código de segurança.
export async function POST(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const { ip, deviceName } = deviceFrom(request)

  // Rate limit por IP + conta: nenhuma das duas dimensões sozinha segura um
  // ataque de força bruta contra 4 dígitos.
  const byIp = checkRateLimitSync(ip, 'admin-gate-unlock', UNLOCK_RATE_LIMIT)
  const byUser = checkRateLimitSync(session.userId, 'admin-gate-unlock', UNLOCK_RATE_LIMIT)
  if (!byIp.success || !byUser.success) {
    const retryAfterMs = Math.max(byIp.retryAfterMs || 0, byUser.retryAfterMs || 0)
    await logAdminSecurityEvent({
      type: 'gate_rate_limited',
      userId: session.userId,
      userName: session.name,
      userEmail: session.email,
      ip,
      deviceName,
    })
    return NextResponse.json(
      {
        error: 'Tentativas demais. Aguarde antes de tentar de novo.',
        retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
      },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) } }
    )
  }

  const body = await request.json().catch(() => ({}))

  if (!isAdminSecurityCodeValid(body?.code)) {
    await logAdminSecurityEvent({
      type: 'gate_failed',
      userId: session.userId,
      userName: session.name,
      userEmail: session.email,
      ip,
      deviceName,
    })
    return NextResponse.json(
      {
        error: 'Código incorreto.',
        attemptsRemaining: Math.min(byIp.remaining, byUser.remaining),
      },
      { status: 401 }
    )
  }

  const { token, expiresAt, absoluteExpiresAt } = await issueAdminGateToken({
    userId: session.userId,
    sessionJti: session.jti || '',
  })

  const response = NextResponse.json({
    success: true,
    expiresInSeconds: expiresAt - Math.floor(Date.now() / 1000),
    absoluteExpiresInSeconds: absoluteExpiresAt - Math.floor(Date.now() / 1000),
    idleWindowSeconds: getAdminGateIdleSeconds(),
  })
  response.cookies.set(
    ADMIN_GATE_COOKIE,
    token,
    adminGateCookieOptions(expiresAt - Math.floor(Date.now() / 1000))
  )

  await logAdminSecurityEvent({
    type: 'gate_unlocked',
    userId: session.userId,
    userName: session.name,
    userEmail: session.email,
    ip,
    deviceName,
  })

  return response
}

// DELETE — tranca o painel na hora, sem deslogar a conta do site.
export async function DELETE(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const { ip, deviceName } = deviceFrom(request)
  const response = NextResponse.json({ success: true })
  response.cookies.set(ADMIN_GATE_COOKIE, '', adminGateCookieOptions(0))

  await logAdminSecurityEvent({
    type: 'gate_locked',
    userId: session.userId,
    userName: session.name,
    userEmail: session.email,
    ip,
    deviceName,
  })

  return response
}
