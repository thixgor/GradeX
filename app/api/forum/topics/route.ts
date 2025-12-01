import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { ForumTopic, ForumType } from '@/lib/types'

export async function GET(req: NextRequest) {
  try {
    const db = await getDb()
    const searchParams = req.nextUrl.searchParams
    const forumType = (searchParams.get('type') || 'discussion') as ForumType

    const topics = await db
      .collection('forumTopics')
      .find({ forumType })
      .sort({ order: 1, createdAt: -1 })
      .toArray()

    return NextResponse.json({
      topics: topics.map((t: any) => ({
        ...t,
        _id: t._id?.toString()
      }))
    })
  } catch (error: any) {
    console.error('Erro ao buscar tópicos:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar tópicos' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = await getDb()
    
    // Verificar autenticação
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    if (session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Apenas administradores podem criar tópicos' },
        { status: 403 }
      )
    }

    const { name, description, forumType, color, icon } = await req.json()

    if (!name || !forumType) {
      return NextResponse.json(
        { error: 'Nome e tipo de fórum são obrigatórios' },
        { status: 400 }
      )
    }

    // Contar tópicos existentes para definir ordem
    const count = await db.collection('forumTopics').countDocuments({ forumType })

    const topicData = {
      name,
      description,
      forumType,
      color: color || '#3B82F6',
      icon: icon || '📁',
      createdBy: session.userId,
      createdByName: session.name,
      order: count,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await db.collection('forumTopics').insertOne(topicData)

    return NextResponse.json({
      topicId: result.insertedId.toString(),
      topic: {
        ...topicData,
        _id: result.insertedId.toString()
      }
    })
  } catch (error: any) {
    console.error('Erro ao criar tópico:', error)
    return NextResponse.json(
      { error: 'Erro ao criar tópico' },
      { status: 500 }
    )
  }
}
