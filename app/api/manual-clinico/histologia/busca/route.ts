import { NextResponse } from 'next/server'

import { histologiaLiberadaNaRequisicao } from '@/lib/histologia/acesso'
import { buscar, type FiltrosDeBusca, type TipoDeResultado } from '@/lib/histologia/busca'
import type { EntradaBusca } from '@/lib/histologia/esquemas'
import { histologiaHabilitada } from '@/lib/histologia/licenca'

import indiceCompleto from '@/data/histologia/busca-servidor.json'

/**
 * Busca no índice completo — o que inclui os 7.453 rótulos de estrutura.
 *
 * ## Por que uma rota, e não busca só no cliente
 *
 * O índice completo tem 3,5 MB (370 KB comprimidos). Mandá-lo ao navegador
 * custaria, em rede móvel, mais do que a lâmina que o aluno quer ver. Então o
 * cliente carrega apenas o índice enxuto de lâminas e seções (88 KB
 * comprimidos, resposta instantânea enquanto se digita) e chama esta rota em
 * paralelo para trazer as estruturas.
 *
 * ## Por que há sessão a validar aqui
 *
 * O módulo é privativo de assinantes do Manual Clínico e de contas Plus+. Este
 * índice é o acervo em forma de texto — os 7.453 rótulos de estrutura, todos
 * eles — e seria a maneira mais fácil de contornar o portão da página. Fecha
 * junto, com o mesmo 404 seco da licença desligada.
 */

const INDICE = indiceCompleto as unknown as EntradaBusca[]

const TIPOS_VALIDOS: TipoDeResultado[] = ['lamina', 'secao', 'estrutura', 'quiz']

export const runtime = 'nodejs'
// A resposta depende de quem pergunta, então não pode mais ficar na borda: o
// cache compartilhado serviria a busca de um assinante a um visitante.
export const dynamic = 'force-dynamic'

export async function GET(requisicao: Request) {
  if (!histologiaHabilitada()) {
    return new NextResponse(null, { status: 404 })
  }
  if (!(await histologiaLiberadaNaRequisicao())) {
    return new NextResponse(null, { status: 404 })
  }

  const parametros = new URL(requisicao.url).searchParams
  const termo = (parametros.get('q') ?? '').slice(0, 120)

  if (termo.trim().length < 2) {
    return NextResponse.json({ resultados: [], total: 0 })
  }

  const filtros: FiltrosDeBusca = {}
  const tipos = parametros
    .getAll('tipo')
    .filter((t): t is TipoDeResultado => TIPOS_VALIDOS.includes(t as TipoDeResultado))
  if (tipos.length > 0) filtros.tipos = tipos
  const setor = parametros.get('setor')
  if (setor && /^[a-z0-9-]+$/.test(setor)) filtros.setor = setor

  const limite = Math.min(60, Math.max(1, Number(parametros.get('limite')) || 30))
  const resultados = buscar(INDICE, termo, { limite, filtros })

  return NextResponse.json(
    { resultados, total: resultados.length },
    { headers: { 'Cache-Control': 'private, max-age=300, must-revalidate' } },
  )
}
