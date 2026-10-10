import 'server-only'

/**
 * Pedidos de monitoria: o aluno publica o que precisa, os monitores respondem.
 * Responder abre uma reserva de NEGOCIAÇÃO comum (com a cópia do pedido), e
 * dali em diante vale todo o fluxo já blindado: chat, proposta, contrato, PIX,
 * garantia e reembolso. O pedido em si nunca mexe com dinheiro.
 */

import { ObjectId } from 'mongodb'
import { obterColecoes, idDe, type Colecoes } from './db'
import { avisar } from './avisos'
import { ErroMonitoria, mesmaPessoa, urlReserva } from './reservas'
import { carregarUsuario, type UsuarioMonitoria } from './servidor'
import {
  anuncioAtendeDemanda,
  chaveDaMateria,
  expiracaoDaDemanda,
  materiaApresentavel,
  MAX_DEMANDAS_ABERTAS,
  MAX_RESPOSTAS_POR_DEMANDA,
  QUANDO_DEMANDA,
  resumoDaDemanda,
  type EntradaDemanda,
  type ResumoDemanda,
} from './demandas-regras'
import type { Demanda, Reserva } from './tipos'

/** Matéria igual sem ligar para acento e maiúscula ("fisiologia" = "Fisiologia"). */
const MESMA_MATERIA = { locale: 'pt', strength: 1 } as const

/** Monitores avisados por pedido novo (o sino é de graça; e-mail tem teto diário). */
const MAX_MONITORES_AVISADOS = 40
const INTERVALO_EMAIL_MS = 20 * 3_600_000

export function abertaAgora(agora = new Date()) {
  return { status: 'aberta', expiraEm: { $gt: agora } } as const
}

export function resumoDe(d: Pick<Demanda, keyof ResumoDemanda>): ResumoDemanda {
  return {
    materia: d.materia,
    assunto: d.assunto || undefined,
    pessoas: d.pessoas,
    valorPorPessoaCentavos: d.valorPorPessoaCentavos,
    duracaoMin: d.duracaoMin,
    quando: d.quando,
    periodos: d.periodos,
  }
}

export async function criarDemanda(aluno: UsuarioMonitoria, entrada: EntradaDemanda): Promise<{ demanda: Demanda; avisados: number }> {
  const c = await obterColecoes()
  const agora = new Date()
  const alunoId = String(aluno._id)
  const materia = materiaApresentavel(entrada.materia)
  const materiaChave = chaveDaMateria(materia)
  const [abertas, repetida] = await Promise.all([
    c.demandas.countDocuments({ alunoId, ...abertaAgora(agora) }),
    c.demandas.findOne({ alunoId, materiaChave, ...abertaAgora(agora) }, { projection: { _id: 1 } }),
  ])
  if (repetida) throw new ErroMonitoria(409, `Você já tem um pedido aberto de ${materia}. Encerre aquele para publicar outro.`)
  if (abertas >= MAX_DEMANDAS_ABERTAS) throw new ErroMonitoria(429, `Você pode ter até ${MAX_DEMANDAS_ABERTAS} pedidos abertos. Encerre algum antes.`)

  const demanda: Demanda = {
    alunoId,
    alunoPrimeiroNome: (aluno.name || 'Aluno').trim().split(/\s+/)[0].slice(0, 30),
    materia,
    materiaChave,
    assunto: entrada.assunto || undefined,
    pessoas: entrada.pessoas,
    valorPorPessoaCentavos: entrada.valorPorPessoaCentavos,
    duracaoMin: entrada.duracaoMin,
    quando: entrada.quando,
    periodos: Array.from(new Set(entrada.periodos)),
    status: 'aberta',
    respostas: 0,
    expiraEm: expiracaoDaDemanda(entrada.quando, agora),
    createdAt: agora,
    updatedAt: agora,
  }
  const res = await c.demandas.insertOne(demanda as any)
  demanda._id = res.insertedId
  const avisados = await avisarMonitoresDaMateria(c, demanda)
  return { demanda, avisados }
}

/**
 * Avisa quem tem anúncio publicado da matéria: sino para todos, e-mail no
 * máximo um por dia por monitor (vários pedidos seguidos não viram spam).
 */
