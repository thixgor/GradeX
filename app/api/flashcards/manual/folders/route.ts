import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { FLASHCARD_MANUAL_COLLECTIONS, normalizeFolderForResponse, isValidObjectId } from '@/lib/flashcard-manual'
import { getFlashcardManualLimits } from '@/lib/flashcard-limits'
import type { FlashcardManualFolder } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const db = await getDb()
    const folders = await db
      .collection<FlashcardManualFolder>(FLASHCARD_MANUAL_COLLECTIONS.folders)
      .find({ ownerId: session.userId })
      .sort({ order: 1, createdAt: 1 })
      .toArray()
    return NextResponse.json({ folders: folders.map(normalizeFolderForResponse) })
  } catch (error) {
    console.error('Erro ao listar pastas:', error)
    return NextResponse.json({ error: 'Erro ao listar pastas' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const body = await request.json()
    const name = String(body.name || '').trim().slice(0, 50)
    if (!name) return NextResponse.json({ error: 'Nome da pasta é obrigatório' }, { status: 400 })

    const db = await getDb()
    const isAdmin = session.role === 'admin'
    const user = await db.collection('users').findOne({ _id: new ObjectId(session.userId) })
    const limits = getFlashcardManualLimits(user?.accountType, isAdmin)
    const folders = db.collection<FlashcardManualFolder>(FLASHCARD_MANUAL_COLLECTIONS.folders)
    const existing = await folders.countDocuments({ ownerId: session.userId })
    if (existing >= limits.maxFolders) {
      return NextResponse.json({ error: `Limite de pastas atingido (${limits.maxFolders}).`, requiresUpgrade: true }, { status: 403 })
    }

    const folder: FlashcardManualFolder = {
      ownerId: session.userId,
      name,
      color: body.color ? String(body.color).slice(0, 16) : undefined,
      icon: body.icon ? String(body.icon).slice(0, 32) : undefined,
      parentFolderId: body.parentFolderId && isValidObjectId(body.parentFolderId) ? body.parentFolderId : null,
      order: typeof body.order === 'number' ? body.order : existing,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    const result = await folders.insertOne(folder)
    return NextResponse.json({ folder: normalizeFolderForResponse({ ...folder, _id: result.insertedId }) }, { status: 201 })
  } catch (error: any) {
    console.error('Erro ao criar pasta:', error)
    return NextResponse.json({ error: error.message || 'Erro ao criar pasta' }, { status: 500 })
  }
}
