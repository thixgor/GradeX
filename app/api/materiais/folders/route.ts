import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

// GET - Listar pastas
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const db = await getDb()
    const { searchParams } = new URL(request.url)
    const parentFolderId = searchParams.get('parentFolderId')
    const all = searchParams.get('all')

    const isAdmin = session.role === 'admin'
    const filter: any = {}

    if (!isAdmin) {
      filter.isHidden = false
    }

    // Se all=true (admin), retorna todas as pastas para montar árvore
    if (all !== 'true') {
      if (parentFolderId) {
        filter.parentFolderId = parentFolderId
      } else {
        filter.$or = [
          { parentFolderId: null },
          { parentFolderId: { $exists: false } },
        ]
      }
    }

    const folders = await db
      .collection('material_folders')
      .find(filter)
      .sort({ order: 1, name: 1 })
      .toArray()

    return NextResponse.json({ folders })
  } catch (error) {
    console.error('Error fetching folders:', error)
    return NextResponse.json({ error: 'Erro ao buscar pastas' }, { status: 500 })
  }
}

// POST - Criar pasta (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const db = await getDb()
    const body = await request.json()

    const folder = {
      name: body.name,
      description: body.description || '',
      coverImage: body.coverImage || '',
      color: body.color || '#468152',
      icon: body.icon || '📁',
      parentFolderId: body.parentFolderId || null,
      moduloId: body.moduloId || '',
      order: body.order || 0,
      isHidden: body.isHidden || false,
      createdBy: session.userId,
      createdByName: session.name,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection('material_folders').insertOne(folder)

    return NextResponse.json({ _id: result.insertedId, ...folder }, { status: 201 })
  } catch (error) {
    console.error('Error creating folder:', error)
    return NextResponse.json({ error: 'Erro ao criar pasta' }, { status: 500 })
  }
}

// PUT - Atualizar pasta (admin only)
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const db = await getDb()
    const body = await request.json()
    const { _id, ...updates } = body

    if (!_id) {
      return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })
    }

    updates.updatedAt = new Date()

    await db.collection('material_folders').updateOne(
      { _id: new ObjectId(_id) },
      { $set: updates }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating folder:', error)
    return NextResponse.json({ error: 'Erro ao atualizar pasta' }, { status: 500 })
  }
}

// DELETE - Deletar pasta (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const db = await getDb()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })
    }

    // Mover materiais da pasta para raiz
    await db.collection('materials').updateMany(
      { folderId: id },
      { $set: { folderId: null, updatedAt: new Date() } }
    )

    // Mover subpastas para raiz
    await db.collection('material_folders').updateMany(
      { parentFolderId: id },
      { $set: { parentFolderId: null, updatedAt: new Date() } }
    )

    await db.collection('material_folders').deleteOne({ _id: new ObjectId(id) })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting folder:', error)
    return NextResponse.json({ error: 'Erro ao deletar pasta' }, { status: 500 })
  }
}
