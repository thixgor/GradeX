import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import {
  getManualClinicoAccess,
  getManualClinicoConfig,
  serializeManualClinicoProduct,
} from '@/lib/manual-clinico-product'
import { CATEGORIAS, carregarTodas, ferramentasDaCategoria } from '@/lib/ferramentas-clinicas'

export const dynamic = 'force-dynamic'

interface ResumoCategoria {
  id: string
  nome: string
  subtitulo: string
  cor: string
  icone: string
  total: number
  /** Nomes das ferramentas: dizem o que se compra sem entregar o cálculo. */
  nomes: string[]
}

export interface ResumoFerramentas {
  ferramentas: number
  areas: number
  referencias: number
  campos: number
  comArmadilhas: number
  categorias: ResumoCategoria[]
}

/**
 * Resumo do catálogo para a vitrine.
 *
 * Calculado no servidor a partir do próprio conteúdo, nunca escrito à mão, para
 * que os números da página de vendas não possam desencontrar do que o produto
 * entrega. Atravessa a rede apenas o que vende: quantidades e os nomes das
 * ferramentas. A conta, o fundamento, as armadilhas e as referências — que são
 * o produto — ficam do outro lado do muro.
 *
 * Fica em cache de módulo porque o catálogo é estático: recalcular a cada
 * requisição significaria reimportar os 15 módulos de conteúdo à toa.
 */
let cacheResumo: ResumoFerramentas | null = null

async function montarResumo(): Promise<ResumoFerramentas> {
  if (cacheResumo) return cacheResumo

  const todas = await carregarTodas()
  const resumo: ResumoFerramentas = {
    ferramentas: todas.length,
    areas: CATEGORIAS.length,
    referencias: todas.reduce((n, f) => n + f.referencias.length, 0),
    campos: todas.reduce((n, f) => n + f.campos.length, 0),
    comArmadilhas: todas.filter((f) => (f.armadilhas?.length ?? 0) > 0).length,
    categorias: CATEGORIAS.map((c) => {
      const daArea = ferramentasDaCategoria(todas, c.id)
      return {
        id: c.id,
        nome: c.nome,
        subtitulo: c.subtitulo,
        cor: c.cor,
        icone: c.icone,
        total: daArea.length,
        nomes: daArea.map((f) => (f.sigla ? `${f.nome} (${f.sigla})` : f.nome)),
      }
    }),
  }

  cacheResumo = resumo
  return resumo
}

/**
 * Verificação de acesso às Ferramentas Clínicas.
 *
 * Seção privativa com a mesma regra do Manual do Eletrocardiograma e do Manual
 * de Tomografia: liberada para assinantes do Manual Clínico e contas Plus+,
 * ambos cobertos por `hasFullAccess`. Não entra na cota de aberturas gratuitas
 * — as calculadoras não se dividem em "3 escores de graça" sem virar outra
 * coisa.
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
