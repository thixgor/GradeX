import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { createToken, setAuthCookie, generateSessionId, normalizeEmail } from '@/lib/auth'
import { User } from '@/lib/types'
import { secureApiEndpoint } from '@/lib/api-security'
import { recordLoginSession } from '@/lib/sessions'
import {
  verifyLoginCode,
  requiresEmailLoginCode,
  LOGIN_CODE_MAX_ATTEMPTS,
} from '@/lib/login-code'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Rate limit rígido (endpoint sensível de 2FA)
    const security = await secureApiEndpoint(request, {
      rateLimit: 'AUTH',
      auth: { requireAuth: false },
    })
    if (!security.success || security.errorResponse) {
      return security.errorResponse
    }

    const body = await request.json()
    const email = typeof body.email === 'string' ? normalizeEmail(body.email) : ''
    const code = typeof body.code === 'string' ? body.code.trim() : ''

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email e código são obrigatórios' },
        { status: 400 }
      )
    }

    const db = await getDb()
    const usersCollection = db.collection<User>('users')
    const user = await usersCollection.findOne({ email })

    // Mensagem genérica para não revelar estado da conta
    const genericError = NextResponse.json(
      { error: 'Código inválido ou expirado. Solicite um novo login.' },
      { status: 401 }
    )

    if (!user || !requiresEmailLoginCode(user)) return genericError
    if (user.banned) {
      return NextResponse.json(
        {
          error: 'banned',
          banReason: user.banReason,
          banDetails: user.banDetails,
          bannedAt: user.bannedAt,
        },
        { status: 403 }
      )
    }

    // Sem código pendente ou expirado
    if (
      !user.loginCodeHash ||
      !user.loginCodeExpires ||
      new Date(user.loginCodeExpires).getTime() < Date.now()
    ) {
      return genericError
    }

    // Excesso de tentativas: invalida o código (precisa logar de novo)
    if ((user.loginCodeAttempts || 0) >= LOGIN_CODE_MAX_ATTEMPTS) {
      await usersCollection.updateOne(
        { _id: user._id },
        {
          $unset: {
            loginCodeHash: '',
            loginCodeExpires: '',
            loginCodeAttempts: '',
            loginCodeLastSentAt: '',
          },
        }
      )
      return NextResponse.json(
        { error: 'Muitas tentativas. Faça login novamente para receber um novo código.' },
        { status: 429 }
      )
    }

    // Código incorreto: conta a tentativa
    if (!verifyLoginCode(code, user.loginCodeHash)) {
      await usersCollection.updateOne(
        { _id: user._id },
        { $inc: { loginCodeAttempts: 1 } }
      )
      const remaining = LOGIN_CODE_MAX_ATTEMPTS - ((user.loginCodeAttempts || 0) + 1)
      return NextResponse.json(
        {
          error:
            remaining > 0
              ? `Código incorreto. ${remaining} tentativa(s) restante(s).`
              : 'Código incorreto.',
        },
        { status: 401 }
      )
    }

    // Sucesso: limpa o código e emite o token
    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: { lastLoginAt: new Date() },
        $unset: {
          loginCodeHash: '',
          loginCodeExpires: '',
          loginCodeAttempts: '',
          loginCodeLastSentAt: '',
        },
      }
    )

    const jti = generateSessionId()
    const token = await createToken({
      userId: user._id!.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      emailVerified: !!user.emailVerified,
      jti,
    })

    await setAuthCookie(token)

    try {
      await recordLoginSession({ request, userId: user._id!.toString(), jti })
    } catch (sessErr) {
      console.error('Falha ao registrar sessão de login (admin 2FA):', sessErr)
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id!.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
      },
    })
  } catch (error) {
    console.error('Verify login code error:', error)
    return NextResponse.json(
      { error: 'Erro ao verificar o código' },
      { status: 500 }
    )
  }
}
