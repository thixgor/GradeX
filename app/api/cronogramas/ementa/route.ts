import { NextRequest, NextResponse } from 'next/server'

import { getSession } from '@/lib/auth'
import { INDICE_EMENTAS, getEmenta } from '@/lib/cronogramas/ementa'
import { contarEmenta, normalizarSecao } from '@/lib/cronogramas/tipos'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Ementa de um período.
 *
 * A rota existe em vez de um `import` no cliente porque os quatro cursos somam
 * ~500 KB de JSON: mandar tudo para exibir um período seria pagar o acervo
 * inteiro em cada abertura da página, no 4G do aluno.
 *
 * Sem `secao` devolve só o índice — a lista de cursos e a contagem de cada
 * período —, que é o que o seletor precisa para montar antes de qualquer
 * escolha.
 */
export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const params = request.nextUrl.searchParams
  const secao = normalizarSecao(params.get('secao'))

  if (!secao) {
    return NextResponse.json({ indice: INDICE_EMENTAS })
  }

  const periodo = Math.round(Number(params.get('periodo') || '1'))
  if (!Number.isFinite(periodo) || periodo < 1 || periodo > 12) {
    return NextResponse.json({ error: 'Período inválido' }, { status: 400 })
  }

  const topicos = await getEmenta(secao, periodo)

  // A ementa só muda quando alguém edita o markdown e faz deploy, então o
  // cache privado longo aqui é seguro e economiza uma função por navegação.
  return NextResponse.json(
    { secao, periodo, topicos, resumo: contarEmenta(topicos), indice: INDICE_EMENTAS },
    { headers: { 'Cache-Control': 'private, max-age=3600, stale-while-revalidate=86400' } },
  )
}
