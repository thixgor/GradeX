import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { MINDMAP_COLLECTIONS, isValidObjectId } from '@/lib/mindmap'

export const dynamic = 'force-dynamic'

// GET /api/mindmaps/[id]/version — resposta minúscula só com updatedAt.
// Usado pelo polling de tempo real: o cliente busca o mapa completo apenas
// quando este timestamp muda, reduzindo drasticamente a banda/CPU (Vercel free).
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = await getDb()
    const coll = db.collection(MINDMAP_COLLECTIONS.maps)
    let map = null
    if (isValidObjectId(params.id)) {
      map = await coll.findOne({ _id: new ObjectId(params.id) }, { projection: { updatedAt: 1 } })
    }
    if (!map) {
      map = await coll.findOne({ slug: params.id }, { projection: { updatedAt: 1 } })
    }
    if (!map) return NextResponse.json({ error: 'Mapa não encontrado' }, { status: 404 })

    const res = NextResponse.json({ updatedAt: map.updatedAt })
    res.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate')
    return res
  } catch (error) {
    console.error('Erro ao checar versão do mapa:', error)
    return NextResponse.json({ error: 'Erro' }, { status: 500 })
  }
}
