import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getDb } from '@/lib/mongodb'
import { exigirAdmin } from '@/lib/embaixadores/admin'
import { COLECAO_EMBAIXADORES, sincronizarVendas, type Embaixador } from '@/lib/embaixadores/servidor'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

/** Refaz a atribuição das vendas deste embaixador sobre o histórico de pedidos. */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { recusa } = await exigirAdmin()
  if (recusa) return recusa
  const { id } = await params
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: 'Embaixador não encontrado' }, { status: 404 })
  try {
    const db = await getDb()
    const embaixador = await db.collection<Embaixador>(COLECAO_EMBAIXADORES).findOne({ _id: new ObjectId(id) })
    if (!embaixador) return NextResponse.json({ error: 'Embaixador não encontrado' }, { status: 404 })
    const resultado = await sincronizarVendas(db, embaixador)
    return NextResponse.json(resultado)
  } catch (erro) {
    console.error('[admin/embaixadores/sincronizar]', erro)
    return NextResponse.json({ error: 'Erro ao sincronizar' }, { status: 500 })
  }
}
