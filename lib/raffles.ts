/**
 * Lógica de domínio das Rifas/Sorteios.
 *
 * Convenções importantes:
 *  - Os números da rifa vão de 1..totalNumbers (exibidos com padding).
 *  - A coleção `raffle_numbers` só guarda números NÃO disponíveis
 *    (reserved/sold/drawn). Um número "available" simplesmente não tem
 *    documento. Isso evita pré-criar milhares de docs (custo no Vercel) e
 *    mantém a coleção pequena.
 *  - O índice único { raffleId, number } garante atomicidade: tentar reservar
 *    um número já tomado falha com erro 11000.
 */

import { Db, ObjectId } from 'mongodb'
import type {
  Raffle,
  RaffleNumber,
  RaffleParticipant,
  RafflePurchase,
  RaffleWinner,
  RaffleWinnerEmbedded,
  RaffleDrawMethod,
} from './types'
import { sendRaffleWinnerEmail, sendRaffleAdminResultEmail } from './mail'
import {
  RAFFLE_RESERVATION_MINUTES,
  getEffectiveStatus,
  maskName,
  pad,
  slugify,
} from './raffle-shared'

// Re-exporta os helpers puros para que rotas de servidor possam importar tudo
// de '@/lib/raffles'.
export {
  RAFFLE_RESERVATION_MINUTES,
  RAFFLE_TEMPLATES,
  getTemplate,
  RAFFLE_STATUS_LABELS,
  RAFFLE_VISIBILITY_LABELS,
  slugify,
  getEffectiveStatus,
  canPurchase,
  maskName,
  maskEmail,
  pad,
  resolveTheme,
} from './raffle-shared'

/** Garante slug único na coleção, adicionando sufixo numérico quando necessário. */
export async function ensureUniqueSlug(
  db: Db,
  base: string,
  excludeId?: string,
): Promise<string> {
  const root = slugify(base) || `rifa-${Date.now()}`
  let candidate = root
  let i = 1
  // Loop limitado para evitar varredura infinita.
  while (i < 200) {
    const existing = await db.collection<Raffle>('raffles').findOne({ slug: candidate })
    if (!existing || (excludeId && String(existing._id) === excludeId)) {
      return candidate
    }
    i += 1
    candidate = `${root}-${i}`
  }
  return `${root}-${Date.now()}`
}

export interface TakenNumbers {
  sold: number[]
  reserved: number[]
}

/**
 * Carrega os números tomados (sold/drawn + reserved não expirados) de uma rifa.
 * Aproveita para limpar reservas expiradas (lazy cleanup).
 */
export async function getTakenNumbers(db: Db, raffleId: string): Promise<TakenNumbers> {
  const col = db.collection<RaffleNumber>('raffle_numbers')
  const now = new Date()
  // Libera reservas expiradas (deleta → voltam a ficar disponíveis).
  await col.deleteMany({
    raffleId,
    status: 'reserved',
    reservedUntil: { $lt: now },
  })

  const docs = await col
    .find({ raffleId }, { projection: { number: 1, status: 1 } })
    .toArray()

  const sold: number[] = []
  const reserved: number[] = []
  for (const d of docs) {
    if (d.status === 'sold' || d.status === 'drawn') sold.push(d.number)
    else if (d.status === 'reserved') reserved.push(d.number)
  }
  return { sold, reserved }
}

export interface ReserveResult {
  ok: boolean
  /** Números que não puderam ser reservados (já tomados). */
  conflicting: number[]
}

/**
 * Reserva atomicamente um conjunto de números para uma sessão/compra.
 * Usa o índice único { raffleId, number }: cada insert que colide significa
 * número já tomado. Em caso de conflito, faz rollback das reservas criadas.
 */
export async function reserveNumbers(
  db: Db,
  raffleId: string,
  numbers: number[],
  ctx: { sessionId: string; orderId?: string; purchaseId?: string },
): Promise<ReserveResult> {
  const col = db.collection<RaffleNumber>('raffle_numbers')
  const now = new Date()
  const reservedUntil = new Date(now.getTime() + RAFFLE_RESERVATION_MINUTES * 60 * 1000)

  // Limpa reservas expiradas desses números antes de tentar.
  await col.deleteMany({
    raffleId,
    number: { $in: numbers },
    status: 'reserved',
    reservedUntil: { $lt: now },
  })

  const inserted: number[] = []
  const conflicting: number[] = []

  for (const number of numbers) {
    try {
      await col.insertOne({
        raffleId,
        number,
        status: 'reserved',
        reservedBySessionId: ctx.sessionId,
        reservedUntil,
        orderId: ctx.orderId,
        purchaseId: ctx.purchaseId,
        createdAt: now,
        updatedAt: now,
      } as RaffleNumber)
      inserted.push(number)
    } catch (err: any) {
      if (err?.code === 11000) {
        conflicting.push(number)
      } else {
        // Erro inesperado — rollback e propaga.
        if (inserted.length) {
          await col.deleteMany({ raffleId, number: { $in: inserted }, status: 'reserved', reservedBySessionId: ctx.sessionId })
        }
        throw err
      }
    }
  }

  if (conflicting.length > 0) {
    // Rollback das reservas que conseguimos criar.
    if (inserted.length) {
      await col.deleteMany({ raffleId, number: { $in: inserted }, status: 'reserved', reservedBySessionId: ctx.sessionId })
    }
    return { ok: false, conflicting }
  }

  return { ok: true, conflicting: [] }
}

