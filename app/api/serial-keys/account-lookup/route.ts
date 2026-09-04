import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { checkRateLimit } from '@/lib/rate-limit'
import { findAccountByEmail, firstNameOf, isValidEmail, logSerialKeySecurity } from '@/lib/serial-keys'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * POST — "este e-mail já tem conta no site?", perguntado pelas telas de compra
 * SEM LOGIN (/comprar e o carrinho de /materiais/checkout) logo depois que o
 * comprador informa nome, e-mail e telefone.
 *
 * Quem compra sem entrar quase sempre já tem conta: digita o mesmo e-mail,
 * paga, recebe a Serial Key e só então descobre que precisaria ativá-la. Com a
 * conta identificada ANTES do pagamento, o checkout pergunta o que ele quer —
 * aplicar o material direto na conta ou receber a key no e-mail informado.
 *
 * A resposta é a mínima possível: existe ou não, mais o primeiro nome (para o
 * aviso soar como "é você mesmo"). Nada de sobrenome, telefone, plano ou id.
 * O e-mail devolvido é o que a pessoa acabou de digitar, normalizado.
 *
 * Enumeração de e-mails: a resposta é um booleano sobre um endereço que o
 * próprio visitante digitou, então o risco é o de qualquer tela de "esqueci
 * minha senha". O rate limit por IP (20/min) mantém isso longe de uma varredura
 * em massa, e cada estouro vira log de segurança.
 *
 * ATENÇÃO: esta rota NÃO decide nada. A escolha do comprador é revalidada no
 * checkout autoritativo (/api/serial-keys/checkout), que procura a conta de
 * novo pelo e-mail da compra — o client nunca manda o id da conta de destino.
 */
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const userAgent = request.headers.get('user-agent') || undefined

  const rl = await checkRateLimit(ip, 'serial_key_account_lookup', 20, 60_000)
  if (!rl.success) {
    await logSerialKeySecurity({ kind: 'rate_limited', ip, userAgent, detail: 'account_lookup' })
    return NextResponse.json({ error: 'Muitas tentativas. Tente novamente em instantes.' }, { status: 429 })
  }

  const body = await request.json().catch(() => null)
  const email = String((body as any)?.email ?? '').trim().toLowerCase()
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: 'Informe um e-mail válido.' }, { status: 400 })
  }

  try {
    const db = await getDb()
    const account = await findAccountByEmail(db, email)
    return NextResponse.json({
      email,
      exists: !!account,
      firstName: account ? firstNameOf(account.name) : undefined,
    })
  } catch (err) {
    console.error('[serial-keys/account-lookup] falha ao consultar conta:', err)
    // Falha aqui não pode travar a compra: a tela segue no caminho da Serial Key.
    return NextResponse.json({ email, exists: false, unavailable: true })
  }
}
