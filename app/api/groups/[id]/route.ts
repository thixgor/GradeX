import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

// PUT - Atualizar grupo
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { id } = params
    const { name, description, color, icon } = await req.json()

    const client = await clientPromise
    const db = client.db('GradeX')
    const groupsCollection = db.collection('groups')

    // Buscar grupo
    const group = await groupsCollection.findOne({ _id: new ObjectId(id) })
    if (!group) {
      return NextResponse.json({ error: 'Grupo não encontrado' }, { status: 404 })
    }

    // Verificar permissão
    // - Grupos pessoais: só o criador pode editar
    // - Grupos gerais: só admin pode editar
    if (group.type === 'personal' && group.createdBy !== session.userId) {
      return NextResponse.json({ error: 'Sem permissão para editar este grupo' }, { status: 403 })
    }
    if (group.type === 'general' && session.role !== 'admin') {
      return NextResponse.json({ error: 'Apenas administradores podem editar grupos gerais' }, { status: 403 })
    }

    // Atualizar grupo
    const updateData: any = {
      updatedAt: new Date(),
    }
    if (name !== undefined) updateData.name = name.trim()
    if (description !== undefined) updateData.description = description.trim()
    if (color !== undefined) updateData.color = color
    if (icon !== undefined) updateData.icon = icon

    await groupsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    )

    return NextResponse.json({ message: 'Grupo atualizado com sucesso' })
  } catch (error: any) {
    console.error('Erro ao atualizar grupo:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Deletar grupo
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { id } = params

    const client = await clientPromise
    const db = client.db('GradeX')
    const groupsCollection = db.collection('groups')
    const examsCollection = db.collection('exams')

    // Buscar grupo
    const group = await groupsCollection.findOne({ _id: new ObjectId(id) })
    if (!group) {
      return NextResponse.json({ error: 'Grupo não encontrado' }, { status: 404 })
    }

    // Verificar permissão
    if (group.type === 'personal' && group.createdBy !== session.userId) {
      return NextResponse.json({ error: 'Sem permissão para deletar este grupo' }, { status: 403 })
    }
    if (group.type === 'general' && session.role !== 'admin') {
      return NextResponse.json({ error: 'Apenas administradores podem deletar grupos gerais' }, { status: 403 })
    }

    // Mover todas as provas deste grupo de volta para a página inicial (groupId = null)
    await examsCollection.updateMany(
      { groupId: id },
      { $set: { groupId: null, updatedAt: new Date() } }
    )

    // Deletar grupo
    await groupsCollection.deleteOne({ _id: new ObjectId(id) })

    return NextResponse.json({ message: 'Grupo deletado com sucesso' })
  } catch (error: any) {
    console.error('Erro ao deletar grupo:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
