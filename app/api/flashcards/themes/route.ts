import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { FlashcardTheme, User } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const db = await getDb()
    const themesCollection = db.collection<FlashcardTheme>('flashcardThemes')

    const themes = await themesCollection.find({}).sort({ createdAt: -1 }).toArray()

    const normalized = themes.map(theme => ({
      ...theme,
      _id: theme._id?.toString(),
    }))

    return NextResponse.json({ themes: normalized })
  } catch (error) {
    console.error('Erro ao listar temas de flashcards:', error)
    return NextResponse.json({ error: 'Erro ao listar temas' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { title, description, tags, defaultDifficulty, suggestedCardCount, contextHint } = await request.json()

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'Título é obrigatório' }, { status: 400 })
    }

    const db = await getDb()
    const themesCollection = db.collection<FlashcardTheme>('flashcardThemes')

    const theme: FlashcardTheme = {
      title: title.trim(),
      description: description?.trim(),
      tags: Array.isArray(tags)
        ? tags.map((tag: string) => tag.trim()).filter(Boolean)
        : [],
      defaultDifficulty: typeof defaultDifficulty === 'number' ? Math.min(Math.max(defaultDifficulty, 0), 1) : undefined,
      suggestedCardCount: typeof suggestedCardCount === 'number' ? suggestedCardCount : undefined,
      contextHint: contextHint?.trim(),
      createdBy: session.userId,
      createdByName: session.userName || 'Admin',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const insert = await themesCollection.insertOne(theme)

    return NextResponse.json({ theme: { ...theme, _id: insert.insertedId } })
  } catch (error) {
    console.error('Erro ao criar tema de flashcard:', error)
    return NextResponse.json({ error: 'Erro ao criar tema' }, { status: 500 })
  }
}
