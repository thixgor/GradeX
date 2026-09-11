import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { Exam, ExamSubmission } from '@/lib/types'
import { ObjectId } from 'mongodb'
import { prepararSubmissaoParaEntrega } from '@/lib/provas/nota-da-prova'

export const dynamic = 'force-dynamic'

// GET - Buscar submissão de um usuário específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const { id, userId } = await params
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Apenas o próprio usuário ou admin pode ver
    if (session.userId !== userId && session.role !== 'admin') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const db = await getDb()
    const submissionsCollection = db.collection<ExamSubmission>('submissions')

    const submission = await submissionsCollection.findOne({
      examId: id,
      userId: userId,
    })

    if (!submission) {
      return NextResponse.json({ error: 'Submissão não encontrada' }, { status: 404 })
    }

    /*
     * A submissão é do aluno; a NOTA dela espera o término da prova.
     *
     * Esta rota alimenta o relatório do aluno (`/exam/[id]/user/[userId]`), que
     * ele abre por "Quero ver meu resumo" minutos depois de entregar — e ela
     * devolvia `score` e as correções comentadas com a turma ainda respondendo.
     * As respostas dele continuam saindo na hora: o que espera é o julgamento
     * delas. Ver `lib/provas/nota-da-prova.ts`.
     */
    let exam: Exam | null = null
    try {
      exam = await db.collection<Exam>('exams').findOne({ _id: new ObjectId(id) })
    } catch {
      exam = null
    }

    return NextResponse.json({
      submission: prepararSubmissaoParaEntrega(submission, exam, {
        userId: session.userId,
        isAdmin: session.role === 'admin',
        jaSubmeteu: true,
      }),
    })
  } catch (error) {
    console.error('Get submission error:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar submissão' },
      { status: 500 }
    )
  }
}
