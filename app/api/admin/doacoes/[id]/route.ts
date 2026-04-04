import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

// PATCH — aprovar / rejeitar / editar doação
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const body = await req.json()
    const db = await getDb()
    const now = new Date()

    let id: ObjectId
    try {
      id = new ObjectId(params.id)
    } catch {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const update: Record<string, unknown> = { updatedAt: now }

    if (body.status !== undefined) update.status = body.status
    if (body.nomeCompleto !== undefined) update.nomeCompleto = body.nomeCompleto.trim()
    if (body.apelido !== undefined) update.apelido = body.apelido.trim()
    if (body.valor !== undefined) update.valor = Number(body.valor)
    if (body.mensagem !== undefined) update.mensagem = body.mensagem?.trim() || undefined
    if (body.dataDoacao !== undefined) update.dataDoacao = new Date(body.dataDoacao)

    if (body.status === 'approved' || body.status === 'rejected') {
      update.reviewedBy = session.userId
      update.reviewedAt = now
    }

    const result = await db.collection('doacoes').findOneAndUpdate(
      { _id: id },
      { $set: update },
      { returnDocument: 'after' }
    )

    if (!result) {
      return NextResponse.json({ error: 'Doação não encontrada' }, { status: 404 })
    }

    return NextResponse.json({ ...result, _id: result._id.toString() })
  } catch (error) {
    console.error('Erro ao atualizar doação:', error)
    return NextResponse.json({ error: 'Erro ao atualizar doação' }, { status: 500 })
  }
}

// DELETE — remover doação
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    let id: ObjectId
    try {
      id = new ObjectId(params.id)
    } catch {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const db = await getDb()
    const result = await db.collection('doacoes').deleteOne({ _id: id })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Doação não encontrada' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar doação:', error)
    return NextResponse.json({ error: 'Erro ao deletar doação' }, { status: 500 })
  }
}
