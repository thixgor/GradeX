import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { BancoPeriodo, BancoPeriodoComContagem } from '@/lib/types/banco-questoes'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const db = await getDb()

    const periodos = await db.collection<BancoPeriodo>('banco_periodos')
      .aggregate<BancoPeriodoComContagem>([
        {
          $lookup: {
            from: 'banco_questoes',
            localField: '_id',
            foreignField: 'periodoId',
            as: 'questoes'
          }
        },
        {
          $lookup: {
            from: 'banco_modulos',
            localField: '_id',
            foreignField: 'periodoId',
            as: 'modulos'
          }
        },
        {
          $addFields: {
            totalQuestoes: { $size: '$questoes' },
            totalModulos: { $size: '$modulos' }
          }
        },
        {
          $project: {
            questoes: 0,
            modulos: 0
          }
        },
        { $sort: { ordem: 1 } }
      ])
      .toArray()

    return NextResponse.json({ periodos })
  } catch (error) {
    console.error('Erro ao buscar períodos:', error)
    return NextResponse.json({ error: 'Erro ao buscar períodos' }, { status: 500 })
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

    const db = await getDb()

    // Gerar código a partir do nome
    const codigo = body.codigo || body.nome.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    // Verificar se já existe
    const existente = await db.collection('banco_periodos').findOne({
      $or: [
        { nome: body.nome.trim() },
        { codigo }
      ]
    })

    if (existente) {
      return NextResponse.json({ error: 'Já existe um período com esse nome ou código' }, { status: 400 })
    }

    // Obter próxima ordem
    const ultimoPeriodo = await db.collection('banco_periodos')
      .findOne({}, { sort: { ordem: -1 } })
    const ordem = body.ordem ?? ((ultimoPeriodo?.ordem ?? 0) + 1)

    const novoPeriodo: Omit<BancoPeriodo, '_id'> = {
      nome: body.nome.trim(),
      codigo,
      ordem,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await db.collection('banco_periodos').insertOne(novoPeriodo)

    return NextResponse.json({
      sucesso: true,
      periodo: { ...novoPeriodo, _id: result.insertedId }
    })
  } catch (error) {
    console.error('Erro ao criar período:', error)
    return NextResponse.json({ error: 'Erro ao criar período' }, { status: 500 })
  }
}
