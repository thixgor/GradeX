import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { getCronogramasLimit } from '@/lib/tier-limits'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

// GET - Listar cronogramas do usuário
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await getDb()
    const cronogramas = await db
      .collection('cronogramas')
      .find({ usuarioId: session.userId })
      .sort({ dataCriacao: -1 })
      .toArray()

    return NextResponse.json({ 
      cronogramas: cronogramas.map(c => ({
        ...c,
        _id: c._id?.toString() // Converter ObjectId para string
      }))
    })
  } catch (error) {
    console.error('Erro ao listar cronogramas:', error)
    return NextResponse.json(
      { error: 'Erro ao listar cronogramas' },
      { status: 500 }
    )
  }
}

// POST - Criar novo cronograma
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const db = await getDb()

    const usersCollection = db.collection('users')
    const user = await usersCollection.findOne({ _id: new ObjectId(session.userId) })
    
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    const isAdmin = session.role === 'admin'
    const accountType = user.accountType || 'gratuito'
    const cronogramasLimit = getCronogramasLimit(accountType)

    const existingCronogramas = await db
      .collection('cronogramas')
      .countDocuments({ usuarioId: session.userId })

    if (!isAdmin && cronogramasLimit !== Infinity && existingCronogramas >= cronogramasLimit) {
      return NextResponse.json({
        error: `Limite de cronogramas atingido (${cronogramasLimit} no total). Faça upgrade para Premium para criar mais cronogramas.`,
        requiresUpgrade: true,
        upgradeUrl: '/buy',
        limit: cronogramasLimit,
        used: existingCronogramas
      }, { status: 403 })
    }

    const cronograma = {
      usuarioId: session.userId,
      titulo: body.titulo,
      modelo: body.modelo,
      dificuldade: body.dificuldade,
      tempoEstudo: body.tempoEstudo,
      config: body.config,
      cronograma: body.cronograma || [],
      totalHoras: body.totalHoras || 0,
      dataCriacao: new Date(),
      dataAtualizacao: new Date()
    }

    const result = await db.collection('cronogramas').insertOne(cronograma)

    // Atualizar contador total do usuário
    await usersCollection.updateOne(
      { _id: new ObjectId(session.userId) },
      { $inc: { totalCronogramasCreated: 1 } }
    )

    return NextResponse.json({
      success: true,
      cronogramaId: result.insertedId
    })
  } catch (error) {
    console.error('Erro ao criar cronograma:', error)
    return NextResponse.json(
      { error: 'Erro ao criar cronograma' },
      { status: 500 }
    )
  }
}
