import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { checkRateLimit } from '@/lib/rate-limit'
import { resolveProuniProduto } from '@/lib/prouni-catalogo'
import {
  getLiveProuniBenefit,
  serializeProuniBenefit,
  serializeProuniRequestForUser,
  PROUNI_REQUESTS_COLLECTION,
  type ProuniItemType,
  type ProuniRequest,
} from '@/lib/prouni-fies'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * "Este item tem desconto PROUNI/FIES, e como está a MINHA situação nele?"
 *
 * Alimenta o chamativo na página do produto e a página exclusiva. Aberta a
 * visitante de propósito — quem ainda não tem conta precisa ver que o benefício
 * existe antes de decidir se cria uma —, e por isso o que sai daqui sem sessão
 * é só a oferta: nada de solicitação, nada de dado pessoal.
 *
 * Falha em silêncio (`{ benefit: null }`): esta rota decora a página de um
 * produto: se o banco piscar, o produto continua à venda como sempre esteve.
 */

const TIPOS_VALIDOS: ProuniItemType[] = ['material', 'package', 'manual_clinico', 'plus']

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const itemType = String(params.get('itemType') || '') as ProuniItemType
  const itemId = String(params.get('itemId') || '').slice(0, 80)

  if (!TIPOS_VALIDOS.includes(itemType) || !itemId) {
    return NextResponse.json({ benefit: null })
  }

  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const rl = await checkRateLimit(ip, 'prouni_beneficio', 90, 60_000)
    if (!rl.success) return NextResponse.json({ benefit: null })

    const db = await getDb()
    const benefit = await getLiveProuniBenefit(db, itemType, itemId)
    if (!benefit) return NextResponse.json({ benefit: null })

    const session = await getSession()
    const [produto, minhaSolicitacao] = await Promise.all([
      resolveProuniProduto(db, itemType, itemId),
      session
        ? db.collection<ProuniRequest>(PROUNI_REQUESTS_COLLECTION).findOne(
            { userId: session.userId, itemType, itemId },
            { sort: { createdAt: -1 } }
          )
        : Promise.resolve(null),
    ])

    // Produto apagado com o benefício órfão: melhor não anunciar desconto para
    // uma página que não existe mais.
    if (!produto) return NextResponse.json({ benefit: null })

    return NextResponse.json({
      benefit: serializeProuniBenefit(benefit),
      product: produto,
      request: minhaSolicitacao ? serializeProuniRequestForUser(minhaSolicitacao) : null,
      authenticated: Boolean(session),
    })
  } catch (error) {
    console.error('[prouni/beneficio] erro:', error)
    return NextResponse.json({ benefit: null })
  }
}
