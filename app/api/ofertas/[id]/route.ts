/**
 * GET /api/ofertas/[id] — a oferta exclusiva, para a página /oferta/[id].
 *
 * Só a dona da oferta vê (o admin também, para conferir como ficou). A
 * primeira abertura pela dona é registrada para o painel saber que ela viu.
 */

import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { OFERTAS_COLLECTION, montarVitrine, type OfertaExclusiva } from '@/lib/ofertas-exclusivas'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(_request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Entre na sua conta para ver a oferta.' }, { status: 401 })

  const { id } = await props.params
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: 'Oferta não encontrada.' }, { status: 404 })

  const db = await getDb()
  const oferta = await db.collection<OfertaExclusiva>(OFERTAS_COLLECTION).findOne({ _id: new ObjectId(id) })
  const ehDona = oferta?.userId === session.userId
  // Oferta de outra pessoa responde como inexistente: o id não confirma nada.
  if (!oferta || (!ehDona && session.role !== 'admin')) {
    return NextResponse.json({ error: 'Oferta não encontrada.' }, { status: 404 })
  }
  if (oferta.status === 'cancelada') {
    return NextResponse.json({ error: 'Esta oferta não está mais disponível.' }, { status: 410 })
  }

  const agora = new Date()
  const [vitrine] = await Promise.all([
    montarVitrine(db, oferta, agora),
    ehDona && !oferta.abertaEm
      ? db.collection<OfertaExclusiva>(OFERTAS_COLLECTION).updateOne(
          { _id: oferta._id, abertaEm: null },
          { $set: { abertaEm: agora } }
        )
      : Promise.resolve(null),
  ])

  return NextResponse.json({
    oferta: {
      id: String(oferta._id),
      titulo: oferta.titulo,
      mensagem: oferta.mensagem || '',
      nome: oferta.userName,
      criadaEm: oferta.createdAt,
      previaDoAdmin: !ehDona,
    },
    vitrine,
  })
}
