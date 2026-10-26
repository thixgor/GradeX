import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { FLASHCARD_SPACED_PROGRESS_COLLECTION } from '@/lib/flashcard-spaced-repetition'
import { inicioDoDiaEmBrasilia } from '@/lib/fuso-brasilia'

export const dynamic = 'force-dynamic'

/**
 * O "hoje" dos flashcards do usuário, por deck, numa agregação só:
 *
 * - `decks`: cards vencidos (a revisão que a repetição espaçada marcou para
 *   agora) — alimenta o aviso "revisar hoje" e os selos da grade;
 * - `errors`: o caderno de erros — cards cuja última nota foi "Difícil"
 *   ("travei ou errei"). O card sai daqui sozinho quando a pessoa acerta;
 * - `reviewedToday`: quantos cards ela já revisou hoje (dia de Brasília), que
 *   é o progresso da meta diária.
 *
 * Um único `$match` por `userId` (prefixo do índice `userId_nextReviewAt`) e
 * as três contas saem do mesmo `$group` — antes era só a primeira.
 */
export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ decks: {}, total: 0, errors: {}, errorsTotal: 0, reviewedToday: 0 })

    const db = await getDb()
    const now = new Date()
    const inicioDeHoje = inicioDoDiaEmBrasilia(now)

    const rows = await db
      .collection(FLASHCARD_SPACED_PROGRESS_COLLECTION)
      .aggregate([
        { $match: { userId: session.userId } },
        {
          $group: {
            _id: '$deckId',
            // Dentro do `$group` a comparação não separa tipos como a consulta
            // faz: `null` (card sem data) seria "menor que agora" e contaria
            // como vencido. Só data de verdade entra na conta.
            due: { $sum: { $cond: [{ $and: [{ $eq: [{ $type: '$nextReviewAt' }, 'date'] }, { $lte: ['$nextReviewAt', now] }] }, 1, 0] } },
            errors: { $sum: { $cond: [{ $eq: ['$rating', 'DIFICIL'] }, 1, 0] } },
            today: { $sum: { $cond: [{ $and: [{ $eq: [{ $type: '$lastReviewedAt' }, 'date'] }, { $gte: ['$lastReviewedAt', inicioDeHoje] }] }, 1, 0] } },
          },
        },
        { $match: { $or: [{ due: { $gt: 0 } }, { errors: { $gt: 0 } }, { today: { $gt: 0 } }] } },
        { $sort: { due: -1 } },
        { $limit: 300 },
      ])
      .toArray()

    const decks: Record<string, number> = {}
    const errors: Record<string, number> = {}
    let total = 0
    let errorsTotal = 0
    let reviewedToday = 0
    for (const row of rows) {
      const deckId = String(row._id || '')
      if (!deckId) continue
      if (row.due > 0) {
        decks[deckId] = row.due
        total += row.due
      }
      if (row.errors > 0) {
        errors[deckId] = row.errors
        errorsTotal += row.errors
      }
      reviewedToday += row.today || 0
    }

    const res = NextResponse.json({ decks, total, errors, errorsTotal, reviewedToday })
    res.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate')
    return res
  } catch (error) {
    console.error('Erro ao contar revisões pendentes:', error)
    return NextResponse.json({ decks: {}, total: 0, errors: {}, errorsTotal: 0, reviewedToday: 0 })
  }
}
