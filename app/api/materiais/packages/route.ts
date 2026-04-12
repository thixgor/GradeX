import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

// GET - Listar pacotes
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const db = await getDb()
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
    if (!isAdmin) {
      filter.isHidden = false
    }

    const packages = await db
      .collection('material_packages')
      .find(filter)
      .sort({ isFeatured: -1, order: 1, createdAt: -1 })
      .toArray()

    // Buscar materiais de cada pacote para exibição
    const allMaterialIds = packages.flatMap((p: any) =>
      (p.materialIds || []).map((id: string) => {
        try { return new ObjectId(id) } catch { return null }
      }).filter(Boolean)
    )

    const materialsInPackages = allMaterialIds.length > 0
      ? await db.collection('materials').find({ _id: { $in: allMaterialIds } }).project({ title: 1, coverImage: 1, type: 1, pricing: 1, price: 1 }).toArray()
      : []

    const materialsMap: Record<string, any> = {}
    materialsInPackages.forEach((m: any) => {
      materialsMap[m._id.toString()] = m
    })

    // Verificar compras do usuário
    let purchasedPackageIds: string[] = []
    if (!isAdmin) {
      const purchases = await db
        .collection('material_purchases')
        .find({
          userId: session.userId,
          itemType: 'package',
          status: 'completed',
        })
        .project({ itemId: 1 })
        .toArray()
      purchasedPackageIds = purchases.map((p: any) => p.itemId)
    }

    const packagesWithMaterials = packages.map((pkg: any) => ({
      ...pkg,
      materials: (pkg.materialIds || []).map((id: string) => materialsMap[id]).filter(Boolean),
    }))

    return NextResponse.json({
      packages: packagesWithMaterials,
      purchasedPackageIds,
      userGroups,
    })
  } catch (error) {
    console.error('Error fetching packages:', error)
    return NextResponse.json({ error: 'Erro ao buscar pacotes' }, { status: 500 })
  }
}

// POST - Criar pacote (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const db = await getDb()
    const body = await request.json()

    const pkg = {
      title: body.title,
      description: body.description || '',
      coverImage: body.coverImage || '',
      materialIds: body.materialIds || [],
      tags: body.tags || [],
      allowedGroups: body.allowedGroups || [],
      pricing: body.pricing || 'free',
      price: body.pricing === 'paid' ? (body.price || 0) : 0,
      originalPrice: body.originalPrice || 0,
      stripePriceId: body.stripePriceId || '',
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

    const result = await db.collection('material_packages').insertOne(pkg)

    return NextResponse.json({ _id: result.insertedId, ...pkg }, { status: 201 })
  } catch (error) {
    console.error('Error creating package:', error)
    return NextResponse.json({ error: 'Erro ao criar pacote' }, { status: 500 })
  }
}

// PUT - Atualizar pacote (admin only)
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

    await db.collection('material_packages').updateOne(
      { _id: new ObjectId(_id) },
      { $set: updates }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating package:', error)
    return NextResponse.json({ error: 'Erro ao atualizar pacote' }, { status: 500 })
  }
}

// DELETE - Deletar pacote (admin only)
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

    await db.collection('material_packages').deleteOne({ _id: new ObjectId(id) })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting package:', error)
    return NextResponse.json({ error: 'Erro ao deletar pacote' }, { status: 500 })
  }
}
