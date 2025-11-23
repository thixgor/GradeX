import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { User } from '@/lib/types'

// GET - Listar todos os usuários (apenas admin)
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const db = await getDb()
    const usersCollection = db.collection<User>('users')

    // Buscar todos os usuários, excluindo o campo password
    const users = await usersCollection
      .find({})
      .project({ password: 0 }) // Não retorna a senha
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar usuários' },
      { status: 500 }
    )
  }
}
