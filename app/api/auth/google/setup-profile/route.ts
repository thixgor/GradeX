import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { createToken, setAuthCookie, generateSessionId } from '@/lib/auth'
import { recordLoginSession } from '@/lib/sessions'
import { User } from '@/lib/types'
import { normalizePeriodo, getCurrentSemesterRef } from '@/lib/user-periodo'
import { isValidStateUf } from '@/lib/brazil-states'
import { isValidBrazilPhone } from '@/lib/phone'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      email, profileName, dateOfBirth,
      profession, state, phone,
      specialty, residencySpecialty, residencyHospital, residencyYear,
      isAfyaMedicineStudent, afyaUnit, periodo,
      picture, googleId,
    } = body

    if (!email || !profileName || !dateOfBirth) {
      return NextResponse.json(
        { error: 'Email, nome do perfil e data de nascimento são obrigatórios' },
        { status: 400 }
      )
    }

    if (!['medico', 'academico', 'residente'].includes(profession)) {
      return NextResponse.json(
        { error: 'Selecione se você é médico, acadêmico ou residente' },
        { status: 400 }
      )
    }

    if (!isValidStateUf(state)) {
      return NextResponse.json(
        { error: 'Selecione um estado válido' },
        { status: 400 }
      )
    }

    if (!isValidBrazilPhone(phone)) {
      return NextResponse.json(
        { error: 'Informe um telefone válido com DDD' },
        { status: 400 }
      )
    }

    if (profession === 'medico' && !specialty) {
      return NextResponse.json(
        { error: 'Especialidade é obrigatória para médicos' },
        { status: 400 }
      )
    }

    if (profession === 'residente' && (!residencySpecialty || !residencyHospital || !residencyYear)) {
      return NextResponse.json(
        { error: 'Dados da residência são obrigatórios para residentes' },
        { status: 400 }
      )
    }

    if (profession === 'academico' && !afyaUnit) {
      return NextResponse.json(
        { error: 'Unidade é obrigatória para acadêmicos' },
        { status: 400 }
      )
    }

    const db = await getDb()
    const usersCollection = db.collection<User>('users')

    // Verifica se o email já existe
    const existingUserByEmail = await usersCollection.findOne({ email })
    if (existingUserByEmail) {
      return NextResponse.json(
        { error: 'Email já cadastrado' },
        { status: 400 }
      )
    }



    // Período é opcional. Quando informado, guardamos a âncora do semestre atual.
    const periodoBase = normalizePeriodo(periodo)

    // Cria o novo usuário
    const newUser: User = {
      email,
      name: profileName,
      password: '', // Usuário do Google não tem senha
      role: 'user',
      createdAt: new Date(),
      lastLoginAt: new Date(),
      dateOfBirth: new Date(dateOfBirth),
      profession,
      state,
      phone,
      specialty: profession === 'medico' ? specialty : undefined,
      residencySpecialty: profession === 'residente' ? residencySpecialty : undefined,
      residencyHospital: profession === 'residente' ? residencyHospital : undefined,
      residencyYear: profession === 'residente' ? residencyYear : undefined,
      isAfyaMedicineStudent: profession === 'academico',
      afyaUnit: profession === 'academico' ? afyaUnit : undefined,
      googleId,
      profilePicture: picture,
      ...(periodoBase !== null
        ? { periodoBase, periodoBaseRef: getCurrentSemesterRef() }
        : {}),
    }

    const result = await usersCollection.insertOne(newUser)

    // Cria o token vinculado a uma sessão de dispositivo (jti)
    const jti = generateSessionId()
    const token = await createToken({
      userId: result.insertedId.toString(),
      email,
      name: profileName,
      role: 'user',
      emailVerified: true, // Google accounts are auto-verified
      jti,
    })

    // Define o cookie
    await setAuthCookie(token)

    try {
      await recordLoginSession({ request, userId: result.insertedId.toString(), jti })
    } catch (sessErr) {
      console.error('Falha ao registrar sessão (Google setup):', sessErr)
    }

    return NextResponse.json({
      success: true,
      user: {
        id: result.insertedId.toString(),
        email,
        name: profileName,
        role: 'user',
      },
    })
  } catch (error) {
    console.error('Setup profile error:', error)
    return NextResponse.json(
      { error: 'Erro ao criar perfil' },
      { status: 500 }
    )
  }
}
