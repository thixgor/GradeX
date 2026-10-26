import { NextRequest, NextResponse } from 'next/server'
import { mesmoDiaEmBrasilia } from '@/lib/fuso-brasilia'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId, WithId } from 'mongodb'
import { FlashcardDeck, FlashcardCard, FlashcardTheme, User } from '@/lib/types'
import { getFlashcardLimits } from '@/lib/flashcard-limits'
import {
  avaliarUsoDoPlano,
  corpoDeRecusa,
  registrarUsoDoPlano,
  resolverPermissoes,
} from '@/lib/plan-entitlements-server'
import { ErroGemini } from '@/lib/ia/gemini'
import { corpoDeIaBloqueada, iaDeEstudoLiberada } from '@/lib/ia/estudo/acesso'
import { FOCOS_DOS_CARTOES, MAXIMO_DE_CARTOES, gerarFlashcards, type FocoDosCartoes } from '@/lib/ia/estudo/gerador-de-flashcards'
import { checkRateLimit } from '@/lib/rate-limit'
import { v4 as uuidv4 } from 'uuid'
import { jsonComprimido } from '@/lib/resposta-comprimida'

export const dynamic = 'force-dynamic'

/**
 * O dia virou para esta pessoa?
 *
 * Isto era `getBrasiliaDate()` + `needsDailyReset()` copiados em três rotas,
 * cada cópia subtraindo três horas na mão e comparando em UTC. Funcionava, mas
 * havia uma QUARTA regra em `app/api/user/limits/route.ts` que comparava
 * `getDate()` cru — ou seja, no fuso do servidor, que é UTC. Duas definições
 * de "novo dia" no mesmo sistema, e a cota do aluno virava às 21h por uma
 * delas.
 *
 * Agora as quatro chamam `mesmoDiaEmBrasilia`, que pergunta o dia ao `Intl` em
 * vez de subtrair um número fixo — e continua certo se o horário de verão
 * voltar.
 */
