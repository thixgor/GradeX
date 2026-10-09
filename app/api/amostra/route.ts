import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { checkRateLimit } from '@/lib/rate-limit'
import {
  getManualClinicoConfig,
  getManualClinicoFreeSlugSet,
  buildManualClinicoPreview,
} from '@/lib/manual-clinico-product'
import type { BancoQuestao } from '@/lib/types/banco-questoes'
import { ObjectId } from 'mongodb'
import { memoizarPorTempo } from '@/lib/cache-de-servidor'
import {
  TAMANHO_DO_POOL,
  escolherPoolDaSemana,
  semanaAtual,
  sortearDoPool,
} from '@/lib/amostra-pool'

export const dynamic = 'force-dynamic'

// Quantidade de questões da amostra pública (sem login).
const MAX_QUESTOES = 10

// Só objetivas com alternativas e comentário (para a amostra fazer sentido).
const FILTRO_DA_AMOSTRA = {
  tipo: 'objetiva',
  alternativas: { $exists: true, $ne: [] },
  explicacao: { $exists: true, $nin: [null, ''] },
}

/**
 * Uma hora por instância. O pool só muda na virada da semana; a hora existe
 * para uma questão corrigida pelo admin aparecer corrigida na amostra no mesmo
 * dia, sem ninguém precisar lembrar de invalidar nada.
 */
const TTL_DO_POOL_MS = 60 * 60 * 1000

async function carregarPoolDaSemana(db: Awaited<ReturnType<typeof getDb>>, semana: number) {
  const colecao = db.collection<BancoQuestao>('banco_questoes')

  // Primeiro só os ids — 12 bytes cada —, para escolher o pool sem trazer
  // enunciado e comentário do banco inteiro.
  const elegiveis = await colecao
    .find(FILTRO_DA_AMOSTRA as any, { projection: { _id: 1 } })
    .toArray()
  const escolhidos = escolherPoolDaSemana(
    elegiveis.map((doc) => String(doc._id)),
    semana,
    TAMANHO_DO_POOL,
  ).map((id) => new ObjectId(id))

  if (escolhidos.length === 0) return []

  const rawQuestoes = await colecao
    .aggregate([
      { $match: { _id: { $in: escolhidos } } },
      // Módulo e tópico vêm junto porque a amostra mostra as MESMAS
      // etiquetas que a tela de resolução de quem tem conta. Sem eles a
      // questão chegava sem lugar na árvore, e a amostra virava um quiz
      // genérico em vez de um pedaço do banco de verdade.
      {
        $lookup: {
          from: 'banco_modulos',
          localField: 'moduloId',
          foreignField: '_id',
          as: 'modulo',
        },
      },
      {
        $lookup: {
          from: 'banco_topicos',
          localField: 'topicoId',
          foreignField: '_id',
          as: 'topico',
        },
      },
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
          moduloNome: { $first: '$modulo.nome' },
          topicoNome: { $first: '$topico.nome' },
        },
      },
    ])
    .toArray()

  return (rawQuestoes as any[]).map((q) => ({
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
    moduloNome: q.moduloNome || null,
    topicoNome: q.topicoNome || null,
  }))
}

function clientIp(request: NextRequest): string {
  const fwd = request.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  return request.headers.get('x-real-ip') || 'desconhecido'
}

// Amostra pública: 10 questões objetivas comentadas + 1 patologia liberada do
// Manual Clínico. Sem autenticação, com rate limit por IP para proteger a
// nova superfície aberta a visitantes. As questões saem do pool da semana, e
// não do banco inteiro — ver lib/amostra-pool.ts.
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

    // O pool da semana (ver lib/amostra-pool.ts): a amostra sorteia sempre
    // dentro das mesmas `TAMANHO_DO_POOL` questões, e não no banco inteiro.
    const semana = semanaAtual()
    const [pool, config] = await Promise.all([
      memoizarPorTempo(`amostra:pool:${semana}`, TTL_DO_POOL_MS, () =>
        carregarPoolDaSemana(db, semana),
      ),
      getManualClinicoConfig(db),
    ])
    const questoes = sortearDoPool(pool, MAX_QUESTOES)

    // 1 patologia liberada, quando o Manual está no modo de acesso por lista.
    let patologia: any = null
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
