import { NextRequest, NextResponse } from 'next/server'

import { getSession } from '@/lib/auth'
import { hojeBrasilia, somarDias } from '@/lib/cronogramas/brasilia'
import { listarAvaliacoes } from '@/lib/cronogramas/avaliacoes-servidor'
import { normalizarSecao } from '@/lib/cronogramas/tipos'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Avaliações que o aluno vê no calendário.
 *
 * Sempre filtra por `publicada`: o admin monta o calendário do semestre com
 * calma, e um rascunho não pode vazar para a turma nem virar lembrete.
 *
 * A janela padrão vai de 90 dias atrás a um ano à frente — larga o bastante
 * para o calendário navegar meses sem uma nova requisição a cada seta, e
 * fechada o bastante para não trazer o histórico inteiro do curso.
 */
export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const params = request.nextUrl.searchParams
  const secao = normalizarSecao(params.get('secao'))
  if (!secao) return NextResponse.json({ error: 'Seção inválida' }, { status: 400 })

  const periodoBruto = Math.round(Number(params.get('periodo')))
  const periodo = Number.isFinite(periodoBruto) && periodoBruto >= 1 && periodoBruto <= 12 ? periodoBruto : null

  const hoje = hojeBrasilia()

  const avaliacoes = await listarAvaliacoes({
    secao,
    periodo,
    desde: params.get('desde') || somarDias(hoje, -90),
    ate: params.get('ate') || somarDias(hoje, 365),
    somentePublicadas: true,
  })

  return NextResponse.json({ avaliacoes, hoje })
}
