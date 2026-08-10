import { NextResponse } from 'next/server'

import { inventarioDaEntrada } from '@/lib/histopatologia/acervo'
import { histopatologiaHabilitada } from '@/lib/histopatologia/direitos'
import { obterEntradaCatalogada } from '@/lib/histopatologia/repositorio'

/**
 * Inventário paginado de mídias de uma entrada catalogada.
 *
 * ## Por que existe
 *
 * As 2.892 entradas ainda sem curadoria editorial não têm fragmento derivado com
 * URLs — duplicar 202 mil referências em `data/` seria acrescentar dezenas de
 * megabytes de conteúdo que já existe, comprimido, em `public/patologia`. Esta
 * rota lê o fragmento certo do catálogo, sob demanda, e devolve **uma página** de
 * até 48 itens já passados pelo portão de direitos.
 *
 * ## O que ela não faz
 *
 * Não busca imagem alguma. Devolve metadados e — só quando os direitos
 * autorizam — a URL remota, que o navegador do aluno usa diretamente. O servidor
 * do Domine Aqui nunca vê um byte de imagem.
 *
 * O `id` vem da URL e é entrada não confiável: ele é resolvido contra o índice
 * catalogado antes de qualquer leitura de arquivo, e o nome do fragmento usado
 * vem do índice, nunca do parâmetro.
 */

export const runtime = 'nodejs'
export const revalidate = 86400

const POR_PAGINA_MAXIMO = 48

export async function GET(requisicao: Request, { params }: { params: { id: string } }) {
  if (!histopatologiaHabilitada()) {
    return new NextResponse(null, { status: 404 })
  }

  const id = decodeURIComponent(params.id).slice(0, 200)

  // A entrada é resolvida contra os derivados conciliados no build. É de lá que
  // vem o nome do fragmento a ser lido — nunca do parâmetro da URL.
  const entrada = await obterEntradaCatalogada(id)
  if (!entrada) {
    return NextResponse.json({ erro: 'Entrada catalogada inexistente.' }, { status: 404 })
  }

  const parametros = new URL(requisicao.url).searchParams
  const pagina = Math.max(1, Number(parametros.get('pagina')) || 1)
  const porPagina = Math.min(POR_PAGINA_MAXIMO, Math.max(1, Number(parametros.get('porPagina')) || 24))
  const modalidade = parametros.get('modalidade') ?? undefined
  const coloracao = parametros.get('coloracao') ?? undefined

  const resultado = await inventarioDaEntrada(entrada, {
    pagina,
    porPagina,
    modalidade: modalidade ?? undefined,
    coloracao: coloracao ?? undefined,
    apenasLaminaVirtual: parametros.get('wsi') === '1',
  })

  return NextResponse.json(
    { ...resultado, pagina, porPagina },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
      },
    },
  )
}
