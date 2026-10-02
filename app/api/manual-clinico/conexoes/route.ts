import { NextRequest, NextResponse } from 'next/server'

import { autorizarEstudo } from '@/lib/manual-clinico/integracao/acesso'
import { obterIndice } from '@/lib/manual-clinico/integracao/indice'
import { refValida } from '@/lib/manual-clinico/integracao/estudos'
import {
  origemDaConsulta,
  origemDoItem,
  relacionar,
  type Origem,
} from '@/lib/manual-clinico/integracao/relacionar'
import type { RespostaConexoes } from '@/lib/manual-clinico/integracao/tipos'
import { nomeDoOrgao, pluralDaNatureza } from '@/lib/manual-clinico/integracao/vocabulario'
import { jsonComprimido } from '@/lib/resposta-comprimida'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Conexões do Estudo Integrado: o que os outros manuais têm sobre um assunto.
 *
 * Três formas de perguntar:
 * - `?ref=tc:carcinoma-de-celulas-renais` — o painel ao pé de uma ficha;
 * - `?refs=a,b,c` — "para completar seu estudo": o que falta perto do que já
 *   está nele (as próprias refs não voltam);
 * - `?q=neoplasia renal` — um tema digitado.
 *
 * `completo=1` devolve a trilha inteira (mais itens por manual), para a página
 * do Estudo Integrado; sem ele, o recorte curto do painel.
 *
 * A resposta é a mesma para todo assinante, mas a rota é privativa: os títulos
 * e caminhos não são segredo, o portão é o mesmo do resto do Manual. Fica em
 * cache privado por cinco minutos — o painel de uma ficha revisitada não
 * chama a função de novo.
 */

const MAX_REFS = 80

export async function GET(request: NextRequest) {
  const autorizado = await autorizarEstudo()
  if ('erro' in autorizado) return autorizado.erro

  const params = request.nextUrl.searchParams
  const completo = params.get('completo') === '1'
  const ref = params.get('ref')
  const refs = (params.get('refs') || '')
    .split(',')
    .map((r) => r.trim())
    .filter(refValida)
    .slice(0, MAX_REFS)
  const q = (params.get('q') || '').trim().slice(0, 120)

  try {
    const indice = await obterIndice()
    let origens: Origem[] = []
    let origemResposta: RespostaConexoes['origem'] = null

    if (ref && refValida(ref)) {
      const item = indice.porRef.get(ref)
      if (!item) return NextResponse.json({ error: 'Item não encontrado' }, { status: 404 })
      origens = [origemDoItem(item)]
      origemResposta = {
        ref: item.ref,
        titulo: item.titulo,
        href: item.href,
        modulo: item.modulo,
        tipo: item.tipo,
        orgaos: item.orgaos,
        naturezas: item.naturezas,
      }
    } else if (refs.length > 0) {
      origens = refs.map((r) => indice.porRef.get(r)).filter(Boolean).map((i) => origemDoItem(i!))
      origemResposta = { titulo: 'Seu estudo', orgaos: [], naturezas: [] }
    } else if (q.length >= 2) {
      const origem = origemDaConsulta(q)
      origens = [origem]
      origemResposta = { titulo: origem.titulo, orgaos: origem.orgaos, naturezas: origem.naturezas }
    } else {
      return NextResponse.json({ error: 'Informe um item ou um tema' }, { status: 400 })
    }

    // Três recortes: a trilha completa, o painel da ficha e as sugestões de um
    // estudo (só a dúzia que a tela mostra).
    const recorte = completo ? { porModulo: 12, total: 90 } : refs.length > 0 ? { porModulo: 3, total: 12 } : { porModulo: 4, total: 24 }
    const { grupos, total } = relacionar(indice, origens, { ...recorte, excluir: new Set(refs) })

    // O painel e as sugestões não mostram o subtítulo: não há por que
    // transferi-lo. A trilha completa mostra.
    if (!completo) for (const g of grupos) for (const c of g.itens) delete c.subtitulo

    if (origemResposta) {
      origemResposta.leitura = [
        ...origemResposta.orgaos.slice(0, 2).map(nomeDoOrgao),
        ...origemResposta.naturezas.slice(0, 2).map(pluralDaNatureza),
      ]
    }

    const resposta: RespostaConexoes = { origem: origemResposta, grupos, total }
    // O conteúdo muda só quando o acervo muda (deploy ou ficha nova): o
    // navegador reaproveita por 15 minutos e, passado isso, mostra o que tem
    // enquanto confirma por trás.
    return jsonComprimido(request, resposta, {
      headers: { 'Cache-Control': 'private, max-age=900, stale-while-revalidate=86400' },
    })
  } catch (erro) {
    console.error('Erro ao montar conexões do Manual:', erro)
    return NextResponse.json({ error: 'Erro ao montar conexões' }, { status: 500 })
  }
}
