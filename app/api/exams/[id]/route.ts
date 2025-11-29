import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { Exam } from '@/lib/types'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

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

    // Verifica se é uma prova pessoal e se o usuário tem permissão
    if (exam.isPersonalExam && session.role !== 'admin' && exam.createdBy !== session.userId) {
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

    // Para provas práticas sem datas, usar uma data muito distante no futuro
    const defaultFutureDate = new Date('2099-12-31T23:59:59')
    const isPracticeExam = body.isPracticeExam !== undefined ? body.isPracticeExam : exam.isPracticeExam

    // Corrigir numeração das questões (começar em 1, não 0)
    if (body.questions && Array.isArray(body.questions)) {
      body.questions = body.questions.map((q: any, index: number) => ({
        ...q,
        number: index + 1
      }))
    }

    const updateData = {
      ...body,
      gatesOpen: body.gatesOpen ? new Date(body.gatesOpen) : undefined,
      gatesClose: body.gatesClose ? new Date(body.gatesClose) : undefined,
      startTime: body.startTime ? new Date(body.startTime) : (isPracticeExam ? defaultFutureDate : exam.startTime),
      endTime: body.endTime ? new Date(body.endTime) : (isPracticeExam ? defaultFutureDate : exam.endTime),
      // Configurações de proctoring
      proctoring: body.proctoringEnabled ? {
        enabled: body.proctoringEnabled,
        camera: body.proctoringCamera || false,
        audio: body.proctoringAudio || false,
        screen: body.proctoringScreen || false,
        screenMode: body.proctoringScreenMode || 'window',
      } : (body.proctoringEnabled === false ? undefined : exam.proctoring),
      updatedAt: new Date(),
    }

    delete updateData._id
    delete updateData.createdBy
    delete updateData.createdAt
    // Remover campos individuais de proctoring que foram consolidados
    delete updateData.proctoringEnabled
    delete updateData.proctoringCamera
    delete updateData.proctoringAudio
    delete updateData.proctoringScreen
    delete updateData.proctoringScreenMode

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
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const db = await getDb()
    const examsCollection = db.collection<Exam>('exams')
    const submissionsCollection = db.collection('submissions')

    const exam = await examsCollection.findOne({ _id: new ObjectId(id) })
    if (!exam) {
      return NextResponse.json({ error: 'Prova não encontrada' }, { status: 404 })
    }

    // Permissões de deleção:
    // - Admin pode deletar qualquer prova
    // - Criador pode deletar sua própria prova (pessoal ou geral)
    const isAdmin = session.role === 'admin'
    const isCreator = exam.createdBy === session.userId
    
    if (!isAdmin && !isCreator) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    // Deletar todas as submissões relacionadas a essa prova
    await submissionsCollection.deleteMany({ examId: id })

    // Deletar a prova
    await examsCollection.deleteOne({ _id: new ObjectId(id) })

    return NextResponse.json({
      success: true,
      message: 'Prova deletada com sucesso'
    })
  } catch (error) {
    console.error('Delete exam error:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar prova' },
      { status: 500 }
    )
  }
}
