import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { Exam } from '@/lib/types'
import { ObjectId } from 'mongodb'
import { pessoaEstaNoPublico } from '@/lib/provas/publico-da-prova'
import { lerPeriodoDoAluno } from '@/lib/provas/periodo-do-aluno'
import { registrarEntrada } from '@/lib/provas/entrada-na-prova'
import { resolverJanelaDaProva } from '@/lib/provas/janela-da-prova'

export const dynamic = 'force-dynamic'

/**
 * POST — passar pelo portão.
 *
 * A tela da prova chama isto ao abrir. Quem chega com o portão aberto fica
 * registrado como "dentro", e o registro é o que faz o botão "Iniciar Prova"
 * destravar às 14h numa prova cujo portão fechou às 13h50 — o caso que antes
 * travava a sala de espera inteira. Ver `lib/provas/entrada-na-prova.ts`.
 *
 * O cliente pede; quem decide é o relógio do servidor. Chamar esta rota com o
 * portão fechado não abre porta nenhuma: devolve 403 com o motivo.
 */
export async function POST(
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
    const exam = await db.collection<Exam>('exams').findOne({ _id: new ObjectId(id) })
    if (!exam) {
      return NextResponse.json({ error: 'Prova não encontrada' }, { status: 404 })
    }

    const isAdmin = session.role === 'admin'

    // As mesmas portas da rota da prova: uma prova oculta ou aplicada a outro
    // período não existe para quem não foi convocado, e o portão dela também
    // não. Sem isto, esta rota seria um jeito de descobrir que a prova existe.
    if (!isAdmin) {
      if (exam.isHidden && exam.createdBy !== session.userId) {
        return NextResponse.json({ error: 'Prova não encontrada' }, { status: 404 })
      }
      const periodo = await lerPeriodoDoAluno(db, session.userId)
      if (!pessoaEstaNoPublico(exam, { userId: session.userId, isAdmin, periodo })) {
        return NextResponse.json({ error: 'Prova não encontrada' }, { status: 404 })
      }
    }

    const resultado = await registrarEntrada(db, exam, id, session.userId)

    if (!resultado.dentro) {
      return NextResponse.json(
        {
          error: resultado.motivo || 'Os portões desta prova estão fechados.',
          janela: resolverJanelaDaProva(exam, new Date(), { jaEntrou: false }),
        },
        { status: 403 },
      )
    }

    return NextResponse.json({
      dentro: true,
      registrouAgora: resultado.registrouAgora,
      janela: resolverJanelaDaProva(exam, new Date(), { jaEntrou: true }),
    })
  } catch (error) {
    console.error('Registrar entrada error:', error)
    return NextResponse.json({ error: 'Erro ao entrar na prova' }, { status: 500 })
  }
}
