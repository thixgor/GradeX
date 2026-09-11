import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { ExamSubmission, Exam } from '@/lib/types'
import { ObjectId } from 'mongodb'
import { prepararSubmissaoParaEntrega } from '@/lib/provas/nota-da-prova'

export const dynamic = 'force-dynamic'

// GET - Buscar todas as submissoes do usuario logado
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
    }

    const db = await getDb()
    const submissionsCollection = db.collection<ExamSubmission>('submissions')
    const examsCollection = db.collection<Exam>('exams')

    // Buscar todas as submissoes do usuario
    const submissions = await submissionsCollection
      .find({ userId: session.userId })
      .sort({ submittedAt: -1 })
      .toArray()

    // Buscar informacoes das provas e filtrar provas deletadas
    const submissionsWithExams = (await Promise.all(
      submissions.map(async (submission) => {
        // Converter examId para ObjectId se necessário
        let examObjectId
        try {
          examObjectId = typeof submission.examId === 'string'
            ? new ObjectId(submission.examId)
            : submission.examId
        } catch (error) {
          console.error('Error converting examId to ObjectId:', submission.examId)
          return null
        }

        const exam = await examsCollection.findOne({ _id: examObjectId })

        // Se a prova foi deletada, retorna null para filtrar depois
        if (!exam) {
          return null
        }

        /*
         * A nota espera o término — inclusive na lista de provas feitas.
         *
         * Esta rota devolvia `score`, `triScore`, `discursiveScore` e as
         * correções comentadas de TODAS as submissões da pessoa, e `/profile`
         * as desenhava ("Pontuação 8.5") num cartão que abre com um clique.
         * Quem entregasse às 14h05 fechava a tela da prova, abria o perfil e
         * lia a nota pela porta dos fundos, com a turma respondendo até as 16h.
         * Ver `lib/provas/nota-da-prova.ts`.
         */
        const comVeredito = prepararSubmissaoParaEntrega(submission, exam, {
          userId: session.userId,
          isAdmin: session.role === 'admin',
          jaSubmeteu: true,
        })

        return {
          ...comVeredito,
          examName: exam.title,
          examTitle: exam.title,
          hasDiscursiveQuestions: exam.questions.some(q => q.type === 'discursive') || false,
          examEndTime: exam.endTime, // Adicionar endTime para verificar se prova terminou
          isPracticeExam: exam.isPracticeExam || false,
          /*
           * Os campos que decidem quem pode baixar os PDFs desta prova, e
           * quando.
           *
           * A lista de provas feitas oferece downloads (prova, respostas,
           * folha e gabarito) e os gerava sem consultar portão nenhum — nem o
           * cargo, nem a exceção que o admin abre por prova, nem a espera que
           * ele configurou. Sem estes campos aqui, a tela não tem como aplicar
           * `resolverDownloadsDaProva`: ela conheceria só o fim da prova, e não
           * a natureza dela, nem a liberação, nem o momento.
           *
           * `holdDownloads` era o que faltava depois da primeira correção, e a
           * falta não dava erro nenhum: sem o campo, a tela assumia o padrão
           * ("a prova em branco sai imediato") e devolvia por aqui os dois PDFs
           * que o admin tinha prendido até o término.
           * Ver lib/provas/downloads-da-prova.ts.
           */
          isPersonalExam: exam.isPersonalExam || false,
          freeDownloads: (exam as any).freeDownloads || null,
          holdDownloads: (exam as any).holdDownloads || null,
        }
      })
    )).filter(submission => submission !== null) // Remove provas deletadas

    return NextResponse.json({ submissions: submissionsWithExams })
  } catch (error) {
    console.error('Get user submissions error:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar submissoes' },
      { status: 500 }
    )
  }
}
