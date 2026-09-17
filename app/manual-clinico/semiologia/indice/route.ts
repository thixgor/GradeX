import { NextResponse } from 'next/server'
import { montarIndiceDeBusca } from '@/lib/semiologia/busca'

/**
 * O índice de busca como JSON estático.
 *
 * Servido à parte, e não embutido em cada página, porque a paleta de busca
 * existe em todas as rotas do módulo e o índice inteiro só é necessário
 * quando o aluno começa a digitar. Um GET cacheado no primeiro foco custa
 * menos do que dezenas de KB em cada HTML.
 *
 * O índice não tem nada que a vitrine já não mostre (nomes, resumos, capas),
 * então não passa pelo portão de acesso — quem clica num resultado sem acesso
 * cai na vitrine, como em qualquer rota do módulo.
 */
export const dynamic = 'force-static'

export function GET() {
  return NextResponse.json(montarIndiceDeBusca(), {
    headers: { 'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400' },
  })
}
