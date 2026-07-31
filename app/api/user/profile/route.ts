import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import crypto from 'crypto'
import { getDb } from '@/lib/mongodb'
import { getSession, verifyPassword, createToken, setAuthCookie, invalidateSessionCache } from '@/lib/auth'
import { sendVerificationEmail } from '@/lib/mail'
import { isValidStateUf } from '@/lib/brazil-states'
import { isValidBrazilPhone } from '@/lib/phone'
import { normalizePeriodo, getCurrentSemesterRef } from '@/lib/user-periodo'
import { maskCpf } from '@/lib/cpf'
import { isValidCrmNumber, onlyCrmDigits } from '@/lib/crm'
import { User } from '@/lib/types'

export const dynamic = 'force-dynamic'

const PROFILE_PROJECTION = {
  email: 1,
  name: 1,
  phone: 1,
  state: 1,
  profession: 1,
  specialty: 1,
  crm: 1,
  crmUf: 1,
  residencySpecialty: 1,
  residencyHospital: 1,
  residencyYear: 1,
  afyaUnit: 1,
  periodoBase: 1,
  periodoBaseRef: 1,
  emailVerified: 1,
  cpf: 1,
  cpfVerified: 1,
  fullName: 1,
  dateOfBirth: 1,
} as const

// Dados de perfil que o próprio usuário pode ver/editar em /profile.
export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const db = await getDb()
  const user = await db.collection<User>('users').findOne(
    { _id: new ObjectId(session.userId) },
    { projection: PROFILE_PROJECTION }
  )

  if (!user) {
    return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
  }

  return NextResponse.json({
    profile: {
      name: user.name || '',
      email: user.email || '',
      emailVerified: !!user.emailVerified,
      phone: user.phone || '',
      state: user.state || '',
      profession: user.profession || '',
      specialty: user.specialty || '',
      crm: user.crm || '',
      crmUf: user.crmUf || '',
      residencySpecialty: user.residencySpecialty || '',
      residencyHospital: user.residencyHospital || '',
      residencyYear: user.residencyYear || '',
      afyaUnit: user.afyaUnit || '',
      periodo: user.periodoBase ? String(user.periodoBase) : '',
      fullName: user.fullName || '',
      dateOfBirth: user.dateOfBirth
        ? new Date(user.dateOfBirth).toISOString().slice(0, 10)
        : '',
      // O CPF em si não volta para o cliente — só o que a tela precisa mostrar:
      // que existe e se a Receita confirmou.
      cpf: maskCpf(user.cpf),
      hasCpf: !!user.cpf,
      cpfVerified: !!user.cpfVerified,
    },
  })
}

