import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { AulaSubmodulo } from '@/lib/types'

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
    const { setorId, moduloId, nome, descricao, ordem, topicoId, subtopicoId } = body

    if (!setorId || !moduloId || !nome) {
      return NextResponse.json(
        { error: 'setorId, moduloId e nome são obrigatórios' },
        { status: 400 }
      )
    }

    const submodulosCollection = db.collection<AulaSubmodulo>('aulas_submodulos')

    const novoSubmodulo: AulaSubmodulo = {
      setorId,
      moduloId,
      topicoId,
      subtopicoId,
      nome,
      descricao,
      ordem: ordem || 0,
      criadoEm: new Date(),
      atualizadoEm: new Date()
    }

    const result = await submodulosCollection.insertOne(novoSubmodulo)

    return NextResponse.json({
      success: true,
      item: {
        _id: result.insertedId,
        ...novoSubmodulo
      }
    })
  } catch (error) {
    console.error('Create submodulo error:', error)
    return NextResponse.json(
      { error: 'Erro ao criar submódulo' },
      { status: 500 }
    )
  }
}
