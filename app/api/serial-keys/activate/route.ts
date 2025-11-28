import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { SerialKey, User, AccountType } from '@/lib/types'
import { ObjectId } from 'mongodb'

// POST - Ativar uma serial key
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { key } = body as { key: string }

    if (!key || typeof key !== 'string') {
      return NextResponse.json(
        { error: 'Serial key inválida' },
        { status: 400 }
      )
    }

    const db = await getDb()
    const keysCollection = db.collection<SerialKey>('serial_keys')
    const usersCollection = db.collection<User>('users')

    // Buscar a serial key
    const serialKey = await keysCollection.findOne({ key: key.toUpperCase() })

    if (!serialKey) {
      return NextResponse.json(
        { error: 'Serial key não encontrada' },
        { status: 404 }
      )
    }

    if (serialKey.used) {
      return NextResponse.json(
        { error: 'Esta serial key já foi utilizada' },
        { status: 400 }
      )
    }

    // Determinar o novo accountType e data de expiração (se aplicável)
    let accountType: AccountType
    let trialExpiresAt: Date | undefined

    if (serialKey.type === 'premium') {
      accountType = 'premium'
      trialExpiresAt = undefined // Premium é vitalício
    } else {
      // Trial - 7 dias a partir de agora
      accountType = 'trial'
      const expirationDate = new Date()
      expirationDate.setDate(expirationDate.getDate() + 7)
      trialExpiresAt = expirationDate
    }

    // Atualizar o usuário
    const updateResult = await usersCollection.updateOne(
      { _id: new ObjectId(session.userId) },
      {
        $set: {
          accountType,
          trialExpiresAt,
          trialDuration: 7, // Padrão
        }
      }
    )

    if (updateResult.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Marcar a serial key como usada
    await keysCollection.updateOne(
      { key: key.toUpperCase() },
      {
        $set: {
          used: true,
          usedBy: session.userId,
          usedByName: session.name,
          usedAt: new Date(),
        }
      }
    )

    return NextResponse.json({
      message: 'Serial key ativada com sucesso',
      accountType,
      trialExpiresAt,
    })
  } catch (error) {
    console.error('Activate serial key error:', error)
    return NextResponse.json(
      { error: 'Erro ao ativar serial key' },
      { status: 500 }
    )
  }
}
