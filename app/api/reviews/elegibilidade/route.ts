import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { checkRateLimitSync, isValidObjectId } from '@/lib/api-security'
import { hasAccessToTarget } from '@/lib/access'
import {
  computeReviewSummary,
  findUserReview,
  getTargetCollectionName,
  isValidTargetType,
} from '@/lib/reviews'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * A pergunta mais barata possível: "vale a pena convidar esta pessoa a avaliar
 * este conteúdo agora?".
 *
 * O convite de fim de estudo (ver `lib/reviews-prompt.ts`) aparece por cima do
 * que a pessoa estiver fazendo. Aparecer para quem já avaliou, para quem perdeu
 * o acesso ou para um item com avaliações travadas seria pior do que não
 * aparecer. `GET /api/reviews` responderia tudo isto, mas traz junto a lista
 * paginada de avaliações — dezenas de documentos que o convite não desenha.
 * Esta rota devolve só o veredito, o título, a capa e o resumo de notas.
 */
function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  return req.headers.get('x-real-ip') || 'unknown'
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const targetType = url.searchParams.get('targetType')
    const targetId = url.searchParams.get('targetId')

    if (!isValidTargetType(targetType)) {
      return NextResponse.json({ error: 'targetType inválido' }, { status: 400 })
    }
    if (!targetId || !isValidObjectId(targetId)) {
      return NextResponse.json({ error: 'targetId inválido' }, { status: 400 })
    }

    const rl = checkRateLimitSync(getClientIp(request), 'reviews:elegibilidade', {
      limit: 60,
      windowMs: 60_000,
    })
    if (!rl.success) {
      return NextResponse.json({ error: 'Muitas requisições' }, { status: 429 })
    }

    const session = await getSession()
    // Convite é coisa de quem está logado: sem sessão não há o que avaliar.
    if (!session) {
      return NextResponse.json({ podeAvaliar: false, motivo: 'nao_autenticado' })
    }

    const db = await getDb()
    const alvo = await db.collection(getTargetCollectionName(targetType)).findOne(
      { _id: new ObjectId(targetId) },
      { projection: { title: 1, coverImage: 1, reviewsLocked: 1, isHidden: 1, slug: 1 } },
    )

    if (!alvo) {
      return NextResponse.json({ podeAvaliar: false, motivo: 'nao_encontrado' })
    }
    if (alvo.reviewsLocked === true) {
      return NextResponse.json({ podeAvaliar: false, motivo: 'travado' })
    }

    const [jaAvaliou, acesso, resumo] = await Promise.all([
      findUserReview(db, targetType, targetId, session.userId),
      hasAccessToTarget({ session, targetType, targetId, db }),
      computeReviewSummary(db, targetType, targetId),
    ])

    if (jaAvaliou) {
      return NextResponse.json({ podeAvaliar: false, motivo: 'ja_avaliou' })
    }
    if (!acesso.allowed) {
      return NextResponse.json({ podeAvaliar: false, motivo: 'sem_acesso' })
    }

    const res = NextResponse.json({
      podeAvaliar: true,
      titulo: typeof alvo.title === 'string' ? alvo.title : null,
      capa: typeof alvo.coverImage === 'string' ? alvo.coverImage : null,
      resumo: { media: resumo.avg, total: resumo.count },
    })
    res.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate')
    return res
  } catch (error) {
    console.error('GET /api/reviews/elegibilidade error:', error)
    return NextResponse.json({ podeAvaliar: false, motivo: 'erro' }, { status: 500 })
  }
}
