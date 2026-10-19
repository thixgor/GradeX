import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { jsonComprimido } from '@/lib/resposta-comprimida'
import { montarRelatorioHistorico, type CompraLegada, type PedidoDoHistorico } from '@/lib/relatorio-vendas'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET — histórico completo de vendas para o PDF de /admin/analytics.
 *
 * Separado de `/api/admin/analytics` de propósito: aquela rota roda a cada
 * abertura do painel e se limita a 12 meses; esta lê TODO o histórico e só é
 * chamada quando o admin baixa o PDF. Devolve agregados (não a lista de
 * pedidos), então a resposta é pequena mesmo com o histórico crescendo.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const db = await getDb()
    const [pedidos, legado, materiais, pacotes, assinaturas, statusDosPedidos] = await Promise.all([
      db.collection('payment_orders')
        .find({ status: 'approved', type: { $ne: 'donation' } })
        .project({
          type: 1, refId: 1, amount: 1, baseAmount: 1, feeAmount: 1, paidInstallments: 1, paymentMethod: 1,
          payerEmail: 1, payerName: 1, userId: 1, paidAt: 1, createdAt: 1, updatedAt: 1,
          'metadata.itemType': 1, 'metadata.itemTitle': 1, 'metadata.accessVersionLabel': 1,
          'metadata.cartItems.itemType': 1, 'metadata.cartItems.itemId': 1, 'metadata.cartItems.itemTitle': 1,
          'metadata.cartItems.price': 1, 'metadata.cartItems.accessVersionLabel': 1,
          'metadata.serialKeyCart.grant': 1, 'metadata.serialKeyCart.amount': 1, 'metadata.serialKeyCart.productTitle': 1,
          'metadata.serialKeyPurchase': 1, 'metadata.shopOrderId': 1, 'metadata.buyerEmail': 1, 'metadata.buyerName': 1,
        })
        .toArray(),
      // Compras do Stripe, anteriores ao payment_orders. As novas têm providerOrderId.
      db.collection('material_purchases')
        .find({
          status: 'completed',
          source: { $ne: 'plus' },
          price: { $gt: 0 },
          $or: [{ providerOrderId: { $exists: false } }, { providerOrderId: null }, { providerOrderId: '' }],
        })
        .project({ itemType: 1, itemId: 1, itemTitle: 1, price: 1, userId: 1, userEmail: 1, userName: 1, purchasedAt: 1 })
        .toArray(),
      db.collection('materials').find({}).project({ title: 1 }).toArray(),
      db.collection('material_packages').find({}).project({ title: 1 }).toArray(),
      db.collection('subscriptions')
        .find({ status: 'authorized' })
        .project({ providerSubscriptionId: 1, amount: 1, lastPaymentAt: 1, createdAt: 1, userId: 1, planId: 1 })
        .toArray(),
      db.collection('payment_orders')
        .aggregate([
          { $match: { type: { $ne: 'donation' } } },
          { $group: { _id: '$status', pedidos: { $sum: 1 }, valor: { $sum: { $ifNull: ['$baseAmount', '$amount'] } } } },
        ])
        .toArray(),
    ])

    const idsFisicos = pedidos
      .map((p: any) => p.metadata?.shopOrderId)
      .filter((id: unknown) => id && ObjectId.isValid(String(id)))
    const idsDeUsuarios = assinaturas
      .map((s: any) => s.userId)
      .filter((id: unknown) => id && ObjectId.isValid(String(id)))
    const [fisicos, usuarios] = await Promise.all([
      idsFisicos.length
        ? db.collection('shop_orders')
            .find({ _id: { $in: idsFisicos.map((id: unknown) => new ObjectId(String(id))) } })
            .project({ total: 1 })
            .toArray()
        : Promise.resolve([]),
      idsDeUsuarios.length
        ? db.collection('users')
            .find({ _id: { $in: idsDeUsuarios.map((id: unknown) => new ObjectId(String(id))) } })
            .project({ name: 1, email: 1 })
            .toArray()
        : Promise.resolve([]),
    ])

    // Mesma regra do painel: a assinatura aprovada que não tem cobrança
    // registrada em payment_orders conta como uma venda.
    const cobradas = new Set(pedidos.filter((p: any) => p.type === 'subscription').map((p: any) => String(p.refId)))
    const usuarioPorId = new Map(usuarios.map((u: any) => [String(u._id), u]))
    const cobrancasDeAssinatura = assinaturas
      .filter((s: any) => !cobradas.has(String(s.providerSubscriptionId)))
      .map((s: any) => {
        const u = usuarioPorId.get(String(s.userId))
        return {
          valor: Number(s.amount) || 0,
          data: s.lastPaymentAt || s.createdAt,
          titulo: String(s.planId || 'Assinatura'),
          userId: s.userId ? String(s.userId) : undefined,
          email: u?.email,
          nome: u?.name,
        }
      })

    const catalogo = new Map<string, string>()
    for (const m of [...materiais, ...pacotes] as any[]) catalogo.set(String(m._id), String(m.title || ''))

    const relatorio = montarRelatorioHistorico({
      pedidos: pedidos as unknown as PedidoDoHistorico[],
      comprasLegadas: legado as unknown as CompraLegada[],
      cobrancasDeAssinatura,
      fisicoPorPedido: new Map(fisicos.map((s: any) => [String(s._id), Number(s.total) || 0])),
      catalogo,
      statusDosPedidos: statusDosPedidos.map((s: any) => ({ status: String(s._id), pedidos: s.pedidos, valor: Number(s.valor) || 0 })),
    })

    return jsonComprimido(request, relatorio)
  } catch (error: any) {
    console.error('Erro ao montar relatório histórico de vendas:', error)
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 })
  }
}
