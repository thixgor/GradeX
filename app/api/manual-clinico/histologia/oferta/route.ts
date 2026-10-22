import { NextResponse } from 'next/server'

import { ofertaDaHistologia } from '@/lib/histologia/acesso'
import { histologiaHabilitada } from '@/lib/histologia/licenca'

/**
 * Preço do Manual Clínico para a vitrine estática da Histologia.
 *
 * A vitrine que o visitante sem sessão recebe sai do CDN; o preço, que mora no
 * banco, chega por aqui. Não depende de quem pergunta — é o produto, não o
 * acesso — então fica no cache da borda por cinco minutos: uma mudança de preço
 * no admin aparece em até 5 min, e milhares de visitas custam uma consulta.
 * O lote promocional não passa por aqui: a vitrine o consulta à parte, ao vivo.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  if (!histologiaHabilitada()) {
    return new NextResponse(null, { status: 404 })
  }
  try {
    return NextResponse.json(
      { produto: await ofertaDaHistologia() },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' } },
    )
  } catch (erro) {
    // eslint-disable-next-line no-console
    console.error('[histologia] falha ao ler a oferta:', erro)
    // Sem preço a vitrine continua de pé (sem o bloco de valor); o erro não
    // pode ficar no cache da borda.
    return NextResponse.json({ produto: null }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
}
