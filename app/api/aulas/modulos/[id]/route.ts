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
    console.log('PATCH /api/aulas/modulos/[id]', { id, isValid: ObjectId.isValid(id) })
    
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
    const { nome, descricao, oculta } = body

    const modulosCollection = db.collection('aulas_modulos')

    const updateData: any = {
      atualizadoEm: new Date()
    }

    if (nome !== undefined) updateData.nome = nome
    if (descricao !== undefined) updateData.descricao = descricao
    if (oculta !== undefined) updateData.oculta = oculta

    const filter: any = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id }
    console.log('Modulo PATCH filter', filter)

    let result = await modulosCollection.findOneAndUpdate(
      filter,
      { $set: updateData },
      { returnDocument: 'after' }
    )

    if ((!result || !result.value) && ObjectId.isValid(id)) {
      result = await modulosCollection.findOneAndUpdate(
        { _id: id } as any,
        { $set: updateData },
        { returnDocument: 'after' }
      )
    }

    if (!result || !result.value) {
      return NextResponse.json(
        { error: 'Módulo não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      item: result.value
    })
  } catch (error) {
    console.error('Update módulo error:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar módulo' },
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
    const modulosCollection = db.collection('aulas_modulos')

    const filter: any = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id }

    let result = await modulosCollection.deleteOne(filter)

    if (result.deletedCount === 0 && ObjectId.isValid(id)) {
      result = await modulosCollection.deleteOne({ _id: id } as any)
    }

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Módulo não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar módulo:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar módulo' },
      { status: 500 }
    )
  }
}
