import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

// PUT - Mover prova para grupo
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { id } = params
    const { groupId } = await req.json() // groupId pode ser null (página inicial) ou ID de um grupo

    const client = await clientPromise
    const db = client.db('GradeX')
    const examsCollection = db.collection('exams')
    const groupsCollection = db.collection('groups')

    // Buscar prova
    const exam = await examsCollection.findOne({ _id: new ObjectId(id) })
    if (!exam) {
      return NextResponse.json({ error: 'Prova não encontrada' }, { status: 404 })
    }

    // REGRAS DE MOVIMENTAÇÃO:
    // 1. Admins podem mover qualquer prova para qualquer lugar
    // 2. Usuários podem mover:
    //    - Provas pessoais (isPersonalExam=true) para grupos pessoais ou página inicial
    //    - Provas que estão em grupos pessoais para a página inicial
    // 3. Usuários NÃO podem mover:
    //    - Provas que estão em grupos gerais (criados por admin)
    //    - Provas públicas (isPersonalExam=false ou undefined) que não criaram

    const isAdmin = session.user?.role === 'admin'

    // Se não for admin, validar permissões
    if (!isAdmin) {
      // Verificar se a prova está em um grupo geral
      if (exam.groupId) {
        const currentGroup = await groupsCollection.findOne({ _id: new ObjectId(exam.groupId) })
        if (currentGroup && currentGroup.type === 'general') {
          return NextResponse.json(
            { error: 'Você não pode mover provas que estão em grupos gerais' },
            { status: 403 }
          )
        }
      }

      // Verificar se é uma prova pessoal do usuário
      const isPersonalExam = exam.isPersonalExam && exam.createdBy === session.userId

      // Se não for prova pessoal e não estiver em grupo pessoal do usuário, não pode mover
      if (!isPersonalExam) {
        return NextResponse.json(
          { error: 'Você só pode mover suas provas pessoais' },
          { status: 403 }
        )
      }

      // Se estiver movendo para um grupo (não null), verificar se o grupo é pessoal do usuário
      if (groupId) {
        const targetGroup = await groupsCollection.findOne({ _id: new ObjectId(groupId) })
        if (!targetGroup) {
          return NextResponse.json({ error: 'Grupo de destino não encontrado' }, { status: 404 })
        }

        if (targetGroup.type === 'general') {
          return NextResponse.json(
            { error: 'Você não pode mover provas pessoais para grupos gerais' },
            { status: 403 }
          )
        }

        if (targetGroup.type === 'personal' && targetGroup.createdBy !== session.userId) {
          return NextResponse.json(
            { error: 'Você não pode mover provas para grupos pessoais de outros usuários' },
            { status: 403 }
          )
        }
      }
    }

    // Se groupId for fornecido, verificar se o grupo existe
    if (groupId) {
      const targetGroup = await groupsCollection.findOne({ _id: new ObjectId(groupId) })
      if (!targetGroup) {
        return NextResponse.json({ error: 'Grupo de destino não encontrado' }, { status: 404 })
      }
    }

    // Mover prova
    await examsCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          groupId: groupId || null,
          updatedAt: new Date(),
        },
      }
    )

    const destinationName = groupId ? 'grupo' : 'página inicial'
    return NextResponse.json({
      message: `Prova movida para ${destinationName} com sucesso`,
    })
  } catch (error: any) {
    console.error('Erro ao mover prova:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
