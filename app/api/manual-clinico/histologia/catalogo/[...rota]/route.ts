import { NextResponse } from 'next/server'

import { histologiaLiberadaNaRequisicao } from '@/lib/histologia/acesso'
import { histologiaHabilitada } from '@/lib/histologia/licenca'
import {
  dadosDaAreaNormal,
  dadosDePraticar,
  dadosDoAtlas,
  dadosDoLaboratorio,
  dadosDoModuloDoLaboratorio,
  dadosDoQuiz,
  dadosDoSistemaUnificado,
  dadosDosQuizzes,
  dadosDosSistemas,
} from '@/lib/histologia/paginas-do-catalogo'
import { respostaDoAcervo, semAcessoAoAcervo } from '@/lib/histologia/resposta'

/**
 * Conteúdo das páginas de navegação do catálogo, para os cascos estáticos:
 * `normal`, `praticar`, `sistemas`, `sistemas/<sistema>`, `quizzes`,
 * `quizzes/<slug>` (com `?modo=prova` o gabarito sai daqui já removido),
 * `atlas`, `laboratorio`, `laboratorio/<módulo>` e `caderno` (este só confirma
 * o acesso: o caderno vive no navegador).
 *
 * Mesmo portão das demais rotas de conteúdo do módulo: 404 seco a quem não
 * assina, e o casco leva à home (vitrine).
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request, props: { params: Promise<{ rota: string[] }> }) {
  if (!histologiaHabilitada()) {
    return new NextResponse(null, { status: 404 })
  }
  if (!(await histologiaLiberadaNaRequisicao())) {
    return semAcessoAoAcervo()
  }

  const { rota } = await props.params
  const caminho = rota.join('/')
  const [secao, item] = rota
  const dados =
    caminho === 'normal'
      ? dadosDaAreaNormal()
      : caminho === 'praticar'
        ? dadosDePraticar()
        : caminho === 'sistemas'
          ? dadosDosSistemas()
          : rota.length === 2 && secao === 'sistemas'
            ? dadosDoSistemaUnificado(item)
            : caminho === 'quizzes'
              ? dadosDosQuizzes()
              : rota.length === 2 && secao === 'quizzes'
                ? await dadosDoQuiz(item, new URL(request.url).searchParams.get('modo') === 'prova' ? 'prova' : 'pratica')
                : caminho === 'atlas'
                  ? dadosDoAtlas()
                  : caminho === 'laboratorio'
                    ? dadosDoLaboratorio()
                    : rota.length === 2 && secao === 'laboratorio'
                      ? dadosDoModuloDoLaboratorio(item)
                      : caminho === 'caderno'
                        ? {}
                        : null
  if (!dados) return semAcessoAoAcervo()
  return respostaDoAcervo(request, dados)
}
