import { NextResponse } from 'next/server'

import { histologiaLiberadaNaRequisicao } from '@/lib/histologia/acesso'
import { histologiaHabilitada } from '@/lib/histologia/licenca'
import { respostaDoAcervo, semAcessoAoAcervo } from '@/lib/histologia/resposta'
import {
  dadosDaLaminaDoZoom,
  dadosDoCatalogoDoZoom,
  dadosDoQuizDoZoom,
  dadosDoSistemaDoZoom,
} from '@/lib/histologia-zoom/paginas'

/**
 * Conteúdo das páginas da Histologia com Zoom, para os cascos estáticos delas:
 *
 * - `/zoom` → catálogo (com o índice da busca);
 * - `/zoom/quiz` → contagens do banco do quiz de identificação;
 * - `/zoom/<sistema>` → página do sistema;
 * - `/zoom/<sistema>/<lâmina>` → a lâmina.
 *
 * Mesmo portão das demais rotas de conteúdo do módulo: 404 seco a quem não
 * assina, e o casco leva à home (vitrine).
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request, props: { params: Promise<{ rota?: string[] }> }) {
  if (!histologiaHabilitada()) {
    return new NextResponse(null, { status: 404 })
  }
  if (!(await histologiaLiberadaNaRequisicao())) {
    return semAcessoAoAcervo()
  }

  const { rota = [] } = await props.params
  const dados =
    rota.length === 0
      ? dadosDoCatalogoDoZoom()
      : rota.length === 1 && rota[0] === 'quiz'
        ? dadosDoQuizDoZoom()
        : rota.length === 1
          ? dadosDoSistemaDoZoom(rota[0])
          : rota.length === 2
            ? dadosDaLaminaDoZoom(rota[1])
            : null
  if (!dados) return semAcessoAoAcervo()
  return respostaDoAcervo(request, dados)
}
