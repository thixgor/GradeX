import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import {
  getManualClinicoConfig,
  grantManualClinicoAccess,
  MANUAL_CLINICO_FREE_QUOTA_COLLECTION,
  MANUAL_CLINICO_PRODUCT_ID,
  MANUAL_CLINICO_PURCHASES_COLLECTION,
} from '@/lib/manual-clinico-product'
import { audit } from '@/lib/payments/audit'
import type { ManualClinicoFreeQuota, ManualClinicoPurchase } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const GrantSchema = z.object({
  userId: z.string().optional(),
  email: z.string().email().optional(),
}).refine((value) => value.userId || value.email, {
  message: 'Informe o usuario ou e-mail.',
})

const RevokeSchema = z.object({
  purchaseId: z.string().optional(),
  userId: z.string().optional(),
  email: z.string().email().optional(),
}).refine((value) => value.purchaseId || value.userId || value.email, {
  message: 'Informe o acesso, usuario ou e-mail.',
})

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function serializePurchase(purchase: ManualClinicoPurchase) {
  return {
    ...purchase,
    _id: purchase._id ? String(purchase._id) : undefined,
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const q = (searchParams.get('q') || '').trim()
    const limit = Math.min(Math.max(Number(searchParams.get('limit') || 50), 1), 100)
    const regex = q ? new RegExp(escapeRegex(q), 'i') : null

    const db = await getDb()
    const purchaseFilter: any = {
      productId: MANUAL_CLINICO_PRODUCT_ID,
      status: 'completed',
    }
    const quotaFilter: any = {
      productId: MANUAL_CLINICO_PRODUCT_ID,
    }
    if (regex) {
      const identitySearch = [
        { userName: regex },
        { userEmail: regex },
        { userId: regex },
      ]
      purchaseFilter.$or = identitySearch
      quotaFilter.$or = identitySearch
    }

    const [purchases, quotaUsers, premiumAccessCount, quotaUserCount] = await Promise.all([
      db.collection<ManualClinicoPurchase>(MANUAL_CLINICO_PURCHASES_COLLECTION)
        .find(purchaseFilter, {
          projection: {
            userId: 1,
            userName: 1,
            userEmail: 1,
            productTitle: 1,
            price: 1,
            provider: 1,
            providerOrderId: 1,
            paymentMethod: 1,
            couponCode: 1,
            accessType: 1,
            purchasedAt: 1,
            expiresAt: 1,
            grantedByName: 1,
          },
        })
        .sort({ purchasedAt: -1 })
        .limit(limit)
        .toArray(),
      db.collection<ManualClinicoFreeQuota>(MANUAL_CLINICO_FREE_QUOTA_COLLECTION)
        .aggregate([
          { $match: quotaFilter },
          { $sort: { lastClaimedAt: -1, updatedAt: -1 } },
          { $limit: limit },
          {
            $project: {
              userId: 1,
              userName: 1,
              userEmail: 1,
              claimedCount: { $size: { $ifNull: ['$claimedSlugs', []] } },
              claimedSlugsPreview: { $slice: [{ $ifNull: ['$claimedSlugs', []] }, 8] },
              createdAt: 1,
              updatedAt: 1,
              lastClaimedAt: 1,
            },
          },
        ])
        .toArray(),
      db.collection<ManualClinicoPurchase>(MANUAL_CLINICO_PURCHASES_COLLECTION).countDocuments({
        productId: MANUAL_CLINICO_PRODUCT_ID,
        status: 'completed',
      }),
      db.collection<ManualClinicoFreeQuota>(MANUAL_CLINICO_FREE_QUOTA_COLLECTION).countDocuments({
        productId: MANUAL_CLINICO_PRODUCT_ID,
      }),
    ])

    return NextResponse.json({
      purchases: purchases.map(serializePurchase),
      quotaUsers: quotaUsers.map((quota: any) => ({
        ...quota,
        _id: quota._id ? String(quota._id) : undefined,
      })),
      stats: {
        premiumAccessCount,
        quotaUserCount,
      },
    })
  } catch (error) {
    console.error('[admin/manual-clinico/access] GET:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = GrantSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados invalidos' }, { status: 400 })
    }

    const db = await getDb()
    const filter: any = parsed.data.userId && ObjectId.isValid(parsed.data.userId)
      ? { _id: new ObjectId(parsed.data.userId) }
      : { email: { $regex: new RegExp(`^${escapeRegex(String(parsed.data.email))}$`, 'i') } }

    const user = await db.collection('users').findOne(filter, { projection: { name: 1, email: 1 } })
    if (!user) {
      return NextResponse.json({ error: 'Usuario nao encontrado.' }, { status: 404 })
    }

    const config = await getManualClinicoConfig(db)
    const purchase = await grantManualClinicoAccess(db, {
      userId: String(user._id),
      userName: user.name || '',
      userEmail: user.email || '',
      config,
      price: 0,
      provider: 'manual_admin',
      grantedBy: session.userId,
      grantedByName: session.name,
    })

    return NextResponse.json({ success: true, purchase: serializePurchase(purchase) })
  } catch (error) {
    console.error('[admin/manual-clinico/access] POST:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Body invalido' }, { status: 400 })
    }

    const parsed = RevokeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados invalidos' }, { status: 400 })
    }

    const db = await getDb()
    const filter: any = {
      productId: MANUAL_CLINICO_PRODUCT_ID,
      status: 'completed',
    }

    if (parsed.data.purchaseId) {
      if (!ObjectId.isValid(parsed.data.purchaseId)) {
        return NextResponse.json({ error: 'Acesso invalido.' }, { status: 400 })
      }
      filter._id = new ObjectId(parsed.data.purchaseId)
    } else if (parsed.data.userId) {
      filter.userId = parsed.data.userId
    } else if (parsed.data.email) {
      filter.userEmail = { $regex: new RegExp(`^${escapeRegex(parsed.data.email)}$`, 'i') }
    }

    const now = new Date()
    const result = await db.collection<ManualClinicoPurchase>(MANUAL_CLINICO_PURCHASES_COLLECTION).updateMany(
      filter,
      {
        $set: {
          status: 'revoked',
          revokedAt: now,
          revokedBy: session.userId,
          revokedByName: session.name,
        },
      }
    )

    await audit({
      action: 'manual_clinico_revoked',
      actorUserId: session.userId,
      targetUserId: parsed.data.userId,
      resourceType: 'product',
      resourceId: MANUAL_CLINICO_PRODUCT_ID,
      metadata: {
        purchaseId: parsed.data.purchaseId,
        email: parsed.data.email,
        revokedCount: result.modifiedCount,
      },
    })

    return NextResponse.json({ success: true, revokedCount: result.modifiedCount })
  } catch (error) {
    console.error('[admin/manual-clinico/access] DELETE:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
