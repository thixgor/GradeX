import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

// PATCH - Reorder exam within its group (admin only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const { direction } = await req.json() // 'up' or 'down'
    if (direction !== 'up' && direction !== 'down') {
      return NextResponse.json({ error: 'Direção inválida' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db('DomineAqui')
    const examsCollection = db.collection('exams')

    const exam = await examsCollection.findOne({ _id: new ObjectId(params.id) })
    if (!exam) {
      return NextResponse.json({ error: 'Prova não encontrada' }, { status: 404 })
    }

    const groupId = exam.groupId
    if (!groupId) {
      return NextResponse.json({ error: 'Prova não está em um grupo' }, { status: 400 })
    }

    // Get all exams in same group, then sort to match the frontend sort:
    // missing orderInGroup → treated as 999 (pushed to end), same as exam-group.tsx
    const rawGroupExams = await examsCollection
      .find({ groupId })
      .toArray()

    const groupExams = rawGroupExams.sort((a, b) => {
      const oa = a.orderInGroup ?? 999
      const ob = b.orderInGroup ?? 999
      return oa !== ob ? oa - ob : 0
    })

    const currentIndex = groupExams.findIndex(e => e._id.toString() === params.id)
    if (currentIndex === -1) return NextResponse.json({ error: 'Erro interno' }, { status: 500 })

    const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (swapIndex < 0 || swapIndex >= groupExams.length) {
      return NextResponse.json({ message: 'Já está no limite' })
    }

    // Normalize all exams in the group so every exam has an explicit orderInGroup.
    // This prevents the null-vs-999 mismatch between frontend and MongoDB on future reorders.
    const updateOps = groupExams.map((e, idx) => ({
      updateOne: {
        filter: { _id: e._id },
        update: { $set: { orderInGroup: idx } },
      }
    }))
    if (updateOps.length > 0) await examsCollection.bulkWrite(updateOps)

    // Now swap the two target exams
    await examsCollection.updateOne(
      { _id: groupExams[currentIndex]._id },
      { $set: { orderInGroup: swapIndex } }
    )
    await examsCollection.updateOne(
      { _id: groupExams[swapIndex]._id },
      { $set: { orderInGroup: currentIndex } }
    )

    return NextResponse.json({ message: 'Reordenado com sucesso' })
  } catch (error) {
    console.error('Erro ao reordenar:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