async function avisarMonitoresDaMateria(c: Colecoes, demanda: Demanda): Promise<number> {
  const userIds = (
    (await c.anuncios.distinct('userId', { status: 'publicado', materia: demanda.materia }, { collation: MESMA_MATERIA })) as string[]
  )
    .filter((id) => id !== demanda.alunoId && ObjectId.isValid(id))
    .slice(0, MAX_MONITORES_AVISADOS)
  if (!userIds.length) return 0
  const agora = new Date()
  // Reserva o e-mail do dia de forma atômica, monitor a monitor.
  const comEmail = new Set<string>()
  await Promise.all(
    userIds.map(async (userId) => {
      const r = await c.tutores.updateOne(
        { userId, status: 'ativo', $or: [{ ultimoAvisoDemandaEm: { $exists: false } }, { ultimoAvisoDemandaEm: { $lt: new Date(agora.getTime() - INTERVALO_EMAIL_MS) } }] } as any,
        { $set: { ultimoAvisoDemandaEm: agora } },
      )
      if (r.modifiedCount) comEmail.add(userId)
    }),
  )
  const resumo = resumoDaDemanda(resumoDe(demanda))
  await avisar(
    userIds.map((userId) => ({
      userId,
      titulo: `Aluno procurando monitor de ${demanda.materia}`,
      mensagem: resumo,
      url: '/monitorias/painel/oportunidades',
      email: comEmail.has(userId)
        ? {
            assunto: `${demanda.alunoPrimeiroNome} procura monitor de ${demanda.materia}`,
            paragrafos: [
              `Um aluno publicou um pedido de monitoria de ${demanda.materia}, a matéria do seu anúncio.`,
              'Responda primeiro: o aluno escolhe entre os monitores que aparecerem.',
            ],
            linhas: [
              ['Pedido', resumo],
              ['Quando', QUANDO_DEMANDA[demanda.quando]],
            ],
            botao: 'Ver o pedido',
          }
        : undefined,
    })),
  )
  return userIds.length
}

