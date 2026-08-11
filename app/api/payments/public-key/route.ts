import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limit'
import { getPaymentConfig } from '@/lib/payments'
import { getEffectiveMpPublicKey } from '@/lib/payments/mercado-pago/marketplace-store'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Expõe apenas a Public Key (não-sensível) para o frontend.
 *
 * Devolve a chave da conta EFETIVA — a mesma aplicação cujo access token vai
 * cobrar o pagamento. Antes esta rota devolvia sempre a chave do ambiente,
 * enquanto a cobrança podia usar o token da conexão de marketplace: o cartão
 * era tokenizado por uma aplicação e cobrado por outra, e o Mercado Pago
 * recusava com "Invalid credentials". Pix e boleto não passam por tokenização,
 * então seguiam funcionando — o que fazia a falha parecer problema do cartão
 * do comprador.
 */
export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

  // O rate limit vive no Mongo. Uma intermitência no banco fazia esta rota
  // responder 500 e, com isso, derrubava o formulário de cartão em TODOS os
  // checkouts — um soluço no banco custava as vendas no cartão. Como o dado
  // aqui não é sigiloso (a chave já vai no JS de toda página de checkout),
  // seguir sem o limite é bem menos grave do que não vender.
  try {
    const rl = await checkRateLimit(ip, 'payments_public_key', 30, 60_000)
    if (!rl.success) {
      return NextResponse.json({ error: 'Muitas requisições.' }, { status: 429 })
    }
  } catch (err) {
    console.error('[payments/public-key] rate limit indisponível, seguindo sem ele:', err)
  }

  try {
    const cfg = getPaymentConfig()
    const effective = await getEffectiveMpPublicKey()
    return NextResponse.json(
      { publicKey: effective.publicKey, env: cfg.mp.env },
      {
        // Cache curto: a chave agora depende do estado da conexão de
        // marketplace, que o admin pode conectar/desconectar a qualquer
        // momento. 60s limita a janela de checkout quebrado após essa troca,
        // ainda evitando uma consulta por carregamento de página de checkout.
        headers: { 'Cache-Control': 'public, max-age=60' },
      }
    )
  } catch (err: any) {
    return NextResponse.json({ publicKey: '', error: err?.message }, { status: 500 })
  }
}
