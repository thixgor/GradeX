import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { BancoTopico, BancoTopicoComContagem } from '@/lib/types/banco-questoes'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const moduloId = searchParams.get('moduloId')

    const db = await getDb()

    const pipeline: any[] = []

    if (moduloId) {
      pipeline.push({
        $match: { moduloId: new ObjectId(moduloId) }
      })
    }

    pipeline.push(
      {
        $lookup: {
          from: 'banco_questoes',
          localField: '_id',
          foreignField: 'topicoId',
          as: 'questoes'
        }
      },
      {
        $lookup: {
          from: 'banco_subtopicos',
          localField: '_id',
          foreignField: 'topicoId',
          as: 'subtopicos'
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
        $addFields: {
          totalQuestoes: { $size: '$questoes' },
          totalSubtopicos: { $size: '$subtopicos' },
          moduloNome: { $arrayElemAt: ['$modulo.nome', 0] }
        }
      },
      {
        $project: {
          questoes: 0,
          subtopicos: 0,
          modulo: 0
        }
      },
      { $sort: { ordem: 1 } }
    )

    const topicos = await db.collection<BancoTopico>('banco_topicos')
      .aggregate<BancoTopicoComContagem>(pipeline)
      .toArray()

    return NextResponse.json({ topicos })
  } catch (error) {
    console.error('Erro ao buscar tópicos:', error)
    return NextResponse.json({ error: 'Erro ao buscar tópicos' }, { status: 500 })
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

    if (!body.moduloId) {
      return NextResponse.json({ error: 'Módulo é obrigatório' }, { status: 400 })
    }

    const db = await getDb()

    // Verificar se módulo existe
    const modulo = await db.collection('banco_modulos').findOne({
      _id: new ObjectId(body.moduloId)
    })

    if (!modulo) {
      return NextResponse.json({ error: 'Módulo não encontrado' }, { status: 404 })
    }

    // Gerar código
    const codigo = body.codigo || body.nome.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    // Verificar duplicidade no mesmo módulo
    const existente = await db.collection('banco_topicos').findOne({
      moduloId: new ObjectId(body.moduloId),
      $or: [
        { nome: body.nome.trim() },
        { codigo }
      ]
    })

    if (existente) {
      return NextResponse.json({ error: 'Já existe um tópico com esse nome ou código neste módulo' }, { status: 400 })
    }

    // Obter próxima ordem
    const ultimoTopico = await db.collection('banco_topicos')
      .findOne({ moduloId: new ObjectId(body.moduloId) }, { sort: { ordem: -1 } })
    const ordem = body.ordem ?? ((ultimoTopico?.ordem ?? 0) + 1)

    const novoTopico: Omit<BancoTopico, '_id'> = {
      moduloId: new ObjectId(body.moduloId),
      nome: body.nome.trim(),
      codigo,
      ordem,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await db.collection('banco_topicos').insertOne(novoTopico)

    return NextResponse.json({
      sucesso: true,
      topico: { ...novoTopico, _id: result.insertedId }
    })
  } catch (error) {
    console.error('Erro ao criar tópico:', error)
    return NextResponse.json({ error: 'Erro ao criar tópico' }, { status: 500 })
  }
}
