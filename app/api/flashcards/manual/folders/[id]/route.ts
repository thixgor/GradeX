import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { FLASHCARD_MANUAL_COLLECTIONS, isValidObjectId, normalizeFolderForResponse } from '@/lib/flashcard-manual'

export const dynamic = 'force-dynamic'

async function loadFolder(db: any, id: string) {
  if (!isValidObjectId(id)) return null
  return db.collection(FLASHCARD_MANUAL_COLLECTIONS.folders).findOne({ _id: new ObjectId(id) })
}

function canEdit(folder: any, session: any): boolean {
  if (folder.ownerType === 'admin') return session.role === 'admin'
  return folder.ownerId === session.userId
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const db = await getDb()
    const folder = await loadFolder(db, params.id)
    if (!folder) return NextResponse.json({ error: 'Pasta não encontrada' }, { status: 404 })
    if (!canEdit(folder, session)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

    const body = await request.json()
    const updates: any = { updatedAt: new Date() }
    if (typeof body.name === 'string' && body.name.trim()) updates.name = body.name.trim().slice(0, 50)
    if (typeof body.color === 'string') updates.color = body.color.slice(0, 16)
    if (typeof body.icon === 'string') updates.icon = body.icon.slice(0, 32)
    if (typeof body.order === 'number') updates.order = body.order

    if (body.parentFolderId !== undefined) {
      if (!body.parentFolderId) {
        updates.parentFolderId = null
      } else if (isValidObjectId(body.parentFolderId) && body.parentFolderId !== params.id) {
        // Impedir ciclo: o novo parent não pode ser um descendente desta pasta
        const isDescendant = await checkIsDescendant(db, body.parentFolderId, params.id)
        if (!isDescendant) updates.parentFolderId = body.parentFolderId
      }
    }

    const folders = db.collection(FLASHCARD_MANUAL_COLLECTIONS.folders)
    await folders.updateOne({ _id: folder._id }, { $set: updates })
    const updated = await folders.findOne({ _id: folder._id })
    return NextResponse.json({ folder: updated ? normalizeFolderForResponse(updated as any) : null })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao atualizar pasta' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const db = await getDb()
    const folder = await loadFolder(db, params.id)
    if (!folder) return NextResponse.json({ error: 'Pasta não encontrada' }, { status: 404 })
    if (!canEdit(folder, session)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

    // Coletar todos os IDs descendentes recursivamente
    const allIds = await collectDescendants(db, params.id)
    allIds.push(params.id)

    const folders = db.collection(FLASHCARD_MANUAL_COLLECTIONS.folders)
    const decks = db.collection(FLASHCARD_MANUAL_COLLECTIONS.decks)

    // Mover decks de todas as pastas deletadas para a raiz
    await decks.updateMany(
      { folderId: { $in: allIds } },
      { $set: { folderId: null, updatedAt: new Date() } }
    )

    // Deletar todas as pastas (pai + descendentes)
    await folders.deleteMany({
      _id: { $in: allIds.map(id => new ObjectId(id)) }
    })

    return NextResponse.json({ success: true, deletedCount: allIds.length })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao deletar pasta' }, { status: 500 })
  }
}

// Retorna true se targetId é descendente de ancestorId
async function checkIsDescendant(db: any, targetId: string, ancestorId: string): Promise<boolean> {
  const folders = db.collection(FLASHCARD_MANUAL_COLLECTIONS.folders)
  let current = await folders.findOne({ _id: new ObjectId(targetId) })
  const visited = new Set<string>()
  while (current && current.parentFolderId) {
    if (visited.has(String(current._id))) break
    visited.add(String(current._id))
    if (current.parentFolderId === ancestorId) return true
    if (!isValidObjectId(current.parentFolderId)) break
    current = await folders.findOne({ _id: new ObjectId(current.parentFolderId) })
  }
  return false
}

// Retorna IDs de todos os descendentes de um folder (BFS)
async function collectDescendants(db: any, rootId: string): Promise<string[]> {
  const folders = db.collection(FLASHCARD_MANUAL_COLLECTIONS.folders)
  const result: string[] = []
  const queue = [rootId]
  const visited = new Set<string>([rootId])

  while (queue.length) {
    const current = queue.shift()!
    const children = await folders.find({ parentFolderId: current }).project({ _id: 1 }).toArray()
    for (const child of children) {
      const id = String(child._id)
      if (!visited.has(id)) {
        visited.add(id)
        result.push(id)
        queue.push(id)
      }
    }
  }
  return result
}
