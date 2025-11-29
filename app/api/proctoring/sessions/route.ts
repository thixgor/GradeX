import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ProctoringSession, Exam, ExamSubmission } from '@/lib/types'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

// GET - Obter todas as sessões de proctoring ativas
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const db = await getDb()
    const submissionsCollection = db.collection<ExamSubmission>('submissions')
    const examsCollection = db.collection<Exam>('exams')

    // Buscar todas as submissions ativas (não finalizadas) de provas com proctoring
    const activeSubmissions = await submissionsCollection
      .find({
        submittedAt: { $exists: false }, // Não submetida ainda
      })
      .toArray()

    console.log('[PROCTORING API] Total de submissions ativas:', activeSubmissions.length)
    console.log('[PROCTORING API] ExamIds das submissions:', activeSubmissions.map(s => s.examId))

    // Buscar informações das provas
    const examIds = [...new Set(activeSubmissions.map(s => s.examId))]
    console.log('[PROCTORING API] ExamIds únicos para buscar:', examIds)

    // Converter examIds para ObjectId para a busca
    const objectIdExamIds = examIds
      .filter(id => ObjectId.isValid(id))
      .map(id => new ObjectId(id))

    console.log('[PROCTORING API] ObjectIds convertidos:', objectIdExamIds)

    const exams = await examsCollection
      .find({ _id: { $in: objectIdExamIds } })
      .toArray()

    console.log('[PROCTORING API] Provas encontradas:', exams.length)
    console.log('[PROCTORING API] IDs das provas encontradas:', exams.map(e => e._id?.toString()))

    // Filtrar apenas provas com proctoring habilitado
    const proctoringExams = exams.filter(exam => exam.proctoring?.enabled)
    console.log('[PROCTORING API] Provas com proctoring habilitado:', proctoringExams.length)
    console.log('[PROCTORING API] Detalhes proctoring:', proctoringExams.map(e => ({
      id: e._id?.toString(),
      title: e.title,
      proctoring: e.proctoring
    })))

    const proctoringExamIds = proctoringExams.map(e => e._id?.toString())

    // Filtrar submissions de provas com proctoring
    const proctoringSubmissions = activeSubmissions.filter(sub =>
      proctoringExamIds.includes(sub.examId)
    )

    console.log('[PROCTORING API] Submissions com proctoring:', proctoringSubmissions.length)

    // Criar objetos de sessão
    const sessions: ProctoringSession[] = proctoringSubmissions.map(sub => {
      const exam = proctoringExams.find(e => e._id?.toString() === sub.examId)

      return {
        examId: sub.examId,
        examTitle: exam?.title || 'Prova',
        userId: sub.userId,
        userName: sub.userName,
        submissionId: sub._id?.toString() || '',
        numberOfQuestions: exam?.numberOfQuestions || exam?.questions?.length || 0,
        totalPoints: exam?.totalPoints || 0,
        isActive: true,
        startedAt: sub.startedAt || new Date(),
        cameraBlackWarnings: 0,
        forcedSubmit: false,
        cameraEnabled: exam?.proctoring?.camera || false,
        audioEnabled: exam?.proctoring?.audio || false,
        screenEnabled: exam?.proctoring?.screen || false,
        screenMode: exam?.proctoring?.screenMode,
      }
    })

    return NextResponse.json({
      success: true,
      sessions,
      total: sessions.length,
    })
  } catch (error: any) {
    console.error('Error fetching proctoring sessions:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar sessões de monitoramento' },
      { status: 500 }
    )
  }
}
