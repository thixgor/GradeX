import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { normalizeEmail } from '@/lib/auth'
import { User } from '@/lib/types'
import { secureApiEndpoint } from '@/lib/api-security'
import {
  requiresEmailLoginCode,
  generateLoginCode,
  hashLoginCode,
  LOGIN_CODE_TTL_MS,
  LOGIN_CODE_RESEND_COOLDOWN_MS,
} from '@/lib/login-code'
import { sendLoginCodeEmail } from '@/lib/mail'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const security = await secureApiEndpoint(request, {
      rateLimit: 'AUTH',
      auth: { requireAuth: false },
    })
    if (!security.success || security.errorResponse) {
      return security.errorResponse
    }

    const body = await request.json()
    const email = typeof body.email === 'string' ? normalizeEmail(body.email) : ''
    if (!email) {
      return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 })
    }

    const db = await getDb()
    const usersCollection = db.collection<User>('users')
    const user = await usersCollection.findOne({ email })

    // Resposta genérica: só reenvia se houver um fluxo de código pendente.
    // Não revela se a conta existe ou é admin.
    const ok = NextResponse.json({ success: true })

    if (!user || !requiresEmailLoginCode(user) || user.banned) return ok

    // Só reenvia se já existe um código pendente (login iniciado) — evita usar
    // este endpoint como gerador avulso de códigos.
    if (!user.loginCodeExpires) return ok

    // Cooldown entre reenvios
    if (
      user.loginCodeLastSentAt &&
      Date.now() - new Date(user.loginCodeLastSentAt).getTime() <
        LOGIN_CODE_RESEND_COOLDOWN_MS
    ) {
      return NextResponse.json(
        { error: 'Aguarde um momento antes de pedir outro código.' },
        { status: 429 }
      )
    }

    const code = generateLoginCode()
    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          loginCodeHash: hashLoginCode(code),
          loginCodeExpires: new Date(Date.now() + LOGIN_CODE_TTL_MS),
          loginCodeAttempts: 0,
          loginCodeLastSentAt: new Date(),
        },
      }
    )

    try {
      await sendLoginCodeEmail(user.email, user.name, code)
    } catch (mailErr) {
      console.error('Falha ao reenviar código de login admin:', mailErr)
      return NextResponse.json(
        { error: 'Não foi possível reenviar o código. Tente novamente.' },
        { status: 500 }
      )
    }

    return ok
  } catch (error) {
    console.error('Resend login code error:', error)
    return NextResponse.json({ error: 'Erro ao reenviar o código' }, { status: 500 })
  }
}
