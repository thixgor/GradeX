import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { MINDMAP_COLLECTIONS, isValidObjectId } from '@/lib/mindmap'

export const dynamic = 'force-dynamic'

async function findMap(db: any, idOrSlug: string) {
  if (isValidObjectId(idOrSlug)) {
    const byId = await db.collection(MINDMAP_COLLECTIONS.maps).findOne({ _id: new ObjectId(idOrSlug) })
    if (byId) return byId
  }
  return db.collection(MINDMAP_COLLECTIONS.maps).findOne({ slug: idOrSlug })
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    const db = await getDb()
    const map = await findMap(db, params.id)
    if (!map) return NextResponse.json({ error: 'Mapa não encontrado' }, { status: 404 })

    const mapId = String(map._id)
    const likes = db.collection(MINDMAP_COLLECTIONS.likes)
    const existing = await likes.findOne({ mapId, userId: session.userId })
    if (existing) {
      return NextResponse.json({ liked: true, likeCount: map.likeCount || 0 })
    }
    await likes.insertOne({ mapId, userId: session.userId, createdAt: new Date() })
    await db.collection(MINDMAP_COLLECTIONS.maps).updateOne({ _id: map._id }, { $inc: { likeCount: 1 } })
    return NextResponse.json({ liked: true, likeCount: (map.likeCount || 0) + 1 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao curtir' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    const db = await getDb()
    const map = await findMap(db, params.id)
    if (!map) return NextResponse.json({ error: 'Mapa não encontrado' }, { status: 404 })

    const mapId = String(map._id)
    const likes = db.collection(MINDMAP_COLLECTIONS.likes)
    const removed = await likes.deleteOne({ mapId, userId: session.userId })
    if (removed.deletedCount && removed.deletedCount > 0) {
      await db.collection(MINDMAP_COLLECTIONS.maps).updateOne(
        { _id: map._id, likeCount: { $gt: 0 } },
        { $inc: { likeCount: -1 } }
      )
      return NextResponse.json({ liked: false, likeCount: Math.max(0, (map.likeCount || 0) - 1) })
    }
    return NextResponse.json({ liked: false, likeCount: map.likeCount || 0 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao remover curtida' }, { status: 500 })
  }
}
