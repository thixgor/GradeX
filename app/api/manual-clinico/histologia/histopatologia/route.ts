import { NextResponse } from 'next/server'

import { histologiaLiberadaNaRequisicao } from '@/lib/histologia/acesso'
import { histologiaHabilitada } from '@/lib/histologia/licenca'
import { respostaDoAcervo, semAcessoAoAcervo } from '@/lib/histologia/resposta'
import { histopatologiaHabilitada } from '@/lib/histopatologia/direitos'
import { dadosDaHistopatologia } from '@/lib/histopatologia/inicio'

/**
 * A home da Histopatologia, para o casco estático da página. Mesmo portão das
 * demais rotas de conteúdo do módulo: 404 seco a quem não assina, e 404 também
 * quando a área está fechada neste ambiente — como o layout da página.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  if (!histologiaHabilitada() || !histopatologiaHabilitada()) {
    return new NextResponse(null, { status: 404 })
  }
  if (!(await histologiaLiberadaNaRequisicao())) {
    return semAcessoAoAcervo()
  }
  return respostaDoAcervo(request, dadosDaHistopatologia())
}
