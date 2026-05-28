
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { hashPassword, createToken, setAuthCookie } from '@/lib/auth'
import { verifyRecaptcha } from '@/lib/recaptcha'
import { User } from '@/lib/types'
import { ADMIN_EMAILS } from '@/lib/constants'
import { sendWelcomeEmail, sendVerificationEmail } from '@/lib/mail'
import crypto from 'crypto'
import { secureApiEndpoint } from '@/lib/api-security'
import { normalizePeriodo, getCurrentSemesterRef } from '@/lib/user-periodo'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Rate limit para registro (endpoint sensivel)
    const security = await secureApiEndpoint(request, {
      rateLimit: 'AUTH',
      auth: { requireAuth: false }
    })

    if (!security.success || security.errorResponse) {
      return security.errorResponse
    }

    const body = await request.json()
    const { email, password, name, dateOfBirth, isAfyaMedicineStudent, afyaUnit, periodo, role = 'user', recaptchaToken } = body

    if (!email || !password || !name || !dateOfBirth) {
      return NextResponse.json(
        { error: 'Email, senha, nome e data de nascimento são obrigatórios' },
        { status: 400 }
      )
    }

    // Usar score mais alto para registro (acao de alto risco)
    const recaptchaResult = await verifyRecaptcha(recaptchaToken, 'HIGH_RISK', 'register')
    if (!recaptchaResult.success) {
      return NextResponse.json(
        { error: recaptchaResult.error || 'Falha na verificação do reCAPTCHA' },
        { status: 400 }
      )
    }

    if (isAfyaMedicineStudent && !afyaUnit) {
      return NextResponse.json(
        { error: 'Unidade é obrigatória para estudantes de Ciências Médicas' },
        { status: 400 }
      )
    }

    if (role === 'admin' && !ADMIN_EMAILS.includes(email.toLowerCase().trim())) {
      return NextResponse.json(
        { error: 'Você não tem permissão para criar conta de administrador' },
        { status: 403 }
      )
    }

    const db = await getDb()

    // Verificar se o cadastro está bloqueado
    const settings = await db.collection('landing_settings').findOne({})
    if (settings?.registrationBlocked && role !== 'admin') {
      return NextResponse.json(
        {
          error: 'blocked',
          message: settings.registrationBlockedMessage || 'Cadastro temporariamente desativado'
        },
        { status: 403 }
      )
    }

    const usersCollection = db.collection<User>('users')

    // Verifica se o email já existe
    const existingUserByEmail = await usersCollection.findOne({ email })
    if (existingUserByEmail) {
      return NextResponse.json(
        { error: 'Email já cadastrado' },
        { status: 400 }
      )
    }



    // Gerar token de verificação
    const verificationToken = crypto.randomBytes(32).toString('hex')

    // Período é opcional no cadastro. Quando informado, guardamos o período-base
    // e o semestre-âncora atual para permitir o avanço automático por semestre.
    const periodoBase = normalizePeriodo(periodo)

    // Cria o usuário
    const hashedPassword = await hashPassword(password)
    const newUser: User = {
      email,
      password: hashedPassword,
      name,
      dateOfBirth: new Date(dateOfBirth),
      isAfyaMedicineStudent: isAfyaMedicineStudent || false,
      afyaUnit: isAfyaMedicineStudent ? afyaUnit : undefined,
      role: role as 'admin' | 'user',
      createdAt: new Date(),
      lastLoginAt: new Date(),
      emailVerified: false,
      verificationToken,
      ...(periodoBase !== null
        ? { periodoBase, periodoBaseRef: getCurrentSemesterRef() }
        : {}),
    }

    const result = await usersCollection.insertOne(newUser)

    // Cria o token de sessão (ainda permite login, mas verificação pode ser checada no frontend)
    const token = await createToken({
      userId: result.insertedId.toString(),
      email,
      name,
      role: newUser.role,
      emailVerified: false // Adicionado ao payload
    })

    // Define o cookie
    await setAuthCookie(token)

    // Enviar emails em paralelo. IMPORTANTE: aguardar o envio — em runtime
    // serverless (Vercel) uma Promise não-aguardada é congelada assim que a
    // resposta é retornada, então o fire-and-forget fazia o e-mail de
    // verificação muitas vezes nunca sair. Falha no envio não bloqueia o
    // cadastro (apenas registramos o erro).
    const emailResults = await Promise.allSettled([
      sendWelcomeEmail(email, name),
      sendVerificationEmail(email, verificationToken, name)
    ])
    emailResults.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`Erro ao enviar email ${index === 0 ? 'boas-vindas' : 'verificação'}:`, result.reason)
      }
    })

    return NextResponse.json({
      success: true,
      user: {
        id: result.insertedId.toString(),
        email,
        name,
        role: newUser.role,
        emailVerified: false
      },
    })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json(
      { error: 'Erro ao criar usuário' },
      { status: 500 }
    )
  }
}
