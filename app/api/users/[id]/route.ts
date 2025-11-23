import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { User } from '@/lib/types'
import { ObjectId } from 'mongodb'

// DELETE - Deletar usuário
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
    const usersCollection = db.collection<User>('users')
    const submissionsCollection = db.collection('submissions')

    const user = await usersCollection.findOne({ _id: new ObjectId(id) })
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Não permite deletar o próprio usuário
    if (id === session.userId) {
      return NextResponse.json(
        { error: 'Você não pode deletar sua própria conta' },
        { status: 400 }
      )
    }

    // Deletar todas as submissões do usuário
    await submissionsCollection.deleteMany({ userId: id })

    // Deletar o usuário
    await usersCollection.deleteOne({ _id: new ObjectId(id) })

    return NextResponse.json({
      success: true,
      message: 'Usuário deletado com sucesso'
    })
  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar usuário' },
      { status: 500 }
    )
  }
}

// PATCH - Banir ou desbanir usuário
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const body = await request.json()
    const { action, banReason, banDetails } = body

    if (!action || !['ban', 'unban'].includes(action)) {
      return NextResponse.json(
        { error: 'Ação inválida. Use "ban" ou "unban"' },
        { status: 400 }
      )
    }

    const db = await getDb()
    const usersCollection = db.collection<User>('users')

    const user = await usersCollection.findOne({ _id: new ObjectId(id) })
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Não permite banir a si mesmo
    if (id === session.userId) {
      return NextResponse.json(
        { error: 'Você não pode banir sua própria conta' },
        { status: 400 }
      )
    }

    let updateData: Partial<User>

    if (action === 'ban') {
      if (!banReason) {
        return NextResponse.json(
          { error: 'Motivo do banimento é obrigatório' },
          { status: 400 }
        )
      }

      updateData = {
        banned: true,
        banReason,
        banDetails: banDetails || '',
        bannedBy: session.userId,
        bannedAt: new Date()
      }
    } else {
      // unban
      updateData = {
        banned: false,
        banReason: undefined,
        banDetails: undefined,
        bannedBy: undefined,
        bannedAt: undefined
      }
    }

    await usersCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    )

    return NextResponse.json({
      success: true,
      message: action === 'ban' ? 'Usuário banido com sucesso' : 'Usuário desbanido com sucesso'
    })
  } catch (error) {
    console.error('Ban/unban user error:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar status do usuário' },
      { status: 500 }
    )
  }
}
