import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getDb } from '@/lib/mongodb'
import { secureApiEndpoint, validateObjectId } from '@/lib/api-security'
import { listarEnviosPara } from '@/lib/registro-de-emails'
import type { User } from '@/lib/types'

export const dynamic = 'force-dynamic'

/**
 * Últimos e-mails que o site tentou mandar para um usuário — a resposta para
 * "o e-mail não chegou": saiu daqui? O servidor aceitou? Deu erro?
 */
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
    if (!idCheck.valid) return NextResponse.json({ error: idCheck.error }, { status: 400 })

    const db = await getDb()
    const user = await db.collection<User>('users').findOne(
      { _id: new ObjectId(userId) },
      { projection: { email: 1 } }
    )
    if (!user?.email) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

    const envios = await listarEnviosPara(user.email, 40)

    return NextResponse.json({
      email: user.email,
      envios,
      smtp: {
        configurado: !!(process.env.SMTP_USER && process.env.SMTP_PASS),
        reserva: !!process.env.SMTP_FALLBACK_HOST,
      },
    })
  } catch (error) {
    console.error('[admin/users/emails] falha ao listar envios:', error)
    return NextResponse.json({ error: 'Erro ao listar os e-mails' }, { status: 500 })
  }
}
