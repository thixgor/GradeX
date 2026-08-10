import { NextResponse } from 'next/server'

import {
  buscar,
  type FiltrosDeBusca,
  type TipoDeResultado,
} from '@/lib/histopatologia/busca'
import type { EntradaBusca, EstadoDeRevisao } from '@/lib/histopatologia/esquemas'
import { histopatologiaHabilitada } from '@/lib/histopatologia/direitos'

import indiceCompleto from '@/data/histopatologia/busca-servidor.json'

/**
 * Busca no índice completo — o que inclui as 2.917 entradas catalogadas.
 *
 * ## Por que uma rota, e não busca só no cliente
 *
 * O índice completo tem 915 KB. Mandá-lo ao navegador custaria mais do que a
 * página inteira que o aluno quer ler. Então o cliente carrega o índice enxuto
 * (7 KB, resposta instantânea enquanto se digita) e chama esta rota em paralelo
 * para trazer o inventário.
 *
 * O módulo é gratuito e sem login, então não há sessão a validar — só a flag do
 * módulo, que fecha esta rota junto com o resto.
 */

const INDICE = indiceCompleto as unknown as EntradaBusca[]

const TIPOS_VALIDOS: TipoDeResultado[] = ['doenca', 'entrada', 'sistema', 'mecanismo']
const ESTADOS_VALIDOS: EstadoDeRevisao[] = [
  'rascunho',
  'revisao-medica',
  'publicado',
  'desatualizado',
]

export const runtime = 'nodejs'
export const revalidate = 86400

export async function GET(requisicao: Request) {
  if (!histopatologiaHabilitada()) {
    return new NextResponse(null, { status: 404 })
  }

  const parametros = new URL(requisicao.url).searchParams
  // Corte de comprimento antes de qualquer processamento: o termo vem da URL e
  // é entrada não confiável. 120 caracteres cobrem qualquer consulta real.
  const termo = (parametros.get('q') ?? '').slice(0, 120)

  if (termo.trim().length < 2) {
    return NextResponse.json([])
  }

  const filtros: FiltrosDeBusca = {}
  const tipos = parametros
    .getAll('tipo')
    .filter((t): t is TipoDeResultado => TIPOS_VALIDOS.includes(t as TipoDeResultado))
  if (tipos.length > 0) filtros.tipos = tipos
  const estados = parametros
    .getAll('estado')
    .filter((e): e is EstadoDeRevisao => ESTADOS_VALIDOS.includes(e as EstadoDeRevisao))
  if (estados.length > 0) filtros.estados = estados

  const limite = Math.min(60, Math.max(1, Number(parametros.get('limite')) || 30))

  return NextResponse.json(buscar(INDICE, termo, { limite, filtros }), {
    headers: {
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
    },
  })
}
