import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { hashPassword, createToken, setAuthCookie } from '@/lib/auth'
import { User } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name, role = 'user' } = body

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      )
    }

    const db = await getDb()
    const usersCollection = db.collection<User>('users')

    // Verifica se o email já existe
    const existingUser = await usersCollection.findOne({ email })
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email já cadastrado' },
        { status: 400 }
      )
    }

    // Cria o usuário
    const hashedPassword = await hashPassword(password)
    const newUser: User = {
      email,
      password: hashedPassword,
      name,
      role: role as 'admin' | 'user',
      createdAt: new Date(),
    }

    const result = await usersCollection.insertOne(newUser)

    // Cria o token
    const token = await createToken({
      userId: result.insertedId.toString(),
      email,
      role: newUser.role,
    })

    // Define o cookie
    await setAuthCookie(token)

    return NextResponse.json({
      success: true,
      user: {
        id: result.insertedId.toString(),
        email,
        name,
        role: newUser.role,
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
