import { NextRequest, NextResponse } from 'next/server'

import { getSession } from '@/lib/auth'
import { getEmenta, getIndiceDeEmentas } from '@/lib/cronogramas/ementa'
import { contarEmenta, normalizarSecao } from '@/lib/cronogramas/tipos'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Ementa de um período, como o admin importou.
 *
 * Devolve um período por vez em vez de tudo: a ementa de um período de
 * Medicina passa de 300 KB, e mandar os quatro cursos para exibir um seria
 * pagar o acervo inteiro em cada abertura da tela, no 4G do aluno.
 *
 * Sem `secao` devolve só o índice — quais períodos têm ementa e o tamanho de
 * cada um —, que é do que o seletor precisa antes de qualquer escolha.
 */
export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const indice = await getIndiceDeEmentas()
  const params = request.nextUrl.searchParams
  const secao = normalizarSecao(params.get('secao'))

  if (!secao) return NextResponse.json({ indice })

  const periodo = Math.round(Number(params.get('periodo') || '1'))
  if (!Number.isFinite(periodo) || periodo < 1 || periodo > 12) {
    return NextResponse.json({ error: 'Período inválido' }, { status: 400 })
  }

  const topicos = await getEmenta(secao, periodo)

  // Sem cache de navegador: a ementa agora é conteúdo editável, e o admin
  // precisa ver a correção valendo assim que importa. O cache curto de
  // processo em `lib/cronogramas/ementa.ts` é quem segura a carga.
  return NextResponse.json(
    { secao, periodo, topicos, resumo: contarEmenta(topicos), indice },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
