import { NextRequest, NextResponse } from 'next/server'

import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { buscarConteudo, type Contexto } from '@/lib/busca-plataforma/conteudo'
import { chaveDeBusca, termosDaConsulta } from '@/lib/busca-plataforma/texto'
import type { RespostaBusca } from '@/lib/busca-plataforma/tipos'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Busca de CONTEÚDO da plataforma.
 *
 * O catálogo de páginas e ações é resolvido no navegador (resposta instantânea,
 * sem rede). Esta rota cuida do que só existe no banco — patologias, fármacos,
 * materiais, aulas, decks, mapas, cronogramas, provas, listas, rifas, posts do
 * fórum — e das 201 calculadoras clínicas, que somam ~400 KB de módulo e por
 * isso são pesquisadas aqui em vez de baixadas para o celular.
 *
 * ## Decisões que valem explicação
 *
 * **Regex com classes de acento, não `$text`.** O índice de texto do Mongo casa
 * palavra inteira depois de radicalizar; quem digita "cardio" quer ver
 * "cardiologia" antes de terminar a palavra. O custo é varredura, então cada
 * fonte tem `limit` curto e `maxTimeMS` — uma coleção grande atrasa a si mesma,
 * nunca a resposta inteira.
 *
 * **`allSettled`, não `all`.** Uma coleção indisponível degrada a busca em vez
 * de derrubá-la; a resposta marca `incompleto` e a interface avisa.
 *
 * **Ordenação no mesmo motor do cliente.** Se o servidor ordenasse por conta
 * própria, o mesmo termo produziria listas diferentes conforme a resposta viesse
 * do catálogo local ou da rede.
 *
 * **Privacidade antes de relevância.** Cada fonte carrega o filtro de acesso da
 * sua própria API (material oculto, deck privado, cronograma de outro usuário).
 * Buscar não pode ser o caminho mais fácil para enxergar o que a tela nega.
 */

/* ───────────────────────────── Cache ───────────────────────────── */

/**
 * Cache por usuário e consulta, curto. Digitar "cardio" e apagar de volta para
 * "cardi" é o padrão normal de uso e refaria treze varreduras no Mongo; 45
 * segundos são suficientes para cobrir a sessão de digitação sem servir
 * conteúdo velho depois de uma compra ou publicação.
 */
const CACHE_TTL_MS = 45_000
const CACHE_MAXIMO = 300
const cache = new Map<string, { em: number; resposta: RespostaBusca }>()

function lerCache(chave: string): RespostaBusca | null {
  const entrada = cache.get(chave)
  if (!entrada) return null
  if (Date.now() - entrada.em > CACHE_TTL_MS) {
    cache.delete(chave)
    return null
  }
  return entrada.resposta
}

function gravarCache(chave: string, resposta: RespostaBusca) {
  if (cache.size >= CACHE_MAXIMO) {
    // Descarte das mais antigas: `Map` preserva ordem de inserção, então as
    // primeiras chaves são as mais velhas.
    const excedente = cache.size - CACHE_MAXIMO + 50
    let i = 0
    for (const chaveAntiga of cache.keys()) {
      if (i++ >= excedente) break
      cache.delete(chaveAntiga)
    }
  }
  cache.set(chave, { em: Date.now(), resposta })
}

/* ───────────────────────────── Rota ───────────────────────────── */

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const bruto = (request.nextUrl.searchParams.get('q') || '').slice(0, 120)
  const consulta = chaveDeBusca(bruto)
  const termos = termosDaConsulta(bruto).filter(t => t.length >= 2)

  if (consulta.length < 2 || termos.length === 0) {
    return NextResponse.json({ itens: [] } satisfies RespostaBusca)
  }

  const isAdmin = session.role === 'admin'
  const chaveCache = `${session.userId}|${isAdmin ? 'a' : 'u'}|${consulta}`
  const emCache = lerCache(chaveCache)
  if (emCache) {
    return NextResponse.json(emCache, {
      headers: { 'Cache-Control': 'private, max-age=30' },
    })
  }

  const inicio = Date.now()

  try {
    const db = await getDb()
    const ctx: Contexto = { db, userId: session.userId, isAdmin, termos }

    const { itens, incompleto } = await buscarConteudo(ctx, bruto)

    const resposta: RespostaBusca = {
      itens,
      ...(incompleto ? { incompleto: true } : {}),
      ms: Date.now() - inicio,
    }

    gravarCache(chaveCache, resposta)

    return NextResponse.json(resposta, {
      headers: { 'Cache-Control': 'private, max-age=30' },
    })
  } catch (erro) {
    console.error('Erro na busca global:', erro)
    return NextResponse.json({ error: 'Erro ao buscar' }, { status: 500 })
  }
}
