import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import {
  FLASHCARD_MANUAL_COLLECTIONS,
  getUserGroups,
  isValidObjectId,
  resolveDeckAccess,
} from '@/lib/flashcard-manual'
import { applyWatermark } from '@/lib/pdf-watermark'
import { checkPlusDownloadAllowance, recordPlusDownload } from '@/lib/plus-guard'
import { emailFingerprint } from '@/lib/watermark-fingerprint'
import { flashcardPdfFileName, generateFlashcardManualPdf } from '@/lib/flashcard-manual-pdf'
import { checkRateLimitSync } from '@/lib/api-security'
import type { FlashcardManualCard, FlashcardManualDeck, User } from '@/lib/types'

export const dynamic = 'force-dynamic'

// Rate limit por usuário para esta rota: a geração do PDF é a operação
// mais cara em CPU do app (jsPDF + pdf-lib + watermark por página).
// Sem limite, um único usuário com re-clique pode consumir minutos de
// Fluid Active CPU em rajada. 5 downloads/hora cobre uso real.
const PDF_RATE_LIMIT = { limit: 5, windowMs: 60 * 60 * 1000 }

async function findDeckByIdOrSlug(db: any, idOrSlug: string): Promise<(FlashcardManualDeck & { _id: ObjectId }) | null> {
  if (isValidObjectId(idOrSlug)) {
    const byId = await db.collection(FLASHCARD_MANUAL_COLLECTIONS.decks).findOne({ _id: new ObjectId(idOrSlug) })
    if (byId) return byId
  }
  return await db.collection(FLASHCARD_MANUAL_COLLECTIONS.decks).findOne({ slug: idOrSlug })
}

function encodeContentDisposition(filename: string): string {
  const ascii = filename.replace(/[^\x20-\x7E]/g, '_').replace(/["\\]/g, '')
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    // Rate-limit por usuário — protege contra burst de re-cliques.
    const rl = checkRateLimitSync(session.userId, '/api/flashcards/manual/pdf', PDF_RATE_LIMIT)
    if (!rl.success) {
      return NextResponse.json(
        {
          error: 'Muitos downloads em pouco tempo. Tente novamente em alguns minutos.',
          retryAfterSeconds: Math.ceil((rl.retryAfterMs || 0) / 1000),
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rl.retryAfterMs || 0) / 1000)),
          },
        }
      )
    }

    const db = await getDb()
    const deck = await findDeckByIdOrSlug(db, params.id)
    if (!deck) return NextResponse.json({ error: 'Deck não encontrado' }, { status: 404 })

    const user = await db.collection<User>('users').findOne(
      { _id: new ObjectId(session.userId) },
      { projection: { name: 1, email: 1, accountType: 1, secondaryRole: 1, role: 1 } }
    )
    if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

    const isAdmin = session.role === 'admin' || user.role === 'admin'
    if (deck.isHidden && !isAdmin && deck.ownerId !== session.userId) {
      return NextResponse.json({ error: 'Deck indisponível' }, { status: 404 })
    }

    if (deck.pdfDownloadEnabled !== true && !isAdmin) {
      return NextResponse.json({ error: 'Download em PDF não está liberado para este deck' }, { status: 403 })
    }

    const access = await resolveDeckAccess({
      db,
      deck,
      userId: session.userId,
      userEmail: user.email || session.email || null,
      userGroups: getUserGroups(user),
      isAdmin,
    })

    if (!access.hasAccess) {
      return NextResponse.json({ error: 'Sem acesso ao deck' }, { status: 403 })
    }

    // Acesso por tempo limitado não inclui download: um PDF exportado
    // sobreviveria ao fim do prazo, que é justamente o que essa modalidade
    // não vende. O estudo no deck segue liberado até a data.
    if (access.timedAccess && !isAdmin) {
      return NextResponse.json(
        {
          error: `Seu acesso é a versão por tempo limitado (${access.timedAccess.label || access.timedAccess.durationLabel || 'temporária'}), que não inclui exportar em PDF. Estude pelo deck — você ainda tem ${access.timedAccess.remainingLabel}.`,
          timedAccess: access.timedAccess,
          downloadBlocked: true,
        },
        { status: 403 },
      )
    }

    // Plus+ Guard: cota antiabuso de downloads.
    const allowance = await checkPlusDownloadAllowance({ userId: session.userId, user, isAdmin, db })
    if (!allowance.allowed) {
      return NextResponse.json(
        { error: allowance.message || 'Limite de downloads atingido.', reason: allowance.reason, retryAt: allowance.retryAt },
        { status: 429 },
      )
    }

    const cards = await db
      .collection<FlashcardManualCard>(FLASHCARD_MANUAL_COLLECTIONS.cards)
      .find({ deckId: String(deck._id) })
      .sort({ index: 1 })
      .toArray()

    const origin = request.nextUrl.origin
    const pdf = await generateFlashcardManualPdf(deck, cards, {
      id: session.userId,
      name: user.name || session.name || 'Usuário',
      email: user.email || session.email || '',
    }, origin)

    // orderId determinístico (não inclui Date.now()) — permite que o
    // browser reuse o mesmo PDF se o usuário clicar download novamente
    // em poucos minutos. O watermark continua único por usuário/deck.
    const stamped = await applyWatermark(pdf, {
      userName: user.name || session.name || 'Usuário',
      userEmail: user.email || session.email || '',
      userId: session.userId,
      orderId: `flashcard-${String(deck._id)}-${session.userId}`,
      downloadedAt: new Date(),
    })

    db.collection(FLASHCARD_MANUAL_COLLECTIONS.decks)
      .updateOne({ _id: deck._id }, { $inc: { pdfDownloadCount: 1 }, $set: { updatedAt: new Date() } })
      .catch(() => {})

    recordPlusDownload({
      userId: session.userId,
      userEmail: user.email || session.email,
      userName: user.name || session.name,
      accountType: user.accountType,
      kind: 'flashcard_deck',
      resourceId: String(deck._id),
      resourceTitle: deck.title,
      ip: request.headers.get('x-forwarded-for')?.split(',')[0] || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
      watermarkFingerprint: emailFingerprint(user.email || session.email),
      db,
    }).catch(() => {})

    const filename = flashcardPdfFileName(deck.title)
    return new NextResponse(Buffer.from(stamped), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': encodeContentDisposition(filename),
        // Cache privado curto: re-cliques dentro de 5 min reaproveitam
        // o PDF do browser sem invocar esta função. SWR mantém UX boa
        // após expiração sem gerar nova função enquanto valida.
        'Cache-Control': 'private, max-age=300, stale-while-revalidate=600',
        'X-Robots-Tag': 'noindex, nofollow',
      },
    })
  } catch (error) {
    console.error('Erro ao gerar PDF do deck:', error)
    return NextResponse.json({ error: 'Erro ao gerar PDF do deck' }, { status: 500 })
  }
}
