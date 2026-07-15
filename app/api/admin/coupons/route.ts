import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import {
  addCouponDuration,
  normalizeCouponCode,
  type Coupon,
  type CouponDurationUnit,
  type CouponProductRef,
} from '@/lib/coupons'
import { INSTITUTION_UNITS } from '@/lib/institution-units'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const ProductRefSchema = z.object({
  itemType: z.enum(['material', 'package', 'manual_clinico']),
  itemId: z.string().min(1),
  title: z.string().optional(),
  kind: z.enum(['material', 'flashcard', 'package', 'product']).optional(),
})

const AllowedAfyaUnitsSchema = z.array(z.string())
  .max(INSTITUTION_UNITS.length)
  .default([])
  .transform((units) => Array.from(new Set(units.filter((unit) => INSTITUTION_UNITS.includes(unit)))))

const CouponCreateSchema = z.object({
  code: z.string().min(2).max(40),
  description: z.string().max(140).optional(),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.number().positive(),
  scope: z.enum(['all', 'materials', 'flashcards', 'manual_clinico', 'specific']),
  productRefs: z.array(ProductRefSchema).max(100).optional(),
  usageLimit: z.number().int().positive().nullable().optional(),
  perUserLimit: z.number().int().positive().nullable().optional(),
  minimumCartAmount: z.number().positive().nullable().optional(),
  firstPurchaseOnly: z.boolean().default(false),
  allowedAfyaUnits: AllowedAfyaUnitsSchema,
  allowedManualPlans: z.array(z.enum(['semestral', 'anual', 'vitalicio'])).max(3).optional(),
  stackWithTier: z.boolean().default(false),
  expirationMode: z.enum(['none', 'date', 'duration']).default('none'),
  expiresAt: z.string().optional(),
  durationValue: z.number().int().positive().optional(),
  durationUnit: z.enum(['hours', 'days', 'weeks', 'months']).optional(),
  isActive: z.boolean().default(true),
}).superRefine((data, ctx) => {
  if (data.discountType === 'percentage' && data.discountValue > 100) {
    ctx.addIssue({ code: 'custom', path: ['discountValue'], message: 'Percentual máximo é 100%.' })
  }
  if (data.scope === 'specific' && (!data.productRefs || data.productRefs.length === 0)) {
    ctx.addIssue({ code: 'custom', path: ['productRefs'], message: 'Selecione pelo menos um item.' })
  }
  if (data.expirationMode === 'date' && !data.expiresAt) {
    ctx.addIssue({ code: 'custom', path: ['expiresAt'], message: 'Informe a data de término.' })
  }
  if (data.expirationMode === 'duration' && (!data.durationValue || !data.durationUnit)) {
    ctx.addIssue({ code: 'custom', path: ['durationValue'], message: 'Informe a duração.' })
  }
})

