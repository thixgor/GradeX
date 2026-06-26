import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import {
  MINDMAP_COLLECTIONS,
  generateRandomSlug,
  normalizeMapForResponse,
  sanitizeTitle,
  sanitizeDescription,
  sanitizeTags,
  sanitizeNodes,
  sanitizeStyle,
} from '@/lib/mindmap'
import { canCreateUnlimitedMindMaps, MINDMAP_FREE_LIMIT } from '@/lib/tier-limits'
import type { MindMap, MindMapNode } from '@/lib/types'

export const dynamic = 'force-dynamic'

// GET /api/mindmaps?scope=mine|community|all-admin&q=...
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    const db = await getDb()
    const maps = db.collection<MindMap>(MINDMAP_COLLECTIONS.maps)
    const { searchParams } = new URL(request.url)
    const scope = searchParams.get('scope') || 'mine'
    const q = (searchParams.get('q') || '').trim()
    const isAdmin = session?.role === 'admin'

    const filter: any = {}

    if (scope === 'all-admin') {
      if (!isAdmin) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
      // admin vê tudo, inclusive privados e protegidos por senha
    } else if (scope === 'community') {
      filter.visibility = 'public'
      filter.isPublished = true
      filter.isHidden = { $ne: true }
    } else {
      // 'mine'
      if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
      filter.ownerId = session.userId
    }

    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { tags: { $regex: q, $options: 'i' } },
        ...(isAdmin && scope === 'all-admin' ? [{ ownerName: { $regex: q, $options: 'i' } }] : []),
      ]
    }

    const sort: Record<string, 1 | -1> = scope === 'community'
      ? { likeCount: -1, updatedAt: -1 }
      : { updatedAt: -1 }
    const list = await maps
      .find(filter, { projection: { passwordHash: 0, nodes: 0 } })
      .sort(sort)
      .limit(scope === 'community' ? 120 : 500)
      .toArray()

    const res = NextResponse.json({
      maps: list.map(m => normalizeMapForResponse(m as any, { includeNodes: false })),
    })
    res.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate')
    return res
  } catch (error) {
    console.error('Erro ao listar mapas mentais:', error)
    return NextResponse.json({ error: 'Erro ao listar mapas' }, { status: 500 })
  }
}

// POST /api/mindmaps — cria um novo mapa (privado por padrão)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const title = sanitizeTitle(body.title) || 'Novo mapa mental'

    const db = await getDb()
    const usersCollection = db.collection('users')
    const maps = db.collection<MindMap>(MINDMAP_COLLECTIONS.maps)

    const user = await usersCollection.findOne(
      { _id: new ObjectId(session.userId) },
      { projection: { name: 1, accountType: 1 } }
    )

    // Limite de plano: gratuito/trial podem manter apenas 1 mapa; Premium,
    // Essential (e admin) criam mapas ilimitados.
    const isAdmin = session.role === 'admin'
    if (!canCreateUnlimitedMindMaps(user?.accountType, isAdmin)) {
      const count = await maps.countDocuments({ ownerId: session.userId })
      if (count >= MINDMAP_FREE_LIMIT) {
        return NextResponse.json(
          {
            error: `No plano gratuito você pode ter apenas ${MINDMAP_FREE_LIMIT} mapa mental. Assine o Premium ou Essential para criar mapas ilimitados.`,
            requiresUpgrade: true,
            limit: MINDMAP_FREE_LIMIT,
          },
          { status: 403 }
        )
      }
    }

    const slug = await generateRandomSlug(db)

    // Nó central inicial.
    const rootNode: MindMapNode = {
      id: 'root',
      parentId: null,
      text: title,
      x: 0,
      y: 0,
    }
    const nodes = Array.isArray(body.nodes) && body.nodes.length > 0
      ? sanitizeNodes(body.nodes)
      : [rootNode]

    const now = new Date()
    const map: MindMap = {
      slug,
      ownerId: session.userId,
      ownerName: user?.name || session.name || 'Usuário',
      title,
      description: sanitizeDescription(body.description || ''),
      tags: sanitizeTags(body.tags),
      category: body.category ? String(body.category).slice(0, 60) : undefined,
      nodes,
      style: sanitizeStyle(body.style),
      collaborators: [],
      visibility: 'private',
      passwordHash: null,
      isPublished: false,
      isHidden: false,
      likeCount: 0,
      viewCount: 0,
      nodeCount: nodes.length,
      createdAt: now,
      updatedAt: now,
    }

    const result = await maps.insertOne(map)
    return NextResponse.json(
      { map: normalizeMapForResponse({ ...map, _id: result.insertedId }) },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Erro ao criar mapa mental:', error)
    return NextResponse.json({ error: error.message || 'Erro ao criar mapa' }, { status: 500 })
  }
}
