import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { diaVazio, obterResumoDeEstudo } from '@/lib/estudo/resumo-de-estudo'
import { dayKey } from '@/lib/streak'

export const dynamic = 'force-dynamic'

/**
 * GET — os números de estudo do usuário atual (painel e perfil).
 *
 * Sai de `obterResumoDeEstudo`, a mesma fonte do `/api/user/performance`:
 * provas (respondidas e acertadas), banco, flashcards, materiais, anatomia e
 * foco. Os campos antigos continuam no topo da resposta para quem ainda lê
 * por eles, agora com o número certo.
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const db = await getDb()
    const agora = new Date()
    const { porDia, notasDasProvas: _notasDasProvas, ...resumo } = await obterResumoDeEstudo(db, session.userId, {
      agora,
      isAdmin: session.role === 'admin',
    })
    // As duas últimas semanas, para o gráfico pequeno do painel — já estão no
    // resumo, então não custam consulta nenhuma.
    const vazio = diaVazio()
    const ultimos14 = Array.from({ length: 14 }, (_, i) => {
      const date = dayKey(new Date(agora.getTime() - (13 - i) * 86_400_000))
      return { date, ...(porDia[date] || vazio) }
    })

    return NextResponse.json(
      {
        resumo,
        ultimos14,
        examsCompleted: resumo.provas.entregues,
        questionsAnswered: resumo.geral.questoes,
        streakDays: resumo.geral.sequencia,
        longestStreak: resumo.geral.maiorSequencia,
        studiedToday: resumo.geral.estudouHoje,
        questionsAnsweredExams: resumo.provas.respondidas,
        questionsAnsweredBank: resumo.banco.resolucoes,
        questionsCorrectBank: resumo.banco.acertos,
        questionsWrongBank: resumo.banco.erros,
        bankAccuracyRate: resumo.banco.acuracia ?? 0,
        accuracyRate: resumo.geral.acuracia,
      },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } },
    )
  } catch (error) {
    console.error('Get user statistics error:', error)
    return NextResponse.json({ error: 'Erro ao buscar estatísticas' }, { status: 500 })
  }
}
