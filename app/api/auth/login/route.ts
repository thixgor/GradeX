import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { verifyPassword, createToken, setAuthCookie, generateSessionId } from '@/lib/auth'
import { verifyRecaptcha } from '@/lib/recaptcha'
import { User } from '@/lib/types'
import { secureApiEndpoint } from '@/lib/api-security'
import { recordLoginSession } from '@/lib/sessions'
import {
  requiresEmailLoginCode,
  generateLoginCode,
  hashLoginCode,
  LOGIN_CODE_TTL_MS,
} from '@/lib/login-code'
import { sendLoginCodeEmail } from '@/lib/mail'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Rate limit para login (endpoint sensivel)
    const security = await secureApiEndpoint(request, {
      rateLimit: 'AUTH',
      auth: { requireAuth: false }
    })

    if (!security.success || security.errorResponse) {
      return security.errorResponse
    }

    const body = await request.json()
    const { email, password, recaptchaToken } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    // Usar score mais alto para login (acao de alto risco)
    const recaptchaResult = await verifyRecaptcha(recaptchaToken, 'HIGH_RISK', 'login')
    if (!recaptchaResult.success) {
      return NextResponse.json(
        { error: recaptchaResult.error || 'Falha na verificação do reCAPTCHA' },
        { status: 400 }
      )
    }

    const db = await getDb()
    const usersCollection = db.collection<User>('users')

    // Busca o usuário
    const user = await usersCollection.findOne({ email })
    if (!user) {
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      )
    }

    // Verifica a senha
    const isValid = await verifyPassword(password, user.password)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      )
    }

    // Verifica se o usuário está banido
    if (user.banned) {
      return NextResponse.json(
        {
          error: 'banned',
          banReason: user.banReason,
          banDetails: user.banDetails,
          bannedAt: user.bannedAt
        },
        { status: 403 }
      )
    }

    // 2FA por email para administradores: NÃO emite o token ainda. Gera um
    // código de 6 dígitos, envia ao email do admin e exige a verificação em
    // /api/auth/login/verify-code. Bloqueia acesso por força-bruta de senha.
    if (requiresEmailLoginCode(user)) {
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

      // Envio best-effort: não vaza se o email existe ou não (o usuário já foi
      // autenticado por senha aqui), mas registra falha de SMTP no log.
      try {
        await sendLoginCodeEmail(user.email, user.name, code)
      } catch (mailErr) {
        console.error('Falha ao enviar código de login admin:', mailErr)
        return NextResponse.json(
          { error: 'Não foi possível enviar o código de verificação. Tente novamente.' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        requiresEmailCode: true,
        email: user.email,
      })
    }

    // Atualiza último login
    await usersCollection.updateOne(
      { _id: user._id },
      { $set: { lastLoginAt: new Date() } }
    )

    // Cria o token vinculado a uma sessão de dispositivo (jti)
    const jti = generateSessionId()
    const token = await createToken({
      userId: user._id!.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      emailVerified: !!user.emailVerified,
      jti,
    })

    // Define o cookie
    await setAuthCookie(token)

    // Registra a sessão (dispositivo/IP) e aplica o limite de aparelhos
    try {
      await recordLoginSession({ request, userId: user._id!.toString(), jti })
    } catch (sessErr) {
      console.error('Falha ao registrar sessão de login:', sessErr)
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
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Erro ao fazer login' },
      { status: 500 }
    )
  }
}
