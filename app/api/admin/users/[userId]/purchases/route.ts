import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { getSubscriptionPurchases } from '@/lib/subscription-purchases'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/users/[userId]/purchases
 *
 * Lista as compras concluídas de um usuário específico: materiais/pacotes
 * (material_purchases) e assinaturas de plano Premium/Essential (subscriptions
 * recorrentes + payment_orders de plano único, com a validade de cada uma).
 * Restrito a administradores. Combina a busca por userId e por userEmail
 * para cobrir registros antigos onde o vínculo era apenas pelo email.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const { userId } = params
    if (!userId) {
      return NextResponse.json({ error: 'userId obrigatório' }, { status: 400 })
    }

    const db = await getDb()

    let targetUser: any = null
    if (ObjectId.isValid(userId)) {
      targetUser = await db
        .collection('users')
        .findOne(
          { _id: new ObjectId(userId) },
          { projection: { name: 1, email: 1 } }
        )
    }
    if (!targetUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    const orConditions: any[] = [{ userId }]
    if (targetUser.email) {
      const safeEmail = String(targetUser.email).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      orConditions.push({
        userEmail: { $regex: new RegExp(`^${safeEmail}$`, 'i') },
      })
    }

    const [materialPurchases, subscriptionPurchases] = await Promise.all([
      db
        .collection('material_purchases')
        .find({
          status: 'completed',
          $or: orConditions,
        })
        .sort({ purchasedAt: -1 })
        .toArray(),
      getSubscriptionPurchases(db, { userId: String(targetUser._id), email: targetUser.email }),
    ])

    const purchases = [
      ...materialPurchases.map((p: any) => ({ ...p, _id: String(p._id) })),
      ...subscriptionPurchases,
    ].sort(
      (a: any, b: any) =>
        new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime()
    )

    const totalAmount = purchases.reduce((sum, p: any) => sum + Number(p.price || 0), 0)

    return NextResponse.json({
      user: {
        id: String(targetUser._id),
        name: targetUser.name || '',
        email: targetUser.email || '',
      },
      purchases,
      totalAmount,
      count: purchases.length,
    })
  } catch (error) {
    console.error('[admin/users/purchases] erro:', error)
    return NextResponse.json({ error: 'Erro ao buscar compras' }, { status: 500 })
  }
}
