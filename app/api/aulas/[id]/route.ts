import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { AulaPostagem } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const db = await getDb()
    const aulasCollection = db.collection<AulaPostagem>('aulas_postagens')

    const aula = await aulasCollection.findOne({
      _id: new ObjectId(params.id)
    })

    if (!aula) {
      return NextResponse.json(
        { error: 'Aula não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({ aula })
  } catch (error) {
    console.error('Erro ao buscar aula:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar aula' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const isAdmin = session.role === 'admin'
    const db = await getDb()
    const usersCollection = db.collection('users')
    const user = await usersCollection.findOne({ _id: new ObjectId(session.userId) })
    const isMonitor = user?.secondaryRole === 'monitor'

    if (!isAdmin && !isMonitor) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const aulasCollection = db.collection<AulaPostagem>('aulas_postagens')

    console.log('PATCH /api/aulas/[id]:', { aulaId: params.id, body })

    // Processar campos que precisam de conversão
    const updateData: any = { ...body }
    
    // Converter dataLiberacao para Date se for string
    if (updateData.dataLiberacao && typeof updateData.dataLiberacao === 'string') {
      updateData.dataLiberacao = new Date(updateData.dataLiberacao)
    }

    // Remover campos undefined e null
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined || updateData[key] === null) {
        delete updateData[key]
      }
    })

    console.log('Update data:', updateData)

    const result = await aulasCollection.updateOne(
      { _id: new ObjectId(params.id) },
      {
        $set: {
          ...updateData,
          atualizadoEm: new Date()
        }
      }
    )

    console.log('Update result:', { matchedCount: result.matchedCount, modifiedCount: result.modifiedCount })

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Aula não encontrada' },
        { status: 404 }
      )
    }

    const aula = await aulasCollection.findOne({
      _id: new ObjectId(params.id)
    })

    return NextResponse.json({ aula })
  } catch (error) {
    console.error('Erro ao atualizar aula:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar aula' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const isAdmin = session.role === 'admin'
    const db = await getDb()
    const usersCollection = db.collection('users')
    const user = await usersCollection.findOne({ _id: new ObjectId(session.userId) })
    const isMonitor = user?.secondaryRole === 'monitor'

    if (!isAdmin && !isMonitor) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const aulasCollection = db.collection<AulaPostagem>('aulas_postagens')

    const result = await aulasCollection.deleteOne({
      _id: new ObjectId(params.id)
    })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Aula não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar aula:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar aula' },
      { status: 500 }
    )
  }
}
