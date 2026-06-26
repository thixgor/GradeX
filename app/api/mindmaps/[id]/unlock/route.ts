import { NextRequest, NextResponse } from 'next/server'
import { getSession, verifyPassword } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import {
  MINDMAP_COLLECTIONS,
  normalizeMapForResponse,
  resolveMindMapAccess,
  isValidObjectId,
} from '@/lib/mindmap'
import type { MindMap } from '@/lib/types'

export const dynamic = 'force-dynamic'

async function findMap(db: any, idOrSlug: string): Promise<(MindMap & { _id: ObjectId }) | null> {
  if (isValidObjectId(idOrSlug)) {
    const byId = await db.collection(MINDMAP_COLLECTIONS.maps).findOne({ _id: new ObjectId(idOrSlug) })
    if (byId) return byId
  }
  return db.collection(MINDMAP_COLLECTIONS.maps).findOne({ slug: idOrSlug })
}

// POST /api/mindmaps/[id]/unlock — verifica senha e devolve o conteúdo.
// Admin e dono recebem o conteúdo sem precisar da senha.
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    const db = await getDb()
    const map = await findMap(db, params.id)
    if (!map) return NextResponse.json({ error: 'Mapa não encontrado' }, { status: 404 })

    const isAdmin = session?.role === 'admin'
    const baseAccess = resolveMindMapAccess({ map, userId: session?.userId || null, userEmail: session?.email || null, isAdmin })

    // Dono/admin: acesso direto, sem senha.
    if (baseAccess.canViewContent) {
      return NextResponse.json({
        ok: true,
        map: normalizeMapForResponse(map, { includeNodes: true }),
      })
    }

    if (map.visibility !== 'password') {
      return NextResponse.json({ error: 'Mapa indisponível' }, { status: 404 })
    }

    const body = await request.json().catch(() => ({}))
    const password = String(body.password || '')
    if (!password || !map.passwordHash) {
      return NextResponse.json({ error: 'Senha incorreta' }, { status: 401 })
    }

    const ok = await verifyPassword(password, map.passwordHash)
    if (!ok) {
      return NextResponse.json({ error: 'Senha incorreta' }, { status: 401 })
    }

    db.collection(MINDMAP_COLLECTIONS.maps)
      .updateOne({ _id: map._id }, { $inc: { viewCount: 1 } })
      .catch(() => {})

    return NextResponse.json({
      ok: true,
      map: normalizeMapForResponse(map, { includeNodes: true }),
    })
  } catch (error) {
    console.error('Erro ao desbloquear mapa:', error)
    return NextResponse.json({ error: 'Erro ao desbloquear mapa' }, { status: 500 })
  }
}
