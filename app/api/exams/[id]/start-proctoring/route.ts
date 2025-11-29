import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ExamSubmission } from '@/lib/types'

export const dynamic = 'force-dynamic'

// POST - Criar submission inicial para tracking de proctoring
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { id: examId } = params
    const body = await request.json()
    const { userName, startedAt } = body

    console.log('[START-PROCTORING] Iniciando criação de sessão:', {
      examId,
      userId: session.userId,
      userName,
      startedAt
    })

    const db = await getDb()
    const submissionsCollection = db.collection<ExamSubmission>('submissions')

    // Verificar se já existe uma submission não finalizada para este usuário nesta prova
    const existingSubmission = await submissionsCollection.findOne({
      examId,
      userId: session.userId,
      submittedAt: { $exists: false },
    })

    console.log('[START-PROCTORING] Submission existente:', existingSubmission ? 'SIM' : 'NÃO')

    if (existingSubmission) {
      // Já existe, retornar sucesso
      console.log('[START-PROCTORING] Retornando sessão existente:', existingSubmission._id?.toString())
      return NextResponse.json({
        success: true,
        submissionId: existingSubmission._id?.toString(),
        message: 'Sessão já existe',
      })
    }

    // Criar nova submission inicial (sem respostas ainda)
    const newSubmission: ExamSubmission = {
      examId,
      userId: session.userId,
      userName,
      answers: [],
      startedAt: new Date(startedAt),
      submittedAt: new Date(), // Será atualizado quando a prova for submetida
    }

    console.log('[START-PROCTORING] Criando nova submission:', newSubmission)

    const result = await submissionsCollection.insertOne(newSubmission)

    return NextResponse.json({
      success: true,
      submissionId: result.insertedId.toString(),
      message: 'Sessão de monitoramento criada',
    })
  } catch (error: any) {
    console.error('Error creating proctoring session:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao criar sessão de monitoramento' },
      { status: 500 }
    )
  }
}
