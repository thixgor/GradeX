import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getDb } from '@/lib/mongodb'
import { secureApiEndpoint, validateObjectId } from '@/lib/api-security'
import { logAdminSecurityEvent } from '@/lib/admin-audit'
import { parseDeviceName } from '@/lib/sessions'
import {
  deliverTransactionalEmails,
  sendAdminTemporaryPasswordEmail,
  sendPasswordChangedEmail,
} from '@/lib/mail'
import {
  enviarLinkDeRedefinicao,
  gerarSenhaAleatoria,
  gravarNovaSenha,
  VALIDADE_DO_LINK_MIN,
} from '@/lib/redefinicao-de-senha'
import type { User } from '@/lib/types'

export const dynamic = 'force-dynamic'

/**
 * Admin redefine o acesso de um usuário (/admin/users).
 *
 *  - `modo: 'aleatoria'` → gera uma senha provisória, grava e devolve UMA vez
 *    para o admin mandar à pessoa pelo canal que já usam (WhatsApp, Instagram).
 *    Opcionalmente também vai por e-mail. Os aparelhos conectados saem.
 *  - `modo: 'link'` → manda o link de "Esqueci minha senha" para o e-mail da
 *    conta, sem mexer na senha atual.
 *
 * Senha de outro administrador não se redefine por aqui: seria o atalho para
 * um admin assumir a conta de outro sem deixar rastro na conta dele. Cada um
 * troca a sua pelo perfil.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const security = await secureApiEndpoint(request, {
      rateLimit: 'ADMIN',
      auth: { requireAuth: true, allowedRoles: ['admin'] },
    })
    if (!security.success || security.errorResponse) return security.errorResponse
    const session = security.session!

    const { userId } = await params
    const idCheck = validateObjectId(userId)
    if (!idCheck.valid) return NextResponse.json({ error: idCheck.error }, { status: 400 })

    const body = await request.json().catch(() => ({}))
    const modo = body?.modo === 'link' ? 'link' : body?.modo === 'aleatoria' ? 'aleatoria' : null
    if (!modo) return NextResponse.json({ error: 'Modo inválido' }, { status: 400 })
    const enviarPorEmail = body?.enviarPorEmail === true

    const db = await getDb()
    const user = await db.collection<User>('users').findOne(
      { _id: new ObjectId(userId) },
      { projection: { email: 1, name: 1, role: 1, resetPasswordTokens: 1, resetPasswordRequestedAt: 1 } }
    )
    if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

    if (userId === session.userId) {
      return NextResponse.json(
        { error: 'Para trocar a sua senha, use Perfil → Configurações → Senha.' },
        { status: 400 }
      )
    }
    if (user.role === 'admin') {
      return NextResponse.json(
        { error: 'Não é permitido redefinir a senha de outro administrador.' },
        { status: 403 }
      )
    }

    const auditoria = {
      userId: session.userId,
      userName: session.name,
      userEmail: session.email,
      ip: security.ip,
      deviceName: parseDeviceName(request.headers.get('user-agent')),
    }

    if (modo === 'link') {
      const envio = await enviarLinkDeRedefinicao(db, user, { origem: 'admin' })
      if (envio.status === 'aguarde') {
        return NextResponse.json(
          { error: `Um link acabou de ser enviado para ${user.email}. Aguarde ${envio.segundos}s para enviar outro.` },
          { status: 429 }
        )
      }
      if (envio.status === 'falhou') {
        return NextResponse.json(
          { error: `O servidor de e-mail recusou o envio: ${envio.erro}. Gere uma senha provisória e mande pelo WhatsApp.` },
          { status: 502 }
        )
      }
      await logAdminSecurityEvent({
        ...auditoria,
        type: 'user_password_link_sent',
        meta: { targetUserId: userId, targetEmail: user.email },
      })
      return NextResponse.json({ success: true, modo, email: user.email, validadeMin: VALIDADE_DO_LINK_MIN })
    }

    const senha = gerarSenhaAleatoria()
    const { sessoesEncerradas } = await gravarNovaSenha(db, userId, senha, { por: 'admin' })

    let emailEnviado = false
    let emailErro: string | undefined
    if (enviarPorEmail) {
      try {
        await sendAdminTemporaryPasswordEmail({ email: user.email, nome: user.name, senha })
        emailEnviado = true
      } catch (err: any) {
        emailErro = String(err?.message || err)
      }
    } else {
      // Sem a senha no e-mail, a pessoa ao menos fica sabendo que a troca
      // aconteceu — e, se não foi ela quem pediu, tem por onde reclamar.
      await deliverTransactionalEmails([
        sendPasswordChangedEmail({ email: user.email, nome: user.name, por: 'admin' }),
      ])
    }

    await logAdminSecurityEvent({
      ...auditoria,
      type: 'user_password_reset',
      meta: { targetUserId: userId, targetEmail: user.email, enviarPorEmail, emailEnviado, sessoesEncerradas },
    })

    return NextResponse.json(
      {
        success: true,
        modo,
        senha,
        email: user.email,
        nome: user.name,
        sessoesEncerradas,
        emailEnviado,
        emailErro,
      },
      // A senha provisória não pode ficar em cache nenhum.
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (error) {
    console.error('[admin/users/password] falha ao redefinir senha:', error)
    return NextResponse.json({ error: 'Erro ao redefinir a senha' }, { status: 500 })
  }
}
