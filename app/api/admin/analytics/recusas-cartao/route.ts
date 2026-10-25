import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { jsonComprimido } from '@/lib/resposta-comprimida'
import { COLECAO_DE_FALHAS_DE_CARTAO, type RegistroDeFalhaDeCartao } from '@/lib/payments/recusa-cartao-log'
import { montarPainelDeRecusas } from '@/lib/payments/recusa-cartao-painel'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const DIA_MS = 24 * 60 * 60 * 1000
const TIPOS_DE_CARTAO = ['credit_card', 'debit_card']

/**
 * GET — o log de recusas de cartão do DomineAqui Analytics (somente admin).
 *
 * Separado de `/api/admin/analytics` de propósito: aquela rota roda a cada
 * abertura do painel; esta só roda quando a aba "Recusas de cartão" é aberta.
 *
 *   ?dias=30  janela em dias (1 a 365)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const dias = Math.min(365, Math.max(1, Math.trunc(Number(request.nextUrl.searchParams.get('dias'))) || 30))
    const desde = new Date(Date.now() - dias * DIA_MS)
    // Um dia a mais para trás: o histórico do comprador olha 24 h antes da falha.
    const desdeComFolga = new Date(desde.getTime() - DIA_MS)

    const db = await getDb()
    const [registros, pedidosDeCartao, aprovacoes] = await Promise.all([
      db
        .collection<RegistroDeFalhaDeCartao>(COLECAO_DE_FALHAS_DE_CARTAO)
        .find({ createdAt: { $gte: desde } })
        .sort({ createdAt: -1 })
        .limit(1000)
        .toArray(),
      db
        .collection('payment_orders')
        .find({
          createdAt: { $gte: desdeComFolga },
          $or: [{ paymentMethod: { $in: TIPOS_DE_CARTAO } }, { 'metadata.cartaoRequisicao': { $exists: true } }],
        } as any)
        .project({ userId: 1, payerEmail: 1, createdAt: 1, status: 1 })
        .limit(5000)
        .toArray(),
      db
        .collection('payment_orders')
        .find({ status: 'approved', createdAt: { $gte: desdeComFolga } } as any)
        .project({ userId: 1, payerEmail: 1, paidAt: 1, updatedAt: 1, createdAt: 1, paymentMethod: 1, amount: 1 })
        .limit(5000)
        .toArray(),
    ])

    // Depende dos registros: de onde veio (IP e aparelho) cada pedido recusado.
    const idsDePedidos = [...new Set(registros.map(r => r.orderId).filter((id): id is string => !!id))]
    const eventos = idsDePedidos.length
      ? await db
          .collection('checkout_events')
          .find({ event: 'order_created', orderId: { $in: idsDePedidos } } as any)
          .project({ orderId: 1, ip: 1, userAgent: 1 })
          .toArray()
      : []

    const noPeriodo = (pedidosDeCartao as any[]).filter(p => new Date(p.createdAt) >= desde)
    const painel = montarPainelDeRecusas({
      registros,
      tentativas: (pedidosDeCartao as any[]).map(p => ({
        orderId: String(p._id),
        userId: p.userId,
        email: p.payerEmail,
        createdAt: p.createdAt,
        status: p.status,
      })),
      aprovacoes: (aprovacoes as any[]).map(a => ({
        orderId: String(a._id),
        userId: a.userId,
        email: a.payerEmail,
        paidAt: a.paidAt || a.updatedAt || a.createdAt,
        paymentMethod: a.paymentMethod,
        valor: Number(a.amount) || 0,
      })),
      eventos: (eventos as any[]).map(e => ({ orderId: e.orderId, ip: e.ip, userAgent: e.userAgent })),
      aprovadasNoPeriodo: noPeriodo.filter(p => p.status === 'approved').length,
      recusadasNoPeriodo: noPeriodo.filter(p => p.status === 'rejected' || p.status === 'cancelled').length,
    })

    return jsonComprimido(request, { dias, atualizadoEm: new Date().toISOString(), ...painel })
  } catch (error: any) {
    console.error('Erro ao montar o log de recusas de cartão:', error)
    return NextResponse.json({ error: error?.message || 'Erro interno' }, { status: 500 })
  }
}
