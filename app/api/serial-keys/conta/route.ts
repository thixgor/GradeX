import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getDb } from '@/lib/mongodb'
import {
  createToken,
  generateSessionId,
  getSession,
  hashPassword,
  normalizeEmail,
  setAuthCookie,
} from '@/lib/auth'
import { recordLoginSession } from '@/lib/sessions'
import { checkRateLimit } from '@/lib/rate-limit'
import { recordCheckoutEvent, getRequestAnalyticsMeta } from '@/lib/analytics'
import { sendWelcomeEmail, sendVerificationEmail, deliverTransactionalEmails } from '@/lib/mail'
import { SERIAL_KEYS_COLLECTION, logSerialKeySecurity, sanitizeName } from '@/lib/serial-keys'
import {
  ativarKeysNaConta,
  destinoDasKeys,
  emailDaCompraValido,
  keysAtivaveisPara,
  resolverCompraParaConta,
  validarSenhaNova,
} from '@/lib/conta-pos-compra'
import type { SerialKey, User } from '@/lib/types'
import { vincularIndicacaoNoCadastro } from '@/lib/embaixadores/servidor'
import { COOKIE_DO_EMBAIXADOR } from '@/lib/embaixadores/regras'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** Por quanto tempo um envio segura a compra contra um segundo envio igual. */
const TRAVA_MS = 60_000

