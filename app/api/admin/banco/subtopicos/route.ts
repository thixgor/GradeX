import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { BancoSubtopico, BancoSubtopicoComContagem } from '@/lib/types/banco-questoes'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const topicoId = searchParams.get('topicoId')

    const db = await getDb()

    const pipeline: any[] = []

    if (topicoId) {
      pipeline.push({
        $match: { topicoId: new ObjectId(topicoId) }
      })
    }

    pipeline.push(
      {
        $lookup: {
          from: 'banco_questoes',
          localField: '_id',
          foreignField: 'subtopicoid',
          as: 'questoes'
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
        $addFields: {
          totalQuestoes: { $size: '$questoes' },
          topicoNome: { $arrayElemAt: ['$topico.nome', 0] }
        }
      },
      {
        $project: {
          questoes: 0,
          topico: 0
        }
      },
      { $sort: { ordem: 1 } }
    )

    const subtopicos = await db.collection<BancoSubtopico>('banco_subtopicos')
      .aggregate<BancoSubtopicoComContagem>(pipeline)
      .toArray()

    return NextResponse.json({ subtopicos })
  } catch (error) {
    console.error('Erro ao buscar subtópicos:', error)
    return NextResponse.json({ error: 'Erro ao buscar subtópicos' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const body = await request.json()

    if (!body.nome || body.nome.trim() === '') {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    }

    if (!body.topicoId) {
      return NextResponse.json({ error: 'Tópico é obrigatório' }, { status: 400 })
    }

    const db = await getDb()

    // Verificar se tópico existe
    const topico = await db.collection('banco_topicos').findOne({
      _id: new ObjectId(body.topicoId)
    })

    if (!topico) {
      return NextResponse.json({ error: 'Tópico não encontrado' }, { status: 404 })
    }

    // Gerar código
    const codigo = body.codigo || body.nome.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    // Verificar duplicidade no mesmo tópico
    const existente = await db.collection('banco_subtopicos').findOne({
      topicoId: new ObjectId(body.topicoId),
      $or: [
        { nome: body.nome.trim() },
        { codigo }
      ]
    })

    if (existente) {
      return NextResponse.json({ error: 'Já existe um subtópico com esse nome ou código neste tópico' }, { status: 400 })
    }

    // Obter próxima ordem
    const ultimoSubtopico = await db.collection('banco_subtopicos')
      .findOne({ topicoId: new ObjectId(body.topicoId) }, { sort: { ordem: -1 } })
    const ordem = body.ordem ?? ((ultimoSubtopico?.ordem ?? 0) + 1)

    const novoSubtopico: Omit<BancoSubtopico, '_id'> = {
      topicoId: new ObjectId(body.topicoId),
      nome: body.nome.trim(),
      codigo,
      ordem,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await db.collection('banco_subtopicos').insertOne(novoSubtopico)

    return NextResponse.json({
      sucesso: true,
      subtopico: { ...novoSubtopico, _id: result.insertedId }
    })
  } catch (error) {
    console.error('Erro ao criar subtópico:', error)
    return NextResponse.json({ error: 'Erro ao criar subtópico' }, { status: 500 })
  }
}
