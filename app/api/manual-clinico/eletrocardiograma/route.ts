import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import {
  getManualClinicoAccess,
  getManualClinicoConfig,
  serializeManualClinicoProduct,
} from '@/lib/manual-clinico-product'

export const dynamic = 'force-dynamic'

/**
 * Verificação de acesso ao Manual do Eletrocardiograma.
 * Seção PRIVATIVA: liberada apenas para assinantes do Manual Clínico e planos
 * Premium (mesma regra de `hasFullAccess`, que cobre admin, compra ativa e plano incluso).
 */
export async function GET() {
  try {
    const [db, session] = await Promise.all([getDb(), getSession()])
    const config = await getManualClinicoConfig(db)
    const access = await getManualClinicoAccess(db, session, config)

    return NextResponse.json({
      isAuthenticated: !!session?.userId,
      access: {
        hasFullAccess: access.hasFullAccess,
        reason: access.reason,
        includedPlan: access.includedPlan ?? null,
      },
      product: serializeManualClinicoProduct(config),
    })
  } catch (error) {
    console.error('Erro ao verificar acesso ao Manual do Eletrocardiograma:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
