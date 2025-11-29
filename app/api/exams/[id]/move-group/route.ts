import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

// PATCH - Mover prova para um grupo
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { groupId } = await request.json()
    const examId = params.id

    const db = await getDb()
    const examsCollection = db.collection('exams')
    const groupsCollection = db.collection('groups')

    // Buscar a prova
    const exam = await examsCollection.findOne({
      _id: new ObjectId(examId),
    })

    if (!exam) {
      return NextResponse.json({ error: 'Prova não encontrada' }, { status: 404 })
    }

    // Validação de permissões
    // Se a prova está em um grupo geral, apenas admin pode movê-la
    if (exam.groupId) {
      const currentGroup = await groupsCollection.findOne({
        _id: new ObjectId(exam.groupId),
      })

      if (currentGroup?.type === 'general' && session.role !== 'admin') {
        return NextResponse.json(
          { error: 'Apenas administradores podem mover provas de grupos gerais' },
          { status: 403 }
        )
      }
    }

    // Se não é admin e a prova é pessoal dele, pode mover para grupos pessoais ou remover de grupo
    if (session.role !== 'admin' && exam.createdBy !== session.userId) {
      return NextResponse.json(
        { error: 'Sem permissão para mover esta prova' },
        { status: 403 }
      )
    }

    // Se está tentando mover para um grupo geral e não é admin
    if (groupId) {
      const targetGroup = await groupsCollection.findOne({
        _id: new ObjectId(groupId),
      })

      if (targetGroup?.type === 'general' && session.role !== 'admin') {
        return NextResponse.json(
          { error: 'Apenas administradores podem mover provas para grupos gerais' },
          { status: 403 }
        )
      }

      // Validar que o grupo existe e pertence ao usuário (se for pessoal)
      if (targetGroup?.type === 'personal' && targetGroup.createdBy !== session.userId) {
        return NextResponse.json(
          { error: 'Você não pode mover provas para grupos de outros usuários' },
          { status: 403 }
        )
      }
    }

    // Atualizar a prova
    const result = await examsCollection.updateOne(
      { _id: new ObjectId(examId) },
      {
        $set: {
          groupId: groupId || null,
          updatedAt: new Date(),
        },
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Prova não encontrada' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Prova movida com sucesso',
    })
  } catch (error: any) {
    console.error('Erro ao mover prova:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
