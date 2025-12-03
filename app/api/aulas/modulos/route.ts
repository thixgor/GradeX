import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { AulaModulo } from '@/lib/types'

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
    const { nome, descricao, topicoId, subtopicoId, setorId, ordem } = body

    if (!nome) {
      return NextResponse.json(
        { error: 'Nome é obrigatório' },
        { status: 400 }
      )
    }

    const modulosCollection = db.collection<AulaModulo>('aulas_modulos')

    const novoModulo: AulaModulo = {
      setorId,
      topicoId,
      subtopicoId,
      nome,
      descricao,
      ordem: ordem || 0,
      criadoEm: new Date(),
      atualizadoEm: new Date()
    }

    const result = await modulosCollection.insertOne(novoModulo)

    return NextResponse.json({
      item: {
        ...novoModulo,
        _id: result.insertedId
      }
    })
  } catch (error) {
    console.error('Erro ao criar módulo:', error)
    return NextResponse.json(
      { error: 'Erro ao criar módulo' },
      { status: 500 }
    )
  }
}
