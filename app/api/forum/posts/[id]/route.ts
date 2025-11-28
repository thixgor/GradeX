import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { ForumPost } from '@/lib/types'
import { ObjectId } from 'mongodb'

// GET - Buscar post específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const db = await getDb()
    const postsCollection = db.collection<ForumPost>('forum_posts')

    const post = await postsCollection.findOne({ _id: new ObjectId(id) })

    if (!post) {
      return NextResponse.json({ error: 'Post não encontrado' }, { status: 404 })
    }

    return NextResponse.json({ post })
  } catch (error) {
    console.error('Get forum post error:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar post' },
      { status: 500 }
    )
  }
}

// PATCH - Atualizar post
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const db = await getDb()
    const postsCollection = db.collection<ForumPost>('forum_posts')

    const post = await postsCollection.findOne({ _id: new ObjectId(id) })
    if (!post) {
      return NextResponse.json({ error: 'Post não encontrado' }, { status: 404 })
    }

    const body = await request.json()
    const { action } = body

    // Ações de admin (fechar/abrir post)
    if (action === 'close' || action === 'open') {
      if (session.role !== 'admin') {
        return NextResponse.json({
          error: 'Apenas administradores podem fechar/abrir posts'
        }, { status: 403 })
      }

      const updateData: any = {
        closed: action === 'close',
        updatedAt: new Date()
      }

      if (action === 'close') {
        updateData.closedBy = session.userId
        updateData.closedByName = session.name
        updateData.closedAt = new Date()
      } else {
        updateData.closedBy = undefined
        updateData.closedByName = undefined
        updateData.closedAt = undefined
      }

      await postsCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      )

      return NextResponse.json({
        success: true,
        message: action === 'close' ? 'Post fechado com sucesso' : 'Post reaberto com sucesso'
      })
    }

    // Ação de editar post
    if (action === 'edit') {
      // Verificar se é o autor ou admin
      if (post.authorId !== session.userId && session.role !== 'admin') {
        return NextResponse.json({
          error: 'Você não tem permissão para editar este post'
        }, { status: 403 })
      }

      const { title, content, attachments, tags, commentsEnabled } = body

      await postsCollection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            title: title || post.title,
            content: content || post.content,
            attachments: attachments !== undefined ? attachments : post.attachments,
            tags: tags !== undefined ? tags : post.tags,
            commentsEnabled: commentsEnabled !== undefined ? commentsEnabled : post.commentsEnabled,
            edited: true,
            editedAt: new Date(),
            updatedAt: new Date()
          }
        }
      )

      return NextResponse.json({
        success: true,
        message: 'Post editado com sucesso'
      })
    }

    return NextResponse.json({
      error: 'Ação inválida'
    }, { status: 400 })
  } catch (error) {
    console.error('Update forum post error:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar post' },
      { status: 500 }
    )
  }
}

// DELETE - Deletar post
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const db = await getDb()
    const postsCollection = db.collection<ForumPost>('forum_posts')
    const commentsCollection = db.collection('forum_comments')

    const post = await postsCollection.findOne({ _id: new ObjectId(id) })
    if (!post) {
      return NextResponse.json({ error: 'Post não encontrado' }, { status: 404 })
    }

    // Verificar se é o autor ou admin
    if (post.authorId !== session.userId && session.role !== 'admin') {
      return NextResponse.json({
        error: 'Você não tem permissão para deletar este post'
      }, { status: 403 })
    }

    // Deletar todos os comentários do post
    await commentsCollection.deleteMany({ postId: id })

    // Deletar o post
    await postsCollection.deleteOne({ _id: new ObjectId(id) })

    return NextResponse.json({
      success: true,
      message: 'Post deletado com sucesso'
    })
  } catch (error) {
    console.error('Delete forum post error:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar post' },
      { status: 500 }
    )
  }
}
