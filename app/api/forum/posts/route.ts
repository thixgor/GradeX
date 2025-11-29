import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { ForumPost, ForumType } from '@/lib/types'

export const dynamic = 'force-dynamic'

// GET - Listar posts do fórum
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const forumType = searchParams.get('type') as ForumType | null

    const db = await getDb()
    const postsCollection = db.collection<ForumPost>('forum_posts')

    const filter: any = {}
    if (forumType) {
      filter.forumType = forumType
    }

    const posts = await postsCollection
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json({ posts })
  } catch (error) {
    console.error('Get forum posts error:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar posts' },
      { status: 500 }
    )
  }
}

// POST - Criar novo post
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const {
      forumType,
      title,
      content,
      attachments,
      tags,
      commentsEnabled
    } = body

    // Validar tipo de fórum
    if (!forumType || !['discussion', 'materials'].includes(forumType)) {
      return NextResponse.json({
        error: 'Tipo de fórum inválido'
      }, { status: 400 })
    }

    // Se for materials, apenas admin pode postar
    if (forumType === 'materials' && session.role !== 'admin') {
      return NextResponse.json({
        error: 'Apenas administradores podem postar no Fórum de Materiais'
      }, { status: 403 })
    }

    if (!title || !content) {
      return NextResponse.json({
        error: 'Título e conteúdo são obrigatórios'
      }, { status: 400 })
    }

    const db = await getDb()
    const postsCollection = db.collection<ForumPost>('forum_posts')

    const newPost: ForumPost = {
      forumType,
      title,
      content,
      authorId: session.userId,
      authorName: session.name,
      attachments: attachments || [],
      tags: tags || [],
      commentsEnabled: commentsEnabled !== false,
      closed: false,
      edited: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await postsCollection.insertOne(newPost as any)

    return NextResponse.json({
      success: true,
      postId: result.insertedId.toString(),
      message: 'Post criado com sucesso'
    })
  } catch (error) {
    console.error('Create forum post error:', error)
    return NextResponse.json(
      { error: 'Erro ao criar post' },
      { status: 500 }
    )
  }
}