/** Libera (deleta) as reservas associadas a uma order/compra. */
export async function releaseReservation(db: Db, raffleId: string, orderId: string): Promise<void> {
  await db.collection<RaffleNumber>('raffle_numbers').deleteMany({
    raffleId,
    orderId,
    status: 'reserved',
  })
}

/**
 * Marca os números de uma compra como vendidos (transição reserved → sold).
 * Idempotente.
 */
export async function markNumbersSold(
  db: Db,
  raffleId: string,
  numbers: number[],
  ctx: { participantId?: string; purchaseId?: string; orderId?: string },
): Promise<void> {
  const col = db.collection<RaffleNumber>('raffle_numbers')
  const now = new Date()
  await col.updateMany(
    { raffleId, number: { $in: numbers } },
    {
      $set: {
        status: 'sold',
        participantId: ctx.participantId,
        purchaseId: ctx.purchaseId,
        orderId: ctx.orderId,
        reservedUntil: undefined,
        updatedAt: now,
      },
    },
  )
}

/** Sorteio Fisher-Yates seguro o suficiente para esta finalidade. */
export function pickRandom<T>(arr: T[], count: number): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy.slice(0, Math.max(0, count))
}

/** Serializa uma rifa para resposta pública (sem dados sensíveis). */
export function serializeRaffle(r: Raffle, taken?: TakenNumbers) {
  const soldCount = taken ? taken.sold.length : r.soldCount || 0
  return {
    id: String(r._id),
    name: r.name,
    slug: r.slug,
    description: r.description || '',
    pricePerNumber: r.pricePerNumber,
    totalNumbers: r.totalNumbers,
    winnersCount: r.winnersCount,
    coverImageUrl: r.coverImageUrl || '',
    prizeName: r.prizeName,
    prizeDescription: r.prizeDescription || '',
    prizeCategory: r.prizeCategory || '',
    prizeImageUrl: r.prizeImageUrl || '',
    template: r.template,
    customDesign: r.customDesign || null,
    visibility: r.visibility,
    status: getEffectiveStatus(r),
    rawStatus: r.status,
    rules: r.rules || '',
    startsAt: r.startsAt || null,
    endsAt: r.endsAt || null,
    drawAt: r.drawAt || null,
    soldCount,
    availableCount: Math.max(0, r.totalNumbers - soldCount),
    winners: (r.winners || []).map(w => ({
      number: w.number,
      participantName: w.participantName || 'Participante',
      prizeName: w.prizeName || r.prizeName,
      drawnAt: w.drawnAt,
      drawMethod: w.drawMethod,
    })),
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }
}

export interface DrawResult {
  ok: boolean
  error?: string
  winners: RaffleWinnerEmbedded[]
}

/**
 * Executa o sorteio de uma rifa. Compartilhado entre sorteio manual (admin) e
 * automático (cron). Idempotente para os números já sorteados (índice único
 * em raffle_winners). Persiste o resultado permanentemente.
 */
