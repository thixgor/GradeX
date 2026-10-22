import { NextResponse } from 'next/server'

import { histologiaLiberadaNaRequisicao } from '@/lib/histologia/acesso'
import { histologiaHabilitada } from '@/lib/histologia/licenca'
import { respostaDoAcervo, semAcessoAoAcervo } from '@/lib/histologia/resposta'
import { dadosDoCapitulo } from '@/lib/histopatologia/capitulo'
import { histopatologiaHabilitada } from '@/lib/histopatologia/direitos'

/**
 * O capítulo de uma doença, para o casco estático da página. Mesmo portão das
 * demais rotas de conteúdo do módulo: 404 seco a quem não assina, e 404 também
 * com a área fechada neste ambiente, como o layout dela.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request, props: { params: Promise<{ slug: string }> }) {
  if (!histologiaHabilitada() || !histopatologiaHabilitada()) {
    return new NextResponse(null, { status: 404 })
  }
  if (!(await histologiaLiberadaNaRequisicao())) {
    return semAcessoAoAcervo()
  }

  const { slug } = await props.params
  const dados = await dadosDoCapitulo(slug)
  if (!dados) return semAcessoAoAcervo()
  return respostaDoAcervo(request, dados)
}