export async function responderDemanda(input: {
  demandaId: string
  anuncioId: string
  monitor: UsuarioMonitoria
  mensagem: string
}): Promise<Reserva> {
  if (!ObjectId.isValid(input.demandaId) || !ObjectId.isValid(input.anuncioId)) throw new ErroMonitoria(404, 'Pedido não encontrado.')
  const c = await obterColecoes()
  const agora = new Date()
  const monitorId = String(input.monitor._id)
  const [demanda, anuncio] = await Promise.all([
    c.demandas.findOne({ _id: new ObjectId(input.demandaId), ...abertaAgora(agora) } as any),
    c.anuncios.findOne({ _id: new ObjectId(input.anuncioId), userId: monitorId, status: 'publicado' } as any),
  ])
  if (!demanda) throw new ErroMonitoria(404, 'Este pedido não está mais aberto.')
  if (!anuncio || !ObjectId.isValid(anuncio.tutorId)) throw new ErroMonitoria(400, 'Escolha um anúncio seu que esteja publicado.')
  const [tutor, aluno] = await Promise.all([
    c.tutores.findOne({ _id: new ObjectId(anuncio.tutorId), status: 'ativo' } as any),
    carregarUsuario(demanda.alunoId),
  ])
  if (!tutor) throw new ErroMonitoria(403, 'Seu perfil de monitor não está ativo.')
  if (!aluno || aluno.banned) throw new ErroMonitoria(404, 'Este pedido não está mais aberto.')
  if (mesmaPessoa(aluno, input.monitor)) throw new ErroMonitoria(400, 'Você não pode responder o seu próprio pedido.')
  const cabe = anuncioAtendeDemanda(anuncio, demanda)
  if (!cabe.ok) throw new ErroMonitoria(400, cabe.motivo)
  const demandaId = idDe(demanda)
  if (await c.reservas.findOne({ 'demanda.id': demandaId, tutorId: idDe(tutor) } as any, { projection: { _id: 1 } })) {
    throw new ErroMonitoria(409, 'Você já respondeu este pedido.')
  }

  // Vaga de resposta (teto por pedido), atômica.
  const vaga = await c.demandas.updateOne(
    { _id: demanda._id, ...abertaAgora(agora), respostas: { $lt: MAX_RESPOSTAS_POR_DEMANDA } } as any,
    { $inc: { respostas: 1 }, $set: { updatedAt: agora } },
  )
  if (!vaga.modifiedCount) throw new ErroMonitoria(409, 'Este pedido já recebeu respostas suficientes.')

  const resumo = resumoDe(demanda)
  const reserva: Reserva = {
    anuncioId: idDe(anuncio),
    anuncioTitulo: anuncio.titulo,
    tutorId: idDe(tutor),
    tutorUserId: tutor.userId,
    solicitanteId: demanda.alunoId,
    origem: 'negociacao',
    status: 'solicitada',
    aceites: {},
    demanda: { id: demandaId, ...resumo },
    materiais: anuncio.materiais || [],
    versao: 0,
    ultimaAtividadeEm: agora,
    createdAt: agora,
    updatedAt: agora,
  }
  try {
    const res = await c.reservas.insertOne(reserva as any)
    reserva._id = res.insertedId
  } catch (e) {
    // Índice único (pedido, monitor): dois cliques ao mesmo tempo.
    await c.demandas.updateOne({ _id: demanda._id } as any, { $inc: { respostas: -1 } })
    if ((e as { code?: number }).code === 11000) throw new ErroMonitoria(409, 'Você já respondeu este pedido.')
    throw e
  }
  const id = idDe(reserva)
  await c.mensagens.insertMany([
    { reservaId: id, autorId: 'sistema', tipo: 'sistema', texto: `Resposta ao pedido de monitoria: ${resumoDaDemanda(resumo)}.`, createdAt: agora },
    { reservaId: id, autorId: monitorId, tipo: 'texto', texto: input.mensagem, createdAt: new Date(agora.getTime() + 1) },
  ])
  await avisar([
    {
      userId: demanda.alunoId,
      titulo: `${tutor.nome.split(' ')[0]} quer dar sua monitoria 🙌`,
      mensagem: `Resposta ao seu pedido de ${demanda.materia}: "${anuncio.titulo}".`,
      url: urlReserva(id),
      email: {
        assunto: `Um monitor respondeu seu pedido de ${demanda.materia}`,
        paragrafos: [
          `${tutor.nome} quer dar a sua monitoria de ${demanda.materia}.`,
          'Converse pelo chat, combine dia e valor e só pague quando estiver tudo certo. Respostas sem retorno em 72 horas expiram sozinhas.',
        ],
        linhas: [
          ['Anúncio', anuncio.titulo],
          ['Mensagem', input.mensagem.slice(0, 300)],
        ],
        botao: 'Ver a resposta',
      },
    },
  ])
  return reserva
}

export async function encerrarDemanda(alunoId: string, demandaId: string): Promise<void> {
  if (!ObjectId.isValid(demandaId)) throw new ErroMonitoria(404, 'Pedido não encontrado.')
  const c = await obterColecoes()
  const r = await c.demandas.updateOne(
    { _id: new ObjectId(demandaId), alunoId, status: 'aberta' } as any,
    { $set: { status: 'encerrada', updatedAt: new Date() } },
  )
  if (!r.matchedCount) throw new ErroMonitoria(404, 'Este pedido não está mais aberto.')
}

/**
 * Aula confirmada a partir de um pedido: o pedido sai do mural e os outros
 * monitores que responderam ficam sabendo (a conversa deles expira sozinha).
 */
export async function marcarDemandaAtendida(reserva: Reserva): Promise<void> {
  if (!reserva.demanda?.id || !ObjectId.isValid(reserva.demanda.id)) return
  const c = await obterColecoes()
  const r = await c.demandas.updateOne(
    { _id: new ObjectId(reserva.demanda.id), status: 'aberta' } as any,
    { $set: { status: 'atendida', atendidaPor: idDe(reserva), updatedAt: new Date() } },
  )
  if (!r.modifiedCount) return
  const outras = await c.reservas
    .find(
      { 'demanda.id': reserva.demanda.id, _id: { $ne: reserva._id }, status: { $in: ['solicitada', 'em_negociacao'] } } as any,
      { projection: { tutorUserId: 1 } },
    )
    .toArray()
  if (outras.length) {
    await avisar(
      outras.map((o) => ({
        userId: o.tutorUserId,
        titulo: 'Pedido fechado com outro monitor',
        mensagem: `O aluno já fechou a monitoria de ${reserva.demanda!.materia}. Obrigado por responder!`,
        url: urlReserva(idDe(o)),
      })),
    )
  }
}