export async function drawRaffle(
  db: Db,
  raffle: Raffle,
  options: {
    count?: number
    drawMethod: RaffleDrawMethod
    drawnBy?: string
    allowUnsold?: boolean
    /** Números específicos a sortear (admin). Se vazio, sorteia aleatoriamente. */
    specificNumbers?: number[]
  },
): Promise<DrawResult> {
  const raffleId = String(raffle._id)
  const alreadyDrawn = (raffle.winners || []).map(w => w.number)
  const remainingSlots = Math.max(0, (raffle.winnersCount || 1) - alreadyDrawn.length)
  const requested = options.count && options.count > 0 ? options.count : remainingSlots
  const count = Math.min(requested, remainingSlots || requested)

  if (count <= 0) {
    return { ok: false, error: 'Todos os ganhadores já foram sorteados.', winners: [] }
  }

  // Pool de candidatos.
  let pool: number[]
  if (options.specificNumbers && options.specificNumbers.length > 0) {
    pool = options.specificNumbers.filter(n => !alreadyDrawn.includes(n))
  } else if (options.allowUnsold || raffle.allowDrawUnsoldNumbers) {
    const all: number[] = []
    for (let i = 1; i <= raffle.totalNumbers; i++) {
      if (!alreadyDrawn.includes(i)) all.push(i)
    }
    pool = all
  } else {
    const soldDocs = await db
      .collection<RaffleNumber>('raffle_numbers')
      .find({ raffleId, status: { $in: ['sold', 'drawn'] } }, { projection: { number: 1 } })
      .toArray()
    pool = soldDocs.map(d => d.number).filter(n => !alreadyDrawn.includes(n))
  }

  if (pool.length === 0) {
    return { ok: false, error: 'Não há números elegíveis para sorteio.', winners: [] }
  }

  const chosen = options.specificNumbers && options.specificNumbers.length > 0
    ? pool.slice(0, count)
    : pickRandom(pool, count)

  const now = new Date()
  const newWinners: RaffleWinnerEmbedded[] = []
  const winnerDocsForEmail: { number: number; name?: string; email?: string }[] = []

  for (const number of chosen) {
    // Localiza a compra paga que contém este número.
    const purchase = await db.collection<RafflePurchase>('raffle_purchases').findOne({
      raffleId,
      status: 'paid',
      numbers: number,
    })
    let participant: RaffleParticipant | null = null
    if (purchase?.participantId) {
      participant = await db.collection<RaffleParticipant>('raffle_participants').findOne({
        _id: new ObjectId(purchase.participantId) as any,
      })
    }

    const participantName = participant?.name || purchase?.participantName
    const participantEmail = participant?.email || purchase?.participantEmail

    const winnerDoc: RaffleWinner = {
      raffleId,
      number,
      participantId: purchase?.participantId,
      purchaseId: purchase ? String(purchase._id) : undefined,
      participantName,
      participantEmail,
      prizeName: raffle.prizeName,
      drawnAt: now,
      drawMethod: options.drawMethod,
      drawnBy: options.drawnBy,
    }

    try {
      await db.collection<RaffleWinner>('raffle_winners').insertOne(winnerDoc as any)
    } catch (err: any) {
      if (err?.code === 11000) continue // já sorteado
      throw err
    }

    // Marca o número como sorteado.
    await db.collection<RaffleNumber>('raffle_numbers').updateOne(
      { raffleId, number },
      {
        $setOnInsert: { raffleId, number, createdAt: now },
        $set: { status: 'drawn', updatedAt: now },
      },
      { upsert: true },
    )

    newWinners.push({
      number,
      participantId: purchase?.participantId,
      purchaseId: winnerDoc.purchaseId,
      participantName: maskName(participantName),
      prizeName: raffle.prizeName,
      drawnAt: now,
      drawMethod: options.drawMethod,
    })
    winnerDocsForEmail.push({ number, name: participantName, email: participantEmail })

    // E-mail ao ganhador (best-effort).
    if (participantEmail) {
      sendRaffleWinnerEmail({
        email: participantEmail,
        name: participantName || '',
        raffleName: raffle.name,
        raffleSlug: raffle.slug,
        prizeName: raffle.prizeName,
        number,
        totalNumbers: raffle.totalNumbers,
      })
        .then(() =>
          db.collection<RaffleWinner>('raffle_winners').updateOne(
            { raffleId, number },
            { $set: { notifiedAt: new Date() } },
          ),
        )
        .catch(err => console.error('[raffle] e-mail ganhador falhou:', err))
    }
  }

  if (newWinners.length === 0) {
    return { ok: false, error: 'Nenhum número novo foi sorteado.', winners: [] }
  }

  const allWinners = [...(raffle.winners || []), ...newWinners]
  const isComplete = allWinners.length >= (raffle.winnersCount || 1)

  await db.collection<Raffle>('raffles').updateOne(
    { _id: raffle._id as any },
    {
      $set: {
        winners: allWinners,
        drawAt: now,
        drawnBy: options.drawnBy,
        status: isComplete ? 'finished' : raffle.status,
        updatedAt: now,
      },
    },
  )

  // Notifica o admin (best-effort).
  sendRaffleAdminResultEmail({
    raffleName: raffle.name,
    prizeName: raffle.prizeName,
    winners: winnerDocsForEmail,
    totalNumbers: raffle.totalNumbers,
  }).catch(err => console.error('[raffle] e-mail admin falhou:', err))

  return { ok: true, winners: newWinners }
}

export function toObjectId(id: string): ObjectId | null {
  try {
    if (!ObjectId.isValid(id)) return null
    return new ObjectId(id)
  } catch {
    return null
  }
}

/** Resolve uma rifa por ObjectId ou por slug. */
export async function findRaffleByIdOrSlug(db: Db, idOrSlug: string): Promise<Raffle | null> {
  const col = db.collection<Raffle>('raffles')
  const oid = toObjectId(idOrSlug)
  if (oid) {
    const byId = await col.findOne({ _id: oid as any })
    if (byId) return byId
  }
  return col.findOne({ slug: idOrSlug })
}
