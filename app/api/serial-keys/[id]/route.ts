import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { SerialKey } from '@/lib/types'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

// DELETE - Deletar uma serial key (apenas admin, apenas se não foi usada)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const db = await getDb()
    const keysCollection = db.collection<SerialKey>('serial_keys')

    const key = await keysCollection.findOne({ _id: new ObjectId(id) })
    if (!key) {
      return NextResponse.json({ error: 'Serial key não encontrada' }, { status: 404 })
    }

    if (key.used) {
      return NextResponse.json(
        { error: 'Não é possível deletar uma serial key que já foi usada' },
        { status: 400 }
      )
    }

    await keysCollection.deleteOne({ _id: new ObjectId(id) })

    return NextResponse.json({
      success: true,
      message: 'Serial key deletada com sucesso'
    })
  } catch (error) {
    console.error('Delete serial key error:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar serial key' },
      { status: 500 }
    )
  }
}
