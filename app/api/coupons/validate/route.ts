import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { checkRateLimit } from '@/lib/rate-limit'
import { MAX_MATERIAL_CART_ITEMS, resolveMaterialCart } from '@/lib/material-cart'
import { CouponError, validateCouponForCheckout } from '@/lib/coupons'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const Schema = z.object({
  code: z.string().min(1),
  itemType: z.enum(['material', 'package']).optional(),
  itemId: z.string().min(1).optional(),
  items: z.array(z.object({
    itemType: z.enum(['material', 'package']),
    itemId: z.string().min(1),
  })).min(1).max(MAX_MATERIAL_CART_ITEMS).optional(),
})

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const rl = await checkRateLimit(ip, 'coupon_validate', 40, 60_000)
  if (!rl.success) return NextResponse.json({ error: 'Muitas requisições.' }, { status: 429 })

  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })

  const items = parsed.data.items?.length
    ? parsed.data.items
    : parsed.data.itemType && parsed.data.itemId
      ? [{ itemType: parsed.data.itemType, itemId: parsed.data.itemId }]
      : []

  if (items.length === 0) {
    return NextResponse.json({ error: 'Informe os itens do checkout.' }, { status: 400 })
  }

  try {
    const db = await getDb()
    const resolution = await resolveMaterialCart(db, session, items)
    const payableItems = resolution.payableItems

    if (payableItems.length === 0 || resolution.amount <= 0) {
      return NextResponse.json({ error: 'Cupom só pode ser aplicado a compras pagas.' }, { status: 400 })
    }

    const validation = await validateCouponForCheckout(db, {
      code: parsed.data.code,
      amountBeforeCoupon: resolution.amount,
      userId: session.userId,
      userEmail: session.email,
      items: payableItems.map((item) => ({
        itemType: item.itemType,
        itemId: item.itemId,
        itemTitle: item.itemTitle,
        materialType: item.materialType,
        price: item.price,
      })),
    })

    return NextResponse.json({
      couponId: validation.couponId,
      code: validation.code,
      label: validation.label,
      amountBeforeCoupon: validation.amountBeforeCoupon,
      eligibleAmount: validation.eligibleAmount,
      discountAmount: validation.discountAmount,
      amountAfterCoupon: validation.amountAfterCoupon,
      items: validation.items.map((item) => ({
        itemType: item.itemType,
        itemId: item.itemId,
        itemTitle: item.itemTitle,
        kind: item.kind,
        discountAmount: item.discountAmount,
        amountAfterDiscount: item.amountAfterDiscount,
      })),
    })
  } catch (error: any) {
    if (error instanceof CouponError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[coupons/validate] erro:', error)
    return NextResponse.json({ error: 'Erro ao validar cupom' }, { status: 500 })
  }
}
