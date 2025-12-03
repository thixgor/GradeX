import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { createToken, setAuthCookie } from '@/lib/auth'
import { User } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, profileName, cpf, dateOfBirth, isAfyaMedicineStudent, afyaUnit, picture, googleId } = body

    if (!email || !profileName || !cpf || !dateOfBirth) {
      return NextResponse.json(
        { error: 'Email, nome do perfil, CPF e data de nascimento são obrigatórios' },
        { status: 400 }
      )
    }

    if (isAfyaMedicineStudent && !afyaUnit) {
      return NextResponse.json(
        { error: 'Unidade Afya é obrigatória para estudantes de Medicina da Afya' },
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

    // Verifica se o CPF já existe
    const existingUserByCPF = await usersCollection.findOne({ cpf })
    if (existingUserByCPF) {
      return NextResponse.json(
        { error: 'CPF já cadastrado' },
        { status: 400 }
      )
    }

    // Cria o novo usuário
    const newUser: User = {
      email,
      name: profileName,
      password: '', // Usuário do Google não tem senha
      role: 'user',
      createdAt: new Date(),
      cpf,
      dateOfBirth: new Date(dateOfBirth),
      isAfyaMedicineStudent: isAfyaMedicineStudent || false,
      afyaUnit: isAfyaMedicineStudent ? afyaUnit : undefined,
      googleId,
      profilePicture: picture,
    }

    const result = await usersCollection.insertOne(newUser)

    // Cria o token
    const token = await createToken({
      userId: result.insertedId.toString(),
      email,
      name: profileName,
      role: 'user',
    })

    // Define o cookie
    await setAuthCookie(token)

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
