import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { defaultShopSettings } from '@/lib/shop'
import type { ShopSettings, DeliveryMethod, PickupPoint } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

async function readOrCreateSettings(): Promise<ShopSettings> {
  const db = await getDb()
  let settings: ShopSettings | null = await db.collection<ShopSettings>('shop_settings').findOne({ settingsId: 'shop' })
  if (!settings) {
    const doc = defaultShopSettings()
    const res = await db.collection('shop_settings').insertOne(doc as any)
    settings = { ...doc, _id: res.insertedId } as ShopSettings
  }
  return { ...settings, _id: String(settings._id) } as ShopSettings
}

function sanitizeMethods(input: any): DeliveryMethod[] {
  if (!Array.isArray(input)) return []
  return input.map((m: any, i: number) => {
    const freight: Record<string, number> = {}
    if (m.freightByRegion && typeof m.freightByRegion === 'object') {
      for (const [k, v] of Object.entries(m.freightByRegion)) {
        const num = Number(v)
        if (!isNaN(num) && num >= 0) freight[String(k).toUpperCase()] = num
      }
    }
    return {
      id: String(m.id || `method-${i}-${Date.now()}`),
      name: String(m.name || 'Método'),
      enabled: m.enabled !== false,
      estimatedDaysMin: Math.max(0, Math.floor(Number(m.estimatedDaysMin) || 0)),
      estimatedDaysMax: Math.max(0, Math.floor(Number(m.estimatedDaysMax) || 0)),
      freightByRegion: freight,
      details: m.details ? String(m.details) : undefined,
    }
  })
}

function sanitizePickupPoints(input: any): PickupPoint[] {
  if (!Array.isArray(input)) return []
  return input.map((p: any, i: number) => ({
    id: String(p.id || `pickup-${i}-${Date.now()}`),
    name: String(p.name || 'Ponto de retirada'),
    address: p.address ? String(p.address) : undefined,
    enabled: p.enabled !== false,
    details: p.details ? String(p.details) : undefined,
  }))
}

// GET - Configurações completas (admin)
export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }
    const settings = await readOrCreateSettings()
    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Error fetching shop settings:', error)
    return NextResponse.json({ error: 'Erro ao buscar configurações' }, { status: 500 })
  }
}

// PUT - Atualiza configurações (admin)
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }
    const db = await getDb()
    const body = await request.json()
    await readOrCreateSettings() // garante existência

    const updates = {
      deliveryMethods: sanitizeMethods(body.deliveryMethods),
      pickupPoints: sanitizePickupPoints(body.pickupPoints),
      sellerFooter: String(body.sellerFooter || 'Entregue por DomineAqui LTDA — Rio de Janeiro'),
      updatedAt: new Date(),
      updatedBy: session.userId,
    }
    await db.collection('shop_settings').updateOne({ settingsId: 'shop' }, { $set: updates })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating shop settings:', error)
    return NextResponse.json({ error: 'Erro ao atualizar configurações' }, { status: 500 })
  }
}
