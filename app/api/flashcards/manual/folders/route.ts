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
    const scope = request.nextUrl.searchParams.get('scope')
    const db = await getDb()

    if (scope === 'admin') {
      // Retorna todas as pastas oficiais (ownerType=admin) — visível a qualquer usuário autenticado
      const folders = await db
        .collection<FlashcardManualFolder>(FLASHCARD_MANUAL_COLLECTIONS.folders)
        .find({ ownerType: 'admin' })
        .sort({ order: 1, createdAt: 1 })
        .toArray()
      return NextResponse.json({ folders: folders.map(normalizeFolderForResponse) })
    }

    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    // Pastas pessoais do usuário
    const folders = await db
      .collection<FlashcardManualFolder>(FLASHCARD_MANUAL_COLLECTIONS.folders)
      .find({ ownerId: session.userId, ownerType: { $ne: 'admin' } })
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
    const asAdminFolder = isAdmin && body.ownerType === 'admin'

    if (!asAdminFolder) {
      // Verificar limite de pastas pessoais
      const user = await db.collection('users').findOne({ _id: new ObjectId(session.userId) })
      const limits = getFlashcardManualLimits(user?.accountType, isAdmin)
      const folders = db.collection<FlashcardManualFolder>(FLASHCARD_MANUAL_COLLECTIONS.folders)
      const existing = await folders.countDocuments({ ownerId: session.userId, ownerType: { $ne: 'admin' } })
      if (existing >= limits.maxFolders) {
        return NextResponse.json({ error: `Limite de pastas atingido (${limits.maxFolders}).`, requiresUpgrade: true }, { status: 403 })
      }
    } else if (!isAdmin) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const folders = db.collection<FlashcardManualFolder>(FLASHCARD_MANUAL_COLLECTIONS.folders)

    // Validar parentFolderId — se pasta admin, parent também deve ser admin
    let parentFolderId: string | null = null
    if (body.parentFolderId && isValidObjectId(body.parentFolderId)) {
      if (asAdminFolder) {
        const parent = await folders.findOne({ _id: new ObjectId(body.parentFolderId), ownerType: 'admin' })
        if (parent) parentFolderId = body.parentFolderId
      } else {
        const parent = await folders.findOne({ _id: new ObjectId(body.parentFolderId), ownerId: session.userId })
        if (parent) parentFolderId = body.parentFolderId
      }
    }

    const countFilter = asAdminFolder
      ? { ownerType: 'admin', parentFolderId }
      : { ownerId: session.userId, parentFolderId }
    const siblingCount = await folders.countDocuments(countFilter as any)

    const folder: FlashcardManualFolder = {
      ownerId: session.userId,
      ownerType: asAdminFolder ? 'admin' : 'user',
      name,
      color: body.color ? String(body.color).slice(0, 16) : undefined,
      icon: body.icon ? String(body.icon).slice(0, 32) : undefined,
      parentFolderId,
      order: typeof body.order === 'number' ? body.order : siblingCount,
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
