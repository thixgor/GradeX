import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import {
  getManualClinicoConfig,
  grantManualClinicoAccess,
  MANUAL_CLINICO_PURCHASES_COLLECTION,
} from '@/lib/manual-clinico-product'
import type { ManualClinicoPurchase } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const GrantSchema = z.object({
  userId: z.string().optional(),
  email: z.string().email().optional(),
}).refine((value) => value.userId || value.email, {
  message: 'Informe o usuario ou e-mail.',
})

function serializePurchase(purchase: ManualClinicoPurchase) {
  return {
    ...purchase,
    _id: purchase._id ? String(purchase._id) : undefined,
  }
}

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const db = await getDb()
    const purchases = await db.collection<ManualClinicoPurchase>(MANUAL_CLINICO_PURCHASES_COLLECTION)
      .find({ status: 'completed' })
      .sort({ purchasedAt: -1 })
      .limit(100)
      .toArray()

    return NextResponse.json({ purchases: purchases.map(serializePurchase) })
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
      : { email: { $regex: new RegExp(`^${String(parsed.data.email).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } }

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
