import { NextResponse } from 'next/server'
import { getFeePolicy } from '@/lib/payments/fees'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Política de taxas operacionais para o checkout no navegador.
 *
 * O valor cobrado é decidido no servidor; esta rota existe para que a tela
 * mostre exatamente a mesma conta ANTES de o comprador confirmar — um total na
 * tela diferente do total cobrado é a receita de chargeback.
 *
 * Nada aqui é sigiloso: é o acréscimo que o próprio comprador vê somado ao
 * preço. Sem rate limit de propósito — o checkout já não carrega sem esta
 * resposta, e derrubar a rota por um soluço no Mongo derrubaria a venda junto.
 */
export async function GET() {
  try {
    const policy = getFeePolicy()
    return NextResponse.json(
      { policy },
      { headers: { 'Cache-Control': 'public, max-age=300' } }
    )
  } catch (err: any) {
    return NextResponse.json({ policy: null, error: err?.message }, { status: 500 })
  }
}
