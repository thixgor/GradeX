import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import {
  getManualClinicoConfig,
  getManualClinicoCurrentPrice,
  MANUAL_CLINICO_PURCHASES_COLLECTION,
  serializeManualClinicoProduct,
  upsertManualClinicoConfig,
} from '@/lib/manual-clinico-product'
import type { ManualClinicoPurchase } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const Schema = z.object({
  label: z.string().min(3).max(80),
  benefitText: z.string().min(3).max(140),
  shortDescription: z.string().min(3).max(260),
  ctaText: z.string().min(3).max(80),
  coverImageUrl: z.string().max(500).optional().nullable(),
  fullPdfButtonEnabled: z.boolean().optional(),
  fullPdfExternalUrl: z.string().max(1000).optional().nullable(),
  isActive: z.boolean(),
  price: z.number().min(0),
  promotionalPrice: z.number().min(0).nullable().optional(),
  promotionEndsAt: z.string().nullable().optional(),
  allowCoupons: z.boolean(),
  lifetimeAccess: z.boolean(),
  freeAccessMode: z.enum(['quantity', 'list']),
  freeQuantity: z.number().int().min(0).max(1000),
  freePathologySlugs: z.array(z.string().min(1)).max(1000),
})

function serializeDate(value?: Date | string | null) {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const db = await getDb()
    const [config, pathologyCount, buyerCount] = await Promise.all([
      getManualClinicoConfig(db),
      db.collection('patologias').countDocuments({}),
      db.collection<ManualClinicoPurchase>(MANUAL_CLINICO_PURCHASES_COLLECTION).countDocuments({
        status: 'completed',
      }),
    ])

    const freeCount = config.freeAccessMode === 'list'
      ? config.freePathologySlugs.length
      : 0

    return NextResponse.json({
      config: {
        ...config,
        _id: config._id ? String(config._id) : undefined,
        promotionEndsAt: serializeDate(config.promotionEndsAt),
        createdAt: serializeDate(config.createdAt),
        updatedAt: serializeDate(config.updatedAt),
      },
      product: serializeManualClinicoProduct(config),
      stats: {
        pathologyCount,
        freeCount,
        lockedCount: Math.max(0, pathologyCount - freeCount),
        buyerCount,
        currentPrice: getManualClinicoCurrentPrice(config),
        freeQuotaPerUser: config.freeAccessMode === 'quantity' ? config.freeQuantity : 0,
      },
    })
  } catch (error) {
    console.error('[admin/manual-clinico/product] GET:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = Schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados invalidos', details: parsed.error.format() }, { status: 400 })
    }

    const db = await getDb()
    const saved = await upsertManualClinicoConfig(db, parsed.data as any, session)
    return NextResponse.json({
      success: true,
      config: {
        ...saved,
        _id: saved._id ? String(saved._id) : undefined,
        promotionEndsAt: serializeDate(saved.promotionEndsAt),
        createdAt: serializeDate(saved.createdAt),
        updatedAt: serializeDate(saved.updatedAt),
      },
      product: serializeManualClinicoProduct(saved),
    })
  } catch (error) {
    console.error('[admin/manual-clinico/product] PUT:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
