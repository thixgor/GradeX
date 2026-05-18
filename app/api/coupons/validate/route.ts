import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { checkRateLimit } from '@/lib/rate-limit'
import { MAX_MATERIAL_CART_ITEMS, resolveMaterialCart } from '@/lib/material-cart'
import { CouponError, validateCouponForCheckout } from '@/lib/coupons'
import {
  buildManualClinicoCouponItem,
  getManualClinicoAccess,
  getManualClinicoConfig,
  getManualClinicoCurrentPrice,
  MANUAL_CLINICO_PRODUCT_ID,
} from '@/lib/manual-clinico-product'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const Schema = z.object({
  code: z.string().min(1),
  itemType: z.enum(['material', 'package', 'manual_clinico']).optional(),
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
    const isManualCheckout =
      parsed.data.itemType === 'manual_clinico' &&
      parsed.data.itemId === MANUAL_CLINICO_PRODUCT_ID

    if (isManualCheckout) {
      const [config, access] = await Promise.all([
        getManualClinicoConfig(db),
        getManualClinicoAccess(db, session),
      ])
      if (access.hasFullAccess) {
        return NextResponse.json({ error: 'Voce ja possui o Manual Clinico Premium.' }, { status: 409 })
      }
      if (!config.isActive) {
        return NextResponse.json({ error: 'Produto indisponivel no momento.' }, { status: 400 })
      }
      if (!config.allowCoupons) {
        return NextResponse.json({ error: 'Cupons nao estao habilitados para este produto.' }, { status: 400 })
      }

      const amount = getManualClinicoCurrentPrice(config)
      if (amount <= 0) {
        return NextResponse.json({ error: 'Cupom so pode ser aplicado a compras pagas.' }, { status: 400 })
      }

      const validation = await validateCouponForCheckout(db, {
        code: parsed.data.code,
        amountBeforeCoupon: amount,
        userId: session.userId,
        userEmail: session.email,
        items: [buildManualClinicoCouponItem(config, amount)],
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
    }

    const materialItems = items.filter((item) => item.itemType === 'material' || item.itemType === 'package') as Array<{ itemType: 'material' | 'package'; itemId: string }>
    const resolution = await resolveMaterialCart(db, session, materialItems)
    const payableItems = resolution.payableItems
    if (resolution.skippedItems.some(item => item.reason === 'already_owned')) {
      return NextResponse.json({
        error: resolution.items.length === 0
          ? 'Você já possui todos os itens deste carrinho.'
          : 'Você já possui alguns itens deste carrinho. Remova-os antes de aplicar cupom.',
      }, { status: 409 })
    }

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
