import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { hashPassword } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import {
  MINDMAP_COLLECTIONS,
  normalizeMapForResponse,
  resolveMindMapAccess,
  sanitizeTitle,
  sanitizeDescription,
  sanitizeTags,
  sanitizeNodes,
  sanitizeStyle,
  isValidObjectId,
  isValidVisibility,
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

// GET /api/mindmaps/[id] — busca um mapa respeitando permissões.
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    const db = await getDb()
    const map = await findMap(db, params.id)
    if (!map) return NextResponse.json({ error: 'Mapa não encontrado' }, { status: 404 })

    const isAdmin = session?.role === 'admin'
    const access = resolveMindMapAccess({ map, userId: session?.userId || null, userEmail: session?.email || null, isAdmin })

    if (!access.canView) {
      return NextResponse.json({ error: 'Mapa indisponível' }, { status: 404 })
    }
    if (map.isHidden && !isAdmin && !access.isOwner) {
      return NextResponse.json({ error: 'Mapa indisponível' }, { status: 404 })
    }

    // Incrementa visualizações (fire-and-forget) para quem não é o dono.
    // O polling de tempo real envia ?poll=1 para não inflar as views.
    const isPoll = new URL(request.url).searchParams.get('poll') === '1'
    if (!isPoll && !access.isOwner && access.canViewContent) {
      db.collection(MINDMAP_COLLECTIONS.maps)
        .updateOne({ _id: map._id }, { $inc: { viewCount: 1 } })
        .catch(() => {})
    }

    // Curtida do usuário atual.
    let liked = false
    if (session) {
      const like = await db.collection(MINDMAP_COLLECTIONS.likes).findOne({ mapId: String(map._id), userId: session.userId })
      liked = !!like
    }

    const res = NextResponse.json({
      map: normalizeMapForResponse(map, {
        includeNodes: access.canViewContent,
        includeCollaborators: access.isOwner || access.isAdmin,
      }),
      access: {
        canView: access.canView,
        canViewContent: access.canViewContent,
        canEdit: access.canEdit,
        canDelete: access.canDelete,
        isOwner: access.isOwner,
        isAdmin: access.isAdmin,
        isCollaborator: access.isCollaborator,
        locked: access.locked,
      },
      liked,
      viewer: {
        isAuthenticated: !!session,
        userId: session?.userId || null,
      },
    })
    res.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate')
    return res
  } catch (error) {
    console.error('Erro ao buscar mapa:', error)
    return NextResponse.json({ error: 'Erro ao buscar mapa' }, { status: 500 })
  }
}

// PATCH — atualiza metadados e/ou conteúdo (dono ou admin).
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const db = await getDb()
    const map = await findMap(db, params.id)
    if (!map) return NextResponse.json({ error: 'Mapa não encontrado' }, { status: 404 })

    const isAdmin = session.role === 'admin'
    const access = resolveMindMapAccess({ map, userId: session.userId, userEmail: session.email, isAdmin })
    if (!access.canEdit) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

    const body = await request.json().catch(() => ({}))
    const updates: Partial<MindMap> = {}

    if (typeof body.title === 'string') {
      const t = sanitizeTitle(body.title)
      if (!t) return NextResponse.json({ error: 'Título inválido' }, { status: 400 })
      updates.title = t
    }
    if (typeof body.description === 'string') updates.description = sanitizeDescription(body.description)
    if (Array.isArray(body.tags)) updates.tags = sanitizeTags(body.tags)
    if (typeof body.category === 'string') updates.category = body.category.slice(0, 60)

    if (Array.isArray(body.nodes)) {
      const nodes = sanitizeNodes(body.nodes)
      updates.nodes = nodes
      updates.nodeCount = nodes.length
    }

    if (body.style !== undefined) {
      updates.style = sanitizeStyle(body.style)
    }

    // Apenas dono/admin alteram visibilidade e senha (colaboradores não).
    const canManage = access.isOwner || isAdmin
    if (body.visibility !== undefined && canManage) {
      if (!isValidVisibility(body.visibility)) {
        return NextResponse.json({ error: 'Visibilidade inválida' }, { status: 400 })
      }
      // Exige e-mail verificado para tornar público/unlisted (admin isento).
      if ((body.visibility === 'public' || body.visibility === 'unlisted') && !isAdmin) {
        const user = await db.collection('users').findOne(
          { _id: new ObjectId(session.userId) },
          { projection: { emailVerified: 1 } }
        )
        if (!user?.emailVerified) {
          return NextResponse.json(
            { error: 'Verifique seu e-mail para publicar mapas.', requiresVerification: true },
            { status: 403 }
          )
        }
      }

      updates.visibility = body.visibility
      updates.isPublished = body.visibility !== 'private'

      if (body.visibility === 'password') {
        if (typeof body.password === 'string' && body.password.length >= 3) {
          updates.passwordHash = await hashPassword(body.password)
        } else if (!map.passwordHash && !body.keepPassword) {
          return NextResponse.json({ error: 'Defina uma senha de no mínimo 3 caracteres.' }, { status: 400 })
        }
      } else {
        // Saindo do modo senha: limpa o hash.
        updates.passwordHash = null
      }
    } else if (canManage && typeof body.password === 'string' && body.password.length >= 3 && map.visibility === 'password') {
      // Troca de senha sem mudar a visibilidade.
      updates.passwordHash = await hashPassword(body.password)
    }

    // Apenas admin pode ocultar mapas da comunidade.
    if (isAdmin && typeof body.isHidden === 'boolean') {
      updates.isHidden = body.isHidden
    }

    updates.updatedAt = new Date()
    await db.collection(MINDMAP_COLLECTIONS.maps).updateOne({ _id: map._id }, { $set: updates })

    const updated = await db.collection<MindMap>(MINDMAP_COLLECTIONS.maps).findOne({ _id: map._id })
    return NextResponse.json({ map: updated ? normalizeMapForResponse(updated) : null })
  } catch (error: any) {
    console.error('Erro ao atualizar mapa:', error)
    return NextResponse.json({ error: error.message || 'Erro ao atualizar mapa' }, { status: 500 })
  }
}

// DELETE — dono ou admin. Admin pode deletar qualquer mapa.
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const db = await getDb()
    const map = await findMap(db, params.id)
    if (!map) return NextResponse.json({ error: 'Mapa não encontrado' }, { status: 404 })

    const isAdmin = session.role === 'admin'
    const access = resolveMindMapAccess({ map, userId: session.userId, userEmail: session.email, isAdmin })
    if (!access.canDelete) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

    const mapId = String(map._id)
    await Promise.all([
      db.collection(MINDMAP_COLLECTIONS.maps).deleteOne({ _id: map._id }),
      db.collection(MINDMAP_COLLECTIONS.likes).deleteMany({ mapId }),
    ])

    return NextResponse.json({ success: true, deletedByAdmin: isAdmin && !access.isOwner })
  } catch (error) {
    console.error('Erro ao deletar mapa:', error)
    return NextResponse.json({ error: 'Erro ao deletar mapa' }, { status: 500 })
  }
}
