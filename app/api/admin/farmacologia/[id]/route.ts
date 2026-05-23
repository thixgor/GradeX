import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { generateSlug } from '@/lib/utils/slug'

export const dynamic = 'force-dynamic'

// GET - Obter medicamento por id (admin)
export async function GET(
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
    const medicamento = await db.collection('medicamentos').findOne({ _id: new ObjectId(id) })
    if (!medicamento) {
      return NextResponse.json({ error: 'Medicamento não encontrado' }, { status: 404 })
    }
    return NextResponse.json(medicamento)
  } catch (error) {
    console.error('Erro ao buscar medicamento:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// PUT - Atualizar medicamento
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

    const current = await db.collection('medicamentos').findOne({ _id: new ObjectId(id) })
    if (!current) {
      return NextResponse.json({ error: 'Medicamento não encontrado' }, { status: 404 })
    }

    let slug = current.slug
    if (body.nome && body.nome !== current.nome) {
      slug = generateSlug(body.nome)
      const existing = await db.collection('medicamentos').findOne({ slug, _id: { $ne: new ObjectId(id) } })
      if (existing) slug = `${slug}-${Date.now()}`
    }

    const { _id, createdAt, ...rest } = body
    await db.collection('medicamentos').updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...rest, slug, updatedAt: new Date() } }
    )

    return NextResponse.json({ success: true, slug })
  } catch (error) {
    console.error('Erro ao atualizar medicamento:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// DELETE - Excluir medicamento
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
    await db.collection('medicamentos').deleteOne({ _id: new ObjectId(id) })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao excluir medicamento:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
