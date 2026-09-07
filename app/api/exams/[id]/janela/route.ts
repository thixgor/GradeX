import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { Exam } from '@/lib/types'
import { ObjectId } from 'mongodb'
import { provaExisteParaPessoa } from '@/lib/provas/visibilidade-da-prova'
import { lerPeriodoDoAluno } from '@/lib/provas/periodo-do-aluno'
import { jaEntrouNaProva } from '@/lib/provas/entrada-na-prova'
import { resolverJanelaDaProva } from '@/lib/provas/janela-da-prova'
import { instantesDaJanela } from '@/lib/provas/sincronizacao-da-janela'

export const dynamic = 'force-dynamic'

/**
 * GET — só o relógio da prova.
 *
 * ## Por que não usar `GET /api/exams/[id]`
 *
 * Porque ele devolve a prova INTEIRA: enunciados, alternativas, imagens em
 * base64. É a resposta certa para abrir a prova uma vez, e a errada para a
 * sala de espera perguntar de tempos em tempos "os horários mudaram?" — uma
 * turma de sessenta alunos esperando às 13h50 repetiria megabytes de questões
 * a cada rodada, para ler quatro datas.
 *
 * Aqui a consulta exclui `questions` e a resposta são os quatro instantes da
 * janela mais a fase calculada com o relógio do SERVIDOR. É o suficiente para
 * "Forçar Início" (`app/api/exams/[id]/force-time/route.ts`) chegar a quem
 * está esperando sem ninguém recarregar nada.
 *
 * As portas são as mesmas da rota da prova: uma prova oculta ou aplicada a
 * outro período não existe para quem não foi convocado, e o horário dela
 * também não — senão esta rota seria um jeito barato de descobrir que a prova
 * existe.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Prova não encontrada' }, { status: 404 })
    }

    const db = await getDb()
    const exam = await db
      .collection<Exam>('exams')
      .findOne({ _id: new ObjectId(id) }, { projection: { questions: 0 } })

    if (!exam) {
      return NextResponse.json({ error: 'Prova não encontrada' }, { status: 404 })
    }

    const isAdmin = session.role === 'admin'
    if (!isAdmin) {
      const periodo = await lerPeriodoDoAluno(db, session.userId)
      if (!provaExisteParaPessoa(exam, { userId: session.userId, isAdmin, periodo })) {
        return NextResponse.json({ error: 'Prova não encontrada' }, { status: 404 })
      }
    }

    const jaEntrou = await jaEntrouNaProva(db, id, session.userId)

    return NextResponse.json({
      horarios: instantesDaJanela(exam),
      janela: resolverJanelaDaProva(exam, new Date(), { jaEntrou }),
      jaEntrou,
    })
  } catch (error) {
    console.error('Get janela error:', error)
    return NextResponse.json({ error: 'Erro ao buscar a janela da prova' }, { status: 500 })
  }
}
