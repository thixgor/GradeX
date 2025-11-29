import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { ExamSubmission } from '@/lib/types'

export const dynamic = 'force-dynamic'

// GET - Verificar se usuario ja fez a prova
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
    }

    const db = await getDb()
    const submissionsCollection = db.collection<ExamSubmission>('submissions')

    const existingSubmission = await submissionsCollection.findOne({
      examId: id,
      userId: session.userId
    })

    if (existingSubmission) {
      return NextResponse.json({
        hasSubmitted: true,
        submissionId: existingSubmission._id?.toString()
      })
    }

    return NextResponse.json({ hasSubmitted: false })
  } catch (error) {
    console.error('Check submission error:', error)
    return NextResponse.json(
      { error: 'Erro ao verificar submissao' },
      { status: 500 }
    )
  }
}
