import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { ExamSubmission } from '@/lib/types'

export const dynamic = 'force-dynamic'

// DELETE - Zerar todas as submissões de uma prova (apenas admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getSession()

    if (!session || session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Sem permissão' },
        { status: 403 }
      )
    }

    const db = await getDb()
    const submissionsCollection = db.collection<ExamSubmission>('submissions')

    // Deleta todas as submissões da prova
    const result = await submissionsCollection.deleteMany({
      examId: id,
    })

    return NextResponse.json({
      success: true,
      message: `${result.deletedCount} submissão(ões) deletada(s)`,
      deletedCount: result.deletedCount,
    })
  } catch (error) {
    console.error('Reset submissions error:', error)
    return NextResponse.json(
      { error: 'Erro ao zerar resultados' },
      { status: 500 }
    )
  }
}
