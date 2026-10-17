import { NextRequest } from 'next/server'
import { audit } from '@/lib/payments/audit'
import { z } from 'zod'
import { erro, idDe, lerJson, obterColecoes } from '@/lib/monitorias/db'
import { rotaAutenticada, ok } from '@/lib/monitorias/rota'
import { criarSalaDeTeste, excluirSalasDeTeste } from '@/lib/monitorias/reservas'

export const dynamic = 'force-dynamic'

/** GET — as últimas salas de teste (abertas para copiar o link; encerradas para excluir). */
export async function GET(request: NextRequest) {
  return rotaAutenticada(request, { admin: true, limite: 'ADMIN' }, async () => {
    const c = await obterColecoes()
    const agora = new Date()
    const salas = await c.reservas
      .find({ teste: true } as any, { projection: { codigoTeste: 1, inicio: 1, fim: 1, tutorUserId: 1 } })
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
        aberta: !!s.fim && s.fim.getTime() + 30 * 60_000 > agora.getTime(),
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

/** DELETE {id} — apaga a sala de teste (e tira quem estiver nela). Aula de verdade nunca. */
export async function DELETE(request: NextRequest) {
  return rotaAutenticada(request, { admin: true, limite: 'ADMIN' }, async ({ sessao, ip }) => {
    const corpo = z.object({ id: z.string().regex(/^[a-f0-9]{24}$/i) }).strict().safeParse(await lerJson(request))
    if (!corpo.success) return erro(400, 'Sala inválida.')
    const apagadas = await excluirSalasDeTeste([corpo.data.id])
    if (!apagadas) return erro(404, 'Sala de teste não encontrada.')
    await audit({ action: 'monitoria_sala_teste_excluida', actorUserId: sessao.userId, resourceType: 'monitoria_reserva', resourceId: corpo.data.id, ip })
    return ok({ ok: true })
  })
}
