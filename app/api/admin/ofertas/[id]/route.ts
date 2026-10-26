/**
 * PATCH /api/admin/ofertas/[id]
 *   { acao: 'cancelar' } → a oferta sai do ar; o cupom criado por ela é
 *                          desativado (cupom existente reaproveitado fica como
 *                          estava — ele não é só desta oferta).
 *   { acao: 'reenviar' } → manda o e-mail de novo, com os preços de agora.
 */

import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { OFERTAS_COLLECTION, type OfertaExclusiva } from '@/lib/ofertas-exclusivas'
import { enviarOferta } from '@/lib/ofertas-exclusivas-envio'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function PATCH(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  const { id } = await props.params
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: 'Oferta inválida' }, { status: 400 })
  const body = await request.json().catch(() => null)
  const acao = body?.acao

  const db = await getDb()
  const oferta = await db.collection<OfertaExclusiva>(OFERTAS_COLLECTION).findOne({ _id: new ObjectId(id) })
  if (!oferta) return NextResponse.json({ error: 'Oferta não encontrada' }, { status: 404 })

  if (acao === 'cancelar') {
    const agora = new Date()
    await Promise.all([
      db.collection<OfertaExclusiva>(OFERTAS_COLLECTION).updateOne(
        { _id: oferta._id },
        { $set: { status: 'cancelada', canceladaEm: agora, updatedAt: agora } }
      ),
      oferta.cupomCriadoPelaOferta && oferta.couponId && ObjectId.isValid(oferta.couponId)
        ? db.collection('coupons').updateOne(
            { _id: new ObjectId(oferta.couponId) },
            { $set: { isActive: false, updatedAt: agora } }
          )
        : Promise.resolve(null),
    ])
    return NextResponse.json({ success: true })
  }

  if (acao === 'reenviar') {
    if (oferta.status === 'cancelada') {
      return NextResponse.json({ error: 'Oferta cancelada não pode ser reenviada.' }, { status: 409 })
    }
    try {
      const envio = await enviarOferta(db, oferta, { email: true, notificacao: false })
      if (!envio.emailEnviado) {
        return NextResponse.json({ error: `O e-mail não saiu: ${envio.emailErro || 'falha no envio'}.` }, { status: 502 })
      }
      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('[admin/ofertas/id] reenvio falhou:', error)
      return NextResponse.json({ error: 'Erro ao reenviar a oferta.' }, { status: 500 })
    }
  }

  return NextResponse.json({ error: 'Ação desconhecida' }, { status: 400 })
}
