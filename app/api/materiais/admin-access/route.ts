import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

// GET - Listar todos os acessos de um material/pacote (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const db = await getDb()
    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('itemId')
    const itemType = searchParams.get('itemType') // 'material' | 'package'

    if (!itemId || !itemType) {
      return NextResponse.json({ error: 'itemId e itemType são obrigatórios' }, { status: 400 })
    }

    const purchases = await db
      .collection('material_purchases')
      .find({ itemId, itemType, status: 'completed' })
      .sort({ purchasedAt: -1 })
      .toArray()

    // Enriquecer com dados atuais do usuário (accountType)
    const userIds = [...new Set(purchases.map((p: any) => p.userId))]
    const users = userIds.length
      ? await db.collection('users').find(
          { _id: { $in: userIds.map(id => { try { return new ObjectId(id) } catch { return null } }).filter(Boolean) as ObjectId[] } },
          { projection: { name: 1, email: 1, accountType: 1, secondaryRole: 1 } }
        ).toArray()
      : []

    const usersMap: Record<string, any> = {}
    users.forEach((u: any) => { usersMap[u._id.toString()] = u })

    const enriched = purchases.map((p: any) => ({
      ...p,
      _id: p._id.toString(),
      userAccountType: usersMap[p.userId]?.accountType || null,
      userSecondaryRole: usersMap[p.userId]?.secondaryRole || null,
    }))

    return NextResponse.json({ purchases: enriched })
  } catch (error) {
    console.error('Error fetching admin access:', error)
    return NextResponse.json({ error: 'Erro ao buscar acessos' }, { status: 500 })
  }
}

// POST - Conceder acesso manual a um usuário (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const db = await getDb()
    const { itemId, itemType, userEmail } = await request.json()

    if (!itemId || !itemType || !userEmail) {
      return NextResponse.json({ error: 'itemId, itemType e userEmail são obrigatórios' }, { status: 400 })
    }

    // Buscar usuário pelo email
    const user = await db.collection('users').findOne(
      { email: userEmail.toLowerCase().trim() },
      { projection: { _id: 1, name: 1, email: 1 } }
    )

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado com este e-mail' }, { status: 404 })
    }

    const userId = user._id.toString()

    // Verificar se já tem acesso
    const existing = await db.collection('material_purchases').findOne({
      userId,
      itemType,
      itemId,
      status: 'completed',
    })

    if (existing) {
      return NextResponse.json({ error: 'Usuário já possui acesso a este item' }, { status: 400 })
    }

    // Buscar item para título
    const collection = itemType === 'package' ? 'material_packages' : 'materials'
    const item = await db.collection(collection).findOne(
      { _id: new ObjectId(itemId) },
      { projection: { title: 1 } }
    )

    await db.collection('material_purchases').insertOne({
      userId,
      userName: user.name,
      userEmail: user.email,
      itemType,
      itemId,
      itemTitle: item?.title || '',
      price: 0,
      grantedByAdmin: session.userId,
      grantedByAdminName: session.name,
      source: 'manual',
      status: 'completed',
      purchasedAt: new Date(),
    })

    return NextResponse.json({ success: true, userName: user.name, userEmail: user.email })
  } catch (error) {
    console.error('Error granting access:', error)
    return NextResponse.json({ error: 'Erro ao conceder acesso' }, { status: 500 })
  }
}

// DELETE - Revogar acesso (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const db = await getDb()
    const { searchParams } = new URL(request.url)
    const purchaseId = searchParams.get('purchaseId')

    if (!purchaseId) {
      return NextResponse.json({ error: 'purchaseId obrigatório' }, { status: 400 })
    }

    await db.collection('material_purchases').deleteOne({ _id: new ObjectId(purchaseId) })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error revoking access:', error)
    return NextResponse.json({ error: 'Erro ao revogar acesso' }, { status: 500 })
  }
}
