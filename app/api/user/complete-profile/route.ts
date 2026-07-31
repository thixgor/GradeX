import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getDb } from '@/lib/mongodb'
import { secureApiEndpoint } from '@/lib/api-security'
import { User } from '@/lib/types'
import { isValidStateUf } from '@/lib/brazil-states'
import { isValidBrazilPhone } from '@/lib/phone'
import { isValidCpf, onlyCpfDigits } from '@/lib/cpf'
import { isValidCrmNumber, onlyCrmDigits } from '@/lib/crm'
import { normalizePeriodo, getCurrentSemesterRef } from '@/lib/user-periodo'
import { verifyCpfWithReceita, isCpfVerificationRequired } from '@/lib/receita-cpf'

export const dynamic = 'force-dynamic'

/** Dias que o "Agora não" segura o modal antes de ele voltar a aparecer. */
const SNOOZE_DAYS = 3

/** Erro de campo: a UI destaca o input em vez de mostrar um alerta genérico. */
function fieldError(field: string, error: string, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ field, error, ...extra }, { status: 400 })
}

/**
 * Salva (parcialmente) os dados do modal de completar perfil.
 *
 * O modal é um passo a passo e grava a cada passo, não só no fim: se o usuário
 * fechar a aba no meio, o que ele já respondeu fica salvo. Por isso todo campo
 * aqui é opcional — valida-se apenas o que veio, e `finish: true` marca o
 * perfil como concluído.
 */
