import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { createToken, setAuthCookie, generateSessionId } from '@/lib/auth'
import { recordLoginSession } from '@/lib/sessions'
import { User } from '@/lib/types'
import { verifyGoogleIdToken, GoogleAuthError } from '@/lib/google-auth'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { idToken } = body

    // Assinatura conferida contra as chaves do Google e `aud` contra o client id
    // deste site — sem isso, um JWT montado à mão logaria como qualquer usuário.
    let identity
    try {
      identity = await verifyGoogleIdToken(idToken)
    } catch (err) {
      if (err instanceof GoogleAuthError) {
        return NextResponse.json({ error: err.message }, { status: err.status })
      }
      throw err
    }

    const { email, name, picture, googleId: sub } = identity

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
      const updateData: any = { lastLoginAt: new Date() }
      if (picture && !user.profilePicture) {
        updateData.profilePicture = picture
        updateData.googleId = sub
      }
      await usersCollection.updateOne(
        { _id: user._id },
        { $set: updateData }
      )
    } else {
      // Novo usuário - verificar se cadastro está bloqueado
      const settings = await db.collection('landing_settings').findOne({})
      if (settings?.registrationBlocked) {
        return NextResponse.json(
          {
            error: 'blocked',
            message: settings.registrationBlockedMessage || 'Cadastro temporariamente desativado'
          },
          { status: 403 }
        )
      }

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

    try {
      await recordLoginSession({ request, userId: user._id!.toString(), jti })
    } catch (sessErr) {
      console.error('Falha ao registrar sessão (Google):', sessErr)
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
    console.error('Google login error:', error)
    return NextResponse.json(
      { error: 'Erro ao fazer login com Google' },
      { status: 500 }
    )
  }
}
