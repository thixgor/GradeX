import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

// GET - Listar materiais (público para usuários logados)
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const db = await getDb()
    const { searchParams } = new URL(request.url)
    const folderId = searchParams.get('folderId')
    const search = searchParams.get('search')
    const pricing = searchParams.get('pricing') // 'free' | 'paid' | null (all)
    const featured = searchParams.get('featured')
    const moduloId = searchParams.get('moduloId')

    const isAdmin = session.role === 'admin'

    // Fetch user groups for access control
    let userGroups: string[] = []
    if (!isAdmin) {
      const user = await db.collection('users').findOne(
        { _id: new ObjectId(session.userId) },
        { projection: { accountType: 1, secondaryRole: 1 } }
      )
      if (user) {
        if (user.accountType) userGroups.push(user.accountType)
        if (user.secondaryRole === 'monitor') userGroups.push('monitor')
      }
    }

    const filter: any = {}

    // Não-admin só vê materiais visíveis
    if (!isAdmin) {
      filter.isHidden = false
    }

    if (folderId) {
      filter.folderId = folderId
    }

    if (pricing) {
      filter.pricing = pricing
    }

    if (featured === 'true') {
      filter.isFeatured = true
    }

    if (moduloId) {
      filter.moduloId = moduloId
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ]
    }

    const materials = await db
      .collection('materials')
      .find(filter)
      .sort({ isFeatured: -1, order: 1, createdAt: -1 })
      .toArray()

    // Se não for admin, verificar quais o usuário já comprou
    let purchasedIds: string[] = []
    if (!isAdmin) {
      const purchases = await db
        .collection('material_purchases')
        .find({
          userId: session.userId,
          itemType: 'material',
          status: 'completed',
        })
        .project({ itemId: 1 })
        .toArray()
      purchasedIds = purchases.map((p: any) => p.itemId)
    }

    return NextResponse.json({
      materials,
      purchasedIds,
      userGroups, // groups the current user belongs to (for client-side access check)
    })
  } catch (error) {
    console.error('Error fetching materials:', error)
    return NextResponse.json({ error: 'Erro ao buscar materiais' }, { status: 500 })
  }
}

// POST - Criar material (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const db = await getDb()
    const body = await request.json()

    const material = {
      title: body.title,
      description: body.description || '',
      coverImage: body.coverImage || '',
      type: body.type || 'pdf',
      downloadUrl: body.downloadUrl,
      previewUrl: body.previewUrl || '',
      folderId: body.folderId || null,
      moduloId: body.moduloId || '',
      tags: body.tags || [],
      pricing: body.pricing || 'free',
      price: body.pricing === 'paid' ? (body.price || 0) : 0,
      stripePriceId: body.stripePriceId || '',
      allowedGroups: body.allowedGroups || [],
      downloadCount: 0,
      viewCount: 0,
      isHidden: body.isHidden || false,
      isFeatured: body.isFeatured || false,
      order: body.order || 0,
      createdBy: session.userId,
      createdByName: session.name,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection('materials').insertOne(material)

    return NextResponse.json({ _id: result.insertedId, ...material }, { status: 201 })
  } catch (error) {
    console.error('Error creating material:', error)
    return NextResponse.json({ error: 'Erro ao criar material' }, { status: 500 })
  }
}

// PUT - Atualizar material (admin only)
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
    if (updates.pricing === 'free') {
      updates.price = 0
    }

    await db.collection('materials').updateOne(
      { _id: new ObjectId(_id) },
      { $set: updates }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating material:', error)
    return NextResponse.json({ error: 'Erro ao atualizar material' }, { status: 500 })
  }
}

// DELETE - Deletar material (admin only)
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

    // Remover material de pacotes que o contêm
    await db.collection('material_packages').updateMany(
      { materialIds: id },
      { $pull: { materialIds: id } as any }
    )

    await db.collection('materials').deleteOne({ _id: new ObjectId(id) })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting material:', error)
    return NextResponse.json({ error: 'Erro ao deletar material' }, { status: 500 })
  }
}
