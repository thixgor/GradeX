import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { FLASHCARD_MANUAL_COLLECTIONS, isValidObjectId, normalizeFolderForResponse } from '@/lib/flashcard-manual'

export const dynamic = 'force-dynamic'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    if (!isValidObjectId(params.id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

    const db = await getDb()
    const folders = db.collection(FLASHCARD_MANUAL_COLLECTIONS.folders)
    const folder = await folders.findOne({ _id: new ObjectId(params.id) })
    if (!folder) return NextResponse.json({ error: 'Pasta não encontrada' }, { status: 404 })
    if (folder.ownerId !== session.userId) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

    const body = await request.json()
    const updates: any = { updatedAt: new Date() }
    if (typeof body.name === 'string') updates.name = body.name.trim().slice(0, 50)
    if (typeof body.color === 'string') updates.color = body.color.slice(0, 16)
    if (typeof body.icon === 'string') updates.icon = body.icon.slice(0, 32)
    if (typeof body.order === 'number') updates.order = body.order
    if (body.parentFolderId !== undefined) {
      updates.parentFolderId = body.parentFolderId && isValidObjectId(body.parentFolderId) ? body.parentFolderId : null
    }
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
    if (!isValidObjectId(params.id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

    const db = await getDb()
    const folders = db.collection(FLASHCARD_MANUAL_COLLECTIONS.folders)
    const folder = await folders.findOne({ _id: new ObjectId(params.id) })
    if (!folder) return NextResponse.json({ error: 'Pasta não encontrada' }, { status: 404 })
    if (folder.ownerId !== session.userId) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

    await folders.deleteOne({ _id: folder._id })
    // Mover decks da pasta para raiz
    await db.collection(FLASHCARD_MANUAL_COLLECTIONS.decks).updateMany(
      { ownerId: session.userId, folderId: params.id },
      { $set: { folderId: null, updatedAt: new Date() } }
    )
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao deletar pasta' }, { status: 500 })
  }
}
