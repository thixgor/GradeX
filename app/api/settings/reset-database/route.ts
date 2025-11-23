import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'

const RESET_PASSWORD = '1302'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { password } = body

    if (!password) {
      return NextResponse.json(
        { error: 'Senha é obrigatória' },
        { status: 400 }
      )
    }

    if (password !== RESET_PASSWORD) {
      return NextResponse.json(
        { error: 'Senha incorreta' },
        { status: 401 }
      )
    }

    // Reset completo do banco de dados
    const db = await getDb()

    // Listar todas as coleções
    const collections = await db.listCollections().toArray()

    // Dropar todas as coleções
    for (const collection of collections) {
      await db.collection(collection.name).drop()
    }

    return NextResponse.json({
      success: true,
      message: 'Banco de dados resetado com sucesso. Todas as coleções foram removidas.'
    })
  } catch (error: any) {
    console.error('Reset database error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro ao resetar banco de dados'
    }, { status: 500 })
  }
}
