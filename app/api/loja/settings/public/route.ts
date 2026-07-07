import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { defaultShopSettings } from '@/lib/shop'
import type { ShopSettings } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Config pública da loja para o checkout: métodos de entrega (com frete por
 * região), pontos de retirada ativos e rodapé. Sem dados administrativos.
 */
export async function GET() {
  try {
    const db = await getDb()
    let settings: ShopSettings | null = await db.collection<ShopSettings>('shop_settings').findOne({ settingsId: 'shop' })
    if (!settings) {
      settings = defaultShopSettings() as ShopSettings
    }
    return NextResponse.json({
      deliveryMethods: (settings.deliveryMethods || []).filter((m) => m.enabled),
      pickupPoints: (settings.pickupPoints || []).filter((p) => p.enabled),
      sellerFooter: settings.sellerFooter,
      freeShippingThreshold: settings.freeShippingThreshold,
    })
  } catch (error) {
    console.error('Error fetching public shop settings:', error)
    return NextResponse.json({ error: 'Erro ao buscar configurações' }, { status: 500 })
  }
}
