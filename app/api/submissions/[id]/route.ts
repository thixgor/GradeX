import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { ExamSubmission } from '@/lib/types'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

// GET - Buscar uma submissão específica
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

    const db = await getDb()
    const submissionsCollection = db.collection<ExamSubmission>('submissions')

    const submission = await submissionsCollection.findOne({ _id: new ObjectId(id) })

    if (!submission) {
      return NextResponse.json({ error: 'Submissão não encontrada' }, { status: 404 })
    }

    // Verificar se é o dono da submissão ou admin
    if (submission.userId !== session.userId && session.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    return NextResponse.json({ submission })
  } catch (error) {
    console.error('Get submission error:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar submissão' },
      { status: 500 }
    )
  }
}
