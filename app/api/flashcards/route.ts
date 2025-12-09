import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId, WithId } from 'mongodb'
import { FlashcardDeck, FlashcardCard, FlashcardTheme, User } from '@/lib/types'
import { getFlashcardLimits } from '@/lib/flashcard-limits'
import { getGeminiApiKey, GEMINI_ENDPOINT } from '@/lib/gemini'
import { v4 as uuidv4 } from 'uuid'

export const dynamic = 'force-dynamic'

function getBrasiliaDate(): Date {
  const now = new Date()
  return new Date(now.getTime() - 3 * 60 * 60 * 1000)
}

function needsDailyReset(lastReset: Date | null): boolean {
  if (!lastReset) return true

  const now = getBrasiliaDate()
  const last = new Date(lastReset.getTime() - 3 * 60 * 60 * 1000)

  return (
    now.getUTCFullYear() !== last.getUTCFullYear() ||
    now.getUTCMonth() !== last.getUTCMonth() ||
    now.getUTCDate() !== last.getUTCDate()
  )
}

async function fetchFlashcardPrompt(
  theme: string,
  title: string,
  difficulty: number,
  randomDifficulty: boolean,
  cards: number,
): Promise<any[]> {
  const apiKey = await getGeminiApiKey()
  const difficultyPct = Math.round(difficulty * 100)

  const prompt = `Você é um treinador de flashcards agressivo e direto. Gere ${cards} flashcards sobre o tema "${theme}" com o título "${title}".

RETORNE APENAS UM ARRAY JSON VÁLIDO, SEM MARKDOWN, SEM BACKTICKS, SEM EXPLICAÇÕES.

Formato exato (array de objetos):
[{"front":"Pergunta curta e cruel com até 25 palavras","back":"Resposta exata + explicação curta e agressiva (até 80 palavras)","hint":"Dica de fogo direta para desbloquear o raciocínio","objectives":["Objetivo 1","Objetivo 2","Objetivo 3"]},...]

Regras:
- FRONT: máxima tensão, linguagem ativa, sem rodeios. Máximo 25 palavras.
- BACK: resposta exata + explicação curta e agressiva. Máximo 80 palavras.
- HINT: dica de fogo direta para desbloquear o raciocínio.
- OBJECTIVES: até 3 metas específicas por cartão (strings simples).
- Dificuldade alvo: ${randomDifficulty ? 'misture fácil/médio/difícil' : difficultyPct + '%'}.
- Não repita objetivos entre cartões.
- RESPONDA APENAS COM O JSON ARRAY, NADA MAIS. SEM MARKDOWN. SEM BACKTICKS.`

  const response = await fetch(GEMINI_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.9,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 4096,
      },
    }),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(`Gemini API error: ${errorData.error?.message || response.statusText}`)
  }

  const data = await response.json()
  const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text

  if (!generatedText) {
    throw new Error('Resposta vazia da API Gemini')
  }

  let parsed: any
  try {
    // Tentar remover markdown se existir
    let cleanedText = generatedText.trim()
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '')
    }
    parsed = JSON.parse(cleanedText)
  } catch (parseError) {
    console.error('Erro ao parsear JSON do Gemini:', generatedText)
    throw new Error('Resposta da IA em formato inválido')
  }

  if (!Array.isArray(parsed)) {
    throw new Error('Resposta inválida da IA')
  }

  return parsed
}

