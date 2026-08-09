import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import {
  getManualClinicoAccess,
  getManualClinicoConfig,
  serializeManualClinicoProduct,
} from '@/lib/manual-clinico-product'
import { CATEGORIAS, carregarTodas } from '@/lib/ferramentas-clinicas'

export const dynamic = 'force-dynamic'

export interface ResumoFerramentas {
  ferramentas: number
  areas: number
  referencias: number
}

/**
 * Números do catálogo para a faixa de assinatura.
 *
 * Contados no servidor a partir do próprio conteúdo, nunca escritos à mão, para
 * que o texto da página não possa desencontrar do que a seção entrega. Só
 * quantidades atravessam a rede: o catálogo em si a página já carrega sozinha,
 * e é aberto.
 *
 * Fica em cache de módulo porque o catálogo é estático — recalcular a cada
 * requisição significaria reimportar os 15 módulos de conteúdo à toa.
 */
let cacheResumo: ResumoFerramentas | null = null

async function montarResumo(): Promise<ResumoFerramentas> {
  if (cacheResumo) return cacheResumo

  const todas = await carregarTodas()
  cacheResumo = {
    ferramentas: todas.length,
    areas: CATEGORIAS.length,
    referencias: todas.reduce((n, f) => n + f.referencias.length, 0),
  }
  return cacheResumo
}

/**
 * Estado do visitante nas Ferramentas Clínicas.
 *
 * A seção é aberta: as 201 calculadoras funcionam sem login e esta rota não
 * barra ninguém. O `hasFullAccess` serve só para decidir se vale mostrar a
 * faixa de assinatura do Manual Clínico — quem já assina não precisa vê-la.
 */
export async function GET() {
  try {
    const [db, session, resumo] = await Promise.all([getDb(), getSession(), montarResumo()])
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
      resumo,
    })
  } catch (error) {
    console.error('Erro ao verificar acesso às Ferramentas Clínicas:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
