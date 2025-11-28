import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { SerialKey } from '@/lib/types'

// DELETE - Limpar histórico de keys (apenas admin)
// Remove todas keys não usadas e limpa histórico de keys usadas
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const db = await getDb()
    const keysCollection = db.collection<SerialKey>('serial_keys')

    // Deletar todas as keys
    const result = await keysCollection.deleteMany({})

    return NextResponse.json({
      success: true,
      message: `Histórico limpo: ${result.deletedCount} keys removidas`,
      deletedCount: result.deletedCount
    })
  } catch (error) {
    console.error('Clear history error:', error)
    return NextResponse.json(
      { error: 'Erro ao limpar histórico' },
      { status: 500 }
    )
  }
}
