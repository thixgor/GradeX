import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { lerConfigDoPrograma } from '@/lib/embaixadores/servidor'
import { CONFIG_PADRAO } from '@/lib/embaixadores/regras'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * As regras públicas do programa, para a página de quem ainda não é
 * embaixador: onde se inscrever e de quanto é o cupom. Igual para todo mundo,
 * então sai do CDN por cinco minutos.
 */
export async function GET() {
  try {
    const db = await getDb()
    const config = await lerConfigDoPrograma(db)
    return publico({ linkInscricao: config.linkInscricao, descontoCupom: config.descontoCupomPadrao })
  } catch (erro) {
    console.error('[embaixadores/programa]', erro)
    return publico({ linkInscricao: CONFIG_PADRAO.linkInscricao, descontoCupom: CONFIG_PADRAO.descontoCupomPadrao })
  }
}

function publico(programa: { linkInscricao: string; descontoCupom: number }) {
  return NextResponse.json(
    { programa },
    { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } },
  )
}
