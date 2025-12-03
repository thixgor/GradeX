import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { AulaSetor } from '@/lib/types'

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
    const { nome, descricao, ordem } = body

    if (!nome) {
      return NextResponse.json(
        { error: 'Nome é obrigatório' },
        { status: 400 }
      )
    }

    const setoresCollection = db.collection<AulaSetor>('aulas_setores')

    const novoSetor: AulaSetor = {
      nome,
      descricao,
      ordem: ordem || 0,
      criadoEm: new Date(),
      atualizadoEm: new Date()
    }

    const result = await setoresCollection.insertOne(novoSetor)

    return NextResponse.json({
      success: true,
      item: {
        _id: result.insertedId,
        ...novoSetor
      }
    })
  } catch (error) {
    console.error('Create setor error:', error)
    return NextResponse.json(
      { error: 'Erro ao criar setor' },
      { status: 500 }
    )
  }
}
