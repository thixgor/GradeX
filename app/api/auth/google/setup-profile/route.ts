import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { createToken, setAuthCookie, generateSessionId } from '@/lib/auth'
import { recordLoginSession } from '@/lib/sessions'
import { User } from '@/lib/types'
import { verifyGoogleIdToken, GoogleAuthError } from '@/lib/google-auth'
import { sendWelcomeEmail } from '@/lib/mail'
import { recordCheckoutEvent, getRequestAnalyticsMeta } from '@/lib/analytics'

export const dynamic = 'force-dynamic'

/**
 * Cria a conta de quem entrou com o Google.
 *
 * Pede só o nome de exibição, igual ao cadastro por e-mail — os dados de perfil
 * (telefone, estado, profissão, faculdade/CRM, CPF) são coletados depois, dentro
 * do app, pelo `ProfileCompletionGate`, que é a fonte única desses campos. Antes
 * esta rota exigia data de nascimento, profissão, estado, telefone e mais — uma
 * lista que já não corresponde ao que a plataforma pede hoje.
 *
 * A identidade vem do ID token verificado, nunca do corpo do request: o e-mail
 * enviado pelo cliente não prova nada.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { idToken, profileName } = body

    let identity
    try {
      identity = await verifyGoogleIdToken(idToken)
    } catch (err) {
      if (err instanceof GoogleAuthError) {
        return NextResponse.json({ error: err.message }, { status: err.status })
      }
      throw err
    }

    const { email, googleId, picture } = identity
    const name = String(profileName ?? identity.name ?? '').trim().slice(0, 60)

    if (name.length < 2) {
      return NextResponse.json(
        { error: 'Digite como você quer ser chamado (mínimo 2 letras).' },
        { status: 400 }
      )
    }

    const db = await getDb()
    const usersCollection = db.collection<User>('users')

    // Duplo envio (clique duplo, retry de rede) ou conta que já existia: o token
    // prova que o e-mail é dele, então entramos em vez de devolver erro.
    const existingUser = await usersCollection.findOne({ email })
    if (existingUser) {
      if (existingUser.banned) {
        return NextResponse.json(
          {
            error: 'banned',
            banReason: existingUser.banReason,
            banDetails: existingUser.banDetails,
            bannedAt: existingUser.bannedAt,
          },
          { status: 403 }
        )
      }

      const patch: Record<string, unknown> = { lastLoginAt: new Date() }
      if (!existingUser.googleId) patch.googleId = googleId
      if (picture && !existingUser.profilePicture) patch.profilePicture = picture
      await usersCollection.updateOne({ _id: existingUser._id }, { $set: patch })

      const jti = generateSessionId()
      const token = await createToken({
        userId: existingUser._id!.toString(),
        email: existingUser.email,
        name: existingUser.name,
        role: existingUser.role,
        emailVerified: !!existingUser.emailVerified,
        jti,
      })
      await setAuthCookie(token)

      try {
        await recordLoginSession({ request, userId: existingUser._id!.toString(), jti })
      } catch (sessErr) {
        console.error('Falha ao registrar sessão (Google setup, conta existente):', sessErr)
      }

      return NextResponse.json({
        success: true,
        user: {
          id: existingUser._id!.toString(),
          email: existingUser.email,
          name: existingUser.name,
          role: existingUser.role,
        },
      })
    }

    // O cadastro pode estar desativado — a rota /api/auth/google já checa, mas
    // esta é chamável direto e não pode ser o caminho aberto.
    const settings = await db.collection('landing_settings').findOne({})
    if (settings?.registrationBlocked) {
      return NextResponse.json(
        {
          error: 'blocked',
          message: settings.registrationBlockedMessage || 'Cadastro temporariamente desativado',
        },
        { status: 403 }
      )
    }

    const newUser: User = {
      email,
      name,
      password: '', // Conta do Google não tem senha
      role: 'user',
      createdAt: new Date(),
      lastLoginAt: new Date(),
      // O Google já confirmou o e-mail: nada de pedir confirmação de novo.
      emailVerified: true,
      googleId,
      ...(picture ? { profilePicture: picture } : {}),
    }

    const result = await usersCollection.insertOne(newUser)
    const userId = result.insertedId.toString()

    const jti = generateSessionId()
    const token = await createToken({
      userId,
      email,
      name,
      role: 'user',
      emailVerified: true,
      jti,
    })
    await setAuthCookie(token)

    try {
      await recordLoginSession({ request, userId, jti })
    } catch (sessErr) {
      console.error('Falha ao registrar sessão (Google setup):', sessErr)
    }

    // Mesmo evento de topo de funil do cadastro por e-mail: sem isso, as contas
    // criadas pelo Google sumiam do funil de conversão em /admin/analytics.
    await recordCheckoutEvent({
      event: 'lead_signup',
      userId,
      userName: name,
      userEmail: email,
      productType: 'unknown',
      source: 'Cadastro com Google',
      metadata: { provider: 'google' },
      ...getRequestAnalyticsMeta(request),
    })

    // Best-effort: e-mail de boas-vindas não trava a criação da conta. (Não há
    // e-mail de verificação — a conta do Google já vem verificada.)
    sendWelcomeEmail(email, name).catch((mailErr) => {
      console.error('Erro ao enviar email de boas-vindas (Google):', mailErr)
    })

    return NextResponse.json({
      success: true,
      created: true,
      user: { id: userId, email, name, role: 'user' },
    })
  } catch (error) {
    console.error('Setup profile error:', error)
    return NextResponse.json(
      { error: 'Erro ao criar perfil' },
      { status: 500 }
    )
  }
}
