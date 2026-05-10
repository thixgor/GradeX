import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import type { PlanConfig } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Endpoint público para leitura de planos visíveis.
 * Não requer autenticação — usado pelas páginas /buy e /buy/checkout.
 * Retorna apenas planos com oculto !== true, ordenados por `ordem`.
 */
export async function GET() {
  try {
    const db = await getDb()
    const settings = await db.collection('admin_settings').findOne({})
    const planos: PlanConfig[] = (settings?.planos || []) as PlanConfig[]

    const visible = planos
      .filter(p => !p.oculto)
      .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))

    return NextResponse.json({ planos: visible })
  } catch {
    return NextResponse.json({ planos: [] })
  }
}
