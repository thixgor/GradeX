import { NextRequest, NextResponse } from 'next/server'
import { secureApiEndpoint, validateObjectId } from '@/lib/api-security'
import {
  listUserSessions,
  countActiveSessions,
  revokeSessionById,
  revokeAllUserSessions,
} from '@/lib/sessions'

export const dynamic = 'force-dynamic'

// GET - Lista os dispositivos/sessões de um usuário (admin)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const security = await secureApiEndpoint(request, {
      rateLimit: 'ADMIN',
      auth: { requireAuth: true, allowedRoles: ['admin'] },
    })
    if (!security.success || security.errorResponse) return security.errorResponse

    const { userId } = await params
    const idCheck = validateObjectId(userId)
    if (!idCheck.valid) {
      return NextResponse.json({ error: idCheck.error }, { status: 400 })
    }

    const [sessions, activeCount] = await Promise.all([
      listUserSessions(userId),
      countActiveSessions(userId),
    ])

    return NextResponse.json({ sessions, activeCount })
  } catch (error) {
    console.error('Get user sessions error:', error)
    return NextResponse.json({ error: 'Erro ao buscar sessões' }, { status: 500 })
  }
}

// DELETE - Revoga uma sessão específica (?sessionId=) ou todas (?all=true)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const security = await secureApiEndpoint(request, {
      rateLimit: 'ADMIN',
      auth: { requireAuth: true, allowedRoles: ['admin'] },
    })
    if (!security.success || security.errorResponse) return security.errorResponse

    const { userId } = await params
    const idCheck = validateObjectId(userId)
    if (!idCheck.valid) {
      return NextResponse.json({ error: idCheck.error }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const all = searchParams.get('all') === 'true'
    const sessionId = searchParams.get('sessionId')

    if (all) {
      const revoked = await revokeAllUserSessions(userId, { revokedBy: 'admin' })
      return NextResponse.json({ success: true, revoked })
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Informe sessionId ou all=true' },
        { status: 400 }
      )
    }

    const ok = await revokeSessionById(userId, sessionId, 'admin')
    if (!ok) {
      return NextResponse.json(
        { error: 'Sessão não encontrada ou já revogada' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Revoke user session error:', error)
    return NextResponse.json({ error: 'Erro ao revogar sessão' }, { status: 500 })
  }
}
