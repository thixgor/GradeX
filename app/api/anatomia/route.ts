import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import {
  getManualClinicoAccess,
  getManualClinicoConfig,
  serializeManualClinicoProduct,
} from '@/lib/manual-clinico-product'
import { ATLAS_SYSTEMS, ATLAS_TOTALS, flattenCollections } from '@/lib/atlas-anatomia/catalogo'
import { getMarkerInsight } from '@/lib/atlas-anatomia/insights'
import { CATEGORIAS, MODELOS, TOTAL_MODELOS, getModelosPorCategoria } from '@/lib/anatomia-3d/modelos'

export const dynamic = 'force-dynamic'

/**
 * Acesso e vitrine de Domine Anatomia.
 *
 * A seção é privativa (assinantes do Manual Clínico e contas Plus+), então quem
 * não assina precisa receber uma página de vendas — e nada além dela. O catálogo
 * do Atlas sozinho tem quase 900 KB de JSON: mandar isso para o navegador de
 * quem ainda não comprou entregaria justamente o produto.
 *
 * Por isso o resumo é montado aqui, no servidor. O que sai daqui são números,
 * títulos e as capas dos sistemas (imagens públicas de vitrine) — o suficiente
 * para a landing ser concreta, sem soltar o acervo.
 */

interface SistemaResumo {
  slug: string
  titulo: string
  capa: string
  pranchas: number
  colecoes: number
  marcadores: number
}

const SISTEMAS: SistemaResumo[] = ATLAS_SYSTEMS.map(sistema => {
  const folhas = flattenCollections(sistema.collections).filter(colecao => colecao.pieces?.length)
  return {
    slug: sistema.slug,
    titulo: sistema.title,
    capa: sistema.cover,
    colecoes: folhas.length,
    pranchas: folhas.reduce((total, colecao) => total + (colecao.pieces?.length || 0), 0),
    marcadores: folhas.reduce(
      (total, colecao) => total + (colecao.pieces || []).reduce((soma, peca) => soma + peca.markers.length, 0),
      0,
    ),
  }
})

const CATEGORIAS_RESUMO = CATEGORIAS.map(categoria => ({
  id: categoria.id,
  titulo: categoria.titulo,
  subtitulo: categoria.subtitulo,
  icone: categoria.icon,
  cor: categoria.cor,
  quantidade: getModelosPorCategoria(categoria.id).length,
})).filter(categoria => categoria.quantidade > 0)

const DESTAQUES = MODELOS.filter(modelo => modelo.destaque)
  .slice(0, 6)
  .map(modelo => ({
    slug: modelo.slug,
    titulo: modelo.titulo,
    legenda: modelo.legenda,
    categoriaId: modelo.categoriaId,
    sketchfabId: modelo.sketchfabId,
  }))

/**
 * Amostra grátis: uma estrutura de verdade, com a ficha inteira que o assinante
 * vê. Uma entre 2.382 não entrega o acervo, e é o argumento mais honesto que a
 * landing pode ter — em vez de descrever o que a ficha traz, ela mostra.
 *
 * O braquiorradial é a escolhida porque carrega a pegadinha clássica da
 * anatomia do membro superior: flexor inervado pelo nervo dos extensores.
 */
const AMOSTRA = (() => {
  for (const sistema of ATLAS_SYSTEMS) {
    for (const colecao of flattenCollections(sistema.collections)) {
      for (const peca of colecao.pieces || []) {
        const indice = peca.markers.findIndex(item => item.title === 'Músculo Braquiorradial')
        if (indice < 0) continue
        return {
          sistema: sistema.title,
          colecao: colecao.title,
          // A prancha inteira vai junto para a landing poder ser interativa de
          // verdade: quem chega gira, aproxima e clica nos sete marcadores desta
          // peça. Uma prancha entre 418 é amostra, não é o acervo.
          prancha: { id: peca.id, title: peca.title, image: peca.image, markers: peca.markers },
          indiceDestaque: indice,
          fichas: peca.markers.map(marcador =>
            getMarkerInsight(marcador, {
              sistema: sistema.slug,
              caminho: colecao.breadcrumb,
              prancha: peca.title,
            }),
          ),
        }
      }
    }
  }
  return null
})()

const CATALOGO = {
  sistemas: SISTEMAS,
  totalSistemas: SISTEMAS.length,
  totalPranchas: ATLAS_TOTALS.pieces,
  totalMarcadores: ATLAS_TOTALS.markers,
  totalModelos: TOTAL_MODELOS,
  categorias: CATEGORIAS_RESUMO,
  destaques: DESTAQUES,
  amostra: AMOSTRA,
}

/**
 * O resumo do catálogo não depende do banco — só o veredito de acesso e o preço
 * dependem. Separar os dois é o que garante que uma falha de banco derrube o
 * acesso (fecha o portão, como deve ser) sem derrubar a página: o visitante
 * continua vendo a landing, apenas sem o preço.
 */
export async function GET() {
  let isAuthenticated = false
  let access = { hasFullAccess: false, reason: 'guest' as string, includedPlan: null as string | null }
  let product: ReturnType<typeof serializeManualClinicoProduct> | null = null

  try {
    const [db, session] = await Promise.all([getDb(), getSession()])
    const config = await getManualClinicoConfig(db)
    const estado = await getManualClinicoAccess(db, session, config, 'anatomia3d')

    isAuthenticated = !!session?.userId
    access = {
      hasFullAccess: estado.hasFullAccess,
      reason: estado.reason,
      includedPlan: estado.includedPlan ?? null,
    }
    product = serializeManualClinicoProduct(config)
  } catch (error) {
    console.error('Erro ao verificar acesso a Domine Anatomia:', error)
  }

  return NextResponse.json({ isAuthenticated, access, product, catalogo: CATALOGO })
}