// Atualiza os dados de perfil do próprio usuário. A troca de e-mail é
// tratada à parte (exige `currentPassword`) porque é sensível: reemite o
// token de sessão e derruba a verificação, exigindo nova confirmação.
export async function PUT(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corpo da requisição inválido' }, { status: 400 })
  }

  const {
    name, phone, state, profession,
    specialty, crm, crmUf, residencySpecialty, residencyHospital, residencyYear,
    afyaUnit, periodo,
    email, currentPassword,
  } = body

  const db = await getDb()
  const usersCollection = db.collection<User>('users')
  const currentUser = await usersCollection.findOne({ _id: new ObjectId(session.userId) })
  if (!currentUser) {
    return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
  }

  const setFields: Record<string, any> = {}
  const unsetFields: Record<string, ''> = {}

  const assign = (key: string, value: unknown) => {
    if (value === undefined) unsetFields[key] = ''
    else setFields[key] = value
  }

  if (typeof name === 'string' && name.trim()) {
    assign('name', name.trim())
  }

  if (phone !== undefined) {
    const trimmedPhone = typeof phone === 'string' ? phone.trim() : ''
    if (trimmedPhone && !isValidBrazilPhone(trimmedPhone)) {
      return NextResponse.json({ error: 'Informe um telefone válido com DDD' }, { status: 400 })
    }
    assign('phone', trimmedPhone || undefined)
  }

  if (state !== undefined) {
    if (state && !isValidStateUf(state)) {
      return NextResponse.json({ error: 'Selecione um estado válido' }, { status: 400 })
    }
    assign('state', state || undefined)
  }

  if (profession !== undefined && profession !== '' && !['medico', 'academico', 'residente'].includes(profession)) {
    return NextResponse.json({ error: 'Profissão inválida' }, { status: 400 })
  }

  // Se profissão ou algum campo específico mudou, recalcula o conjunto
  // completo de campos "específicos da profissão" a partir da profissão
  // final, descartando o que sobrou de uma profissão anterior (ex.: trocar
  // de médico pra acadêmico não deve deixar `specialty` órfão no banco).
  if (crm !== undefined && crm !== '' && !isValidCrmNumber(crm)) {
    return NextResponse.json({ error: 'O CRM deve ter entre 4 e 7 dígitos' }, { status: 400 })
  }

  if (crmUf !== undefined && crmUf !== '' && !isValidStateUf(crmUf)) {
    return NextResponse.json({ error: 'Selecione uma UF válida para o CRM' }, { status: 400 })
  }

  const touchesProfessionFields =
    profession !== undefined ||
    specialty !== undefined ||
    crm !== undefined ||
    crmUf !== undefined ||
    residencySpecialty !== undefined ||
    residencyHospital !== undefined ||
    residencyYear !== undefined ||
    afyaUnit !== undefined

  if (touchesProfessionFields) {
    const resolvedProfession = profession !== undefined ? (profession || undefined) : currentUser.profession
    assign('profession', resolvedProfession)

    // CRM só faz sentido para quem já tem registro: médico e residente.
    const holdsCrm = resolvedProfession === 'medico' || resolvedProfession === 'residente'
    const finalCrm = crm !== undefined ? onlyCrmDigits(crm) : currentUser.crm
    const finalCrmUf = crmUf !== undefined ? crmUf : currentUser.crmUf
    assign('crm', holdsCrm ? (finalCrm || undefined) : undefined)
    assign('crmUf', holdsCrm && finalCrm ? (finalCrmUf || undefined) : undefined)

    const finalSpecialty = specialty !== undefined ? specialty : currentUser.specialty
    const finalResidencySpecialty = residencySpecialty !== undefined ? residencySpecialty : currentUser.residencySpecialty
    const finalResidencyHospital = residencyHospital !== undefined ? residencyHospital : currentUser.residencyHospital
    const finalResidencyYear = residencyYear !== undefined ? residencyYear : currentUser.residencyYear
    const finalAfyaUnit = afyaUnit !== undefined ? afyaUnit : currentUser.afyaUnit

    assign('specialty', resolvedProfession === 'medico' ? (finalSpecialty || undefined) : undefined)
    assign('residencySpecialty', resolvedProfession === 'residente' ? (finalResidencySpecialty || undefined) : undefined)
    assign('residencyHospital', resolvedProfession === 'residente' ? (finalResidencyHospital || undefined) : undefined)
    assign('residencyYear', resolvedProfession === 'residente' ? (finalResidencyYear || undefined) : undefined)
    assign('afyaUnit', resolvedProfession === 'academico' ? (finalAfyaUnit || undefined) : undefined)
    assign('isAfyaMedicineStudent', resolvedProfession === 'academico')
  }

  if (periodo !== undefined) {
    if (periodo === '' || periodo === null) {
      assign('periodoBase', undefined)
      assign('periodoBaseRef', undefined)
    } else {
      const periodoBase = normalizePeriodo(periodo)
      if (periodoBase === null) {
        return NextResponse.json({ error: 'Período inválido' }, { status: 400 })
      }
      assign('periodoBase', periodoBase)
      assign('periodoBaseRef', getCurrentSemesterRef())
    }
  }

  let emailChanged = false
  let newEmail = ''
  if (typeof email === 'string' && email.trim()) {
    newEmail = email.trim().toLowerCase()
    if (newEmail !== currentUser.email.toLowerCase()) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'Informe sua senha atual para alterar o e-mail' }, { status: 400 })
      }
      const passwordOk = await verifyPassword(currentPassword, currentUser.password)
      if (!passwordOk) {
        return NextResponse.json({ error: 'Senha atual incorreta' }, { status: 401 })
      }
      const existing = await usersCollection.findOne({ email: newEmail })
      if (existing) {
        return NextResponse.json({ error: 'Este e-mail já está em uso' }, { status: 400 })
      }
      const verificationToken = crypto.randomBytes(32).toString('hex')
      assign('email', newEmail)
      assign('emailVerified', false)
      assign('verificationToken', verificationToken)
      emailChanged = true
    }
  }

  if (Object.keys(setFields).length === 0 && Object.keys(unsetFields).length === 0) {
    return NextResponse.json({ error: 'Nada para atualizar' }, { status: 400 })
  }

  await usersCollection.updateOne(
    { _id: new ObjectId(session.userId) },
    {
      ...(Object.keys(setFields).length ? { $set: setFields } : {}),
      ...(Object.keys(unsetFields).length ? { $unset: unsetFields } : {}),
    }
  )

  if (emailChanged) {
    sendVerificationEmail(newEmail, setFields.verificationToken, currentUser.name).catch((err) => {
      console.error('Falha ao enviar e-mail de verificação (troca de email):', err)
    })

    // Reemite o token/cookie com o novo e-mail pra manter a sessão coerente
    // (o payload do JWT carrega o e-mail). Mantém o mesmo jti — não é um
    // novo login, só uma atualização de sessão.
    const newToken = await createToken({
      userId: session.userId,
      email: newEmail,
      name: setFields.name || currentUser.name,
      role: currentUser.role,
      emailVerified: false,
      jti: session.jti,
    })
    await setAuthCookie(newToken)
    invalidateSessionCache(session.userId)
  }

  return NextResponse.json({ success: true, emailChangePending: emailChanged })
}
