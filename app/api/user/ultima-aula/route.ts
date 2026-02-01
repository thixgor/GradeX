import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

interface UltimaAulaVisitada {
  userId: ObjectId
  aulaId: ObjectId
  aulaTitulo: string
  visitadaEm: Date
}

// GET - Retornar a última aula visitada pelo usuário atual
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const db = await getDb()
    const collection = db.collection<UltimaAulaVisitada>('user_ultima_aula')

    const ultimaAula = await collection.findOne({
      userId: new ObjectId(session.userId)
    })

    if (!ultimaAula) {
      return NextResponse.json({ ultimaAula: null })
    }

    return NextResponse.json({ ultimaAula })
  } catch (error) {
    console.error('Erro ao buscar última aula visitada:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar última aula visitada' },
      { status: 500 }
    )
  }
}

// POST - Registrar que o usuário visitou uma aula
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { aulaId } = body

    if (!aulaId) {
      return NextResponse.json(
        { error: 'aulaId é obrigatório' },
        { status: 400 }
      )
    }

    const db = await getDb()

    // Buscar a aula para obter o título
    const aulasCollection = db.collection('aulas_postagens')
    const aula = await aulasCollection.findOne({
      _id: new ObjectId(aulaId)
    })

    if (!aula) {
      return NextResponse.json(
        { error: 'Aula não encontrada' },
        { status: 404 }
      )
    }

    const collection = db.collection<UltimaAulaVisitada>('user_ultima_aula')

    // Upsert: atualiza se existir, cria se não existir
    const result = await collection.updateOne(
      { userId: new ObjectId(session.userId) },
      {
        $set: {
          userId: new ObjectId(session.userId),
          aulaId: new ObjectId(aulaId),
          aulaTitulo: aula.titulo || 'Sem título',
          visitadaEm: new Date()
        }
      },
      { upsert: true }
    )

    return NextResponse.json({
      success: true,
      ultimaAula: {
        userId: new ObjectId(session.userId),
        aulaId: new ObjectId(aulaId),
        aulaTitulo: aula.titulo || 'Sem título',
        visitadaEm: new Date()
      }
    })
  } catch (error) {
    console.error('Erro ao registrar última aula visitada:', error)
    return NextResponse.json(
      { error: 'Erro ao registrar última aula visitada' },
      { status: 500 }
    )
  }
}
