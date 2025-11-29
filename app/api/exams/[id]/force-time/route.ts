import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { Exam } from '@/lib/types'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

// POST - Forçar início ou término da prova (apenas admin)
export async function POST(
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

    const body = await request.json()
    const { action } = body // 'start' ou 'end'

    if (!action || (action !== 'start' && action !== 'end')) {
      return NextResponse.json(
        { error: 'Ação inválida' },
        { status: 400 }
      )
    }

    const db = await getDb()
    const examsCollection = db.collection<Exam>('exams')

    const exam = await examsCollection.findOne({ _id: new ObjectId(id) })
    if (!exam) {
      return NextResponse.json({ error: 'Prova não encontrada' }, { status: 404 })
    }

    const now = new Date()

    if (action === 'start') {
      // Forçar início: define startTime como agora e gatesOpen também
      await examsCollection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            startTime: now,
            gatesOpen: now,
            updatedAt: now,
          },
        }
      )
      return NextResponse.json({ success: true, message: 'Prova forçada a iniciar' })
    } else {
      // Forçar término: define endTime como agora e gatesClose também
      await examsCollection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            endTime: now,
            gatesClose: now,
            updatedAt: now,
          },
        }
      )
      return NextResponse.json({ success: true, message: 'Prova forçada a terminar' })
    }
  } catch (error) {
    console.error('Force time error:', error)
    return NextResponse.json(
      { error: 'Erro ao forçar tempo' },
      { status: 500 }
    )
  }
}
