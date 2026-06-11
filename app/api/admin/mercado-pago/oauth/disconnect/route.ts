import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { clearMarketplaceConnection } from '@/lib/payments/mercado-pago/marketplace-store'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Desconecta o marketplace: remove o token salvo. A camada de pagamento volta
 * a usar o MERCADOPAGO_ACCESS_TOKEN do ambiente (sem split).
 */
export async function POST() {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  try {
    await clearMarketplaceConnection()
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 500 })
  }
}
