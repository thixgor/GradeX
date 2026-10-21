import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getDb } from '@/lib/mongodb'
import { secureApiEndpoint } from '@/lib/api-security'
import { verifyPassword } from '@/lib/auth'
import { sendPasswordChangedEmail, deliverTransactionalEmails } from '@/lib/mail'
import { gravarNovaSenha, problemaNaSenha } from '@/lib/redefinicao-de-senha'
import type { User } from '@/lib/types'

export const dynamic = 'force-dynamic'

/**
 * Troca de senha pelo próprio perfil, sem precisar sair da conta.
 *
 * Antes o único caminho era deslogar e usar "Esqueci minha senha" — que
 * dependia de um e-mail chegar. Aqui basta a senha atual. Conta criada pelo
 * Google não tem senha: nesse caso a pessoa define a primeira sem informar uma
 * atual (a sessão já prova quem ela é).
 *
 * Os outros aparelhos são desconectados; este continua logado.
 */
export async function POST(request: NextRequest) {
  try {
    const security = await secureApiEndpoint(request, {
      // Teto baixo: é aqui que alguém com a sessão roubada tentaria adivinhar
      // a senha atual.
      rateLimit: { limit: 10, windowMs: 15 * 60 * 1000 },
      auth: { requireAuth: true },
    })
    if (!security.success || security.errorResponse) return security.errorResponse
    const session = security.session!

    const body = await request.json().catch(() => ({}))
    const senhaAtual = typeof body?.senhaAtual === 'string' ? body.senhaAtual : ''
    const novaSenha = body?.novaSenha

    const problema = problemaNaSenha(novaSenha)
    if (problema) return NextResponse.json({ error: problema }, { status: 400 })

    const db = await getDb()
    const user = await db.collection<User>('users').findOne(
      { _id: new ObjectId(session.userId) },
      { projection: { email: 1, name: 1, password: 1 } }
    )
    if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

    if (user.password) {
      if (!senhaAtual) {
        return NextResponse.json({ error: 'Informe sua senha atual' }, { status: 400 })
      }
      if (!(await verifyPassword(senhaAtual, user.password))) {
        return NextResponse.json({ error: 'Senha atual incorreta' }, { status: 401 })
      }
      if (await verifyPassword(novaSenha, user.password)) {
        return NextResponse.json({ error: 'A nova senha precisa ser diferente da atual' }, { status: 400 })
      }
    }

    const { sessoesEncerradas } = await gravarNovaSenha(db, user._id!, novaSenha, {
      por: 'user',
      manterSessaoJti: session.jti,
    })

    await deliverTransactionalEmails([
      sendPasswordChangedEmail({ email: user.email, nome: user.name, por: 'user' }),
    ])

    return NextResponse.json({
      success: true,
      criada: !user.password,
      sessoesEncerradas,
    })
  } catch (error) {
    console.error('[user/password] troca de senha falhou:', error)
    return NextResponse.json({ error: 'Erro ao trocar a senha' }, { status: 500 })
  }
}
