import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { Exam } from '@/lib/types'
import { ObjectId } from 'mongodb'

// GET - Buscar prova por ID
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
    const examsCollection = db.collection<Exam>('exams')

    const exam = await examsCollection.findOne({ _id: new ObjectId(id) })

    if (!exam) {
      return NextResponse.json({ error: 'Prova não encontrada' }, { status: 404 })
    }

    // Verifica se a prova está oculta e se o usuário tem permissão
    if (exam.isHidden && session.role !== 'admin' && exam.createdBy !== session.userId) {
      return NextResponse.json({ error: 'Prova não encontrada' }, { status: 404 })
    }

    return NextResponse.json({ exam })
  } catch (error) {
    console.error('Get exam error:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar prova' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar prova
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const body = await request.json()
    const db = await getDb()
    const examsCollection = db.collection<Exam>('exams')

    const exam = await examsCollection.findOne({ _id: new ObjectId(id) })
    if (!exam) {
      return NextResponse.json({ error: 'Prova não encontrada' }, { status: 404 })
    }

    // Apenas o criador pode editar
    if (exam.createdBy !== session.userId) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const updateData = {
      ...body,
      gatesOpen: body.gatesOpen ? new Date(body.gatesOpen) : undefined,
      gatesClose: body.gatesClose ? new Date(body.gatesClose) : undefined,
      startTime: body.startTime ? new Date(body.startTime) : exam.startTime,
      endTime: body.endTime ? new Date(body.endTime) : exam.endTime,
      updatedAt: new Date(),
    }

    delete updateData._id
    delete updateData.createdBy
    delete updateData.createdAt

    await examsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update exam error:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar prova' },
      { status: 500 }
    )
  }
}

// DELETE - Deletar prova
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const db = await getDb()
    const examsCollection = db.collection<Exam>('exams')

    const exam = await examsCollection.findOne({ _id: new ObjectId(id) })
    if (!exam) {
      return NextResponse.json({ error: 'Prova não encontrada' }, { status: 404 })
    }

    // Apenas o criador pode deletar
    if (exam.createdBy !== session.userId) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    await examsCollection.deleteOne({ _id: new ObjectId(id) })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete exam error:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar prova' },
      { status: 500 }
    )
  }
}
