import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { secureApiEndpoint } from '@/lib/api-security'

export const dynamic = 'force-dynamic'

// PATCH - Update self-score for a discursive question
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const security = await secureApiEndpoint(request, {
      rateLimit: 'WRITE',
      auth: { requireAuth: true }
    })

    if (!security.success || security.errorResponse) {
      return security.errorResponse
    }

    const session = security.session!
    const { questionId, selfScore } = await request.json()

    if (!questionId || selfScore === undefined || selfScore === null) {
      return NextResponse.json({ error: 'questionId e selfScore são obrigatórios' }, { status: 400 })
    }

    if (typeof selfScore !== 'number' || selfScore < 0 || selfScore > 100) {
      return NextResponse.json({ error: 'selfScore deve ser entre 0 e 100' }, { status: 400 })
    }

    const db = await getDb()
    const submission = await db.collection('submissions').findOne({
      _id: new ObjectId(id),
      userId: session.userId,
    })

    if (!submission) {
      return NextResponse.json({ error: 'Submissão não encontrada' }, { status: 404 })
    }

    // Update the specific answer's discursiveSelfScore
    await db.collection('submissions').updateOne(
      { _id: new ObjectId(id), 'answers.questionId': questionId },
      { $set: { 'answers.$.discursiveSelfScore': selfScore, updatedAt: new Date() } }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao atualizar auto-avaliação:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
