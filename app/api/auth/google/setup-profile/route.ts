import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { createToken, setAuthCookie, generateSessionId } from '@/lib/auth'
import { recordLoginSession } from '@/lib/sessions'
import { User } from '@/lib/types'
import { normalizePeriodo, getCurrentSemesterRef } from '@/lib/user-periodo'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, profileName, dateOfBirth, isAfyaMedicineStudent, afyaUnit, periodo, picture, googleId } = body

    if (!email || !profileName || !dateOfBirth) {
      return NextResponse.json(
        { error: 'Email, nome do perfil e data de nascimento são obrigatórios' },
        { status: 400 }
      )
    }

    if (isAfyaMedicineStudent && !afyaUnit) {
      return NextResponse.json(
        { error: 'Unidade é obrigatória para estudantes de Ciências Médicas' },
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
      isAfyaMedicineStudent: isAfyaMedicineStudent || false,
      afyaUnit: isAfyaMedicineStudent ? afyaUnit : undefined,
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