async function resetFlashcardLimitsIfNeeded(usersCollection: any, user: WithId<User>): Promise<WithId<User>> {
  const lastReset = user.flashcardsLastReset ? new Date(user.flashcardsLastReset) : null
  const needsResetLimits = needsDailyReset(lastReset)

  if (needsResetLimits) {
    const now = new Date()
    await usersCollection.updateOne(
      { _id: new ObjectId(String(user._id)) },
      {
        $set: {
          dailyFlashcardsGenerated: 0,
          flashcardsLastReset: now,
        },
      }
    )
    return {
      ...user,
      dailyFlashcardsGenerated: 0,
      flashcardsLastReset: now,
    }
  }

  return user
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const db = await getDb()
    const decksCollection = db.collection<FlashcardDeck>('flashcardDecks')

    const decks = await decksCollection
      .find({ userId: session.userId })
      .sort({ createdAt: -1 })
      .toArray()

    const normalizedDecks = decks.map(deck => ({
      ...deck,
      _id: deck._id ? deck._id.toString() : undefined,
      templateId: deck.templateId ? deck.templateId.toString() : undefined,
    }))

    return NextResponse.json({ decks: normalizedDecks })
  } catch (error) {
    console.error('Erro ao listar flashcards:', error)
    return NextResponse.json({ error: 'Erro ao listar flashcards' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { title, theme, difficulty, randomDifficulty, cardsRequested, templateId } = await request.json()

    if (!title || !theme) {
      return NextResponse.json({ error: 'Título e tema são obrigatórios' }, { status: 400 })
    }

    const db = await getDb()
    const usersCollection = db.collection<User>('users')
    const decksCollection = db.collection<FlashcardDeck>('flashcardDecks')
    const cardsCollection = db.collection<FlashcardCard>('flashcardCards')
    const themesCollection = db.collection<FlashcardTheme>('flashcardThemes')

    let user = await usersCollection.findOne({ _id: new ObjectId(session.userId) }) as WithId<User> | null
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    user = await resetFlashcardLimitsIfNeeded(usersCollection, user)

    const isAdmin = session.role === 'admin'
    const limits = getFlashcardLimits(user.accountType, isAdmin)

    const deckCountToday = user.dailyFlashcardsGenerated || 0
    if (deckCountToday >= limits.dailyDecks) {
      return NextResponse.json({ error: 'Limite diário de flashcards atingido' }, { status: 403 })
    }

    const activeDecks = await decksCollection.countDocuments({ userId: session.userId, status: 'ativo' })
    if (limits.maxActiveDecks !== null && activeDecks >= limits.maxActiveDecks) {
      return NextResponse.json({ error: 'Limite de flashcards ativos atingido' }, { status: 403 })
    }

    if (cardsRequested > limits.cardsPerDeck) {
      return NextResponse.json({ error: `Seu plano permite no máximo ${limits.cardsPerDeck} cartões por flashcard` }, { status: 403 })
    }

    let template = null
    if (templateId) {
      if (!ObjectId.isValid(templateId)) {
        return NextResponse.json({ error: 'Tema inválido' }, { status: 400 })
      }
      template = await themesCollection.findOne({ _id: new ObjectId(templateId) })
      if (!template) {
        return NextResponse.json({ error: 'Tema não encontrado' }, { status: 404 })
      }
    }

    // Criar deck primeiro (vazio)
    const deck: FlashcardDeck = {
      userId: session.userId,
      userName: session.userName || 'Usuário',
      title,
      theme,
      templateId: template ? template._id : undefined,
      difficultyPercentage: difficulty,
      randomDifficulty,
      cardsRequested,
      cardsGenerated: 0, // Será incrementado conforme os cartões são gerados
      accountTypeSnapshot: user.accountType || 'gratuito',
      status: 'ativo',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const deckInsert = await decksCollection.insertOne(deck)
    const deckId = deckInsert.insertedId.toString()

    // Gerar flashcards via IA
    const generatedCards = await fetchFlashcardPrompt(theme, title, difficulty, randomDifficulty, cardsRequested)

    // Salvar cartões um por um para evitar perda de dados se a IA falhar
    let cardsGenerated = 0
    for (let i = 0; i < generatedCards.length; i++) {
      const card = generatedCards[i]
      const flashcardCard: FlashcardCard = {
        id: uuidv4(),
        deckId,
        index: i,
        front: card.front,
        back: card.back,
        hint: card.hint,
        objectives: (card.objectives || []).map((text: string, idx: number) => ({ id: `${i}-${idx}`, text })),
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      try {
        await cardsCollection.insertOne(flashcardCard)
        cardsGenerated++
      } catch (cardError) {
        console.error(`Erro ao salvar cartão ${i + 1}:`, cardError)
        // Continuar salvando os próximos cartões mesmo se um falhar
      }
    }

    // Atualizar o deck com o número real de cartões gerados
    await decksCollection.updateOne(
      { _id: deckInsert.insertedId },
      { $set: { cardsGenerated } }
    )

    await usersCollection.updateOne(
      { _id: new ObjectId(session.userId) },
      {
        $inc: {
          dailyFlashcardsGenerated: 1,
          flashcardsActiveDecks: 1,
        },
      }
    )

    return NextResponse.json({ deckId })
  } catch (error: any) {
    console.error('Erro ao criar flashcards:', error)
    return NextResponse.json({ error: error.message || 'Erro ao criar flashcards' }, { status: 500 })
  }
}
