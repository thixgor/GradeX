import 'server-only'

import { getDb } from '@/lib/mongodb'
import { colecoes } from '../db'

/**
 * Quem perdeu o direito de estar na aula (assento reembolsado ou cancelado,
 * reserva cancelada) sai da sala JÁ, sem esperar a renovação do token (~10 min):
 * a conexão gravada some, o próximo sinal dele recebe 403 e os outros o veem
 * sair no próximo pulso — e fecham a conexão direta com ele.
 *
 * `userIds` ausente = todos. Não entra em `removidos`: pode voltar se o acesso
 * voltar (ex.: reembolso que falhou). Nunca lança: é um efeito colateral de
 * fluxos de dinheiro que não podem falhar por causa da sala.
 */
export async function tirarDaSala(reservaId: string, userIds?: string[], agora = new Date()): Promise<number> {
  try {
    const c = colecoes(await getDb())
    const sala = await c.salas.findOne({ _id: reservaId }, { projection: { participantes: 1 } })
    if (!sala) return 0
    const alvos = Object.entries(sala.participantes || {}).filter(([, p]) => p.conexao && (!userIds || userIds.includes(p.uid)))
    if (!alvos.length) return 0
    const $set: Record<string, unknown> = { updatedAt: agora }
    for (const [pid] of alvos) Object.assign($set, { [`participantes.${pid}.conexao`]: null, [`participantes.${pid}.saiuEm`]: agora })
    await c.salas.updateOne({ _id: reservaId }, { $set, $inc: { versao: 1 } } as any)
    return alvos.length
  } catch (err) {
    console.error('[monitorias/sala] não deu para tirar da sala', reservaId, err)
    return 0
  }
}
