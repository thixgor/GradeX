import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getPaymentConfig } from '@/lib/payments'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** Testa conexão com a API do Mercado Pago: GET /users/me */
export async function POST() {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const cfg = getPaymentConfig()
  if (!cfg.mp.accessToken) {
    return NextResponse.json({ ok: false, error: 'ACCESS_TOKEN não configurado' }, { status: 400 })
  }

  try {
    const res = await fetch('https://api.mercadopago.com/users/me', {
      headers: { Authorization: `Bearer ${cfg.mp.accessToken}` },
    })
    if (!res.ok) {
      return NextResponse.json({ ok: false, status: res.status, error: await res.text() }, { status: 502 })
    }
    const data = await res.json()
    return NextResponse.json({
      ok: true,
      account: {
        id: data.id,
        nickname: data.nickname,
        siteId: data.site_id,
        countryId: data.country_id,
        email: data.email,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 502 })
  }
}
