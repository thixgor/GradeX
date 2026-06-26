import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import {
  MINDMAP_COLLECTIONS,
  resolveMindMapAccess,
  isValidObjectId,
} from '@/lib/mindmap'
import type { MindMap, MindMapCollaborator } from '@/lib/types'

export const dynamic = 'force-dynamic'

const MAX_COLLABORATORS = 20

async function findMap(db: any, idOrSlug: string): Promise<(MindMap & { _id: ObjectId }) | null> {
  if (isValidObjectId(idOrSlug)) {
    const byId = await db.collection(MINDMAP_COLLECTIONS.maps).findOne({ _id: new ObjectId(idOrSlug) })
    if (byId) return byId
  }
  return db.collection(MINDMAP_COLLECTIONS.maps).findOne({ slug: idOrSlug })
}

// Só dono ou admin gerenciam colaboradores.
async function requireManager(params: { id: string }) {
  const session = await getSession()
  if (!session) return { error: NextResponse.json({ error: 'Não autenticado' }, { status: 401 }) }
  const db = await getDb()
  const map = await findMap(db, params.id)
  if (!map) return { error: NextResponse.json({ error: 'Mapa não encontrado' }, { status: 404 }) }
  const isAdmin = session.role === 'admin'
  const access = resolveMindMapAccess({ map, userId: session.userId, userEmail: session.email, isAdmin })
  if (!access.isOwner && !isAdmin) {
    return { error: NextResponse.json({ error: 'Apenas o criador pode gerenciar colaboradores' }, { status: 403 }) }
  }
  return { session, db, map }
}

// POST — adiciona colaborador por e-mail (o criador escolhe o e-mail).
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await requireManager(params)
    if ('error' in ctx) return ctx.error
    const { db, map } = ctx

    const body = await request.json().catch(() => ({}))
    const email = String(body.email || '').trim().toLowerCase()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'E-mail inválido' }, { status: 400 })
    }

    const collaborators: MindMapCollaborator[] = Array.isArray(map.collaborators) ? map.collaborators : []
    if (collaborators.length >= MAX_COLLABORATORS) {
      return NextResponse.json({ error: `Limite de ${MAX_COLLABORATORS} colaboradores atingido` }, { status: 400 })
    }

    // O colaborador precisa ter conta na plataforma.
    const user = await db.collection('users').findOne(
      { email },
      { projection: { _id: 1, name: 1, email: 1 } }
    )
    if (!user) {
      return NextResponse.json({ error: 'Nenhum usuário cadastrado com esse e-mail' }, { status: 404 })
    }

    const userId = String(user._id)
    if (userId === map.ownerId) {
      return NextResponse.json({ error: 'O criador já tem acesso total' }, { status: 400 })
    }
    if (collaborators.some(c => c.userId === userId || (c.email || '').toLowerCase() === email)) {
      return NextResponse.json({ error: 'Esse usuário já é colaborador' }, { status: 400 })
    }

    const collaborator: MindMapCollaborator = {
      userId,
      email: user.email || email,
      name: user.name || undefined,
      addedAt: new Date(),
    }
    await db.collection(MINDMAP_COLLECTIONS.maps).updateOne(
      { _id: map._id },
      { $push: { collaborators: collaborator }, $set: { updatedAt: new Date() } } as any
    )

    return NextResponse.json({ ok: true, collaborator, collaborators: [...collaborators, collaborator] })
  } catch (error) {
    console.error('Erro ao adicionar colaborador:', error)
    return NextResponse.json({ error: 'Erro ao adicionar colaborador' }, { status: 500 })
  }
}

// DELETE — remove colaborador por userId.
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await requireManager(params)
    if ('error' in ctx) return ctx.error
    const { db, map } = ctx

    const { searchParams } = new URL(request.url)
    let userId = searchParams.get('userId') || ''
    if (!userId) {
      const body = await request.json().catch(() => ({}))
      userId = String(body.userId || '')
    }
    if (!userId) return NextResponse.json({ error: 'Colaborador inválido' }, { status: 400 })

    const collaborators: MindMapCollaborator[] = Array.isArray(map.collaborators) ? map.collaborators : []
    const next = collaborators.filter(c => c.userId !== userId)
    await db.collection(MINDMAP_COLLECTIONS.maps).updateOne(
      { _id: map._id },
      { $set: { collaborators: next, updatedAt: new Date() } }
    )

    return NextResponse.json({ ok: true, collaborators: next })
  } catch (error) {
    console.error('Erro ao remover colaborador:', error)
    return NextResponse.json({ error: 'Erro ao remover colaborador' }, { status: 500 })
  }
}
