import { NextRequest } from 'next/server'
import { audit } from '@/lib/payments/audit'
import { idDe, obterColecoes } from '@/lib/monitorias/db'
import { rotaAutenticada, ok } from '@/lib/monitorias/rota'
import { criarSalaDeTeste } from '@/lib/monitorias/reservas'

export const dynamic = 'force-dynamic'

/** GET — salas de teste ainda abertas (para copiar o link de novo). */
export async function GET(request: NextRequest) {
  return rotaAutenticada(request, { admin: true, limite: 'ADMIN' }, async () => {
    const c = await obterColecoes()
    const agora = new Date()
    const salas = await c.reservas
      .find({ teste: true, fim: { $gt: new Date(agora.getTime() - 30 * 60_000) } } as any, { projection: { codigoTeste: 1, inicio: 1, fim: 1, tutorUserId: 1 } })
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray()
    const ids = salas.map((s) => idDe(s))
    const alunos = await c.participacoes.find({ reservaId: { $in: ids } }, { projection: { reservaId: 1, alunoNome: 1 } }).toArray()
    return ok({
      salas: salas.map((s) => ({
        id: idDe(s),
        codigo: s.codigoTeste,
        inicio: s.inicio,
        fim: s.fim,
        alunos: alunos.filter((a) => a.reservaId === idDe(s)).map((a) => a.alunoNome),
      })),
    })
  })
}

/** POST — cria uma sala de teste (o admin é o monitor) e devolve o convite. */
export async function POST(request: NextRequest) {
  return rotaAutenticada(request, { admin: true, limite: 'ADMIN' }, async ({ sessao, ip }) => {
    const reserva = await criarSalaDeTeste({ userId: sessao.userId, nome: sessao.name || 'Admin' })
    await audit({ action: 'monitoria_sala_teste', actorUserId: sessao.userId, resourceType: 'monitoria_reserva', resourceId: idDe(reserva), ip })
    return ok({ id: idDe(reserva), codigo: reserva.codigoTeste, inicio: reserva.inicio, fim: reserva.fim }, 201)
  })
}
