import { NextRequest, NextResponse } from 'next/server'
import { secureApiEndpoint } from '@/lib/api-security'
import { listAdminSecurityEvents } from '@/lib/admin-audit'

export const dynamic = 'force-dynamic'

// GET — últimos eventos de segurança do painel (desbloqueios, códigos errados,
// bloqueios manuais e logouts em massa).
export async function GET(request: NextRequest) {
  try {
    const security = await secureApiEndpoint(request, {
      rateLimit: 'ADMIN',
      auth: { requireAuth: true, allowedRoles: ['admin'] },
    })
    if (!security.success || security.errorResponse) return security.errorResponse

    const limit = Number(new URL(request.url).searchParams.get('limit')) || 20
    const events = await listAdminSecurityEvents(limit)

    return NextResponse.json({ events })
  } catch (error) {
    console.error('Admin security events error:', error)
    return NextResponse.json({ error: 'Erro ao buscar eventos' }, { status: 500 })
  }
}
