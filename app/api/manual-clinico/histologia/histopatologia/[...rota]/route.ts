import { NextResponse } from 'next/server'

import { histologiaLiberadaNaRequisicao } from '@/lib/histologia/acesso'
import { histologiaHabilitada } from '@/lib/histologia/licenca'
import { respostaDoAcervo, semAcessoAoAcervo } from '@/lib/histologia/resposta'
import { histopatologiaHabilitada } from '@/lib/histopatologia/direitos'
import {
  dadosDaComparacaoComNormal,
  dadosDaEntradaDoAtlas,
  dadosDoAtlasDaPatologia,
  dadosDoCapituloWebPath,
  dadosDoMecanismo,
  dadosDoSistemaDaPatologia,
  dadosDosCreditos,
  dadosDosMecanismos,
} from '@/lib/histopatologia/paginas'

/**
 * Conteúdo das demais páginas da Histopatologia, para os cascos estáticos:
 *
 * - `atlas` e `atlas/<entrada>` (`?pagina=&modalidade=&coloracao=`);
 * - `atlas/webpath-utah/<capítulo>` (`?q=&modalidade=&pagina=&ref=`);
 * - `comparar/<doença>/<caminho normal…>`;
 * - `creditos`, `mecanismos`, `mecanismos/<id>`;
 * - `sistemas/<sistema>` (`?pagina=&capitulo=`).
 *
 * A home, o capítulo de doença e a área com zoom têm rotas próprias (as pastas
 * irmãs desta). Mesmo portão das demais rotas de conteúdo do módulo: 404 seco a
 * quem não assina, e 404 também com a área fechada neste ambiente.
 *
 * A entrada do atlas lê fragmentos `.json.gz` do disco: o rastreio deles está
 * declarado para esta rota em `outputFileTracingIncludes` (`next.config.js`).
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request, props: { params: Promise<{ rota: string[] }> }) {
  if (!histologiaHabilitada() || !histopatologiaHabilitada()) {
    return new NextResponse(null, { status: 404 })
  }
  if (!(await histologiaLiberadaNaRequisicao())) {
    return semAcessoAoAcervo()
  }

  const { rota } = await props.params
  const busca = new URL(request.url).searchParams
  const [secao, item, subitem] = rota

  const dados =
    secao === 'atlas' && rota.length === 1
      ? dadosDoAtlasDaPatologia()
      : secao === 'atlas' && rota.length === 3 && item === 'webpath-utah'
        ? await dadosDoCapituloWebPath(subitem, {
            q: busca.get('q'),
            modalidade: busca.get('modalidade'),
            pagina: busca.get('pagina'),
            ref: busca.get('ref'),
          })
        : secao === 'atlas' && rota.length === 2
          ? await dadosDaEntradaDoAtlas(decodificar(item).slice(0, 200), {
              pagina: busca.get('pagina'),
              modalidade: busca.get('modalidade'),
              coloracao: busca.get('coloracao'),
            })
          : secao === 'comparar' && rota.length >= 3
            ? await dadosDaComparacaoComNormal(rota.slice(1))
            : secao === 'creditos' && rota.length === 1
              ? dadosDosCreditos()
              : secao === 'mecanismos' && rota.length === 1
                ? dadosDosMecanismos()
                : secao === 'mecanismos' && rota.length === 2
                  ? dadosDoMecanismo(item)
                  : secao === 'sistemas' && rota.length === 2
                    ? await dadosDoSistemaDaPatologia(item, { pagina: busca.get('pagina'), capitulo: busca.get('capitulo') })
                    : null
  if (!dados) return semAcessoAoAcervo()
  return respostaDoAcervo(request, dados)
}

/** O id da entrada vem como a página o recebia (`decodeURIComponent`), sem quebrar num `%` solto. */
function decodificar(valor: string): string {
  try {
    return decodeURIComponent(valor)
  } catch {
    return valor
  }
}