function needsDailyReset(lastReset: Date | null): boolean {
  return !lastReset || !mesmoDiaEmBrasilia(new Date(), lastReset)
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

    // Add cache headers to reduce serverless invocations
    // Private cache (user-specific data) for 5 minutes
    const headers = new Headers({
      'Cache-Control': 'private, max-age=300, stale-while-revalidate=600',
      'Content-Type': 'application/json',
    })

    return jsonComprimido(request, { decks: normalizedDecks }, { headers })
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

    const body = await request.json()
    const title = String(body.title || '').slice(0, 100).trim()
    // O tema pode vir do cronograma ("Tópico › Subtópico › Módulo"): cabe mais que 100.
    const theme = String(body.theme || '').replace(/\s+/g, ' ').slice(0, 300).trim()
    const notes = String(body.notes || '').replace(/\s+/g, ' ').slice(0, 400).trim()
    const { templateId } = body
    const randomDifficulty = body.randomDifficulty === true
    const difficulty = Math.min(1, Math.max(0, Number(body.difficulty) || 0.6))
    const cardsRequested = Math.max(1, Math.min(MAXIMO_DE_CARTOES, Math.round(Number(body.cardsRequested) || 10)))
    const foco: FocoDosCartoes = FOCOS_DOS_CARTOES.some((f) => f.id === body.foco) ? body.foco : 'misto'

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

    const isAdmin = session.role === 'admin'

    // Flashcards com IA: só Quest+ e Plus+ (lib/ia/estudo/acesso.ts).
    if (!iaDeEstudoLiberada(user.accountType, isAdmin)) {
      return NextResponse.json(corpoDeIaBloqueada('flashcards'), { status: 403 })
    }
    const ritmo = await checkRateLimit(session.userId, 'flashcards_ia', 20, 60_000)
    if (!ritmo.success) {
      return NextResponse.json({ error: 'Muitas gerações seguidas. Aguarde um minuto.' }, { status: 429 })
    }

    user = await resetFlashcardLimitsIfNeeded(usersCollection, user)
    const limits = getFlashcardLimits(user.accountType, isAdmin)

    // Regra do plano assinado para "Flashcards por IA". Quando ela vale, os
    // tetos por cargo abaixo saem de cena: o admin configurou um número, e
    // esse número precisa ser o que o aluno encontra.
    const permissoesDoPlano = await resolverPermissoes(db, {
      userId: session.userId,
      role: session.role,
      accountType: user.accountType,
      premiumPlanType: user.premiumPlanType as string | null,
    })
    const veredictoDoPlano = await avaliarUsoDoPlano(db, permissoesDoPlano, 'flashcardsIa')
    if (!veredictoDoPlano.permitido) {
      return NextResponse.json(corpoDeRecusa(veredictoDoPlano), { status: 403 })
    }
    const usarTetosDoCargo = !veredictoDoPlano.aplicavel

    const deckCountToday = user.dailyFlashcardsGenerated || 0
    if (usarTetosDoCargo && deckCountToday >= limits.dailyDecks) {
      return NextResponse.json({ error: 'Limite diário de flashcards atingido' }, { status: 403 })
    }

    const activeDecks = await decksCollection.countDocuments({ userId: session.userId, status: 'ativo' })
    if (usarTetosDoCargo && limits.maxActiveDecks !== null && activeDecks >= limits.maxActiveDecks) {
      return NextResponse.json({ error: 'Limite de flashcards ativos atingido' }, { status: 403 })
    }

    // Teto de cartões por deck continua valendo sempre: não é entitlement de
    // plano, é o freio de custo de uma chamada à IA. Para o cargo pago ele já
    // é infinito, então nada muda para quem assina.
    if (cardsRequested > limits.cardsPerDeck) {
      return NextResponse.json({ error: `Seu plano permite no máximo ${limits.cardsPerDeck} cartões por flashcard` }, { status: 403 })
    }

    const totalDecksCreated = user.totalFlashcardDecksCreated || 0
    if (usarTetosDoCargo && limits.totalDecksLifetime !== Infinity && totalDecksCreated >= limits.totalDecksLifetime) {
      return NextResponse.json({
        error: `Limite vitalício de decks atingido (${limits.totalDecksLifetime} decks). Faça para o Plus+ para criar mais.`,
        requiresUpgrade: true,
        upgradeUrl: '/buy',
        limit: limits.totalDecksLifetime,
        used: totalDecksCreated
      }, { status: 403 })
    }

    if (usarTetosDoCargo && limits.totalCardsLifetime !== Infinity) {
      const totalCardsCreated = await cardsCollection.countDocuments({ userId: session.userId })
      const cardsToCreate = Math.min(cardsRequested, limits.cardsPerDeck)
      const newTotal = totalCardsCreated + cardsToCreate

      if (newTotal > limits.totalCardsLifetime) {
        return NextResponse.json({
          error: `Limite vitalício de cartões atingido (${limits.totalCardsLifetime} cartões). Faça para o Plus+ para criar mais flashcards.`,
          requiresUpgrade: true,
          upgradeUrl: '/buy',
          limit: limits.totalCardsLifetime,
          used: totalCardsCreated
        }, { status: 403 })
      }
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

    // Gerar flashcards via IA (uma chamada, JSON estruturado, teto de cartões).
    let generatedCards
    try {
      generatedCards = await gerarFlashcards({
        tema: theme,
        titulo: title,
        quantidade: Math.min(cardsRequested, limits.cardsPerDeck),
        dificuldade: randomDifficulty ? null : difficulty,
        foco,
        observacoes: notes || template?.contextHint || undefined,
      })
    } catch (erro) {
      const temporario = erro instanceof ErroGemini ? erro.temporario : false
      console.error('[flashcards/ia] falha ao gerar:', erro instanceof Error ? erro.message.slice(0, 200) : erro)
      return NextResponse.json(
        { error: temporario ? 'A IA está sobrecarregada agora. Tente de novo em instantes.' : (erro as Error)?.message || 'Erro ao gerar flashcards' },
        { status: temporario ? 503 : 502 },
      )
    }

    const deck: FlashcardDeck = {
      userId: session.userId,
      userName: session.userName || 'Usuário',
      title,
      theme,
      templateId: template ? template._id : undefined,
      difficultyPercentage: difficulty,
      randomDifficulty,
      cardsRequested,
      cardsGenerated: generatedCards.length,
      accountTypeSnapshot: user.accountType || 'gratuito',
      status: 'ativo',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const deckInsert = await decksCollection.insertOne(deck)

    await registrarUsoDoPlano(db, permissoesDoPlano, 'flashcardsIa', {
      recurso: String(deckInsert.insertedId),
    })
    const deckId = deckInsert.insertedId.toString()

    const cards: FlashcardCard[] = generatedCards.map((card, index) => ({
      id: uuidv4(),
      deckId,
      index,
      front: card.front,
      back: card.back,
      hint: card.hint,
      objectives: (card.objectives || []).map((text: string, idx: number) => ({ id: `${index}-${idx}`, text })),
      createdAt: new Date(),
      updatedAt: new Date(),
    }))

    await cardsCollection.insertMany(cards)

    await usersCollection.updateOne(
      { _id: new ObjectId(session.userId) },
      {
        $inc: {
          dailyFlashcardsGenerated: 1,
          flashcardsActiveDecks: 1,
          totalFlashcardsCreated: cards.length,
          totalFlashcardDecksCreated: 1,
        },
      }
    )

    return NextResponse.json({ deckId })
  } catch (error: any) {
    console.error('Erro ao criar flashcards:', error)
    return NextResponse.json({ error: error.message || 'Erro ao criar flashcards' }, { status: 500 })
  }
}
