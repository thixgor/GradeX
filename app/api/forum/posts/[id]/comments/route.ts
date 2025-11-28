import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { ForumComment, ForumPost } from '@/lib/types'
import { ObjectId } from 'mongodb'

// GET - Listar comentários de um post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const db = await getDb()
    const commentsCollection = db.collection<ForumComment>('forum_comments')

    const comments = await commentsCollection
      .find({ postId: id })
      .sort({ createdAt: 1 })
      .toArray()

    return NextResponse.json({ comments })
  } catch (error) {
    console.error('Get comments error:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar comentários' },
      { status: 500 }
    )
  }
}

// POST - Criar comentário
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const db = await getDb()
    const postsCollection = db.collection<ForumPost>('forum_posts')
    const commentsCollection = db.collection<ForumComment>('forum_comments')

    // Verificar se o post existe e permite comentários
    const post = await postsCollection.findOne({ _id: new ObjectId(postId) })
    if (!post) {
      return NextResponse.json({ error: 'Post não encontrado' }, { status: 404 })
    }

    if (!post.commentsEnabled) {
      return NextResponse.json({
        error: 'Comentários desabilitados neste post'
      }, { status: 403 })
    }

    if (post.closed) {
      return NextResponse.json({
        error: 'Este post está fechado para novos comentários'
      }, { status: 403 })
    }

    const body = await request.json()
    const { content } = body

    if (!content) {
      return NextResponse.json({
        error: 'Conteúdo é obrigatório'
      }, { status: 400 })
    }

    const newComment: ForumComment = {
      postId,
      authorId: session.userId,
      authorName: session.name,
      content,
      createdAt: new Date(),
      edited: false,
    }

    await commentsCollection.insertOne(newComment as any)

    return NextResponse.json({
      success: true,
      message: 'Comentário adicionado com sucesso'
    })
  } catch (error) {
    console.error('Create comment error:', error)
    return NextResponse.json(
      { error: 'Erro ao criar comentário' },
      { status: 500 }
    )
  }
}
