import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { audit } from '@/lib/payments/audit'
import { verificarPedidoNoMercadoPago } from '@/lib/payments/verificacao'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * "Verificar no Mercado Pago" de um pedido (Analytics → Pedidos).
 *
 * Confere o pagamento no MP e aplica o que ele disser — sem forçar aprovação
 * (para isso continua existindo o "Aprovar manualmente"). Também termina a
 * liberação que tenha parado no meio. Ver lib/payments/verificacao.ts.
 */
export async function POST(_request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }
  if (!id || !ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'orderId inválido' }, { status: 400 })
  }

  const db = await getDb()
  const relatorio = await verificarPedidoNoMercadoPago(db, id)
  if (!relatorio) return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })

  await audit({
    action: 'order_checked_manually',
    actorUserId: session.userId,
    resourceType: 'payment_order',
    resourceId: id,
    metadata: {
      antes: relatorio.antes.status,
      depois: relatorio.depois.status,
      encontradoPor: relatorio.encontradoPor,
      efeitos: relatorio.efeitos,
    },
  })

  return NextResponse.json(relatorio)
}
