import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { checkRateLimit } from '@/lib/rate-limit'
import { findAccountByEmail, isValidEmail, logSerialKeySecurity } from '@/lib/serial-keys'
import { emailDomainOf } from '@/lib/email-check'
import { checkEmailDomain } from '@/lib/email-domain-check'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * POST — o que o servidor sabe sobre o e-mail digitado numa compra SEM LOGIN
 * (/comprar e o carrinho de /materiais/checkout), perguntado logo depois que o
 * comprador informa nome, e-mail e telefone. Duas coisas, uma ida só:
 *
 *  1. Esse e-mail já tem conta no site?
 *  2. O domínio dele consegue receber e-mail?
 *
 * Quem compra sem entrar quase sempre já tem conta: digita o mesmo e-mail,
 * paga, recebe a Serial Key e só então descobre que precisaria ativá-la. Com a
 * conta identificada ANTES do pagamento, o checkout pergunta o que ele quer —
 * aplicar o material direto na conta ou receber a key no e-mail informado.
 *
 * A resposta é UM BOOLEANO e nada mais. Nem nome, nem telefone, nem plano, nem
 * id: existir conta com um e-mail não diz de quem ela é, e quem digitou o
 * endereço não provou nada sobre ele. Quem quiser saber a quem a conta pertence
 * passa por /api/serial-keys/account-verify, que cobra CPF e data de nascimento
 * antes de devolver o nome. O e-mail que volta aqui é o que a própria pessoa
 * acabou de digitar, normalizado.
 *
 * Enumeração de e-mails: um booleano sobre um endereço digitado pelo visitante
 * é o mesmo que qualquer tela de "esqueci minha senha" entrega. O rate limit
 * por IP mantém isso longe de uma varredura em massa, e cada estouro vira log
 * de segurança.
 *
 * A pergunta 2 existe por um prejuízo concreto: na compra sem login o e-mail é
 * o único endereço do que foi comprado. Quem digita um domínio que não existe
 * paga, não recebe nada, e o desfecho é sempre reembolso. O DNS responde isso
 * antes do pagamento — e nunca bloqueia sozinho, só avisa: `unknown` (timeout,
 * SERVFAIL) não pode custar uma venda de verdade.
 *
 * ATENÇÃO: esta rota NÃO decide nada. A escolha do comprador é revalidada no
 * checkout autoritativo (/api/serial-keys/checkout), que procura a conta de
 * novo pelo e-mail da compra — o client nunca manda o id da conta de destino.
 */
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const userAgent = request.headers.get('user-agent') || undefined

  const rl = await checkRateLimit(ip, 'serial_key_account_lookup', 12, 60_000)
  if (!rl.success) {
    await logSerialKeySecurity({ kind: 'rate_limited', ip, userAgent, detail: 'account_lookup' })
    return NextResponse.json({ error: 'Muitas tentativas. Tente novamente em instantes.' }, { status: 429 })
  }

  const body = await request.json().catch(() => null)
  const email = String((body as any)?.email ?? '').trim().toLowerCase()
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: 'Informe um e-mail válido.' }, { status: 400 })
  }

  // As duas perguntas são independentes: uma consulta ao Mongo e uma ao DNS,
  // lado a lado, para a tela não esperar a soma das duas.
  const domainStatus = checkEmailDomain(emailDomainOf(email))

  try {
    const db = await getDb()
    const [account, emailDomain] = await Promise.all([findAccountByEmail(db, email), domainStatus])
    return NextResponse.json({ email, exists: !!account, emailDomain })
  } catch (err) {
    console.error('[serial-keys/account-lookup] falha ao consultar conta:', err)
    // Falha aqui não pode travar a compra: a tela segue no caminho da Serial Key.
    return NextResponse.json({
      email,
      exists: false,
      unavailable: true,
      emailDomain: await domainStatus.catch(() => 'unknown' as const),
    })
  }
}
