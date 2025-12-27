import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { ForumPost, ForumType, ForumPostCreationFreezeMode, ForumSettings, User } from '@/lib/types'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

function isPostCreationBlocked(params: {
  freezeMode: ForumPostCreationFreezeMode
  isAdmin: boolean
  isMonitor: boolean
  accountType: 'gratuito' | 'trial' | 'premium'
}) {
  const { freezeMode, isAdmin, isMonitor, accountType } = params
  const isCommonUser = !isAdmin && !isMonitor

  switch (freezeMode) {
    case 'off':
      return false
    case 'pause_all':
      return true
    case 'pause_all_except_admins':
      return !isAdmin
    case 'pause_all_except_common_users':
      return !isCommonUser
    case 'pause_only_free_common':
      return isCommonUser && accountType === 'gratuito'
    case 'pause_only_free_common_and_monitors':
      return isMonitor || (isCommonUser && accountType === 'gratuito')
    case 'pause_only_free_common_and_premium_common':
      return isCommonUser && (accountType === 'gratuito' || accountType === 'premium')
    default:
      return false
  }
}

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

    const db = await getDb()

    const forumSettings = await db
      .collection<ForumSettings>('forum_settings')
      .findOne({})

    const freezeMode: ForumPostCreationFreezeMode =
      forumSettings?.postCreationFreezeMode || 'off'

    const user = await db.collection<User>('users').findOne(
      { _id: new ObjectId(session.userId) },
      { projection: { accountType: 1, secondaryRole: 1 } }
    )

    const isAdmin = session.role === 'admin'
    const isMonitor = user?.secondaryRole === 'monitor'
    const accountType = (user?.accountType || 'gratuito') as
      | 'gratuito'
      | 'trial'
      | 'premium'

    if (
      isPostCreationBlocked({
        freezeMode,
        isAdmin,
        isMonitor,
        accountType,
      })
    ) {
      return NextResponse.json(
        { error: 'Envio de novos posts está temporariamente paralisado' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      forumType,
      topicId,
      title,
      content,
      attachments,
      tags,
      commentsEnabled,
      premiumOnly
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

    const postsCollection = db.collection<ForumPost>('forum_posts')

    const newPost: ForumPost = {
      forumType,
      topicId: topicId || undefined,
      title,
      content,
      authorId: session.userId,
      authorName: session.name,
      attachments: attachments || [],
      tags: tags || [],
      commentsEnabled: commentsEnabled !== false,
      closed: false,
      edited: false,
      premiumOnly: forumType === 'materials' ? premiumOnly : false,
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
