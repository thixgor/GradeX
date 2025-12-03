import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { AulaSubtopic } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Verificar se é admin ou monitor
    const db = await getDb()
    const usersCollection = db.collection('users')
    const user = await usersCollection.findOne({ _id: new ObjectId(session.userId) })

    const isAdmin = session.role === 'admin'
    const isMonitor = user?.secondaryRole === 'monitor'

    if (!isAdmin && !isMonitor) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { nome, descricao, topicoId, setorId, ordem } = body

    if (!nome || !topicoId) {
      return NextResponse.json(
        { error: 'Nome e tópico são obrigatórios' },
        { status: 400 }
      )
    }

    const subtopicosCollection = db.collection<AulaSubtopic>('aulas_subtopicos')

    const novoSubtopico: AulaSubtopic = {
      setorId,
      topicoId,
      nome,
      descricao,
      ordem: ordem || 0,
      criadoEm: new Date(),
      atualizadoEm: new Date()
    }

    const result = await subtopicosCollection.insertOne(novoSubtopico)

    return NextResponse.json({
      item: {
        ...novoSubtopico,
        _id: result.insertedId
      }
    })
  } catch (error) {
    console.error('Erro ao criar subtópico:', error)
    return NextResponse.json(
      { error: 'Erro ao criar subtópico' },
      { status: 500 }
    )
  }
}
