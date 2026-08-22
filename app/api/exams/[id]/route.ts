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
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    const body = await request.json()
    const db = await getDb()
    const examsCollection = db.collection<Exam>('exams')

    const exam = await examsCollection.findOne({ _id: new ObjectId(id) })
    if (!exam) {
      return NextResponse.json({ error: 'Prova não encontrada' }, { status: 404 })
    }

    // Apenas admin ou o criador da prova pode editar/deletar
    const isAdmin = session.role === 'admin'
    const isCreator = exam.createdBy === session.userId

    if (!isAdmin && !isCreator) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    /*
     * Só campos conhecidos entram no `$set`.
     *
     * ## O que isto conserta
     *
     * O corpo da requisição era espalhado inteiro (`{ ...body }`) no `$set`.
     * Como qualquer aluno cria prova pessoal — e é o `createdBy` dela —, ele
     * passava por esta autorização legitimamente e depois escrevia QUALQUER
     * campo no documento, direto do console do navegador:
     *
     *   fetch('/api/exams/<prova dele>', { method: 'PUT',
     *     headers: { 'Content-Type': 'application/json' },
     *     body: JSON.stringify({ isPersonalExam: false, isHidden: false }) })
     *
     * Duas chaves, e a prova privada dele passava a ser listada em `/provas`
     * para a plataforma inteira — porque é exatamente por esses dois campos que
     * `GET /api/exams` decide o que é público. O mesmo caminho servia para
     * plantar campos que o código nunca espera achar num documento de prova e
     * quebrar as telas que o leem.
     *
     * ## Como está agora
     *
     * `CAMPOS_DO_CRIADOR` é o que o dono da prova mexe: conteúdo, aparência,
     * tempo e monitoramento. `CAMPOS_SO_DE_ADMIN` é o que decide onde a prova
     * aparece para os OUTROS — visibilidade, grupo, natureza pessoal/pública —
     * e por isso só o painel escreve. O que não está em nenhuma das duas listas
     * é silenciosamente ignorado, inclusive `_id`, `createdBy` e `createdAt`,
     * que antes eram removidos um a um depois do espalhamento.
     */
    const CAMPOS_DO_CRIADOR = [
      'title', 'description', 'coverImage', 'themePhrase', 'pdfUrl',
      'numberOfAlternatives', 'numberOfQuestions', 'questions',
      'scoringMethod', 'totalPoints', 'duration', 'durationMinutes',
      'discursiveCorrectionMethod', 'discursiveAiRigor',
      'essayStyle', 'essayCorrectionMethod', 'essayAiRigor',
      'navigationMode', 'allowCustomName', 'requireSignature',
      'shuffleQuestions', 'timeMode', 'generalizedTimeSeconds',
      'feedbackMode',
    ] as const

    const CAMPOS_SO_DE_ADMIN = [
      'isHidden', 'isPersonalExam', 'isPracticeExam',
      'groupId', 'orderInGroup',
    ] as const

    const permitidos = new Set<string>([
      ...CAMPOS_DO_CRIADOR,
      ...(isAdmin ? CAMPOS_SO_DE_ADMIN : []),
    ])

    const camposEnviados: Record<string, any> = {}
    for (const [chave, valor] of Object.entries(body)) {
      if (permitidos.has(chave)) camposEnviados[chave] = valor
    }

    // Para provas práticas sem datas, usar uma data muito distante no futuro
    const defaultFutureDate = new Date('2099-12-31T23:59:59')
    // Lido de `camposEnviados`, não de `body`: para quem não é admin o campo foi
    // descartado acima, e ler o corpo cru aqui deixaria um não-admin escolher
    // as datas derivadas de uma prova que ele não pode reclassificar.
    const isPracticeExam =
      camposEnviados.isPracticeExam !== undefined
        ? camposEnviados.isPracticeExam
        : exam.isPracticeExam

    // Corrigir numeração das questões (começar em 1, não 0)
    if (camposEnviados.questions && Array.isArray(camposEnviados.questions)) {
      camposEnviados.questions = camposEnviados.questions.map((q: any, index: number) => ({
        ...q,
        number: index + 1
      }))
    }

    // As datas e o bloco de proctoring são derivados, não copiados: eles entram
    // já convertidos, fora da lista de campos permitidos.
    const updateData: Record<string, any> = {
      ...camposEnviados,
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

// PATCH - Reordenar prova dentro do grupo (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const { direction } = await request.json()
    if (direction !== 'up' && direction !== 'down') {
      return NextResponse.json({ error: 'Direção inválida' }, { status: 400 })
    }

    const db = await getDb()
    const examsCollection = db.collection<Exam>('exams')

    const exam = await examsCollection.findOne({ _id: new ObjectId(id) })
    if (!exam) {
      return NextResponse.json({ error: 'Prova não encontrada' }, { status: 404 })
    }

    const groupId = (exam as any).groupId
    if (!groupId) {
      return NextResponse.json({ error: 'Prova não está em um grupo' }, { status: 400 })
    }

    // Fetch all exams in the same group, sorted to match frontend (missing → 999 = last)
    const rawGroupExams = await examsCollection.find({ groupId } as any).toArray()
    const groupExams = rawGroupExams.sort((a, b) => {
      const oa = (a as any).orderInGroup ?? 999
      const ob = (b as any).orderInGroup ?? 999
      return oa !== ob ? oa - ob : 0
    })

    const currentIndex = groupExams.findIndex(e => e._id!.toString() === id)
    if (currentIndex === -1) return NextResponse.json({ error: 'Erro interno' }, { status: 500 })

    const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (swapIndex < 0 || swapIndex >= groupExams.length) {
      return NextResponse.json({ message: 'Já está no limite' })
    }

    // Normalize all orderInGroup values so every exam has an explicit position
    for (let i = 0; i < groupExams.length; i++) {
      await examsCollection.updateOne(
        { _id: groupExams[i]._id } as any,
        { $set: { orderInGroup: i } } as any
      )
    }

    // Swap the two target exams
    await examsCollection.updateOne(
      { _id: groupExams[currentIndex]._id } as any,
      { $set: { orderInGroup: swapIndex } } as any
    )
    await examsCollection.updateOne(
      { _id: groupExams[swapIndex]._id } as any,
      { $set: { orderInGroup: currentIndex } } as any
    )

    return NextResponse.json({ message: 'Reordenado com sucesso' })
  } catch (error) {
    console.error('Reorder exam error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
