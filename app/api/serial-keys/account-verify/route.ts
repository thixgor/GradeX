import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { checkRateLimit } from '@/lib/rate-limit'
import { isValidCpf, onlyCpfDigits } from '@/lib/cpf'
import {
  isValidEmail,
  logSerialKeySecurity,
  normalizeBirthDate,
  verifyAccountIdentity,
} from '@/lib/serial-keys'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * POST — "essa conta é minha mesmo?", na compra SEM LOGIN.
 *
 * O checkout já disse que existe conta com o e-mail digitado, e o comprador
 * está prestes a mandar o material para lá. Saber que a conta existe não diz de
 * QUEM ela é: quem quiser certeza informa CPF e data de nascimento e recebe de
 * volta o nome cadastrado.
 *
 * O nome é o ÚNICO dado que sai daqui, e só para quem provou conhecer os dois
 * campos. A conferência é opcional — não trava a compra de ninguém, inclusive
 * de quem tem conta sem CPF ou sem nascimento preenchidos.
 *
 * Contra abuso:
 *  - Resposta negativa uniforme (ver `verifyAccountIdentity`): sem conta, conta
 *    sem CPF, conta sem nascimento e dados errados devolvem exatamente a mesma
 *    coisa. Nada aqui conta ao visitante o que uma conta alheia tem cadastrado.
 *  - Dois limites, dois alvos: o e-mail (quem martela uma conta específica) e o
 *    IP (quem varre vários e-mails). Ambos consomem tentativa mesmo quando o
 *    e-mail não tem conta — senão a própria contagem viraria um oráculo.
 *  - CPF é conferido em tempo constante, e nunca volta na resposta.
 */
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const userAgent = request.headers.get('user-agent') || undefined

  const body = await request.json().catch(() => null)
  const email = String((body as any)?.email ?? '').trim().toLowerCase()
  const cpf = onlyCpfDigits(String((body as any)?.cpf ?? ''))
  const dateOfBirth = String((body as any)?.dateOfBirth ?? '')

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: 'Informe um e-mail válido.' }, { status: 400 })
  }

  // Os limites vêm ANTES de qualquer erro de preenchimento: sem isso, um CPF
  // malformado sairia de graça e daria tentativas ilimitadas para quem quisesse
  // medir o tempo de resposta da rota.
  const [porEmail, porIp] = await Promise.all([
    checkRateLimit(email, 'serial_key_account_verify_email', 5, 600_000),
    checkRateLimit(ip, 'serial_key_account_verify_ip', 10, 600_000),
  ])
  if (!porEmail.success || !porIp.success) {
    await logSerialKeySecurity({ kind: 'rate_limited', ip, userAgent, email, detail: 'account_verify' })
    return NextResponse.json(
      { error: 'Muitas tentativas de conferência. Tente novamente mais tarde.' },
      { status: 429 }
    )
  }

  // Erro de digitação do próprio visitante: dizer não revela nada da conta.
  if (!isValidCpf(cpf)) {
    return NextResponse.json({ error: 'CPF inválido. Confira os números digitados.' }, { status: 400 })
  }
  if (!normalizeBirthDate(dateOfBirth)) {
    return NextResponse.json({ error: 'Data de nascimento inválida.' }, { status: 400 })
  }

  try {
    const db = await getDb()
    const result = await verifyAccountIdentity(db, { email, cpf, dateOfBirth })
    if (!result.verified) {
      await logSerialKeySecurity({ kind: 'identity_check_failed', ip, userAgent, email, detail: 'account_verify' })
      return NextResponse.json({ verified: false })
    }
    return NextResponse.json({ verified: true, name: result.name })
  } catch (err) {
    console.error('[serial-keys/account-verify] falha ao conferir a conta:', err)
    // Conferência é um extra: falhando, a compra segue sem ela.
    return NextResponse.json({ verified: false, unavailable: true })
  }
}
