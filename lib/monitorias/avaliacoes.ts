import 'server-only'

/**
 * Avaliação do monitor pelo aluno — só quem teve a aula (assento pago/grátis
 * numa reserva realizada ou concluída), uma vez por assento. As médias do
 * monitor e do anúncio são RECALCULADAS por agregação (não incrementadas), então
 * nunca derivam por corrida entre duas avaliações simultâneas.
 */

import { ObjectId } from 'mongodb'
import { getDb } from '@/lib/mongodb'
import { colecoes, idDe } from './db'
import { ErroMonitoria } from './reservas'
import { mascararContato } from './contato'
import type { Reserva } from './tipos'
import { avatarPorId } from './avatares'

export async function avaliar(input: { reserva: Reserva; alunoId: string; nota: number; comentario: string }): Promise<void> {
  const { reserva } = input
  if (!['realizada', 'concluida'].includes(reserva.status)) throw new ErroMonitoria(409, 'Você poderá avaliar depois que a aula acontecer.')
  if (!Number.isInteger(input.nota) || input.nota < 1 || input.nota > 5) throw new ErroMonitoria(400, 'Nota de 1 a 5.')
  const c = colecoes(await getDb())
  const res = await c.participacoes.updateOne(
    { reservaId: idDe(reserva), alunoId: input.alunoId, status: { $in: ['paga', 'gratis', 'concluida'] }, avaliacao: { $exists: false } } as any,
    { $set: { avaliacao: { nota: input.nota, comentario: mascararContato(input.comentario).texto, em: new Date(), anuncioId: reserva.anuncioId }, updatedAt: new Date() } },
  )
  if (res.matchedCount === 0) throw new ErroMonitoria(409, 'Você já avaliou esta monitoria (ou não participou dela).')

  const media = async (filtro: Record<string, unknown>) => {
    const [r] = await c.participacoes
      .aggregate<{ nota: number; n: number }>([{ $match: { ...filtro, 'avaliacao.nota': { $exists: true } } }, { $group: { _id: null, nota: { $avg: '$avaliacao.nota' }, n: { $sum: 1 } } }])
      .toArray()
    return { nota: Math.round((r?.nota || 0) * 10) / 10, n: r?.n || 0 }
  }
  const [doTutor, doAnuncio] = await Promise.all([media({ tutorId: reserva.tutorId }), media({ 'avaliacao.anuncioId': reserva.anuncioId })])
  await Promise.all([
    c.tutores.updateOne({ _id: new ObjectId(reserva.tutorId) } as any, { $set: { 'stats.nota': doTutor.nota, 'stats.avaliacoes': doTutor.n } }),
    c.anuncios.updateOne({ _id: new ObjectId(reserva.anuncioId) } as any, { $set: { 'stats.nota': doAnuncio.nota, 'stats.avaliacoes': doAnuncio.n } }),
  ])
}

export async function avaliacoesDoAnuncio(anuncioId: string, limite = 10) {
  const c = colecoes(await getDb())
  const itens = await c.participacoes
    .find({ 'avaliacao.anuncioId': anuncioId } as any, { projection: { alunoId: 1, alunoNome: 1, avaliacao: 1 } })
    .sort({ 'avaliacao.em': -1 })
    .limit(limite)
    .toArray()
  // Retrato atual de quem avaliou: só o id do catálogo sai do banco; a URL vem
  // do catálogo (nunca do usuário) e o id da pessoa não vai para a página.
  const ids = Array.from(new Set(itens.map((p) => p.alunoId))).filter((id) => ObjectId.isValid(id))
  const donos = ids.length
    ? await c.users.find({ _id: { $in: ids.map((id) => new ObjectId(id)) } } as any, { projection: { avatar: 1 } }).toArray()
    : []
  const fotos = new Map(donos.map((u: any) => [String(u._id), avatarPorId(u.avatar)?.url || null]))
  return itens.map((p) => ({
    nome: p.alunoNome.split(' ')[0],
    foto: fotos.get(p.alunoId) || null,
    nota: p.avaliacao!.nota,
    comentario: p.avaliacao!.comentario,
    em: p.avaliacao!.em,
  }))
}
