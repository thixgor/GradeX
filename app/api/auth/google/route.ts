import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { createToken, setAuthCookie } from '@/lib/auth'
import { User } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { idToken } = body

    if (!idToken) {
      return NextResponse.json(
        { error: 'ID token é obrigatório' },
        { status: 400 }
      )
    }

    // Decodifica o token JWT do Google (sem verificar assinatura por enquanto)
    // Em produção, você deve verificar a assinatura do token
    const parts = idToken.split('.')
    if (parts.length !== 3) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 400 }
      )
    }

    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64').toString('utf-8')
    )

    const { email, name, picture, sub } = payload

    if (!email) {
      return NextResponse.json(
        { error: 'Email não encontrado no token' },
        { status: 400 }
      )
    }

    const db = await getDb()
    const usersCollection = db.collection<User>('users')

    // Verifica se o usuário já existe
    let user = await usersCollection.findOne({ email })

    if (user) {
      // Usuário já existe - faz login
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

      // Atualiza a foto de perfil se fornecida
      if (picture && !user.profilePicture) {
        await usersCollection.updateOne(
          { _id: user._id },
          { $set: { profilePicture: picture, googleId: sub } }
        )
      }
    } else {
      // Novo usuário - precisa definir o nome do perfil
      return NextResponse.json(
        {
          success: false,
          requiresProfileSetup: true,
          googleData: {
            email,
            name,
            picture,
            googleId: sub
          }
        },
        { status: 200 }
      )
    }

    // Cria o token
    const token = await createToken({
      userId: user._id!.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    })

    // Define o cookie
    await setAuthCookie(token)

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
    console.error('Google login error:', error)
    return NextResponse.json(
      { error: 'Erro ao fazer login com Google' },
      { status: 500 }
    )
  }
}
