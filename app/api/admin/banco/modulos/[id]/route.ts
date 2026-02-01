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

    if (body.periodoId !== undefined) {
      updateData.periodoId = new ObjectId(body.periodoId)
    }

    const result = await db.collection('banco_modulos').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Módulo não encontrado' }, { status: 404 })
    }

    return NextResponse.json({ sucesso: true })
  } catch (error) {
    console.error('Erro ao atualizar módulo:', error)
    return NextResponse.json({ error: 'Erro ao atualizar módulo' }, { status: 500 })
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
    const moduloId = new ObjectId(id)

    // Contar itens vinculados
    const questoesVinculadas = await db.collection('banco_questoes')
      .countDocuments({ moduloId })
    const topicosVinculados = await db.collection('banco_topicos')
      .countDocuments({ moduloId })

    // Se não for cascata e houver vínculos, retornar erro
    if (!cascata && (questoesVinculadas > 0 || topicosVinculados > 0)) {
      return NextResponse.json({
        error: 'Existem itens vinculados a este módulo',
        detalhes: {
          questoes: questoesVinculadas,
          topicos: topicosVinculados
        },
        mensagem: `Este módulo possui ${topicosVinculados} tópico(s) e ${questoesVinculadas} questão(ões). Deseja excluir tudo?`
      }, { status: 400 })
    }

    // Se cascata, deletar tudo
    if (cascata) {
      // Buscar tópicos do módulo
      const topicos = await db.collection('banco_topicos')
        .find({ moduloId })
        .toArray()
      const topicoIds = topicos.map(t => t._id)

      // Deletar subtópicos
      await db.collection('banco_subtopicos')
        .deleteMany({ topicoId: { $in: topicoIds } })

      // Deletar tópicos
      await db.collection('banco_topicos')
        .deleteMany({ moduloId })

      // Deletar questões
      await db.collection('banco_questoes')
        .deleteMany({ moduloId })
    }

    const result = await db.collection('banco_modulos').deleteOne({
      _id: moduloId
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Módulo não encontrado' }, { status: 404 })
    }

    return NextResponse.json({
      sucesso: true,
      excluidos: cascata ? {
        questoes: questoesVinculadas,
        topicos: topicosVinculados
      } : undefined
    })
  } catch (error) {
    console.error('Erro ao excluir módulo:', error)
    return NextResponse.json({ error: 'Erro ao excluir módulo' }, { status: 500 })
  }
}
