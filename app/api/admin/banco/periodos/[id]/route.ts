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

    const result = await db.collection('banco_periodos').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Período não encontrado' }, { status: 404 })
    }

    return NextResponse.json({ sucesso: true })
  } catch (error) {
    console.error('Erro ao atualizar período:', error)
    return NextResponse.json({ error: 'Erro ao atualizar período' }, { status: 500 })
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
    const { searchParams } = new URL(request.url)
    const cascata = searchParams.get('cascata') === 'true'

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const db = await getDb()
    const periodoId = new ObjectId(id)

    // Contar itens vinculados
    const questoesVinculadas = await db.collection('banco_questoes')
      .countDocuments({ periodoId })
    const modulosVinculados = await db.collection('banco_modulos')
      .countDocuments({ periodoId })

    // Se não for cascata e houver vínculos, retornar erro com contagem
    if (!cascata && (questoesVinculadas > 0 || modulosVinculados > 0)) {
      return NextResponse.json({
        error: 'Existem itens vinculados a este período',
        detalhes: {
          questoes: questoesVinculadas,
          modulos: modulosVinculados
        },
        mensagem: `Este período possui ${modulosVinculados} módulo(s) e ${questoesVinculadas} questão(ões). Deseja excluir tudo?`
      }, { status: 400 })
    }

    // Se cascata, deletar tudo em ordem
    if (cascata) {
      // Primeiro, buscar todos os módulos deste período
      const modulos = await db.collection('banco_modulos')
        .find({ periodoId })
        .toArray()

      const moduloIds = modulos.map(m => m._id)

      // Buscar todos os tópicos destes módulos
      const topicos = await db.collection('banco_topicos')
        .find({ moduloId: { $in: moduloIds } })
        .toArray()

      const topicoIds = topicos.map(t => t._id)

      // Deletar subtópicos dos tópicos
      await db.collection('banco_subtopicos')
        .deleteMany({ topicoId: { $in: topicoIds } })

      // Deletar tópicos dos módulos
      await db.collection('banco_topicos')
        .deleteMany({ moduloId: { $in: moduloIds } })

      // Deletar questões do período
      await db.collection('banco_questoes')
        .deleteMany({ periodoId })

      // Deletar módulos do período
      await db.collection('banco_modulos')
        .deleteMany({ periodoId })
    }

    // Deletar o período
    const result = await db.collection('banco_periodos').deleteOne({
      _id: periodoId
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Período não encontrado' }, { status: 404 })
    }

    return NextResponse.json({
      sucesso: true,
      excluidos: cascata ? {
        questoes: questoesVinculadas,
        modulos: modulosVinculados
      } : undefined
    })
  } catch (error) {
    console.error('Erro ao excluir período:', error)
    return NextResponse.json({ error: 'Erro ao excluir período' }, { status: 500 })
  }
}
