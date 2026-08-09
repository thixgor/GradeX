import { NextResponse } from 'next/server'

import { histologiaHabilitada } from '@/lib/histologia/licenca'

import indiceCliente from '@/data/histologia/busca-cliente.json'

/**
 * Índice enxuto de lâminas, seções e quizzes para busca no navegador.
 *
 * Servido por rota, e não importado num componente de cliente, por uma razão
 * concreta: um `import` estático colocaria 533 KB dentro do bundle de
 * JavaScript, baixado por todo mundo que abre o módulo. Como resposta HTTP, ele
 * só é buscado quando o aluno toca no campo de busca, e o cache imutável da
 * borda o entrega uma vez por dia.
 */

export const runtime = 'nodejs'
export const revalidate = 86400

export async function GET() {
  if (!histologiaHabilitada()) {
    return new NextResponse(null, { status: 404 })
  }

  return NextResponse.json(indiceCliente, {
    headers: {
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
    },
  })
}
