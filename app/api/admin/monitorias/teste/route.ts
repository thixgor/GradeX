import { NextRequest } from 'next/server'
import { audit } from '@/lib/payments/audit'
import { z } from 'zod'
import { erro, idDe, lerJson, obterColecoes } from '@/lib/monitorias/db'
import { rotaAutenticada, ok } from '@/lib/monitorias/rota'
import { criarSalaDeTeste, excluirSalasDeTeste } from '@/lib/monitorias/reservas'
import { criarResumoDeTeste, encerrarTesteEGerarResumo, resumoDosTrechos } from '@/lib/monitorias/resumo/tarefa'
import { dispararProcessador } from '@/lib/monitorias/resumo/disparo'

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
    const [alunos, resumos, trechos] = await Promise.all([
      c.participacoes.find({ reservaId: { $in: ids } }, { projection: { reservaId: 1, alunoNome: 1 } }).toArray(),
      c.resumos.find({ _id: { $in: ids } }, { projection: { status: 1, erro: 1, trechosNoFim: 1 } }).toArray(),
      resumoDosTrechos(ids),
    ])
    return ok({
      salas: salas.map((s) => {
        const resumo = resumos.find((r) => r._id === idDe(s))
        return {
          id: idDe(s),
          codigo: s.codigoTeste,
          inicio: s.inicio,
          fim: s.fim,
          aberta: !!s.fim && s.fim.getTime() + 30 * 60_000 > agora.getTime(),
          alunos: alunos.filter((a) => a.reservaId === idDe(s)).map((a) => a.alunoNome),
          resumoIA: resumo?.status || null,
          // Por que o resumo de teste não saiu (ex.: "Não houve áudio da aula para transcrever").
          resumoMotivo: resumo && ['cancelado', 'falhou'].includes(resumo.status) ? resumo.erro || null : null,
          trechos: resumo ? trechos[idDe(s)] || resumo.trechosNoFim || null : null,
        }
      }),
    })
  })
}

/**
 * POST {resumoIA?} — cria uma sala de teste (o admin é o monitor) e devolve o
 * convite. Com `resumoIA`, a aula tem Resumo por IA SEM COBRANÇA (a voz do
 * monitor é transcrita, como numa aula em grupo) para testar o fluxo inteiro.
 */
export async function POST(request: NextRequest) {
  return rotaAutenticada(request, { admin: true, limite: 'ADMIN' }, async ({ sessao, ip }) => {
    const corpo = z.object({ resumoIA: z.boolean().optional() }).strict().safeParse((await lerJson(request).catch(() => ({}))) ?? {})
    if (!corpo.success) return erro(400, 'Pedido inválido.')
    const reserva = await criarSalaDeTeste({ userId: sessao.userId, nome: sessao.name || 'Admin' })
    if (corpo.data.resumoIA) await criarResumoDeTeste(reserva, sessao.userId)
    await audit({ action: 'monitoria_sala_teste', actorUserId: sessao.userId, resourceType: 'monitoria_reserva', resourceId: idDe(reserva), metadata: { resumoIA: !!corpo.data.resumoIA }, ip })
    return ok({ id: idDe(reserva), codigo: reserva.codigoTeste, inicio: reserva.inicio, fim: reserva.fim }, 201)
  })
}

/**
 * PATCH {id, acao: 'gerar_resumo'} — "Gerar resumo agora": encerra a sala de
 * teste e dispara o processador com o que já foi gravado (o admin testa
 * sozinho, sem esperar os 90 min nem cobrir 30% deles). Aula de verdade nunca.
 */
export async function PATCH(request: NextRequest) {
  return rotaAutenticada(request, { admin: true, limite: 'ADMIN' }, async ({ sessao, ip }) => {
    const corpo = z.object({ id: z.string().regex(/^[a-f0-9]{24}$/i), acao: z.literal('gerar_resumo') }).strict().safeParse(await lerJson(request))
    if (!corpo.success) return erro(400, 'Pedido inválido.')
    const feito = await encerrarTesteEGerarResumo(corpo.data.id)
    dispararProcessador(new URL(request.url).origin)
    await audit({ action: 'monitoria_resumo_suporte', actorUserId: sessao.userId, resourceType: 'monitoria_resumo', resourceId: corpo.data.id, metadata: { acao: 'gerar_teste', trechos: feito.trechos }, ip })
    return ok({ ok: true, trechos: feito.trechos })
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
