import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { Submission } from '@/lib/types'

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

    const db = await getDb()
    const submissionsCollection = db.collection<Submission>('submissions')

    // Verificar se já existe uma submission não finalizada para este usuário nesta prova
    const existingSubmission = await submissionsCollection.findOne({
      examId,
      userId: session.userId,
      submittedAt: { $exists: false },
    })

    if (existingSubmission) {
      // Já existe, retornar sucesso
      return NextResponse.json({
        success: true,
        submissionId: existingSubmission._id?.toString(),
        message: 'Sessão já existe',
      })
    }

    // Criar nova submission inicial (sem respostas ainda)
    const newSubmission: Submission = {
      examId,
      userId: session.userId,
      userName,
      answers: [],
      startedAt: new Date(startedAt),
      // submittedAt não existe ainda (prova em andamento)
    }

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
