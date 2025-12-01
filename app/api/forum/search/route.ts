import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { ForumType } from '@/lib/types'

export async function GET(req: NextRequest) {
  try {
    const db = await getDb()
    const searchParams = req.nextUrl.searchParams
    const query = searchParams.get('q') || ''
    const forumType = (searchParams.get('type') || 'discussion') as ForumType

    if (!query || query.trim().length === 0) {
      return NextResponse.json({
        posts: []
      })
    }

    // Buscar por tags e palavras-chave no título/conteúdo
    const searchQuery = {
      forumType,
      $or: [
        { tags: { $in: [new RegExp(query, 'i')] } },
        { title: { $regex: query, $options: 'i' } },
        { content: { $regex: query, $options: 'i' } }
      ]
    }

    const posts = await db
      .collection('forumPosts')
      .find(searchQuery)
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray()

    return NextResponse.json({
      posts: posts.map((p: any) => ({
        ...p,
        _id: p._id?.toString()
      }))
    })
  } catch (error: any) {
    console.error('Erro ao buscar posts:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar posts' },
      { status: 500 }
    )
  }
}
