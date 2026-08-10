import { NextResponse } from 'next/server'

import { histopatologiaHabilitada } from '@/lib/histopatologia/direitos'

import indiceCliente from '@/data/histopatologia/busca-cliente.json'

/**
 * Índice enxuto de doenças, sistemas e mecanismos para busca no navegador.
 *
 * Servido por rota, e não importado num componente de cliente, pela mesma razão
 * do módulo de Histologia normal: um `import` estático colocaria o índice dentro
 * do bundle de JavaScript de todo mundo que abre o módulo. Como resposta HTTP,
 * ele só é buscado quando o aluno toca no campo de busca.
 *
 * Este índice **não contém URL de mídia** — é o contrato verificado por
 * `__tests__/histopatologia/direitos.test.ts`. Baixá-lo inteiro não é um caminho
 * lateral para contornar o portão de direitos.
 */

export const runtime = 'nodejs'
export const revalidate = 86400

export async function GET() {
  if (!histopatologiaHabilitada()) {
    return new NextResponse(null, { status: 404 })
  }

  return NextResponse.json(indiceCliente, {
    headers: {
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
    },
  })
}
