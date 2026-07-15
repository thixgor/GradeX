import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
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

const CouponUpdateSchema = z.object({
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

function buildExpiresAt(input: z.infer<typeof CouponUpdateSchema>, now: Date) {
  if (input.expirationMode === 'date') {
    const date = new Date(input.expiresAt!)
    if (Number.isNaN(date.getTime())) throw new Error('Data de término inválida.')
    return date
  }
  if (input.expirationMode === 'duration') {
    return addCouponDuration(now, input.durationValue!, input.durationUnit as CouponDurationUnit)
  }
  return null
}

function getId(params: { id: string }) {
  if (!ObjectId.isValid(params.id)) return null
  return new ObjectId(params.id)
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const id = getId(params)
    if (!id) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

    const body = await request.json()
    const parsed = CouponUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.format() }, { status: 400 })
    }

    const data = parsed.data
    const now = new Date()
    const codeNormalized = normalizeCouponCode(data.code)
    const db = await getDb()
    const existing = await db.collection<Coupon>('coupons').findOne({ _id: id as any })
    if (!existing) return NextResponse.json({ error: 'Cupom não encontrado' }, { status: 404 })
    const createdAt = existing.createdAt instanceof Date ? existing.createdAt : new Date(existing.createdAt)
    const update: Partial<Coupon> = {
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
      expiresAt: buildExpiresAt(data, Number.isNaN(createdAt.getTime()) ? now : createdAt),
      durationValue: data.expirationMode === 'duration' ? data.durationValue || null : null,
      durationUnit: data.expirationMode === 'duration' ? data.durationUnit || null : null,
      isActive: data.isActive,
      updatedAt: now,
    }

    await db.collection<Coupon>('coupons').updateOne(
      { _id: id as any },
      { $set: update }
    )
    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error?.code === 11000) {
      return NextResponse.json({ error: 'Já existe um cupom com esse código.' }, { status: 409 })
    }
    console.error('[admin/coupons/id] erro ao atualizar:', error)
    return NextResponse.json({ error: error.message || 'Erro ao atualizar cupom' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const id = getId(params)
    if (!id) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

    const db = await getDb()
    await db.collection<Coupon>('coupons').deleteOne({ _id: id as any })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[admin/coupons/id] erro ao excluir:', error)
    return NextResponse.json({ error: error.message || 'Erro ao excluir cupom' }, { status: 500 })
  }
}
