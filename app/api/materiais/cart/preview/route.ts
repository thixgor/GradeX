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

  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

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
  const resolution = await resolveMaterialCart(db, session, parsed.data.items)
  const suggestions = await computeCartUpgradeSuggestions(db, session, resolution)

  return NextResponse.json({
    items: resolution.items.map(serializeMaterialCartItem),
    payableItems: resolution.payableItems.map(serializeMaterialCartItem),
    freeItems: resolution.freeItems.map(serializeMaterialCartItem),
    skippedItems: resolution.skippedItems,
    amount: resolution.amount,
    suggestions,
  })
}
