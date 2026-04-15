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

    // Se não for admin, verificar quais o usuário já comprou.
    // Two separate queries (userId and userEmail) then merge, to avoid any $or
    // index quirks and ensure manual admin grants are always detected.
    let purchasedIds: string[] = []
    if (!isAdmin) {
      const baseFilter = { itemType: 'material', status: 'completed' }

      // Query by userId (primary — always present)
      const byUserId = await db
        .collection('material_purchases')
        .find({ ...baseFilter, userId: session.userId })
        .project({ itemId: 1 })
        .toArray()

      // Query by userEmail as fallback (covers edge-cases where userId wasn't stored)
      let byEmail: any[] = []
      if (session.email) {
        const emailRegex = new RegExp(`^${session.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
        byEmail = await db
          .collection('material_purchases')
          .find({ ...baseFilter, userEmail: { $regex: emailRegex } })
          .project({ itemId: 1 })
          .toArray()
      }

      // Merge, deduplicate and normalise to plain strings
      purchasedIds = [...new Set([...byUserId, ...byEmail].map((p: any) => String(p.itemId)))]
    }

    // Security: strip downloadUrl for video_embed materials the user has no access to.
    // A manual purchase grant (source: 'manual') overrides group restrictions.
    const secureMaterials = isAdmin
      ? materials
      : materials.map((m: any) => {
          if (m.type !== 'video_embed') return m
          const hasGroupAccess =
            !m.allowedGroups?.length ||
            userGroups.some((g: string) => m.allowedGroups.includes(g))
          const hasPurchased = purchasedIds.includes(m._id.toString())
          // Access = purchased/granted OR (group member AND free)
          const canAccess = hasPurchased || (hasGroupAccess && m.pricing !== 'paid')
          if (canAccess) return m
          return { ...m, downloadUrl: '' } // never send real embed URL to unauthorized client
        })

    return NextResponse.json({
      materials: secureMaterials,
      purchasedIds,
      userGroups, // groups the current user belongs to (for client-side access check)
      _debug: {
        userId: session.userId,
        email: session.email,
        purchasedCount: purchasedIds.length,
        purchasedIds,
      },
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