/**
 * POST — leva a compra sem login para uma conta, já ativada.
 *
 * Dois modos, o mesmo segredo (ver `lib/conta-pos-compra.ts`):
 *
 *  - `acao: 'criar'` — a pessoa não tem conta. Cria a conta com o E-MAIL DA
 *    COMPRA (nunca um que venha do navegador), entra nela e ativa todas as
 *    keys do pedido. Sem reCAPTCHA: quem chega aqui pagou uma compra aprovada,
 *    o que nenhum robô faz — e o segredo só vale enquanto houver key por ativar.
 *  - `acao: 'vincular'` — a pessoa já entrou. Ativa as keys do pedido na conta
 *    da sessão, de uma vez (o carrinho deixava uma key por clique).
 *
 * A conta nasce como no cadastro comum: e-mail ainda não confirmado, com o
 * e-mail de confirmação e o de boas-vindas. O "cadastro bloqueado" do admin
 * não vale aqui de propósito: ele fecha a porta da conta grátis, e quem chega
 * por este caminho pagou — sem conta, não teria onde usar o que comprou.
 */
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const userAgent = request.headers.get('user-agent') || undefined

  const rl = await checkRateLimit(ip, 'serial_key_post_purchase_account', 10, 600_000)
  if (!rl.success) {
    await logSerialKeySecurity({ kind: 'rate_limited', ip, userAgent, detail: 'post_purchase_account' })
    return NextResponse.json({ error: 'Muitas tentativas. Aguarde alguns minutos.' }, { status: 429 })
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
  if (!body) return NextResponse.json({ error: 'Requisição inválida.' }, { status: 400 })
  const acao = body.acao === 'vincular' ? 'vincular' : 'criar'

  try {
    const db = await getDb()
    const resolucao = await resolverCompraParaConta(db, {
      orderId: body.orderId,
      receiptToken: body.receiptToken,
      activationToken: body.activationToken,
      key: body.key,
    })
    if (!resolucao.ok) {
      return NextResponse.json({ error: resolucao.error }, { status: resolucao.status })
    }
    const { compra } = resolucao

    if (acao === 'vincular') {
      const session = await getSession()
      if (!session) {
        return NextResponse.json({ error: 'Entre na sua conta para ativar.', requiresAuth: true }, { status: 401 })
      }
      const { ativaveis, restritas } = keysAtivaveisPara(compra.keys, session.email)
      if (ativaveis.length === 0) {
        return NextResponse.json(
          {
            error: restritas.length > 0
              ? `Esta compra só pode ser ativada na conta ${compra.buyerEmail}.`
              : 'Não há nada para ativar nesta compra — ela já foi ativada.',
          },
          { status: 409 }
        )
      }
      const conta = { userId: session.userId, name: session.name, email: session.email }
      const { ativadas, falharam } = await ativarKeysNaConta(db, ativaveis, conta)
      return NextResponse.json({
        ok: ativadas.length > 0,
        ativadas: ativadas.map((key) => key.productTitle || 'Produto'),
        falharam: falharam.map((key) => key.productTitle || 'Produto'),
        restritas: restritas.map((key) => key.productTitle || 'Produto'),
        redirectTo: destinoDasKeys(ativadas.length > 0 ? ativadas : ativaveis),
      })
    }

    // ── criar ────────────────────────────────────────────────────────────
    const email = normalizeEmail(compra.buyerEmail)
    if (!emailDaCompraValido(email)) {
      return NextResponse.json({ error: 'Esta compra não tem um e-mail válido. Fale com o suporte.' }, { status: 400 })
    }
    const name = sanitizeName(body.name || compra.buyerName)
    if (name.length < 2) {
      return NextResponse.json({ error: 'Informe seu nome.' }, { status: 400 })
    }
    const erroDeSenha = validarSenhaNova(body.password)
    if (erroDeSenha) return NextResponse.json({ error: erroDeSenha }, { status: 400 })

    const { ativaveis } = keysAtivaveisPara(compra.keys, email)
    if (ativaveis.length === 0) {
      return NextResponse.json({ error: 'Esta compra já foi ativada em uma conta.' }, { status: 409 })
    }

    const usersCollection = db.collection<User>('users')
    if (await usersCollection.findOne({ email }, { projection: { _id: 1 } })) {
      return NextResponse.json(
        { error: `Já existe uma conta com ${email}. Entre nela para ativar.`, contaExiste: true },
        { status: 409 }
      )
    }

    // Duplo clique (ou duas abas) não pode criar duas contas com o mesmo
    // e-mail: o índice de e-mail não é único. A primeira key da compra segura
    // a vez por um minuto.
    const keysCol = db.collection<SerialKey>(SERIAL_KEYS_COLLECTION)
    const agora = new Date()
    const trava = await keysCol.updateOne(
      {
        _id: new ObjectId(String(ativaveis[0]._id)) as any,
        $or: [
          { contaPosCompraEm: { $exists: false } },
          { contaPosCompraEm: { $lt: new Date(agora.getTime() - TRAVA_MS) } },
        ],
      } as any,
      { $set: { contaPosCompraEm: agora } } as any
    )
    if (trava.modifiedCount === 0) {
      return NextResponse.json({ error: 'Sua conta já está sendo criada. Aguarde alguns segundos.' }, { status: 409 })
    }

    const verificationToken = crypto.randomBytes(32).toString('hex')
    const newUser: User = {
      email,
      password: await hashPassword(String(body.password)),
      name,
      role: 'user',
      createdAt: agora,
      lastLoginAt: agora,
      emailVerified: false,
      verificationToken,
    }
    const inserted = await usersCollection.insertOne(newUser)
    const userId = inserted.insertedId.toString()
    await vincularIndicacaoNoCadastro(db, request.cookies.get(COOKIE_DO_EMBAIXADOR)?.value, { userId, nome: name, email })

    const jti = generateSessionId()
    const token = await createToken({ userId, email, name, role: 'user', emailVerified: false, jti })
    await setAuthCookie(token)

    const conta = { userId, name, email }
    const { ativadas, falharam } = await ativarKeysNaConta(db, ativaveis, conta)

    await Promise.all([
      recordLoginSession({ request, userId, jti }).catch((err) =>
        console.error('[serial-keys/conta] falha ao registrar sessão:', err)
      ),
      recordCheckoutEvent({
        event: 'lead_signup',
        userId,
        userName: name,
        userEmail: email,
        productType: 'unknown',
        source: 'Cadastro pós-compra',
        metadata: { ativadas: ativadas.length },
        ...getRequestAnalyticsMeta(request),
      }),
      // Esperados antes de responder: em serverless não existe "depois".
      deliverTransactionalEmails([
        sendWelcomeEmail(email, name).catch((err) => console.error('Erro ao enviar email boas-vindas:', err)),
        sendVerificationEmail(email, verificationToken, name).catch((err) =>
          console.error('Erro ao enviar email verificação:', err)
        ),
      ]),
    ])

    return NextResponse.json({
      ok: true,
      email,
      ativadas: ativadas.map((key) => key.productTitle || 'Produto'),
      falharam: falharam.map((key) => key.productTitle || 'Produto'),
      redirectTo: destinoDasKeys(ativadas.length > 0 ? ativadas : ativaveis),
    })
  } catch (err) {
    console.error('[serial-keys/conta] erro:', err)
    return NextResponse.json({ error: 'Não foi possível concluir agora. Tente novamente.' }, { status: 500 })
  }
}
