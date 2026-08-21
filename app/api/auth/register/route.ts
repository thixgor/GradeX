
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { hashPassword, createToken, setAuthCookie, generateSessionId, normalizeEmail } from '@/lib/auth'
import { recordLoginSession } from '@/lib/sessions'
import { verifyRecaptcha } from '@/lib/recaptcha'
import { User } from '@/lib/types'
import { ADMIN_EMAILS } from '@/lib/constants'
import { sendWelcomeEmail, sendVerificationEmail } from '@/lib/mail'
import crypto from 'crypto'
import { secureApiEndpoint } from '@/lib/api-security'
import { recordCheckoutEvent, getRequestAnalyticsMeta } from '@/lib/analytics'
import { normalizePeriodo, getCurrentSemesterRef } from '@/lib/user-periodo'
import { isValidStateUf } from '@/lib/brazil-states'
import { isValidBrazilPhone } from '@/lib/phone'

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
    const {
      password, name, dateOfBirth,
      profession, state, phone,
      specialty, residencySpecialty, residencyHospital, residencyYear,
      isAfyaMedicineStudent, afyaUnit, periodo,
      role = 'user', recaptchaToken,
    } = body

    // Normaliza antes de qualquer uso: "Nome@gmail.com" e "nome@gmail.com"
    // precisam ser a mesma conta. Sem isso, quem digita o e-mail com
    // maiúscula (ex: autocomplete do teclado) passa pela checagem de
    // duplicidade abaixo e cria uma segunda conta com o mesmo e-mail.
    const email = typeof body.email === 'string' ? normalizeEmail(body.email) : body.email

    // Funil de baixa fricção: o cadastro grátis pede só o essencial (nome, email
    // e senha). Todo o resto — data de nascimento, profissão, estado, telefone,
    // especialidade/residência/unidade — é opcional aqui e coletado depois,
    // dentro do app (progressive profiling). Menos campos no topo do funil =
    // mais contas criadas. Os campos, quando enviados, ainda são validados e
    // gravados; quando ausentes, o cadastro segue normalmente.
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Nome, email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    // Validação leniente: só rejeita valores presentes E inválidos. Ausência é ok.
    if (profession && !['medico', 'academico', 'residente'].includes(profession)) {
      return NextResponse.json(
        { error: 'Profissão inválida' },
        { status: 400 }
      )
    }

    if (state && !isValidStateUf(state)) {
      return NextResponse.json(
        { error: 'Estado inválido' },
        { status: 400 }
      )
    }

    if (phone && !isValidBrazilPhone(phone)) {
      return NextResponse.json(
        { error: 'Telefone inválido' },
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

    if (role === 'admin' && !ADMIN_EMAILS.includes(email)) {
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

    // Cria o usuário. Só o essencial é garantido; os demais campos entram apenas
    // quando o cadastro os enviou (o perfil é completado depois, dentro do app).
    const hashedPassword = await hashPassword(password)
    const newUser: User = {
      email,
      password: hashedPassword,
      name,
      role: role as 'admin' | 'user',
      createdAt: new Date(),
      lastLoginAt: new Date(),
      emailVerified: false,
      verificationToken,
      ...(dateOfBirth ? { dateOfBirth: new Date(dateOfBirth) } : {}),
      ...(profession ? { profession } : {}),
      ...(state ? { state } : {}),
      ...(phone ? { phone } : {}),
      ...(profession === 'medico' && specialty ? { specialty } : {}),
      ...(profession === 'residente'
        ? { residencySpecialty, residencyHospital, residencyYear }
        : {}),
      ...(profession === 'academico'
        ? { isAfyaMedicineStudent: true, ...(afyaUnit ? { afyaUnit } : {}) }
        : {}),
      ...(periodoBase !== null
        ? { periodoBase, periodoBaseRef: getCurrentSemesterRef() }
        : {}),
    }

    const result = await usersCollection.insertOne(newUser)

    // Cria o token de sessão (ainda permite login, mas verificação pode ser checada no frontend)
    const jti = generateSessionId()
    const token = await createToken({
      userId: result.insertedId.toString(),
      email,
      name,
      role: newUser.role,
      emailVerified: false, // Adicionado ao payload
      jti,
    })

    // Define o cookie
    await setAuthCookie(token)

    try {
      await recordLoginSession({ request, userId: result.insertedId.toString(), jti })
    } catch (sessErr) {
      console.error('Falha ao registrar sessão (registro):', sessErr)
    }

    // Topo do funil: conta grátis criada (o "teste grátis" do anúncio). Alimenta
    // o funil de conversão em /admin/analytics (cadastro grátis → compra).
    // recordCheckoutEvent engole erros próprios, então não trava o registro.
    await recordCheckoutEvent({
      event: 'lead_signup',
      userId: result.insertedId.toString(),
      userName: name,
      userEmail: email,
      productType: 'unknown',
      source: 'Cadastro gratuito',
      metadata: { role: newUser.role, profession: (newUser as any).profession },
      ...getRequestAnalyticsMeta(request),
    })

    // Enviar emails em paralelo para não travar
    Promise.allSettled([
      sendWelcomeEmail(email, name),
      sendVerificationEmail(email, verificationToken, name)
    ]).then((results) => {
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Erro ao enviar email ${index === 0 ? 'boas-vindas' : 'verificação'}:`, result.reason)
        }
      })
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
