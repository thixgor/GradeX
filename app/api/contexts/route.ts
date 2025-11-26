import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { Settings, CustomContext } from '@/lib/types'
import { v4 as uuidv4 } from 'uuid'

// GET - Obter todos os contextos personalizados
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const db = await getDb()
    const settingsCollection = db.collection<Settings>('settings')
    const settings = await settingsCollection.findOne({})

    return NextResponse.json({
      success: true,
      contexts: settings?.customContexts || [],
    })
  } catch (error: any) {
    console.error('Error fetching custom contexts:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar contextos' },
      { status: 500 }
    )
  }
}

// POST - Adicionar novo contexto personalizado
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Nome do contexto é obrigatório' },
        { status: 400 }
      )
    }

    const newContext: CustomContext = {
      id: uuidv4(),
      name: name.trim(),
      description: description?.trim() || '',
      createdAt: new Date(),
    }

    const db = await getDb()
    const settingsCollection = db.collection<Settings>('settings')

    // Adicionar o contexto ao array customContexts
    await settingsCollection.updateOne(
      {},
      {
        $push: { customContexts: newContext },
        $set: {
          updatedAt: new Date(),
          updatedBy: session.userId,
        },
      },
      { upsert: true }
    )

    return NextResponse.json({
      success: true,
      context: newContext,
    })
  } catch (error: any) {
    console.error('Error adding custom context:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao adicionar contexto' },
      { status: 500 }
    )
  }
}

// PUT - Editar contexto personalizado
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const body = await request.json()
    const { id, name, description } = body

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'ID do contexto é obrigatório' },
        { status: 400 }
      )
    }

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Nome do contexto é obrigatório' },
        { status: 400 }
      )
    }

    const db = await getDb()
    const settingsCollection = db.collection<Settings>('settings')

    // Atualizar o contexto específico no array
    const result = await settingsCollection.updateOne(
      { 'customContexts.id': id },
      {
        $set: {
          'customContexts.$.name': name.trim(),
          'customContexts.$.description': description?.trim() || '',
          updatedAt: new Date(),
          updatedBy: session.userId,
        },
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Contexto não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Contexto atualizado com sucesso',
    })
  } catch (error: any) {
    console.error('Error updating custom context:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao atualizar contexto' },
      { status: 500 }
    )
  }
}

// DELETE - Excluir contexto personalizado
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID do contexto é obrigatório' },
        { status: 400 }
      )
    }

    const db = await getDb()
    const settingsCollection = db.collection<Settings>('settings')

    // Remover o contexto do array
    const result = await settingsCollection.updateOne(
      {},
      {
        $pull: { customContexts: { id } },
        $set: {
          updatedAt: new Date(),
          updatedBy: session.userId,
        },
      }
    )

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: 'Contexto não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Contexto excluído com sucesso',
    })
  } catch (error: any) {
    console.error('Error deleting custom context:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao excluir contexto' },
      { status: 500 }
    )
  }
}
