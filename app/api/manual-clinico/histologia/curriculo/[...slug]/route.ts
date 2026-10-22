import { NextResponse } from 'next/server'

import { histologiaLiberadaNaRequisicao } from '@/lib/histologia/acesso'
import { dadosDaPaginaDoCurriculo } from '@/lib/histologia/curriculo'
import { histologiaHabilitada } from '@/lib/histologia/licenca'
import { respostaDoAcervo, semAcessoAoAcervo } from '@/lib/histologia/resposta'

/**
 * Conteúdo de uma página do currículo — lâmina ou nó de índice.
 *
 * A página `/manual-clinico/histologia/[...slug]` é um casco estático; o que
 * ela mostra vem daqui, e só para quem passa pelo portão. Para quem não passa,
 * 404 seco, e o casco leva à home (vitrine), como o `redirect()` da página
 * antiga fazia.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request, props: { params: Promise<{ slug: string[] }> }) {
  if (!histologiaHabilitada()) {
    return new NextResponse(null, { status: 404 })
  }
  if (!(await histologiaLiberadaNaRequisicao())) {
    return semAcessoAoAcervo()
  }

  const { slug } = await props.params
  const dados = await dadosDaPaginaDoCurriculo(slug)
  if (!dados) return semAcessoAoAcervo()
  return respostaDoAcervo(request, dados)
}
