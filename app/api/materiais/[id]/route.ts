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

    // Check purchase — includes manual admin grants (source: 'manual').
    // Two separate queries (userId and userEmail) to avoid any $or index quirks.
    let isPurchased = false
    if (!isAdmin) {
      const baseFilter = { itemId: id, itemType: 'material', status: 'completed' }

      const byUserId = await db.collection('material_purchases').findOne({
        ...baseFilter,
        userId: session.userId,
      })

      if (byUserId) {
        isPurchased = true
      } else if (session.email) {
        const emailRegex = new RegExp(`^${session.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
        const byEmail = await db.collection('material_purchases').findOne({
          ...baseFilter,
          userEmail: { $regex: emailRegex },
        })
        isPurchased = !!byEmail
      }
    }

    // Access = purchased/granted OR (group member AND free content)
    const canAccess = isAdmin || isPurchased || (hasGroupAccess && material.pricing === 'free')

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

    const res = NextResponse.json({
      material: { ...safeMaterial, _id: String(safeMaterial._id) },
      hasAccess: canAccess,
      isPurchased,
      hasGroupAccess,
      userGroups,
      watermark: {
        name: userDoc?.name || session.name || 'Usuário',
        cpf: userDoc?.cpf || '',
      },
    })
    res.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate')
    return res
  } catch (error) {
    console.error('Error fetching material:', error)
    return NextResponse.json({ error: 'Erro ao buscar material' }, { status: 500 })
  }
}
