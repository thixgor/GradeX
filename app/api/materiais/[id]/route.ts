import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { id } = params
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const db = await getDb()
    const isAdmin = session.role === 'admin'

    // Fetch user from DB for group access and watermark data
    const userDoc = await db.collection('users').findOne(
      { _id: new ObjectId(session.userId) },
      { projection: { accountType: 1, secondaryRole: 1, name: 1, cpf: 1 } }
    )

    const userGroups: string[] = []
    if (!isAdmin && userDoc) {
      if (userDoc.accountType) userGroups.push(userDoc.accountType)
      if (userDoc.secondaryRole === 'monitor') userGroups.push('monitor')
    }

    const material = await db.collection('materials').findOne({
      _id: new ObjectId(id),
      ...(isAdmin ? {} : { isHidden: false }),
    })

    if (!material) {
      return NextResponse.json({ error: 'Material não encontrado' }, { status: 404 })
    }

    // Check group access
    const hasGroupAccess =
      isAdmin ||
      !material.allowedGroups?.length ||
      userGroups.some((g) => material.allowedGroups.includes(g))

    // Check purchase
    let isPurchased = false
    if (!isAdmin && material.pricing === 'paid') {
      const purchase = await db.collection('material_purchases').findOne({
        userId: session.userId,
        itemId: id,
        itemType: 'material',
        status: 'completed',
      })
      isPurchased = !!purchase
    }

    const canAccess = isAdmin || (hasGroupAccess && (material.pricing === 'free' || isPurchased))

    // Security: strip embed URL from video_embed if no access
    const safeMaterial =
      !canAccess && material.type === 'video_embed'
        ? { ...material, downloadUrl: '' }
        : material

    // Increment view count (fire and forget)
    db.collection('materials').updateOne(
      { _id: new ObjectId(id) },
      { $inc: { viewCount: 1 } }
    ).catch(() => {})

    return NextResponse.json({
      material: safeMaterial,
      hasAccess: canAccess,
      isPurchased,
      hasGroupAccess,
      userGroups,
      watermark: {
        name: userDoc?.name || session.name || 'Usuário',
        cpf: userDoc?.cpf || '',
      },
    })
  } catch (error) {
    console.error('Error fetching material:', error)
    return NextResponse.json({ error: 'Erro ao buscar material' }, { status: 500 })
  }
}
