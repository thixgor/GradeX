import { NextRequest } from 'next/server'
import { rotaAutenticada, ok } from '@/lib/monitorias/rota'
import { entrarNaSalaDeTeste } from '@/lib/monitorias/reservas'
import { configDaSala } from '@/lib/monitorias/sala/config'

export const dynamic = 'force-dynamic'

/** POST — quem tem o convite da sala de teste ganha um assento (grátis) e entra. */
export async function POST(request: NextRequest, { params }: { params: { codigo: string } }) {
  return rotaAutenticada(request, { limite: 'WRITE' }, async ({ sessao }) => {
    const codigo = String(params.codigo || '').slice(0, 40)
    const config = await configDaSala()
    const reservaId = await entrarNaSalaDeTeste(codigo, { userId: sessao.userId, nome: sessao.name || 'Convidado' }, Math.max(1, config.limiteMalha - 1))
    return ok({ reservaId })
  })
}
