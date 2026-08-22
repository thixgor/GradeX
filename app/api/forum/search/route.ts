import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { prepararTermoDeBusca, TEMPO_MAXIMO_DE_BUSCA_MS } from '@/lib/utils/escape-regex'
import { ForumType } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const db = await getDb()
    const searchParams = req.nextUrl.searchParams
    const query = searchParams.get('q') || ''
    const forumType = (searchParams.get('type') || 'discussion') as ForumType

    // Busca do fórum é pública (sem sessão) e varre título e conteúdo de todos
    // os posts — a superfície mais barata que existe para um regex hostil.
    // `prepararTermoDeBusca` escapa os metacaracteres e recusa termo curto
    // demais, que viraria varredura completa da coleção.
    const termo = prepararTermoDeBusca(query)
    if (!termo) {
      return NextResponse.json({
        posts: []
      })
    }

    // Buscar por tags e palavras-chave no título/conteúdo
    const searchQuery = {
      forumType,
      $or: [
        { tags: { $in: [new RegExp(termo, 'i')] } },
        { title: { $regex: termo, $options: 'i' } },
        { content: { $regex: termo, $options: 'i' } }
      ]
    }

    const posts = await db
      .collection('forumPosts')
      .find(searchQuery)
      .sort({ createdAt: -1 })
      .limit(50)
      .maxTimeMS(TEMPO_MAXIMO_DE_BUSCA_MS)
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
