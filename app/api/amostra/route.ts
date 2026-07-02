import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { checkRateLimit } from '@/lib/rate-limit'
import {
  getManualClinicoConfig,
  getManualClinicoFreeSlugSet,
  buildManualClinicoPreview,
} from '@/lib/manual-clinico-product'
import type { BancoQuestao } from '@/lib/types/banco-questoes'

export const dynamic = 'force-dynamic'

// Quantidade de questões da amostra pública (sem login).
const MAX_QUESTOES = 10

function clientIp(request: NextRequest): string {
  const fwd = request.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  return request.headers.get('x-real-ip') || 'desconhecido'
}

// Amostra pública: 10 questões objetivas comentadas + 1 patologia liberada do
// Manual Clínico. Sem autenticação, com rate limit por IP para proteger a
// nova superfície aberta a visitantes.
export async function GET(request: NextRequest) {
  try {
    const ip = clientIp(request)
    const rl = await checkRateLimit(ip, 'amostra', 60, 10 * 60 * 1000)
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Muitas requisições. Tente de novo em alguns minutos.' },
        { status: 429 },
      )
    }

    const db = await getDb()

    // Só objetivas com alternativas e comentário (para a amostra fazer sentido).
    const rawQuestoes = await db
      .collection<BancoQuestao>('banco_questoes')
      .aggregate([
        {
          $match: {
            tipo: 'objetiva',
            alternativas: { $exists: true, $ne: [] },
            explicacao: { $exists: true, $nin: [null, ''] },
          },
        },
        { $sample: { size: MAX_QUESTOES } },
        {
          $project: {
            _id: 1,
            tipo: 1,
            enunciado: 1,
            explicacao: 1,
            imagemUrl: 1,
            imagensAlternativas: 1,
            alternativas: 1,
            dificuldade: 1,
            fonte: 1,
            ano: 1,
          },
        },
      ])
      .toArray()

    const questoes = (rawQuestoes as any[]).map((q) => ({
      id: String(q._id),
      enunciado: q.enunciado || '',
      explicacao: q.explicacao || '',
      imagemUrl: q.imagemUrl || null,
      imagensAlternativas: q.imagensAlternativas || [],
      alternativas: (q.alternativas || []).map((a: any) => ({
        letra: a.letra,
        texto: a.texto,
        correta: !!a.correta,
      })),
      dificuldade: q.dificuldade || null,
      fonte: q.fonte || null,
      ano: q.ano || null,
    }))

    // 1 patologia liberada, quando o Manual está no modo de acesso por lista.
    let patologia: any = null
    const config = await getManualClinicoConfig(db)
    const freeSlugs = await getManualClinicoFreeSlugSet(db, config)
    if (freeSlugs.size > 0) {
      const slug = Array.from(freeSlugs)[0]
      const doc = await db.collection('patologias').findOne({ slug })
      if (doc) {
        const preview = buildManualClinicoPreview(doc)
        patologia = {
          slug: preview.slug,
          nome: preview.nome,
          sistema: preview.sistema || null,
          cid10: preview.cid10 || null,
          preview: preview.preview || '',
        }
      }
    }

    return NextResponse.json(
      { questoes, patologia },
      { headers: { 'cache-control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300' } },
    )
  } catch (error) {
    console.error('[amostra] erro:', error)
    return NextResponse.json({ error: 'Erro ao carregar a amostra' }, { status: 500 })
  }
}
