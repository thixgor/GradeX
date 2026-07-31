import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { FLASHCARD_MANUAL_COLLECTIONS, normalizeDeckForResponse, getUserGroups } from '@/lib/flashcard-manual'
import { ObjectId } from 'mongodb'
import type { FlashcardManualDeck } from '@/lib/types'

export const dynamic = 'force-dynamic'

// GET — lista decks comerciais (admin) que o usuário pode comprar/acessar
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    const isAuthenticated = !!session
    const isAdmin = session?.role === 'admin'

    const db = await getDb()
    const userDoc = session ? await db.collection('users').findOne(
      { _id: new ObjectId(session.userId) },
      { projection: { accountType: 1, secondaryRole: 1, email: 1 } }
    ) : null
    const userGroups = getUserGroups(userDoc as any)

    const filter: any = {
      ownerType: 'admin',
      isHidden: false,
      visibility: { $ne: 'private' },
    }

    const decks = await db
      .collection<FlashcardManualDeck>(FLASHCARD_MANUAL_COLLECTIONS.decks)
      .find(filter)
      .sort({ isFeatured: -1, createdAt: -1 })
      .toArray()

    // Determina compras do usuário (somente decks pagos linkados a /materiais)
    const purchasedSet = new Set<string>()
    if (session && !isAdmin) {
      const linkedIds = decks.map(d => d.linkedMaterialId).filter(Boolean) as string[]
      if (linkedIds.length > 0) {
        const baseFilter: any = { itemType: 'material', status: 'completed' }
        const purchases = await db.collection('material_purchases').find({
          ...baseFilter,
          itemId: { $in: linkedIds },
          $or: [
            { userId: session.userId },
            ...(userDoc?.email ? [{ userEmail: { $regex: new RegExp(`^${String(userDoc.email).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } }] : []),
          ],
        }).project({ itemId: 1 }).toArray()
        purchases.forEach((p: any) => purchasedSet.add(String(p.itemId)))

        const packages = await db.collection('material_packages')
          .find({ materialIds: { $in: linkedIds }, isHidden: { $ne: true } })
          .project({ _id: 1, materialIds: 1 })
          .toArray()
        const packageIds = packages.map((pkg: any) => String(pkg._id))

        if (packageIds.length > 0) {
          const packagePurchases = await db.collection('material_purchases').find({
            itemType: 'package',
            status: 'completed',
            itemId: { $in: packageIds },
            $or: [
              { userId: session.userId },
              ...(userDoc?.email ? [{ userEmail: { $regex: new RegExp(`^${String(userDoc.email).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } }] : []),
            ],
          }).project({ itemId: 1 }).toArray()
          const purchasedPackageIds = new Set(packagePurchases.map((purchase: any) => String(purchase.itemId)))
          packages.forEach((pkg: any) => {
            if (!purchasedPackageIds.has(String(pkg._id))) return
            ;(pkg.materialIds || []).forEach((materialId: string) => purchasedSet.add(String(materialId)))
          })
        }
      }
    }

    // Deck pago é liberado pelo resgate do material vinculado, não pelo cargo.
    const isPlus = userGroups.includes('plus')

    const enriched = decks.map(d => {
      const allowedGroups = (d.allowedGroups || []) as string[]
      const hasGroupAccess = allowedGroups.length === 0 || userGroups.some(g => allowedGroups.includes(g))
      const isPurchased = isAdmin || (!!d.linkedMaterialId && purchasedSet.has(d.linkedMaterialId))
      const isFreeForUser = d.pricing === 'free' && hasGroupAccess
      const hasAccess = isAuthenticated && (isAdmin || isPurchased || isFreeForUser)
      const includedInPlus = isPlus && !hasAccess
      return {
        ...normalizeDeckForResponse(d),
        _isPurchased: isPurchased,
        _hasGroupAccess: hasGroupAccess,
        _hasAccess: hasAccess,
        _includedInPlus: includedInPlus,
      }
    })

    const res = NextResponse.json({ decks: enriched, userGroups, isAuthenticated })
    res.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate')
    return res
  } catch (error) {
    console.error('Erro ao listar loja de flashcards:', error)
    return NextResponse.json({ error: 'Erro ao listar loja' }, { status: 500 })
  }
}
