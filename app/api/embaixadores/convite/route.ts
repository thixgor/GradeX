import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getDb } from '@/lib/mongodb'
import { embaixadorAtivoPorCodigo } from '@/lib/embaixadores/servidor'
import { normalizarCodigo } from '@/lib/embaixadores/regras'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * O que o convite de um embaixador mostra a quem chegou pelo link dele:
 * primeiro nome, faculdade e o cupom. Nada além — nem e-mail, nem sobrenome,
 * nem números. Embaixador que saiu do programa responde 404.
 */
export async function GET(request: NextRequest) {
  const codigo = normalizarCodigo(request.nextUrl.searchParams.get('codigo') || '')
  try {
    const db = await getDb()
    const embaixador = await embaixadorAtivoPorCodigo(db, codigo)
    if (!embaixador) {
      return NextResponse.json({ error: 'Convite não encontrado' }, { status: 404, headers: cache(60) })
    }
    const cupom =
      embaixador.couponId && ObjectId.isValid(embaixador.couponId)
        ? await db
            .collection('coupons')
            .findOne(
              { _id: new ObjectId(embaixador.couponId) },
              { projection: { codeNormalized: 1, discountValue: 1, discountType: 1, isActive: 1 } },
            )
        : null
    const cupomValido = cupom && cupom.isActive !== false
    return NextResponse.json(
      {
        convite: {
          primeiroNome: String(embaixador.nome || '').trim().split(/\s+/)[0] || 'Um colega',
          faculdade: embaixador.faculdade || '',
          codigo: embaixador.codigo,
          cupom: cupomValido
            ? {
                codigo: cupom.codeNormalized,
                rotulo:
                  cupom.discountType === 'fixed'
                    ? `R$ ${Number(cupom.discountValue).toFixed(2).replace('.', ',')} OFF`
                    : `${Number(cupom.discountValue)}% OFF`,
              }
            : null,
        },
      },
      { headers: cache(120) },
    )
  } catch (erro) {
    console.error('[embaixadores/convite]', erro)
    return NextResponse.json({ error: 'Erro ao abrir o convite' }, { status: 500 })
  }
}

function cache(segundos: number) {
  return { 'Cache-Control': `public, s-maxage=${segundos}, stale-while-revalidate=${segundos * 5}` }
}
