import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { z } from 'zod'

const reportSchema = z.object({
  reason: z.enum([
    'erro_gabarito',
    'enunciado_confuso',
    'imagem_ruim',
    'conteudo_desatualizado',
    'outros'
  ]),
  description: z.string().max(500).optional(),
  questionId: z.string(), // UUID da questão dentro da prova
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { id: examId } = await params
    if (!ObjectId.isValid(examId)) {
      return NextResponse.json({ error: 'ID da prova inválido' }, { status: 400 })
    }

    const body = await request.json()
    const validation = reportSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ error: 'Dados inválidos', details: validation.error.format() }, { status: 400 })
    }

    const { reason, description, questionId } = validation.data

    if (reason === 'outros' && (!description || description.trim().length === 0)) {
      return NextResponse.json({ error: 'Descrição é obrigatória para "Outros"' }, { status: 400 })
    }

    const db = await getDb()

    // Verificar se a prova existe
    const exam = await db.collection('exams').findOne({ _id: new ObjectId(examId) })
    if (!exam) {
      return NextResponse.json({ error: 'Prova não encontrada' }, { status: 404 })
    }

    // Verificar se a questão existe na prova
    const question = exam.questions?.find((q: any) => q.id === questionId)
    if (!question) {
      return NextResponse.json({ error: 'Questão não encontrada nesta prova' }, { status: 404 })
    }

    // Criar o relato (reutiliza a mesma collection de reports)
    const report = {
      examId: new ObjectId(examId),
      examQuestionId: questionId,
      questionEnunciado: question.statement?.substring(0, 200) || '',
      userId: new ObjectId(session.userId),
      reason,
      description: description ? description.trim() : null,
      status: 'pending',
      source: 'exam', // Distinguir de reports do banco de questões
      createdAt: new Date(),
      updatedAt: new Date()
    }

    await db.collection('banco_questoes_reports').insertOne(report)

    return NextResponse.json({ success: true, message: 'Relato enviado com sucesso' })
  } catch (error) {
    console.error('Erro ao enviar relato:', error)
    return NextResponse.json({ error: 'Erro interno ao processar relato' }, { status: 500 })
  }
}
