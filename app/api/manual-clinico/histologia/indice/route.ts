import { NextResponse } from 'next/server'

import { histologiaLiberadaNaRequisicao } from '@/lib/histologia/acesso'
import { histologiaHabilitada } from '@/lib/histologia/licenca'

import indiceCliente from '@/data/histologia/busca-cliente.json'

/**
 * Índice enxuto de lâminas, seções e quizzes para busca no navegador.
 *
 * Servido por rota, e não importado num componente de cliente, por uma razão
 * concreta: um `import` estático colocaria 533 KB dentro do bundle de
 * JavaScript, baixado por todo mundo que abre o módulo. Como resposta HTTP, ele
 * só é buscado quando o aluno toca no campo de busca.
 *
 * O módulo é privativo de assinantes, então esta rota valida sessão e devolve
 * 404 — o mesmo que a licença desligada devolve — para quem não assina. Sem
 * isso, o índice inteiro do acervo seria um `curl` de distância.
 *
 * A resposta deixou de ser cacheável na borda pelo mesmo motivo: ela agora
 * depende de quem pergunta. `private` mantém o ganho no navegador do assinante
 * sem que um cache compartilhado sirva o índice a quem não tem acesso.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  if (!histologiaHabilitada()) {
    return new NextResponse(null, { status: 404 })
  }
  if (!(await histologiaLiberadaNaRequisicao())) {
    return new NextResponse(null, { status: 404 })
  }

  return NextResponse.json(indiceCliente, {
    headers: {
      'Cache-Control': 'private, max-age=3600, must-revalidate',
    },
  })
}