function serializeDate(value?: Date | string | null) {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function serializeCoupon(coupon: Coupon, stats?: any) {
  return {
    id: String(coupon._id),
    code: coupon.code,
    codeNormalized: coupon.codeNormalized,
    description: coupon.description || '',
    discountType: coupon.discountType,
    discountValue: Number(coupon.discountValue || 0),
    scope: coupon.scope,
    productRefs: coupon.productRefs || [],
    usageLimit: coupon.usageLimit ?? null,
    perUserLimit: coupon.perUserLimit ?? null,
    minimumCartAmount: coupon.minimumCartAmount ?? null,
    firstPurchaseOnly: coupon.firstPurchaseOnly === true,
    allowedAfyaUnits: coupon.allowedAfyaUnits || [],
    allowedManualPlans: coupon.allowedManualPlans || [],
    stackWithTier: coupon.stackWithTier === true,
    usageCount: Number(coupon.usageCount || 0),
    expiresAt: serializeDate(coupon.expiresAt),
    durationValue: coupon.durationValue ?? null,
    durationUnit: coupon.durationUnit ?? null,
    isActive: coupon.isActive !== false,
    createdByName: coupon.createdByName || '',
    createdAt: serializeDate(coupon.createdAt),
    updatedAt: serializeDate(coupon.updatedAt),
    stats: {
      approvedUses: Number(stats?.approvedUses || 0),
      uniqueUsers: Number(stats?.uniqueUsers || 0),
      revenueAttributed: Number(stats?.revenueAttributed || 0),
      discountGiven: Number(stats?.discountGiven || 0),
      lastUsedAt: serializeDate(stats?.lastUsedAt),
    },
  }
}

function buildExpiresAt(input: z.infer<typeof CouponCreateSchema>, createdAt: Date) {
  if (input.expirationMode === 'date') {
    const date = new Date(input.expiresAt!)
    if (Number.isNaN(date.getTime())) throw new Error('Data de término inválida.')
    return date
  }
  if (input.expirationMode === 'duration') {
    return addCouponDuration(createdAt, input.durationValue!, input.durationUnit as CouponDurationUnit)
  }
  return null
}

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const db = await getDb()
    const [coupons, statsRows] = await Promise.all([
      db.collection<Coupon>('coupons').find({}).sort({ createdAt: -1 }).limit(500).toArray(),
      db.collection('coupon_redemptions').aggregate([
        { $match: { status: 'approved' } },
        {
          $group: {
            _id: '$couponId',
            approvedUses: { $sum: 1 },
            users: { $addToSet: '$userId' },
            revenueAttributed: { $sum: '$amountAfterCoupon' },
            discountGiven: { $sum: '$discountAmount' },
            lastUsedAt: { $max: '$approvedAt' },
          },
        },
      ]).toArray(),
    ])

    const statsByCoupon = new Map(statsRows.map((row: any) => [
      String(row._id),
      {
        ...row,
        uniqueUsers: Array.isArray(row.users) ? row.users.length : 0,
      },
    ]))

    return NextResponse.json({
      coupons: coupons.map((coupon) => serializeCoupon(coupon, statsByCoupon.get(String(coupon._id)))),
    })
  } catch (error: any) {
    console.error('[admin/coupons] erro:', error)
    return NextResponse.json({ error: error.message || 'Erro ao buscar cupons' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = CouponCreateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.format() }, { status: 400 })
    }

    const data = parsed.data
    const now = new Date()
    const codeNormalized = normalizeCouponCode(data.code)
    const coupon: Coupon = {
      code: codeNormalized,
      codeNormalized,
      description: data.description?.trim() || '',
      discountType: data.discountType,
      discountValue: data.discountType === 'percentage'
        ? Math.min(100, Number(data.discountValue))
        : Number(data.discountValue),
      scope: data.scope,
      productRefs: data.scope === 'specific'
        ? Array.from(new Map((data.productRefs || []).map((ref: CouponProductRef) => [`${ref.itemType}:${ref.itemId}`, ref])).values())
        : [],
      usageLimit: data.usageLimit ?? null,
      perUserLimit: data.perUserLimit ?? null,
      minimumCartAmount: data.minimumCartAmount ?? null,
      firstPurchaseOnly: data.firstPurchaseOnly,
      allowedAfyaUnits: data.allowedAfyaUnits,
      allowedManualPlans: data.allowedManualPlans?.length
        ? Array.from(new Set(data.allowedManualPlans))
        : null,
      stackWithTier: data.stackWithTier === true,
      usageCount: 0,
      expiresAt: buildExpiresAt(data, now),
      durationValue: data.expirationMode === 'duration' ? data.durationValue || null : null,
      durationUnit: data.expirationMode === 'duration' ? data.durationUnit || null : null,
      isActive: data.isActive,
      createdBy: session.userId,
      createdByName: session.name,
      createdAt: now,
      updatedAt: now,
    }

    const db = await getDb()
    const inserted = await db.collection<Coupon>('coupons').insertOne(coupon as any)
    return NextResponse.json({ coupon: serializeCoupon({ ...coupon, _id: inserted.insertedId }) }, { status: 201 })
  } catch (error: any) {
    if (error?.code === 11000) {
      return NextResponse.json({ error: 'Já existe um cupom com esse código.' }, { status: 409 })
    }
    console.error('[admin/coupons] erro ao criar:', error)
    return NextResponse.json({ error: error.message || 'Erro ao criar cupom' }, { status: 500 })
  }
}
