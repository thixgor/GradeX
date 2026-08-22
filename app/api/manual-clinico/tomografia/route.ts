import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import {
  getManualClinicoAccess,
  getManualClinicoConfig,
  serializeManualClinicoProduct,
} from '@/lib/manual-clinico-product'
import { SECOES, TOTAL_CORTES, TOTAL_ESTRUTURAS, TOTAL_QUESTOES, TOTAL_SUBSECOES } from '@/lib/tomografia'
import { ESTUDOS_RAIO_X, REGIOES_RAIO_X, TOTAL_ESTRUTURAS_RAIO_X } from '@/lib/radiologia/raio-x'

export const dynamic = 'force-dynamic'

/**
 * Resumo do Manual de Radiologia para a landing de vendas: quantos cortes,
 * incidências, estruturas e séries existem, e como estão distribuídos entre as
 * duas modalidades.
 *
 * É calculado no servidor a partir do próprio conteúdo, e não escrito à mão,
 * para que os números da vitrine nunca desencontrem do que o produto entrega.
 * Só os totais e os títulos atravessam a rede — o conteúdo das fichas é
 * justamente o que está do outro lado do muro.
 */
const RESUMO = {
  cortes: TOTAL_CORTES,
  estruturas: TOTAL_ESTRUTURAS,
  series: TOTAL_SUBSECOES,
  questoes: TOTAL_QUESTOES,
  secoes: SECOES.map((s) => ({
    id: s.id,
    titulo: s.titulo,
    series: s.subsecoes.length,
    estruturas: s.subsecoes.reduce((n, sub) => n + sub.estruturas.length, 0),
    cortes: s.subsecoes.reduce((n, sub) => n + sub.totalCortes, 0),
    // Nomes das séries: dizem o que se compra sem entregar o conteúdo.
    titulosSeries: s.subsecoes.map((sub) => sub.titulo),
  })),
  raioX: {
    estudos: ESTUDOS_RAIO_X.length,
    estruturas: TOTAL_ESTRUTURAS_RAIO_X,
    regioes: REGIOES_RAIO_X.map((r) => ({
      id: r.id,
      titulo: r.titulo,
      estudos: r.totalEstudos,
      estruturas: r.totalEstruturas,
      incidencias: r.incidencias,
    })),
  },
}

/**
 * Verificação de acesso ao Manual de Tomografia.
 *
 * Seção PRIVATIVA, com a mesma regra do Manual do Eletrocardiograma: liberada
 * para assinantes do Manual Clínico e para contas Plus+ (ambos cobertos por
 * `hasFullAccess`). Não entra na cota de aberturas gratuitas do Manual — o
 * atlas é indivisível, não faz sentido liberar "3 cortes de graça".
 */
export async function GET() {
  try {
    const [db, session] = await Promise.all([getDb(), getSession()])
    const config = await getManualClinicoConfig(db)
    const access = await getManualClinicoAccess(db, session, config, 'radiologia')

    return NextResponse.json({
      isAuthenticated: !!session?.userId,
      access: {
        hasFullAccess: access.hasFullAccess,
        reason: access.reason,
        includedPlan: access.includedPlan ?? null,
      },
      product: serializeManualClinicoProduct(config),
      resumo: RESUMO,
    })
  } catch (error) {
    console.error('Erro ao verificar acesso ao Manual de Tomografia:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
