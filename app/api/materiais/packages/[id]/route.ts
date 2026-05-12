import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { computeEffectivePackagePrice } from '@/lib/material-package-pricing'

export const dynamic = 'force-dynamic'

// GET - Detalhes de um pacote individual + materiais incluídos +
// preço efetivo com desconto proporcional caso o usuário já possua
// algum material do pacote.
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

    const [userDoc, pkg] = await Promise.all([
      db.collection('users').findOne(
        { _id: new ObjectId(session.userId) },
        { projection: { accountType: 1, secondaryRole: 1 } }
      ),
      db.collection('material_packages').findOne({
        _id: new ObjectId(id),
        ...(isAdmin ? {} : { isHidden: false }),
      }),
    ])

    if (!pkg) {
      return NextResponse.json({ error: 'Pacote não encontrado' }, { status: 404 })
    }

    const userGroups: string[] = []
    if (!isAdmin && userDoc) {
      if (userDoc.accountType) userGroups.push(userDoc.accountType)
      if (userDoc.secondaryRole === 'monitor') userGroups.push('monitor')
    }

    // Buscar materiais do pacote
    const materialObjectIds = (pkg.materialIds || [])
      .map((mid: string) => {
        try { return new ObjectId(mid) } catch { return null }
      })
      .filter(Boolean) as ObjectId[]

    const materialDocs = materialObjectIds.length > 0
      ? await db
          .collection('materials')
          .find({ _id: { $in: materialObjectIds } })
          .project({
            title: 1, coverImage: 1, type: 1, pricing: 1, price: 1,
            description: 1, isHidden: 1, allowedGroups: 1,
            videoDuration: 1, tags: 1,
          })
          .toArray()
      : []

    // Preserva a ordem original do pacote e oculta os escondidos para não-admin
    const materialsById: Record<string, any> = {}
    materialDocs.forEach((m: any) => {
      if (!isAdmin && m.isHidden) return
      materialsById[String(m._id)] = m
    })

    const orderedMaterials = (pkg.materialIds || [])
      .map((mid: string) => materialsById[mid])
      .filter(Boolean)
      .map((m: any) => ({
        ...m,
        _id: String(m._id),
      }))

    // ─── Verificar compras do usuário ─────────────────────────
    let purchasedMaterialIds: string[] = []
    let isPackagePurchased = false

    if (isAdmin) {
      isPackagePurchased = true
    } else {
      const matIdsStr = orderedMaterials.map((m: any) => String(m._id))

      // Single query covering both itemTypes via $or, plus a fallback
      // by-email query (mirrors the pattern used in other materiais routes).
      const baseFilter: any = {
        status: 'completed',
        $or: [
          { itemType: 'package', itemId: id },
          ...(matIdsStr.length > 0
            ? [{ itemType: 'material', itemId: { $in: matIdsStr } }]
            : []),
        ],
      }

      const byUserId = await db
        .collection('material_purchases')
        .find({ ...baseFilter, userId: session.userId })
        .project({ itemId: 1, itemType: 1 })
        .toArray()

      let byEmail: any[] = []
      if (session.email) {
        const emailRegex = new RegExp(
          `^${session.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
          'i'
        )
        byEmail = await db
          .collection('material_purchases')
          .find({ ...baseFilter, userEmail: { $regex: emailRegex } })
          .project({ itemId: 1, itemType: 1 })
          .toArray()
      }

      const combined = [...byUserId, ...byEmail]
      for (const p of combined) {
        if (p.itemType === 'package' && String(p.itemId) === id) {
          isPackagePurchased = true
        } else if (p.itemType === 'material') {
          purchasedMaterialIds.push(String(p.itemId))
        }
      }
      purchasedMaterialIds = Array.from(new Set(purchasedMaterialIds))
    }

    // ─── Acesso por grupo ─────────────────────────────────────
    const hasGroupAccess =
      isAdmin ||
      !pkg.allowedGroups?.length ||
      userGroups.some((g: string) => pkg.allowedGroups.includes(g))

    const hasAccess =
      isAdmin || isPackagePurchased || (hasGroupAccess && pkg.pricing !== 'paid')

    // ─── Preço efetivo (desconto proporcional anti-burla) ─────
    const pricing = computeEffectivePackagePrice({
      pkgPrice: Number(pkg.price || 0),
      materials: orderedMaterials,
      ownedMaterialIds: purchasedMaterialIds,
    })

    // Marcar cada material como já adquirido (para a UI)
    const purchasedSet = new Set(purchasedMaterialIds)
    const materialsForClient = orderedMaterials.map((m: any) => {
      const idStr = String(m._id)
      const matGroupAccess =
        isAdmin ||
        !m.allowedGroups?.length ||
        userGroups.some((g: string) => m.allowedGroups.includes(g))
      const matPurchased = isAdmin || purchasedSet.has(idStr)
      const matHasAccess =
        isAdmin ||
        isPackagePurchased ||
        matPurchased ||
        (matGroupAccess && m.pricing !== 'paid')
      return {
        _id: idStr,
        title: m.title,
        description: m.description || '',
        coverImage: m.coverImage || '',
        type: m.type,
        pricing: m.pricing || 'free',
        price: Number(m.price || 0),
        videoDuration: m.videoDuration,
        tags: m.tags || [],
        allowedGroups: m.allowedGroups || [],
        _isPurchased: matPurchased,
        _hasGroupAccess: matGroupAccess,
        _hasAccess: matHasAccess,
      }
    })

    const res = NextResponse.json({
      package: {
        _id: String(pkg._id),
        title: pkg.title,
        description: pkg.description || '',
        coverImage: pkg.coverImage || '',
        tags: pkg.tags || [],
        allowedGroups: pkg.allowedGroups || [],
        pricing: pkg.pricing || 'free',
        price: Number(pkg.price || 0),
        originalPrice: Number(pkg.originalPrice || 0),
        materialIds: pkg.materialIds || [],
        downloadCount: pkg.downloadCount || 0,
        viewCount: pkg.viewCount || 0,
        isFeatured: !!pkg.isFeatured,
        createdAt: pkg.createdAt,
      },
      materials: materialsForClient,
      access: {
        isAdmin,
        isPurchased: isPackagePurchased,
        hasGroupAccess,
        hasAccess,
        userGroups,
      },
      pricing: {
        originalPackagePrice: pricing.originalPackagePrice,
        effectivePrice: pricing.effectivePrice,
        discountApplied: pricing.discountApplied,
        ownedValue: pricing.ownedValue,
        totalPaidIndividualValue: pricing.totalPaidIndividualValue,
        ownedMaterialIds: pricing.ownedMaterialIds,
      },
    })
    res.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate')
    return res
  } catch (error) {
    console.error('Error fetching package detail:', error)
    return NextResponse.json({ error: 'Erro ao buscar pacote' }, { status: 500 })
  }
}
