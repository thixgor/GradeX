import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getDb } from '@/lib/mongodb'
import { secureApiEndpoint } from '@/lib/api-security'
import { enviarLinkDeRedefinicao, VALIDADE_DO_LINK_MIN } from '@/lib/redefinicao-de-senha'
import type { User } from '@/lib/types'

export const dynamic = 'force-dynamic'

/**
 * "Esqueci minha senha atual" de dentro do perfil: manda o link de redefinição
 * para o e-mail da conta sem obrigar a pessoa a sair.
 */
export async function POST(request: NextRequest) {
  try {
    const security = await secureApiEndpoint(request, {
      rateLimit: 'AUTH',
      auth: { requireAuth: true },
    })
    if (!security.success || security.errorResponse) return security.errorResponse
    const session = security.session!

    const db = await getDb()
    const user = await db.collection<User>('users').findOne(
      { _id: new ObjectId(session.userId) },
      { projection: { email: 1, name: 1, resetPasswordTokens: 1, resetPasswordRequestedAt: 1 } }
    )
    if (!user?.email) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

    const envio = await enviarLinkDeRedefinicao(db, user, { origem: 'perfil' })

    if (envio.status === 'falhou') {
      return NextResponse.json(
        { error: 'Não conseguimos enviar o e-mail agora. Tente novamente em alguns minutos.' },
        { status: 503 }
      )
    }
    if (envio.status === 'aguarde') {
      return NextResponse.json(
        {
          error: `Acabamos de enviar um link para ${user.email}. Aguarde ${envio.segundos}s para pedir outro.`,
          retryAfterSeconds: envio.segundos,
        },
        { status: 429 }
      )
    }

    return NextResponse.json({ success: true, email: user.email, validadeMin: VALIDADE_DO_LINK_MIN })
  } catch (error) {
    console.error('[user/password/link] envio do link falhou:', error)
    return NextResponse.json({ error: 'Erro ao enviar o link' }, { status: 500 })
  }
}
