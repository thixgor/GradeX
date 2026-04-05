import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

// PATCH - Sort all exams in a group by title (reverse alphanumeric, admin only)
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await params
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const db = await getDb()
    const examsCollection = db.collection('exams')

    const exams = await examsCollection
      .find({ groupId } as any)
      .toArray()

    if (exams.length === 0) {
      return NextResponse.json({ message: 'Nenhuma prova para ordenar' })
    }

    // Reverse alphanumeric sort: "2025.2" before "2023.1", "B" before "A"
    const sorted = [...exams].sort((a, b) =>
      b.title.localeCompare(a.title, 'pt-BR', { numeric: true, sensitivity: 'base' })
    )

    const ops = sorted.map((exam, idx) => ({
      updateOne: {
        filter: { _id: exam._id },
        update: { $set: { orderInGroup: idx } },
      },
    }))

    await examsCollection.bulkWrite(ops as any)

    return NextResponse.json({ message: 'Provas ordenadas com sucesso', count: sorted.length })
  } catch (error) {
    console.error('Sort exams error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
