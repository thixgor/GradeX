import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { BancoQuestaoFormData } from '@/lib/types/banco-questoes'

export const dynamic = 'force-dynamic'

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

    const questao = await db.collection('banco_questoes')
      .aggregate([
        { $match: { _id: new ObjectId(id) } },
        {
          $lookup: {
            from: 'banco_periodos',
            localField: 'periodoId',
            foreignField: '_id',
            as: 'periodo'
          }
        },
        {
          $lookup: {
            from: 'banco_modulos',
            localField: 'moduloId',
            foreignField: '_id',
            as: 'modulo'
          }
        },
        {
          $lookup: {
            from: 'banco_topicos',
            localField: 'topicoId',
            foreignField: '_id',
            as: 'topico'
          }
        },
        {
          $lookup: {
            from: 'banco_subtopicos',
            localField: 'subtopicoid',
            foreignField: '_id',
            as: 'subtopico'
          }
        },
        {
          $addFields: {
            periodoNome: { $arrayElemAt: ['$periodo.nome', 0] },
            moduloNome: { $arrayElemAt: ['$modulo.nome', 0] },
            topicoNome: { $arrayElemAt: ['$topico.nome', 0] },
            subtopicoNome: { $arrayElemAt: ['$subtopico.nome', 0] }
          }
        },
        {
          $project: {
            periodo: 0,
            modulo: 0,
            topico: 0,
            subtopico: 0
          }
        }
      ])
      .toArray()

    if (questao.length === 0) {
      return NextResponse.json({ error: 'Questão não encontrada' }, { status: 404 })
    }

    return NextResponse.json({ questao: questao[0] })
  } catch (error) {
    console.error('Erro ao buscar questão:', error)
    return NextResponse.json({ error: 'Erro ao buscar questão' }, { status: 500 })
  }
}

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

    const body: Partial<BancoQuestaoFormData> = await request.json()
    const db = await getDb()

    const questaoExistente = await db.collection('banco_questoes').findOne({ _id: new ObjectId(id) })
    if (!questaoExistente) {
      return NextResponse.json({ error: 'Questão não encontrada' }, { status: 404 })
    }

    const updateData: any = {
      updatedAt: new Date()
    }

    if (body.tipo !== undefined) {
      if (!['objetiva', 'discursiva'].includes(body.tipo)) {
        return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 })
      }
      updateData.tipo = body.tipo
    }

    if (body.periodoId !== undefined) {
      updateData.periodoId = new ObjectId(body.periodoId)
    }

    if (body.moduloId !== undefined) {
      updateData.moduloId = new ObjectId(body.moduloId)
    }

    if (body.topicoId !== undefined) {
      updateData.topicoId = new ObjectId(body.topicoId)
    }

    if (body.subtopicoId !== undefined) {
      updateData.subtopicoid = body.subtopicoId ? new ObjectId(body.subtopicoId) : null
    }

    if (body.enunciado !== undefined) {
      if (body.enunciado.trim() === '') {
        return NextResponse.json({ error: 'Enunciado é obrigatório' }, { status: 400 })
      }
      updateData.enunciado = body.enunciado.trim()
    }

    if (body.explicacao !== undefined) {
      updateData.explicacao = body.explicacao?.trim() || null
    }

    if (body.imagemUrl !== undefined) {
      updateData.imagemUrl = body.imagemUrl?.trim() || null
    }

    if (body.alternativas !== undefined) {
      updateData.alternativas = body.alternativas
    }

    if (body.respostaModelo !== undefined) {
      updateData.respostaModelo = body.respostaModelo?.trim() || null
    }

    if (body.dificuldade !== undefined) {
      updateData.dificuldade = body.dificuldade || null
    }

    if (body.tags !== undefined) {
      updateData.tags = body.tags
    }

    if (body.fonte !== undefined) {
      updateData.fonte = body.fonte?.trim() || null
    }

    if (body.ano !== undefined) {
      updateData.ano = body.ano || null
    }

    await db.collection('banco_questoes').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    )

    return NextResponse.json({ sucesso: true })
  } catch (error) {
    console.error('Erro ao atualizar questão:', error)
    return NextResponse.json({ error: 'Erro ao atualizar questão' }, { status: 500 })
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

    // Remover questão das listas de usuários
    await db.collection('banco_listas_usuario').updateMany(
      {},
      { $pull: { questaoIds: new ObjectId(id) } as any }
    )

    // Remover resoluções
    await db.collection('banco_resolucoes').deleteMany({
      questaoId: new ObjectId(id)
    })

    // Excluir questão
    const result = await db.collection('banco_questoes').deleteOne({
      _id: new ObjectId(id)
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Questão não encontrada' }, { status: 404 })
    }

    return NextResponse.json({ sucesso: true })
  } catch (error) {
    console.error('Erro ao excluir questão:', error)
    return NextResponse.json({ error: 'Erro ao excluir questão' }, { status: 500 })
  }
}
