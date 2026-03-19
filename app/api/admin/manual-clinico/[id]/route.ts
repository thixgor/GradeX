import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { generateSlug } from '@/lib/utils/slug'

export const dynamic = 'force-dynamic'

// GET - Obter patologia por ID
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
    const db = await getDb()
    const patologia = await db.collection('patologias').findOne({ _id: new ObjectId(id) })

    if (!patologia) {
      return NextResponse.json({ error: 'Patologia não encontrada' }, { status: 404 })
    }

    return NextResponse.json(patologia)
  } catch (error) {
    console.error('Erro ao buscar patologia:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// PUT - Atualizar patologia
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
    const body = await request.json()
    const db = await getDb()

    const existing = await db.collection('patologias').findOne({ _id: new ObjectId(id) })
    if (!existing) {
      return NextResponse.json({ error: 'Patologia não encontrada' }, { status: 404 })
    }

    // Regenerar slug se nome mudou
    let slug = existing.slug
    if (body.nome && body.nome !== existing.nome) {
      slug = generateSlug(body.nome)
      const slugConflict = await db.collection('patologias').findOne({
        slug,
        _id: { $ne: new ObjectId(id) }
      })
      if (slugConflict) {
        slug = `${slug}-${Date.now()}`
      }
    }

    const updateData = {
      nome: body.nome ?? existing.nome,
      sinonimos: body.sinonimos ?? existing.sinonimos,
      areas: body.areas ?? existing.areas,
      sistema: body.sistema ?? existing.sistema,
      classificacao: body.classificacao ?? existing.classificacao,
      fisiopatologia: body.fisiopatologia ?? existing.fisiopatologia,
      diagnostico_semiologico: body.diagnostico_semiologico ?? existing.diagnostico_semiologico,
      diagnosticos_diferenciais: body.diagnosticos_diferenciais ?? existing.diagnosticos_diferenciais,
      gravidade: body.gravidade ?? existing.gravidade,
      tratamento: body.tratamento ?? existing.tratamento,
      farmacologia: body.farmacologia ?? existing.farmacologia,
      fluxograma_tratamento: body.fluxograma_tratamento ?? existing.fluxograma_tratamento,
      cid10: body.cid10 ?? existing.cid10,
      slug,
      imagens_mecanismo: body.imagens_mecanismo ?? existing.imagens_mecanismo,
      legenda_imagens: body.legenda_imagens ?? existing.legenda_imagens,
      observacoes_clinicas: body.observacoes_clinicas ?? existing.observacoes_clinicas,
      referencias: body.referencias ?? existing.referencias,
      updatedAt: new Date(),
    }

    await db.collection('patologias').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    )

    return NextResponse.json({ success: true, slug })
  } catch (error) {
    console.error('Erro ao atualizar patologia:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// DELETE - Excluir patologia
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
    const db = await getDb()

    const result = await db.collection('patologias').deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Patologia não encontrada' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao excluir patologia:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
