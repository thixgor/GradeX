/**
 * GET /api/materiais/recomendacoes?tipo=material|package&id=<id>[&visitante=1]
 *
 * Sugestões para a prateleira "Quem estuda isto também leva" das páginas
 * /materiais/[id] e /pacotes/[id]. O algoritmo está em
 * lib/recomendacoes/motor.ts.
 *
 * Duas formas, de propósito:
 *  - `visitante=1` (a página sabe que não há login): a resposta não depende
 *    de ninguém, então nem lê a sessão e sai com cache público no CDN — a
 *    visita anônima não chega a acordar a função.
 *  - com login: tira o que a pessoa já tem e usa as compras dela como sinal;
 *    a resposta é dela e não pode ser guardada no CDN.
 * A URL diferente é o que impede o CDN de entregar a resposta de um visitante
 * para quem está logado (e vice-versa).
 */

import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { chaveDe, recomendar } from '@/lib/recomendacoes/motor'
import { carregarModelo, contextoDaPessoa } from '@/lib/recomendacoes/servidor'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const LIMITE = 8

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const tipo = params.get('tipo') === 'package' ? 'package' : params.get('tipo') === 'material' ? 'material' : null
  const id = params.get('id') || ''
  if (!tipo || !ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Item inválido' }, { status: 400 })
  }
  const visitante = params.get('visitante') === '1'

  try {
    const db = await getDb()
    const modelo = await carregarModelo(db)
    const semente = chaveDe(tipo, id)

    const session = visitante ? null : await getSession()
    const contexto = session?.userId ? await contextoDaPessoa(db, modelo, session.userId) : null

    const itens = recomendar(modelo, semente, {
      limite: LIMITE,
      possuidos: contexto?.possuidos,
      materiaisPossuidos: contexto?.materiaisPossuidos,
      grupos: contexto?.grupos,
    })

    return NextResponse.json(
      { itens, personalizado: !!contexto },
      {
        headers: {
          'Cache-Control': visitante
            ? 'public, max-age=300, s-maxage=900, stale-while-revalidate=3600'
            : 'private, no-store',
        },
      }
    )
  } catch (error) {
    // Prateleira de sugestão não derruba a página do produto.
    console.error('[materiais/recomendacoes] erro:', error)
    return NextResponse.json({ itens: [], personalizado: false })
  }
}
