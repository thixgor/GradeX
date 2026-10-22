import { NextResponse } from 'next/server'

import { histologiaLiberadaNaRequisicao } from '@/lib/histologia/acesso'
import { histologiaHabilitada } from '@/lib/histologia/licenca'
import { respostaDoAcervo, semAcessoAoAcervo } from '@/lib/histologia/resposta'
import { histopatologiaHabilitada } from '@/lib/histopatologia/direitos'
import {
  dadosDaComparacaoPatologica,
  dadosDaDoencaComZoom,
  dadosDaLaminaPatologica,
  dadosDoCatalogoDaPatologiaComZoom,
} from '@/lib/histopatologia-zoom/paginas'

/**
 * Conteúdo das páginas da Histopatologia com Zoom, para os cascos estáticos:
 *
 * - `/zoom` → catálogo de doenças com lâmina;
 * - `/zoom/<doença>` → a doença, suas lâminas e a ficha;
 * - `/zoom/<doença>/<lâmina>` → a lâmina, com os achados;
 * - `/zoom/<doença>/<lâmina>/comparar?normal=<slug>` → lado a lado com o normal.
 *
 * Mesmo portão das demais rotas de conteúdo do módulo: 404 seco a quem não
 * assina, e 404 também com a área fechada neste ambiente, como o layout dela.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request, props: { params: Promise<{ rota?: string[] }> }) {
  if (!histologiaHabilitada() || !histopatologiaHabilitada()) {
    return new NextResponse(null, { status: 404 })
  }
  if (!(await histologiaLiberadaNaRequisicao())) {
    return semAcessoAoAcervo()
  }

  const { rota = [] } = await props.params
  const [doenca, lamina, acao] = rota
  const dados =
    rota.length === 0
      ? dadosDoCatalogoDaPatologiaComZoom()
      : rota.length === 1
        ? dadosDaDoencaComZoom(doenca)
        : rota.length === 2
          ? dadosDaLaminaPatologica(lamina)
          : rota.length === 3 && acao === 'comparar'
            ? dadosDaComparacaoPatologica(lamina, new URL(request.url).searchParams.get('normal'))
            : null
  if (!dados) return semAcessoAoAcervo()
  return respostaDoAcervo(request, dados)
}
