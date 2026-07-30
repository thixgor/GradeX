import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import {
  getManualClinicoAccess,
  getManualClinicoConfig,
  serializeManualClinicoProduct,
} from '@/lib/manual-clinico-product'
import { CATEGORIES, ECG_CATALOG } from '@/lib/ecg/catalog'

export const dynamic = 'force-dynamic'

/**
 * Resumo do banco de traçados para o paywall: quantos padrões existem e como
 * estão distribuídos. É calculado aqui, no servidor, de propósito — o catálogo
 * tem ~140 KB e é justamente o conteúdo que o visitante ainda não comprou.
 * Mandar só os números mantém a página leve e o acervo do outro lado do muro.
 * Como deriva do próprio catálogo, os totais nunca desencontram do produto.
 */
const CATALOG_SUMMARY = {
  total: ECG_CATALOG.length,
  emergencies: ECG_CATALOG.filter((e) => e.urgencia === 'emergencia').length,
  categories: CATEGORIES.map((name) => ({
    name,
    count: ECG_CATALOG.filter((e) => e.categoria === name).length,
  })).filter((c) => c.count > 0),
}

/**
 * Verificação de acesso ao Manual do Eletrocardiograma.
 * Seção PRIVATIVA: liberada apenas para assinantes do Manual Clínico e planos
 * Plus+ (mesma regra de `hasFullAccess`, que cobre admin, compra ativa e plano incluso).
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
      catalog: CATALOG_SUMMARY,
    })
  } catch (error) {
    console.error('Erro ao verificar acesso ao Manual do Eletrocardiograma:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
