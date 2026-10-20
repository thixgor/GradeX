import { NextRequest } from 'next/server'
import { rotaAutenticada, ok } from '@/lib/monitorias/rota'
import { encerrarDemanda } from '@/lib/monitorias/demandas'

export const dynamic = 'force-dynamic'

/** POST — o aluno tira o pedido do mural (as conversas abertas continuam). */
export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  return rotaAutenticada(request, { limite: 'WRITE' }, async ({ sessao }) => {
    await encerrarDemanda(sessao.userId, params.id)
    return ok({ encerrada: true })
  })
}
