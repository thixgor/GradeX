import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { ExamSubmission } from '@/lib/types'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

// GET - Buscar todas as submissões de uma prova
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getSession()

    // Apenas admin pode ver todas as submissões
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const db = await getDb()
    const submissionsCollection = db.collection<ExamSubmission>('submissions')

    const submissions = await submissionsCollection
      .find({ examId: id })
      .sort({ submittedAt: -1 })
      .toArray()

    return NextResponse.json({ submissions })
  } catch (error) {
    console.error('Get submissions error:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar submissões' },
      { status: 500 }
    )
  }
}
