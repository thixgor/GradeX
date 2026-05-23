import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import {
  getManualClinicoAccess,
  getManualClinicoConfig,
  serializeManualClinicoProduct,
} from '@/lib/manual-clinico-product'

export const dynamic = 'force-dynamic'

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// GET - Lista pública de medicamentos (catálogo). Conteúdo completo é premium.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const busca = searchParams.get('busca')?.trim() || ''
    const classe = searchParams.get('classe')
    const subclasse = searchParams.get('subclasse')

    const session = await getSession()
    const db = await getDb()
    const [config, access] = await Promise.all([
      getManualClinicoConfig(db),
      getManualClinicoAccess(db, session),
    ])

    const filter: any = {}
    if (classe) filter.classe_principal = classe
    if (subclasse) filter.subclasse = subclasse
    if (busca) {
      const rx = new RegExp(escapeRegex(busca), 'i')
      filter.$or = [
        { nome: rx },
        { sinonimos: rx },
        { classe_principal: rx },
        { subclasse: rx },
      ]
    }

    const projection = {
      nome: 1,
      sinonimos: 1,
      classe_principal: 1,
      subclasse: 1,
      slug: 1,
      tipo_farmaco: 1,
    }

    const results = await db.collection('medicamentos')
      .find(filter, { projection })
      .sort({ classe_principal: 1, subclasse: 1, nome: 1 })
      .toArray()

    const medicamentos = results.map((m) => ({
      ...m,
      isPremiumLocked: !access.hasFullAccess,
      accessStatus: access.hasFullAccess ? 'premium_unlocked' : 'locked',
    }))

    return NextResponse.json({
      medicamentos,
      total: medicamentos.length,
      product: serializeManualClinicoProduct(config),
      access: {
        hasFullAccess: access.hasFullAccess,
        reason: access.reason,
      },
    })
  } catch (error) {
    console.error('Erro ao buscar medicamentos:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