export async function POST(request: NextRequest) {
  const security = await secureApiEndpoint(request, {
    rateLimit: 'WRITE',
    auth: { requireAuth: true },
  })
  if (!security.success || security.errorResponse) {
    return security.errorResponse!
  }

  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corpo da requisição inválido' }, { status: 400 })
  }

  const {
    fullName, cpf, dateOfBirth,
    phone, state, profession,
    specialty, crm, crmUf,
    residencySpecialty, residencyHospital, residencyYear,
    afyaUnit, periodo,
    finish,
  } = body

  const userId = new ObjectId(security.session!.userId)
  const db = await getDb()
  const usersCollection = db.collection<User>('users')
  const currentUser = await usersCollection.findOne({ _id: userId })
  if (!currentUser) {
    return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
  }

  const set: Record<string, any> = {}

  if (phone) {
    if (!isValidBrazilPhone(phone)) {
      return fieldError('phone', 'Informe um telefone válido com DDD.')
    }
    set.phone = String(phone).trim()
  }

  if (state) {
    if (!isValidStateUf(state)) {
      return fieldError('state', 'Selecione um estado válido.')
    }
    set.state = state
  }

  if (profession) {
    if (!['medico', 'academico', 'residente'].includes(profession)) {
      return fieldError('profession', 'Selecione médico, acadêmico ou residente.')
    }
    set.profession = profession
    set.isAfyaMedicineStudent = profession === 'academico'
  }

  if (specialty) set.specialty = String(specialty).trim()
  if (residencySpecialty) set.residencySpecialty = String(residencySpecialty).trim()
  if (residencyHospital) set.residencyHospital = String(residencyHospital).trim()
  if (residencyYear) set.residencyYear = String(residencyYear).trim()
  if (afyaUnit) set.afyaUnit = String(afyaUnit).trim()

  if (crm) {
    if (!isValidCrmNumber(crm)) {
      return fieldError('crm', 'O CRM deve ter entre 4 e 7 dígitos.')
    }
    if (crmUf && !isValidStateUf(crmUf)) {
      return fieldError('crmUf', 'Selecione a UF do seu CRM.')
    }
    set.crm = onlyCrmDigits(crm)
    // Sem UF explícita, o CRM segue o estado do usuário — que é o caso da
    // esmagadora maioria (só quem migrou de estado tem CRM de outra UF).
    set.crmUf = crmUf || currentUser.crmUf || set.state || currentUser.state
  }

  if (periodo) {
    const periodoBase = normalizePeriodo(periodo)
    if (periodoBase === null) {
      return fieldError('periodo', 'Selecione um período entre 1 e 12.')
    }
    set.periodoBase = periodoBase
    set.periodoBaseRef = getCurrentSemesterRef()
  }

  if (fullName && String(fullName).trim()) {
    set.fullName = String(fullName).trim().replace(/\s+/g, ' ')
  }

  let birthDateIso = ''
  if (dateOfBirth) {
    const parsed = new Date(dateOfBirth)
    if (Number.isNaN(parsed.getTime())) {
      return fieldError('dateOfBirth', 'Data de nascimento inválida.')
    }
    const age = (Date.now() - parsed.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
    if (age < 15 || age > 110) {
      return fieldError('dateOfBirth', 'Confira a data de nascimento.')
    }
    set.dateOfBirth = parsed
    birthDateIso = parsed.toISOString().slice(0, 10)
  }

  // ── CPF ───────────────────────────────────────────────────────────────
  // Só entra em jogo quando o usuário envia o CPF. A ordem é: formato →
  // duplicidade → Receita Federal. A consulta externa fica por último porque
  // é a única que custa dinheiro e latência.
  let cpfVerification: Awaited<ReturnType<typeof verifyCpfWithReceita>> | null = null

  if (cpf) {
    const digits = onlyCpfDigits(cpf)
    if (!isValidCpf(digits)) {
      return fieldError('cpf', 'CPF inválido. Confira os números digitados.')
    }

    const duplicate = await usersCollection.findOne(
      { cpf: digits, _id: { $ne: userId } },
      { projection: { _id: 1 } }
    )
    if (duplicate) {
      return fieldError('cpf', 'Este CPF já está cadastrado em outra conta.')
    }

    // O nome de conferência sai do que o usuário já deu: o nome civil, se ele
    // tiver preenchido, senão o nome da conta. Só pedimos o nome completo de
    // novo quando esse não bate com o titular do CPF.
    const nameForCheck = set.fullName || currentUser.fullName || currentUser.name
    const birthForCheck = birthDateIso
      || (currentUser.dateOfBirth ? new Date(currentUser.dateOfBirth).toISOString().slice(0, 10) : '')

    cpfVerification = await verifyCpfWithReceita({
      cpf: digits,
      birthDate: birthForCheck || undefined,
      name: nameForCheck,
    })

    if (cpfVerification.status === 'name_mismatch') {
      // `needsFullName` faz a UI revelar o campo de nome completo em vez de só
      // mostrar um erro sem saída.
      return fieldError(
        'fullName',
        set.fullName
          ? 'Esse nome não corresponde ao titular do CPF.'
          : 'O nome da sua conta não bate com esse CPF. Digite seu nome completo, como está no CPF.',
        { needsFullName: true }
      )
    }

    if (
      cpfVerification.status === 'not_found' ||
      cpfVerification.status === 'birthdate_mismatch' ||
      cpfVerification.status === 'irregular'
    ) {
      return fieldError('cpf', cpfVerification.message || 'Não foi possível confirmar seu CPF.')
    }

    if (cpfVerification.status === 'unavailable' && isCpfVerificationRequired()) {
      return NextResponse.json(
        { error: cpfVerification.message || 'Serviço de verificação indisponível. Tente de novo.' },
        { status: 503 }
      )
    }

    set.cpf = digits
    set.cpfVerified = cpfVerification.verified
    if (cpfVerification.verified) {
      set.cpfVerifiedAt = new Date()
      // O nome devolvido pela Receita é o civil canônico — vale mais que o
      // digitado (abreviações, caixa, acentuação).
      if (cpfVerification.officialName) set.fullName = cpfVerification.officialName
    }
  }

  if (finish) {
    set.profileCompletedAt = new Date()
    set.profilePromptSnoozedUntil = null
  }

  if (Object.keys(set).length === 0) {
    return NextResponse.json({ success: true, saved: false })
  }

  await usersCollection.updateOne({ _id: userId }, { $set: set })

  return NextResponse.json({
    success: true,
    saved: true,
    cpfVerified: set.cpfVerified,
    // Quando a Receita confirma, devolvemos o nome oficial para a UI mostrar o
    // "confere?" — é o feedback que dá confiança de que o dado foi aceito.
    officialName: cpfVerification?.verified ? cpfVerification.officialName : undefined,
    cpfVerificationStatus: cpfVerification?.status,
  })
}

/**
 * "Agora não": adia o modal por alguns dias em vez de bloquear o usuário.
 * Cadastro de baixa fricção só funciona se o pedido de dados também for de
 * baixa fricção — quem é empurrado contra a parede abandona a conta.
 */
export async function PUT(request: NextRequest) {
  const security = await secureApiEndpoint(request, {
    rateLimit: 'WRITE',
    auth: { requireAuth: true },
  })
  if (!security.success || security.errorResponse) {
    return security.errorResponse!
  }

  const snoozedUntil = new Date(Date.now() + SNOOZE_DAYS * 24 * 60 * 60 * 1000)
  const db = await getDb()
  await db.collection<User>('users').updateOne(
    { _id: new ObjectId(security.session!.userId) },
    { $set: { profilePromptSnoozedUntil: snoozedUntil } }
  )

  return NextResponse.json({ success: true, snoozedUntil })
}
