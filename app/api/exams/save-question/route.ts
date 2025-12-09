import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { Question } from '@/lib/types'

export const dynamic = 'force-dynamic'

/**
 * POST - Salva uma questão individual em uma prova
 * Usado para salvar questões uma por uma durante a geração em lote
 * para evitar perda de dados se a IA falhar no meio do processo
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { examId, question } = await request.json()

    if (!examId || !question) {
      return NextResponse.json(
        { error: 'examId e question são obrigatórios' },
        { status: 400 }
      )
    }

    const db = await getDb()
    const examsCollection = db.collection('exams')

    // Validar se a prova existe e pertence ao usuário
    const exam = await examsCollection.findOne({
      _id: new ObjectId(examId),
      createdBy: session.userId,
    })

    if (!exam) {
      return NextResponse.json(
        { error: 'Prova não encontrada ou sem permissão' },
        { status: 404 }
      )
    }

    // Adicionar a questão ao array de questões
    const result = await examsCollection.updateOne(
      { _id: new ObjectId(examId) },
      {
        $push: { questions: question },
        $set: { updatedAt: new Date() },
      }
    )

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: 'Falha ao salvar questão' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Questão salva com sucesso',
    })
  } catch (error: any) {
    console.error('Erro ao salvar questão:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao salvar questão' },
      { status: 500 }
    )
  }
}
