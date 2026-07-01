import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { checkRateLimit } from '@/lib/rate-limit'
import {
  MAX_MATERIAL_CART_ITEMS,
  computeCartUpgradeSuggestions,
  resolveMaterialCart,
  serializeMaterialCartItem,
} from '@/lib/material-cart'
import { computeCartTierDiscounts, serializePricingEventState } from '@/lib/pricing-events'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const Schema = z.object({
  items: z.array(z.object({
    itemType: z.enum(['material', 'package']),
    itemId: z.string().min(1),
  })).min(1).max(MAX_MATERIAL_CART_ITEMS),
})

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const rl = await checkRateLimit(ip, 'materiais_cart_preview', 60, 60_000)
  if (!rl.success) return NextResponse.json({ error: 'Muitas requisições.' }, { status: 429 })

  // Visitantes (sem login) podem pré-visualizar o carrinho para comprar via
  // Serial Key. Sem sessão, usamos uma sessão sintética de convidado (não possui
  // nada), então nenhum item é marcado como "já adquirido".
  const session = await getSession()
  const cartSession = session || { userId: '', role: 'user' as const }

  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.format() }, { status: 400 })
  }

  const db = await getDb()
  const resolution = await resolveMaterialCart(db, cartSession, parsed.data.items)
  const suggestions = await computeCartUpgradeSuggestions(db, cartSession, resolution)

  // Lote dinâmico — calcula desconto por item para exibição no preview.
  const tierCalc = await computeCartTierDiscounts(
    db,
    resolution.payableItems.map((item) => ({
      itemType: item.itemType,
      itemId: item.itemId,
      price: item.price,
      pricingEventId: item.pricingEventId,
    }))
  )
  const tierByKey = new Map(
    tierCalc.perItem.map((entry) => [`${entry.itemType}:${entry.itemId}`, entry])
  )

  const decorateItem = (item: ReturnType<typeof serializeMaterialCartItem>) => {
    const tier = tierByKey.get(`${item.itemType}:${item.itemId}`)
    const tierDiscount = tier?.tierDiscountAmount || 0
    const priceAfterTier = Math.max(0, Math.round((item.price - tierDiscount) * 100) / 100)
    return {
      ...item,
      tierDiscount,
      priceAfterTier,
      pricingEventState: tier?.state ? serializePricingEventState(tier.state) : null,
    }
  }

  const items = resolution.items.map(serializeMaterialCartItem).map(decorateItem)
  const payableItems = resolution.payableItems.map(serializeMaterialCartItem).map(decorateItem)
  const freeItems = resolution.freeItems.map(serializeMaterialCartItem).map(decorateItem)
  const amountAfterTier = Math.max(
    0,
    Math.round((resolution.amount - tierCalc.totalTierDiscount) * 100) / 100
  )

  return NextResponse.json({
    items,
    payableItems,
    freeItems,
    skippedItems: resolution.skippedItems,
    amount: resolution.amount,
    tierDiscountTotal: tierCalc.totalTierDiscount,
    amountAfterTier,
    suggestions,
  })
}
