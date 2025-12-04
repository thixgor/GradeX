import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    console.log('PATCH /api/aulas/subtopicos/[id]:', { id })
    
    const session = await getSession()
    if (!session) {
      console.log('No session found')
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Verificar se é admin ou monitor
    const db = await getDb()
    const usersCollection = db.collection('users')
    const user = await usersCollection.findOne({ _id: new ObjectId(session.userId) })

    const isAdmin = session.role === 'admin'
    const isMonitor = user?.secondaryRole === 'monitor'

    if (!isAdmin && !isMonitor) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { nome, descricao, oculta } = body

    const subtopicosCollection = db.collection('aulas_subtopicos')

    const updateData: any = {
      atualizadoEm: new Date()
    }

    if (nome !== undefined) updateData.nome = nome
    if (descricao !== undefined) updateData.descricao = descricao
    if (oculta !== undefined) updateData.oculta = oculta

    const result = await subtopicosCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    )

    if (!result || !result.value) {
      return NextResponse.json(
        { error: 'Subtópico não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      item: result.value
    })
  } catch (error) {
    console.error('Update subtópico error:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar subtópico' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Verificar se é admin ou monitor
    const db = await getDb()
    const usersCollection = db.collection('users')
    const user = await usersCollection.findOne({ _id: new ObjectId(session.userId) })

    const isAdmin = session.role === 'admin'
    const isMonitor = user?.secondaryRole === 'monitor'

    if (!isAdmin && !isMonitor) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    const subtopicosCollection = db.collection('aulas_subtopicos')
    const postagensCollection = db.collection('aulas_postagens')

    // Deletar todas as aulas associadas ao subtópico
    const deleteAulasResult = await postagensCollection.deleteMany({
      subtopicoId: new ObjectId(id)
    })

    const result = await subtopicosCollection.deleteOne({
      _id: new ObjectId(id)
    })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Subtópico não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Subtópico deletado com sucesso (${deleteAulasResult.deletedCount} aula(s) removida(s))`,
      deletedAulas: deleteAulasResult.deletedCount
    })
  } catch (error) {
    console.error('Erro ao deletar subtópico:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar subtópico' },
      { status: 500 }
    )
  }
}
