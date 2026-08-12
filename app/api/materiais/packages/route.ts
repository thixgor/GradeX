import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { computeEffectivePackagePrice } from '@/lib/material-package-pricing'
import { getPricingEventStatesByIds, serializePricingEventState } from '@/lib/pricing-events'
import { expandUserAccessGroups, isPlusAccount } from '@/lib/account-tier'
import {
  activeAccessFilter,
  sanitizeTimedAccessVersions,
  serializeTimedAccessVersions,
  summarizeTimedAccess,
} from '@/lib/material-timed-access'

export const dynamic = 'force-dynamic'

// GET - Listar pacotes
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    const isAuthenticated = !!session

    const db = await getDb()
    const isAdmin = session?.role === 'admin'

    // Fetch user groups for access control
    let userGroups: string[] = []
    let isPlus = false
    if (session && !isAdmin) {
      const user = await db.collection('users').findOne(
        { _id: new ObjectId(session.userId) },
        { projection: { accountType: 1, secondaryRole: 1 } }
      )
      if (user) {
        // Inclui os aliases legados para que um assinante Plus+ continue
        // enxergando itens marcados como premium/essential.
        userGroups = expandUserAccessGroups(user.accountType, user.secondaryRole)
        isPlus = isPlusAccount(user.accountType)
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
    // Two separate queries (userId and userEmail) to avoid any $or index quirks.
    let purchasedPackageIds: string[] = []
    let purchasedMaterialIds: string[] = []
    /** packageId → prazo restante, quando a compra foi por tempo limitado. */
    const timedAccessByPackageId: Record<string, any> = {}
    if (session && !isAdmin) {
      // Compra por tempo vencida não conta como posse.
      const baseFilter = { status: 'completed', ...activeAccessFilter() }
      const accessProjection = {
        itemId: 1,
        itemType: 1,
        accessMode: 1,
        accessVersionId: 1,
        accessVersionLabel: 1,
        accessDurationMinutes: 1,
        accessStartsAt: 1,
        accessExpiresAt: 1,
      }

      const byUserId = await db
        .collection('material_purchases')
        .find({
          ...baseFilter,
          userId: session.userId,
          itemType: { $in: ['package', 'material'] },
        })
        .project(accessProjection)
        .toArray()

      let byEmail: any[] = []
      if (session.email) {
        const emailRegex = new RegExp(`^${session.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
        byEmail = await db
          .collection('material_purchases')
          .find({
            ...baseFilter,
            userEmail: { $regex: emailRegex },
            itemType: { $in: ['package', 'material'] },
          })
          .project(accessProjection)
          .toArray()
      }

      const purchases = [...byUserId, ...byEmail]
      purchasedPackageIds = [...new Set(
        purchases
          .filter((p: any) => p.itemType === 'package')
          .map((p: any) => String(p.itemId))
      )]
      purchasedMaterialIds = [...new Set(
        purchases
          .filter((p: any) => p.itemType === 'material')
          .map((p: any) => String(p.itemId))
      )]

      for (const purchase of purchases.filter((p: any) => p.itemType === 'package')) {
        const status = summarizeTimedAccess(purchase)
        if (!status) continue
        const key = String(purchase.itemId)
        const current = timedAccessByPackageId[key]
        if (!current || status.remainingMs > current.remainingMs) {
          timedAccessByPackageId[key] = status
        }
      }
    }

    // Server is the source of truth for access — attach flags per package
    const purchasedSet = new Set(purchasedPackageIds)
    const purchasedMaterialSet = new Set(purchasedMaterialIds)

    // Resolve pricing event states (batch) for packages that have a pricingEventId
    const pkgEventIds = packages
      .map((p: any) => p.pricingEventId)
      .filter((id: any): id is string => !!id)
    const pkgEventStates = pkgEventIds.length > 0
      ? await getPricingEventStatesByIds(db, pkgEventIds)
      : new Map()

    const packagesWithMaterials = packages.map((pkg: any) => {
      const idStr = String(pkg._id)
      const hasGroupAccess =
        isAdmin ||
        !pkg.allowedGroups?.length ||
        userGroups.some((g: string) => pkg.allowedGroups.includes(g))
      const isPurchased = isAdmin || purchasedSet.has(idStr)
      // Plus+ inclui, mas o acesso só vale após o resgate (ver
      // POST /api/materiais/resgatar).
      const hasAccess = isAuthenticated && (isAdmin || isPurchased || (hasGroupAccess && pkg.pricing !== 'paid'))
      const includedInPlus = isPlus && !hasAccess
      const materials = (pkg.materialIds || []).map((id: string) => materialsMap[id]).filter(Boolean)
      const pricing = computeEffectivePackagePrice({
        pkgPrice: Number(pkg.price || 0),
        materials: materials.map((m: any) => ({
          _id: String(m._id),
          pricing: m.pricing,
          price: Number(m.price || 0),
        })),
        ownedMaterialIds: purchasedMaterialSet,
      })

      const pricingEventState = pkg.pricingEventId
        ? pkgEventStates.get(String(pkg.pricingEventId)) || null
        : null

      return {
        ...pkg,
        _id: idStr,
        materials,
        _isPurchased: isPurchased,
        _hasGroupAccess: hasGroupAccess,
        _hasAccess: hasAccess,
        _includedInPlus: includedInPlus,
        _pricing: pricing,
        _pricingEventState: serializePricingEventState(pricingEventState),
        _timedAccessVersions: serializeTimedAccessVersions(pkg),
        _timedAccess: timedAccessByPackageId[idStr] || null,
      }
    })

    const res = NextResponse.json({
      packages: packagesWithMaterials,
      purchasedPackageIds,
      userGroups,
      isAuthenticated,
    })
    res.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate')
    return res
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
      autoEmailPdfOnPurchase: body.autoEmailPdfOnPurchase === true,
      allowedGroups: body.allowedGroups || [],
      pricing: body.pricing || 'free',
      price: body.pricing === 'paid' ? (body.price || 0) : 0,
      originalPrice: body.originalPrice || 0,
      pricingEventId: body.pricingEventId ? String(body.pricingEventId) : null,
      timedAccessVersions: sanitizeTimedAccessVersions(body.timedAccessVersions),
      stripePriceId: body.stripePriceId || '',
      excludeFromCommission: body.excludeFromCommission === true,
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
    if ('pricingEventId' in updates) {
      updates.pricingEventId = updates.pricingEventId ? String(updates.pricingEventId) : null
    }
    if ('autoEmailPdfOnPurchase' in updates) {
      updates.autoEmailPdfOnPurchase = updates.autoEmailPdfOnPurchase === true
    }
    if ('excludeFromCommission' in updates) {
      updates.excludeFromCommission = updates.excludeFromCommission === true
    }
    if ('timedAccessVersions' in updates) {
      updates.timedAccessVersions = sanitizeTimedAccessVersions(updates.timedAccessVersions)
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
