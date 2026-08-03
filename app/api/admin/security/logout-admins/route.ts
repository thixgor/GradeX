import { NextRequest, NextResponse } from 'next/server'
import { secureApiEndpoint } from '@/lib/api-security'
import { revokeAllAdminSessions, getClientIp, parseDeviceName } from '@/lib/sessions'
import { logAdminSecurityEvent } from '@/lib/admin-audit'
import { ADMIN_GATE_COOKIE, adminGateCookieOptions } from '@/lib/admin-gate'

export const dynamic = 'force-dynamic'

/**
 * POST — derruba as sessões de todos os administradores.
 *
 * Body: { keepCurrentSession?: boolean }  (padrão: true)
 *
 * Com `keepCurrentSession: false` quem apertou o botão também cai, o que é o
 * comportamento certo quando a suspeita é sobre o próprio dispositivo.
 */
export async function POST(request: NextRequest) {
  try {
    const security = await secureApiEndpoint(request, {
      rateLimit: { limit: 5, windowMs: 10 * 60 * 1000 },
      auth: { requireAuth: true, allowedRoles: ['admin'] },
    })
    if (!security.success || security.errorResponse) return security.errorResponse

    const session = security.session!
    const body = await request.json().catch(() => ({}))
    const keepCurrentSession = body?.keepCurrentSession !== false

    const result = await revokeAllAdminSessions({
      exceptJti: keepCurrentSession ? session.jti : undefined,
    })

    const response = NextResponse.json({
      success: true,
      revoked: result.revoked,
      admins: result.admins,
      affectedUsers: result.affectedUsers,
      keptCurrentSession: keepCurrentSession,
    })

    // Sem "manter a sessão atual", o gate do próprio autor também morre — o
    // cookie ficaria amarrado a um jti já revogado.
    if (!keepCurrentSession) {
      response.cookies.set(ADMIN_GATE_COOKIE, '', adminGateCookieOptions(0))
      response.cookies.delete('auth-token')
    }

    await logAdminSecurityEvent({
      type: 'admins_logged_out',
      userId: session.userId,
      userName: session.name,
      userEmail: session.email,
      ip: getClientIp(request),
      deviceName: parseDeviceName(request.headers.get('user-agent')),
      meta: {
        revoked: result.revoked,
        admins: result.admins,
        affectedUsers: result.affectedUsers,
        keptCurrentSession: keepCurrentSession,
      },
    })

    return response
  } catch (error) {
    console.error('Logout all admins error:', error)
    return NextResponse.json(
      { error: 'Erro ao desconectar administradores' },
      { status: 500 }
    )
  }
}
