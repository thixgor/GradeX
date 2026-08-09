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

export interface ItemCatalogo {
  id: string
  nome: string
  sigla?: string
  /** O que a ferramenta faz — é o que a vitrine promete e o que a pessoa compra. */
  resumo: string
  area: string
}

export interface CategoriaCatalogo {
  id: string
  nome: string
  subtitulo: string
  cor: string
  icone: string
  total: number
  /** Ids das ferramentas desta área, inclusive as emprestadas de outras. */
  ids: string[]
}

export interface ResumoFerramentas {
  ferramentas: number
  areas: number
  referencias: number
  lista: ItemCatalogo[]
  categorias: CategoriaCatalogo[]
}

/**
 * Catálogo público das Ferramentas Clínicas.
 *
 * A seção é privativa, mas a lista do que existe não: quem está decidindo se
 * assina precisa saber exatamente o que vai receber, ferramenta por ferramenta,
 * e não uma contagem redonda. Então atravessa a rede o nome, a sigla e o resumo
 * de cada uma — o que ela faz. O que fica do outro lado é o que constitui o
 * produto: a conta, a fórmula, o fundamento, as armadilhas e as referências.
 *
 * As ferramentas vão numa lista única e as áreas guardam só ids. Uma mesma
 * ferramenta aparece em até três áreas — repetir o texto dela em cada uma
 * inflaria a resposta sem acrescentar informação.
 *
 * Cache de módulo: o catálogo é estático, e recalcular a cada requisição
 * significaria reimportar os 15 módulos de conteúdo à toa.
 */
let cacheResumo: ResumoFerramentas | null = null

async function montarResumo(): Promise<ResumoFerramentas> {
  if (cacheResumo) return cacheResumo

  const todas = await carregarTodas()
  cacheResumo = {
    ferramentas: todas.length,
    areas: CATEGORIAS.length,
    referencias: todas.reduce((n, f) => n + f.referencias.length, 0),
    lista: todas.map((f) => ({
      id: f.id,
      nome: f.nome,
      sigla: f.sigla,
      resumo: f.resumo,
      area: f.categorias[0],
    })),
    categorias: CATEGORIAS.map((c) => {
      const daArea = ferramentasDaCategoria(todas, c.id)
      return {
        id: c.id,
        nome: c.nome,
        subtitulo: c.subtitulo,
        cor: c.cor,
        icone: c.icone,
        total: daArea.length,
        ids: daArea.map((f) => f.id),
      }
    }),
  }
  return cacheResumo
}

/**
 * Verificação de acesso às Ferramentas Clínicas.
 *
 * Seção privativa com a mesma regra do Manual do Eletrocardiograma e do Manual
 * de Tomografia: liberada para assinantes do Manual Clínico e contas Plus+,
 * ambos cobertos por `hasFullAccess`.
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
