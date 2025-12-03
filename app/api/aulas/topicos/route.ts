import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { AulaTopic } from '@/lib/types'

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
    const { nome, descricao, setorId, ordem } = body

    if (!nome || !setorId) {
      return NextResponse.json(
        { error: 'Nome e setor são obrigatórios' },
        { status: 400 }
      )
    }

    const topicosCollection = db.collection<AulaTopic>('aulas_topicos')

    const novoTopico: AulaTopic = {
      setorId,
      nome,
      descricao,
      ordem: ordem || 0,
      criadoEm: new Date(),
      atualizadoEm: new Date()
    }

    const result = await topicosCollection.insertOne(novoTopico)

    return NextResponse.json({
      item: {
        ...novoTopico,
        _id: result.insertedId
      }
    })
  } catch (error) {
    console.error('Erro ao criar tópico:', error)
    return NextResponse.json(
      { error: 'Erro ao criar tópico' },
      { status: 500 }
    )
  }
}
