import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { MANUAL_CLINICO_PURCHASES_COLLECTION } from '@/lib/manual-clinico-product'

export const dynamic = 'force-dynamic'

// GET - Listar compras do usuário
export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const db = await getDb()

    const [materialPurchases, manualPurchases] = await Promise.all([
      db
      .collection('material_purchases')
      .find({
        userId: session.userId,
        status: 'completed',
      })
      .sort({ purchasedAt: -1 })
        .toArray(),
      db
        .collection(MANUAL_CLINICO_PURCHASES_COLLECTION)
        .find({
          userId: session.userId,
          status: 'completed',
        })
        .sort({ purchasedAt: -1 })
        .toArray(),
    ])

    const purchases = [
      ...materialPurchases.map((purchase: any) => ({
        ...purchase,
        _id: String(purchase._id),
        purchaseType: 'material',
      })),
      ...manualPurchases.map((purchase: any) => ({
        ...purchase,
        _id: String(purchase._id),
        purchaseType: 'product',
        itemType: 'manual_clinico',
        itemId: purchase.productId,
        itemTitle: purchase.productTitle,
        price: purchase.price,
        purchasedAt: purchase.purchasedAt,
        status: purchase.status,
      })),
    ].sort((a: any, b: any) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime())

    return NextResponse.json({ purchases })
  } catch (error) {
    console.error('Error fetching purchases:', error)
    return NextResponse.json({ error: 'Erro ao buscar compras' }, { status: 500 })
  }
}
