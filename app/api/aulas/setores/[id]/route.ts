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

    const body = await request.json()
    const { nome, descricao, oculta, ordem } = body

    const setoresCollection = db.collection('aulas_setores')

    const updateData: any = {
      atualizadoEm: new Date()
    }

    if (nome !== undefined) updateData.nome = nome
    if (descricao !== undefined) updateData.descricao = descricao
    if (oculta !== undefined) updateData.oculta = oculta
    if (ordem !== undefined) updateData.ordem = ordem

    const result = await setoresCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    )

    if (!result || !result.value) {
      return NextResponse.json(
        { error: 'Setor não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      item: result.value
    })
  } catch (error) {
    console.error('Update setor error:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar setor' },
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

    const setoresCollection = db.collection('aulas_setores')

    const result = await setoresCollection.deleteOne({
      _id: new ObjectId(id)
    })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Setor não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Setor deletado com sucesso'
    })
  } catch (error) {
    console.error('Delete setor error:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar setor' },
      { status: 500 }
    )
  }
}
