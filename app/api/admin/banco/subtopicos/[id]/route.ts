import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { id } = await params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const body = await request.json()
    const db = await getDb()

    const updateData: any = {
      updatedAt: new Date()
    }

    if (body.nome !== undefined) {
      if (body.nome.trim() === '') {
        return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
      }
      updateData.nome = body.nome.trim()
    }

    if (body.codigo !== undefined) {
      updateData.codigo = body.codigo
    }

    if (body.ordem !== undefined) {
      updateData.ordem = body.ordem
    }

    if (body.topicoId !== undefined) {
      updateData.topicoId = new ObjectId(body.topicoId)
    }

    const result = await db.collection('banco_subtopicos').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Subtópico não encontrado' }, { status: 404 })
    }

    return NextResponse.json({ sucesso: true })
  } catch (error) {
    console.error('Erro ao atualizar subtópico:', error)
    return NextResponse.json({ error: 'Erro ao atualizar subtópico' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { id } = await params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const db = await getDb()

    // Verificar se há questões vinculadas
    const questoesVinculadas = await db.collection('banco_questoes')
      .countDocuments({ subtopicoid: new ObjectId(id) })

    if (questoesVinculadas > 0) {
      return NextResponse.json({
        error: `Não é possível excluir: existem ${questoesVinculadas} questões vinculadas a este subtópico`
      }, { status: 400 })
    }

    const result = await db.collection('banco_subtopicos').deleteOne({
      _id: new ObjectId(id)
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Subtópico não encontrado' }, { status: 404 })
    }

    return NextResponse.json({ sucesso: true })
  } catch (error) {
    console.error('Erro ao excluir subtópico:', error)
    return NextResponse.json({ error: 'Erro ao excluir subtópico' }, { status: 500 })
  }
}
