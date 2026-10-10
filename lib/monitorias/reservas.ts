import 'server-only'

/**
 * Regras da reserva — do pedido à aula.
 *
 * Cada função aqui é chamada por UMA rota e faz uma transição da máquina de
 * estados (`estado.ts`) com compare-and-set. Erro de regra vira
 * `ErroMonitoria` (status HTTP + mensagem legível), que a rota devolve como está.
 */

import { randomBytes, randomUUID } from 'crypto'
import { ObjectId, type Collection } from 'mongodb'
import { getDb } from '@/lib/mongodb'
import { formatarEmBrasilia } from '@/lib/fuso-brasilia'
import { onlyCpfDigits } from '@/lib/cpf'
import { audit } from '@/lib/payments/audit'
import { VALOR_MAXIMO_CENTAVOS, VALOR_MINIMO_CENTAVOS, formatarCentavos } from './dinheiro'
import { precoPorPessoaCentavos } from './precos'
import { blocosDaAula, cabeNaDisponibilidade, DIAS_MAXIMOS_DE_ANTECEDENCIA, duracoesPermitidas, formatarDuracao, inicioNaGrade } from './agenda'
import { colecoes, ehDuplicada, idDe } from './db'
import { negociavel, podeTransitar, STATUS_EM_ABERTO } from './estado'
import { decidirCancelamento, prazoDePagamento, STRIKES_PARA_SUSPENDER, strikesRecentes, podeReportar } from './politica'
import { emitirContrato, nomeCivil, rescindirContratosDaReserva } from './contratos'
import { avisar } from './avisos'
import { reembolsarReserva, reembolsarParticipacao } from './reembolso'
import { VERSAO_OFERTA } from './documentos/contrato'
import { VERSAO_TERMOS } from './documentos/termos'
import type { UsuarioMonitoria } from './servidor'
import type { Anuncio, Bloqueio, Contrato, Participacao, Proposta, Reserva, StatusReserva, Tutor } from './tipos'
import type { Ticket } from '@/lib/types'
import { mensagemDoSistema as mensagemDoSistemaDoTicket, novaMensagem, protocoloDoTicket } from '@/lib/tickets'

export class ErroMonitoria extends Error {
  constructor(public status: number, mensagem: string) {
    super(mensagem)
  }
}

const MAX_RESERVAS_ABERTAS_POR_ALUNO = 10
const MAX_AGENDAMENTOS_PENDENTES_POR_MONITOR = 2
const ANTECEDENCIA_MIN_PROPOSTA_MS = 3 * 3_600_000
const HOLD_DIRETO_MS = 30 * 60_000
const FOLGA_HOLD_MS = 15 * 60_000

type Colecoes = ReturnType<typeof colecoes>

async function cols(): Promise<Colecoes> {
  return colecoes(await getDb())
}

function urlReserva(id: string) {
  return `/monitorias/reservas/${id}`
}

function quando(d: Date) {
  return `${formatarEmBrasilia(d, { weekday: 'long', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} (Brasília)`
}

// ─── Bloqueios de agenda ────────────────────────────────────────────────

/**
 * Trava os blocos da aula. Índice único (tutorId, inicioBloco): se QUALQUER
 * bloco já é de outra reserva, desfaz o que inseriu e devolve false.
 */
export async function reservarBlocos(input: {
  bloqueios: Collection<Bloqueio>
  tutorId: string
  reservaId: string
  inicio: Date
  duracaoMin: number
  intervaloMin: number
  expiraEm: Date
}): Promise<boolean> {
  const blocos = blocosDaAula(input.inicio, input.duracaoMin, input.intervaloMin)
  const agora = new Date()
  // Holds vencidos que o TTL do Mongo ainda não recolheu não podem travar ninguém.
  await input.bloqueios.deleteMany({ tutorId: input.tutorId, inicioBloco: { $in: blocos }, tipo: 'hold', expiraEm: { $lt: agora } })
  try {
    await input.bloqueios.insertMany(
      blocos.map((b) => ({ tutorId: input.tutorId, inicioBloco: b, reservaId: input.reservaId, tipo: 'hold' as const, expiraEm: input.expiraEm })),
      { ordered: true },
    )
    return true
  } catch (err) {
    await input.bloqueios.deleteMany({ reservaId: input.reservaId, inicioBloco: { $in: blocos } })
    if (ehDuplicada(err)) return false
    throw err
  }
}

/**
 * Garante que a aula inteira está travada para esta reserva antes de
 * confirmá-la. Se algum bloco da aula venceu (hold de 30 min, TTL) e alguém
 * pegou o horário, devolve false — quem chama não confirma. Conta só os
 * blocos da AULA (sem a folga): mudar o intervalo do monitor depois não
 * derruba uma reserva que já estava travada.
 */
export async function garantirBlocos(reserva: Reserva): Promise<boolean> {
  const c = await cols()
  const id = idDe(reserva)
  if (!reserva.inicio || !reserva.proposta) return false
  const nucleo = blocosDaAula(reserva.inicio, reserva.proposta.duracaoMin, 0)
  const agora = new Date()
  const vivos = await c.bloqueios.countDocuments({
    reservaId: id,
    inicioBloco: { $in: nucleo },
    $or: [{ tipo: 'firme' }, { expiraEm: { $gt: agora } }],
  } as any)
  if (vivos >= nucleo.length) return true
  const tutor = await c.tutores.findOne({ _id: new ObjectId(reserva.tutorId) } as any, { projection: { disponibilidade: 1 } })
  await c.bloqueios.deleteMany({ reservaId: id })
  return reservarBlocos({
    bloqueios: c.bloqueios,
    tutorId: reserva.tutorId,
    reservaId: id,
    inicio: reserva.inicio,
    duracaoMin: reserva.proposta.duracaoMin,
    intervaloMin: tutor?.disponibilidade.intervaloMin || 0,
    expiraEm: new Date(agora.getTime() + 60 * 60_000),
  })
}

export async function firmarBlocos(reservaId: string): Promise<void> {
  const c = await cols()
  await c.bloqueios.updateMany({ reservaId }, { $set: { tipo: 'firme' }, $unset: { expiraEm: '' } })
}

export async function liberarBlocos(reservaId: string): Promise<void> {
  const c = await cols()
  await c.bloqueios.deleteMany({ reservaId })
}

// ─── Leitura e papéis ───────────────────────────────────────────────────

export type Papel = 'monitor' | 'organizador' | 'membro'

export async function carregarReserva(id: string): Promise<Reserva> {
  if (!ObjectId.isValid(id)) throw new ErroMonitoria(404, 'Não encontrado.')
  const c = await cols()
  const reserva = await c.reservas.findOne({ _id: new ObjectId(id) } as any)
  if (!reserva) throw new ErroMonitoria(404, 'Não encontrado.')
  return reserva
}

/** Assento que ainda participa da reserva (quem expirou, cancelou ou foi reembolsado saiu). */
const ASSENTO_ATIVO = ['aguardando_assinatura', 'aguardando_pagamento', 'paga', 'gratis', 'concluida', 'reembolso_processando']
const ASSENTO_PAGO = ['paga', 'gratis', 'concluida']

function papelPeloAssento(reserva: Reserva, userId: string, part: { status: string } | null): Papel | null {
  if (reserva.tutorUserId === userId) return 'monitor'
  if (reserva.solicitanteId === userId) {
    // Na negociação o organizador ainda não tem assento: segue organizador.
    return !part || ASSENTO_ATIVO.includes(part.status) ? 'organizador' : null
  }
  return part && ASSENTO_ATIVO.includes(part.status) ? 'membro' : null
}

/** Papel ATIVO na reserva: quem pode agir e escrever. */
export async function papelNaReserva(reserva: Reserva, userId: string): Promise<Papel | null> {
  if (reserva.tutorUserId === userId) return 'monitor'
  const c = await cols()
  const part = await c.participacoes.findOne({ reservaId: idDe(reserva), alunoId: userId }, { projection: { status: 1 } })
  return papelPeloAssento(reserva, userId, part)
}

/**
 * Leitura da sala, das mensagens e do PDF da conversa. Quem já participou
 * continua vendo o próprio histórico ("acesso a tudo"), mas:
 *  - sem papel ativo (expirou, cancelou, foi reembolsado) é só leitura;
 *  - sem assento pago/grátis, os contatos aparecem mascarados — senão quem
 *    nunca pagou leria o telefone que o monitor mandou depois da confirmação.
 */
export async function acessoDeLeitura(
  reserva: Reserva,
  userId: string,
): Promise<{ papel: Papel; somenteLeitura: boolean; mascarar: boolean } | null> {
  if (reserva.tutorUserId === userId) return { papel: 'monitor', somenteLeitura: false, mascarar: false }
  const c = await cols()
  const part = await c.participacoes.findOne({ reservaId: idDe(reserva), alunoId: userId }, { projection: { status: 1 } })
  const papel = papelPeloAssento(reserva, userId, part)
  const pago = !!part && ASSENTO_PAGO.includes(part.status)
  if (papel) return { papel, somenteLeitura: false, mascarar: !pago }
  if (part) return { papel: reserva.solicitanteId === userId ? 'organizador' : 'membro', somenteLeitura: true, mascarar: true }
  return null
}

/** Quem tem assento pago/grátis/concluído (ou é o monitor) escreve sem máscara depois da confirmação. */
export async function assentoPago(reserva: Reserva, userId: string): Promise<boolean> {
  if (reserva.tutorUserId === userId) return true
  const c = await cols()
  const part = await c.participacoes.findOne({ reservaId: idDe(reserva), alunoId: userId }, { projection: { status: 1 } })
  return !!part && ASSENTO_PAGO.includes(part.status)
}

/** Mesmo CPF dos dois lados = a mesma pessoa com duas contas. */
function mesmaPessoa(a: UsuarioMonitoria, b: UsuarioMonitoria): boolean {
  if (String(a._id) === String(b._id)) return true
  const ca = onlyCpfDigits(a.cpf || '')
  return ca.length === 11 && ca === onlyCpfDigits(b.cpf || '')
}

async function transitar(c: Colecoes, reserva: Reserva, para: StatusReserva, extra: Record<string, unknown> = {}): Promise<Reserva> {
  if (!podeTransitar(reserva.status, para)) {
    throw new ErroMonitoria(409, 'Esta ação não é possível no estado atual da reserva.')
  }
  const agora = new Date()
  const atualizada = await c.reservas.findOneAndUpdate(
    { _id: reserva._id as any, status: reserva.status, versao: reserva.versao },
    { $set: { status: para, updatedAt: agora, ultimaAtividadeEm: agora, ...extra }, $inc: { versao: 1 } },
    { returnDocument: 'after' },
  )
  if (!atualizada) throw new ErroMonitoria(409, 'A reserva mudou enquanto você agia. Recarregue a página.')
  return atualizada
}

async function mensagemDoSistema(c: Colecoes, reservaId: string, texto: string): Promise<void> {
  await c.mensagens.insertOne({ reservaId, autorId: 'sistema', tipo: 'sistema', texto, createdAt: new Date() })
}

async function contarAbertas(c: Colecoes, alunoId: string): Promise<number> {
  return c.reservas.countDocuments({ solicitanteId: alunoId, status: { $in: STATUS_EM_ABERTO } })
}

function checarAnuncioAtivo(anuncio: Anuncio | null, tutor: Tutor | null): asserts anuncio is Anuncio {
  if (!anuncio || anuncio.status !== 'publicado' || !tutor || tutor.status !== 'ativo') {
    throw new ErroMonitoria(404, 'Este anúncio não está disponível.')
  }
}

// ─── Pedido (negociação / a combinar) ───────────────────────────────────

export async function criarSolicitacao(input: {
  anuncio: Anuncio | null
  tutor: Tutor | null
  aluno: UsuarioMonitoria
  monitor: UsuarioMonitoria
  modo: 'negociacao' | 'a_combinar'
  mensagem: string
  vagas: number
  conteudos: string[]
  gratis: boolean
}): Promise<Reserva> {
  const { anuncio, tutor, aluno, monitor } = input
  checarAnuncioAtivo(anuncio, tutor)
  if (mesmaPessoa(aluno, monitor)) throw new ErroMonitoria(400, 'Você não pode contratar a sua própria monitoria.')
  if (input.modo === 'negociacao' && !anuncio.modos.negociacao) throw new ErroMonitoria(400, 'Este anúncio não aceita negociação.')
  if (input.modo === 'a_combinar' && !anuncio.modos.aCombinar) throw new ErroMonitoria(400, 'Este anúncio não é "a combinar".')
  if (input.gratis && !anuncio.aulaGratis.ativa) throw new ErroMonitoria(400, 'Este anúncio não oferece aula grátis.')
  const maxVagas = anuncio.grupo.ativo ? anuncio.grupo.maxAlunos : 1
  if (input.vagas < 1 || input.vagas > maxVagas || (input.gratis && input.vagas !== 1)) {
    throw new ErroMonitoria(400, `Número de alunos inválido (máximo ${maxVagas}).`)
  }

  const c = await cols()
  const [abertas, jaTem] = await Promise.all([
    contarAbertas(c, String(aluno._id)),
    c.reservas.findOne({ anuncioId: idDe(anuncio), solicitanteId: String(aluno._id), status: { $in: STATUS_EM_ABERTO } }, { projection: { _id: 1 } }),
  ])
  if (jaTem) throw new ErroMonitoria(409, 'Você já tem um pedido em aberto neste anúncio.', )
  if (abertas >= MAX_RESERVAS_ABERTAS_POR_ALUNO) throw new ErroMonitoria(429, 'Você tem pedidos demais em aberto. Conclua ou cancele algum antes.')
  if (input.gratis) {
    const usada = await c.cotasGratis.findOne({ alunoId: String(aluno._id), tutorId: idDe(tutor) })
    if (usada) throw new ErroMonitoria(409, 'Você já usou sua aula grátis com este monitor.')
  }

  const agora = new Date()
  const reserva: Reserva = {
    anuncioId: idDe(anuncio),
    anuncioTitulo: anuncio.titulo,
    tutorId: idDe(tutor),
    tutorUserId: tutor!.userId,
    solicitanteId: String(aluno._id),
    origem: input.gratis ? 'gratis' : input.modo,
    status: 'solicitada',
    aceites: {},
    materiais: anuncio.materiais || [],
    versao: 0,
    ultimaAtividadeEm: agora,
    createdAt: agora,
    updatedAt: agora,
  }
  const res = await c.reservas.insertOne(reserva as any)
  reserva._id = res.insertedId
  const id = String(res.insertedId)
  const pedidoResumo = [
    input.gratis ? 'Aula grátis' : null,
    input.vagas > 1 ? `Grupo de ${input.vagas} alunos` : 'Individual',
    input.conteudos.length ? `Conteúdos: ${input.conteudos.join(', ')}` : null,
  ]
    .filter(Boolean)
    .join(' · ')
  await c.mensagens.insertMany([
    { reservaId: id, autorId: 'sistema', tipo: 'sistema', texto: `Pedido aberto — ${pedidoResumo}.`, createdAt: agora },
    { reservaId: id, autorId: String(aluno._id), tipo: 'texto', texto: input.mensagem, createdAt: new Date(agora.getTime() + 1) },
  ])
  await avisar([
    {
      userId: tutor!.userId,
      titulo: 'Alguém quer sua monitoria! 🎉',
      mensagem: `${aluno.name} pediu "${anuncio.titulo}".`,
      url: urlReserva(id),
      email: {
        assunto: `Novo pedido de monitoria: ${anuncio.titulo}`,
        paragrafos: [
          `${aluno.name} quer fazer monitoria com você em "${anuncio.titulo}".`,
          input.modo === 'a_combinar'
            ? 'Este anúncio é "a combinar": envie a primeira proposta com dia, horário (de Brasília), duração e valor.'
            : 'Responda no chat e envie uma proposta com dia, horário (de Brasília), duração e valor.',
          'Pedidos sem resposta em 72 horas expiram sozinhos.',
        ],
        linhas: [['Pedido', pedidoResumo], ['Mensagem', input.mensagem.slice(0, 300)]],
        botao: 'Responder o pedido',
      },
    },
    {
      userId: String(aluno._id),
      titulo: 'Solicitação enviada',
      mensagem: `Seu pedido de monitoria "${anuncio.titulo}" foi enviado ao monitor.`,
      url: urlReserva(id),
      email: {
        assunto: `Sua solicitação de monitoria foi feita: ${anuncio.titulo}`,
        paragrafos: [
          `Enviamos seu pedido para ${tutor!.nome}. Você vai receber um aviso quando chegar uma resposta ou proposta.`,
          'Combine tudo pelo chat da plataforma: só assim você tem contrato, comprovante, garantia e reembolso.',
        ],
        linhas: [['Anúncio', anuncio.titulo], ['Pedido', pedidoResumo]],
        botao: 'Acompanhar o pedido',
      },
    },
  ])
  return reserva
}

// ─── Propostas ──────────────────────────────────────────────────────────

export async function proporNova(input: {
  reserva: Reserva
  anuncio: Anuncio
  autor: UsuarioMonitoria
  papel: Papel
  inicio: Date
  duracaoMin: number
  conteudos: string[]
  vagas: number
  valorPorPessoaCentavos?: number
  gratis: boolean
  observacao?: string
}): Promise<Reserva> {
  const { reserva, anuncio, papel } = input
  if (papel === 'membro') throw new ErroMonitoria(403, 'Só o organizador e o monitor negociam a reserva.')
  if (!negociavel(reserva.status)) throw new ErroMonitoria(409, 'Esta reserva não está mais em negociação.')
  if (reserva.origem === 'direto') throw new ErroMonitoria(409, 'Agendamento direto não tem negociação.')
  if (reserva.origem === 'a_combinar' && !reserva.proposta && papel !== 'monitor') {
    throw new ErroMonitoria(409, 'Neste anúncio "a combinar", a primeira proposta é do monitor.')
  }
  if (input.inicio.getTime() < Date.now() + ANTECEDENCIA_MIN_PROPOSTA_MS) {
    throw new ErroMonitoria(400, 'A aula precisa começar daqui a pelo menos 3 horas.')
  }
  if (input.inicio.getTime() > Date.now() + 120 * 24 * 3_600_000) throw new ErroMonitoria(400, 'Data muito distante (máximo 120 dias).')
  if (!inicioNaGrade(input.inicio)) throw new ErroMonitoria(400, 'Escolha um horário cheio ou de meia hora (ex.: 19:00 ou 19:30).')
  const maxVagas = anuncio.grupo.ativo ? anuncio.grupo.maxAlunos : 1
  if (input.vagas > maxVagas) throw new ErroMonitoria(400, `Este anúncio aceita no máximo ${maxVagas} aluno(s).`)

  const gratis = reserva.origem === 'gratis' ? true : input.gratis && papel === 'monitor'
  if (gratis && input.vagas !== 1) throw new ErroMonitoria(400, 'Aula grátis é individual.')
  let valor = 0
  if (!gratis) {
    valor = input.valorPorPessoaCentavos ?? precoPorPessoaCentavos(anuncio, input.duracaoMin, input.vagas)
    if (valor < VALOR_MINIMO_CENTAVOS || valor > VALOR_MAXIMO_CENTAVOS) {
      throw new ErroMonitoria(400, 'Valor por pessoa deve ficar entre R$ 10,00 e R$ 5.000,00.')
    }
  } else if (reserva.origem === 'gratis' && input.duracaoMin > anuncio.aulaGratis.duracaoMin) {
    throw new ErroMonitoria(400, `A aula grátis deste anúncio tem até ${formatarDuracao(anuncio.aulaGratis.duracaoMin)}.`)
  }

  const c = await cols()
  if (reserva.status === 'aguardando_assinaturas') {
    // Contraproposta depois do aceite: o combinado anterior deixa de valer.
    await desfazerAceite(c, reserva)
  }
  const proposta: Proposta = {
    id: randomUUID(),
    autorId: String(input.autor._id),
    inicio: input.inicio,
    duracaoMin: input.duracaoMin,
    conteudos: input.conteudos,
    vagas: input.vagas,
    valorPorPessoaCentavos: valor,
    gratis,
    observacao: input.observacao || undefined,
    criadaEm: new Date(),
  }
  const ladoAutor = papel === 'monitor' ? 'tutor' : 'aluno'
  const atual = reserva.status === 'aguardando_assinaturas' ? await carregarReserva(idDe(reserva)) : reserva
  const atualizada = await transitar(c, atual, 'em_negociacao', {
    proposta,
    aceites: { [ladoAutor]: new Date() },
  })
  const resumo = `${quando(proposta.inicio)} · ${formatarDuracao(proposta.duracaoMin)} · ${
    gratis ? 'grátis' : `${formatarCentavos(valor)} por pessoa`
  }${proposta.vagas > 1 ? ` · ${proposta.vagas} alunos` : ''}`
  await c.mensagens.insertOne({
    reservaId: idDe(reserva),
    autorId: proposta.autorId,
    tipo: 'proposta',
    texto: resumo,
    propostaId: proposta.id,
    createdAt: new Date(),
  })
  const outro = papel === 'monitor' ? reserva.solicitanteId : reserva.tutorUserId
  await avisar([
    {
      userId: outro,
      titulo: 'Nova proposta de monitoria',
      mensagem: `${input.autor.name} propôs: ${resumo}`,
      url: urlReserva(idDe(reserva)),
      email: {
        assunto: `Nova proposta: ${reserva.anuncioTitulo}`,
        paragrafos: [`${input.autor.name} enviou uma proposta para a monitoria "${reserva.anuncioTitulo}".`, 'Aceite, recuse ou faça uma contraproposta.'],
        linhas: [
          ['Quando', quando(proposta.inicio)],
          ['Duração', formatarDuracao(proposta.duracaoMin)],
          ['Valor', gratis ? 'Grátis' : `${formatarCentavos(valor)} por pessoa`],
          ['Alunos', String(proposta.vagas)],
          ...(proposta.conteudos.length ? ([['Conteúdos', proposta.conteudos.join(', ')]] as Array<[string, string]>) : []),
        ],
        botao: 'Ver proposta',
      },
    },
  ])
  return atualizada
}

/** Volta de "aguardando assinaturas" para negociação: solta agenda, contrato e assentos não pagos. */
async function desfazerAceite(c: Colecoes, reserva: Reserva): Promise<void> {
  const pagos = await c.participacoes.countDocuments({ reservaId: idDe(reserva), status: { $in: ['paga', 'reembolso_processando'] } })
  if (pagos > 0) throw new ErroMonitoria(409, 'Já há pagamento nesta reserva; para mudar o combinado, cancele e faça um novo pedido.')
  await Promise.all([
    liberarBlocos(idDe(reserva)),
    rescindirContratosDaReserva(idDe(reserva)),
    c.participacoes.updateMany(
      { reservaId: idDe(reserva), status: { $in: ['aguardando_assinatura', 'aguardando_pagamento'] } },
      { $set: { status: 'cancelada', updatedAt: new Date() } },
    ),
    c.cotasGratis.deleteMany({ reservaId: idDe(reserva) }),
  ])
  // O índice único (reservaId, alunoId) não pode impedir o novo assento do organizador.
  await c.participacoes.deleteMany({ reservaId: idDe(reserva), status: 'cancelada', paymentOrderId: { $exists: false } })
}

// ─── Aceite → contrato ──────────────────────────────────────────────────

export async function aceitarProposta(input: {
  reserva: Reserva
  anuncio: Anuncio
  tutor: Tutor
  ator: UsuarioMonitoria
  papel: Papel
  propostaId: string
  aluno: UsuarioMonitoria
  monitor: UsuarioMonitoria
}): Promise<Reserva> {
  const { reserva, papel, tutor } = input
  if (papel === 'membro') throw new ErroMonitoria(403, 'Só o organizador e o monitor aceitam propostas.')
  if (reserva.status !== 'em_negociacao') throw new ErroMonitoria(409, 'Não há proposta aguardando aceite.')
  const proposta = reserva.proposta
  if (!proposta || proposta.id !== input.propostaId) throw new ErroMonitoria(409, 'Essa proposta foi substituída por outra. Veja a mais recente.')
  if (proposta.autorId === String(input.ator._id)) throw new ErroMonitoria(409, 'A outra parte é quem aceita a sua proposta.')
  if (proposta.inicio.getTime() < Date.now() + 60 * 60_000) throw new ErroMonitoria(409, 'O horário desta proposta ficou próximo demais. Envie uma nova.')

  const c = await cols()
  const id = idDe(reserva)
  const prazo = prazoDePagamento(new Date(), proposta.inicio)
  if (proposta.gratis) {
    try {
      await c.cotasGratis.insertOne({ alunoId: reserva.solicitanteId, tutorId: reserva.tutorId, reservaId: id, em: new Date() })
    } catch (err) {
      if (ehDuplicada(err)) throw new ErroMonitoria(409, 'O aluno já usou a aula grátis com este monitor.')
      throw err
    }
  }
  const travou = await reservarBlocos({
    bloqueios: c.bloqueios,
    tutorId: reserva.tutorId,
    reservaId: id,
    inicio: proposta.inicio,
    duracaoMin: proposta.duracaoMin,
    intervaloMin: tutor.disponibilidade.intervaloMin,
    expiraEm: new Date(prazo.getTime() + 30 * 60_000 + FOLGA_HOLD_MS),
  })
  if (!travou) {
    if (proposta.gratis) await c.cotasGratis.deleteOne({ reservaId: id })
    throw new ErroMonitoria(409, 'O monitor já tem outra aula nesse horário. Proponha outro.')
  }
  const fim = new Date(proposta.inicio.getTime() + proposta.duracaoMin * 60_000)
  let atualizada: Reserva
  try {
    atualizada = await transitar(c, reserva, 'aguardando_assinaturas', {
      aceites: { ...reserva.aceites, [papel === 'monitor' ? 'tutor' : 'aluno']: new Date() },
      inicio: proposta.inicio,
      fim,
      prazoPagamento: prazo,
      ...(proposta.vagas > 1 ? { codigoConvite: codigoDeConvite() } : {}),
    })
  } catch (err) {
    await liberarBlocos(id)
    if (proposta.gratis) await c.cotasGratis.deleteOne({ reservaId: id })
    throw err
  }
  const part = await novoAssento(c, atualizada, input.aluno)
  await emitirContrato({ reserva: atualizada, participacao: part, anuncio: input.anuncio, aluno: input.aluno, monitor: input.monitor })
  await mensagemDoSistema(c, id, 'Proposta aceita! Agora os dois assinam o contrato (com código enviado ao e-mail). Depois disso, o pagamento é liberado.')
  await avisar(
    [reserva.solicitanteId, reserva.tutorUserId].map((userId) => ({
      userId,
      titulo: 'Proposta aceita — falta assinar',
      mensagem: `"${reserva.anuncioTitulo}" foi combinada. Assine o contrato para continuar.`,
      url: urlReserva(id),
      email: {
        assunto: `Combinado! Assine o contrato da monitoria: ${reserva.anuncioTitulo}`,
        paragrafos: [
          'A proposta foi aceita. O próximo passo é assinar o contrato de prestação de serviços — leva 1 minuto.',
          proposta.gratis ? 'Como é uma aula grátis, depois das assinaturas a aula já fica confirmada.' : `O pagamento por PIX precisa acontecer até ${quando(prazo)}, senão o horário é liberado.`,
        ],
        linhas: [
          ['Quando', quando(proposta.inicio)],
          ['Duração', formatarDuracao(proposta.duracaoMin)],
          ['Valor', proposta.gratis ? 'Grátis' : `${formatarCentavos(proposta.valorPorPessoaCentavos)} por pessoa`],
        ],
        botao: 'Assinar contrato',
      },
    })),
  )
  return atualizada
}

function codigoDeConvite(): string {
  return randomBytes(9).toString('base64url')
}

async function novoAssento(c: Colecoes, reserva: Reserva, aluno: UsuarioMonitoria): Promise<Participacao> {
  const agora = new Date()
  const part: Participacao = {
    reservaId: idDe(reserva),
    alunoId: String(aluno._id),
    alunoNome: aluno.name,
    tutorId: reserva.tutorId,
    status: 'aguardando_assinatura',
    valorCentavos: reserva.proposta!.gratis ? 0 : reserva.proposta!.valorPorPessoaCentavos,
    reembolsos: [],
    createdAt: agora,
    updatedAt: agora,
  }
  try {
    const res = await c.participacoes.insertOne(part as any)
    part._id = res.insertedId
  } catch (err) {
    if (ehDuplicada(err)) throw new ErroMonitoria(409, 'Você já está nesta reserva.')
    throw err
  }
  return part
}

// ─── Agendamento direto ─────────────────────────────────────────────────

export async function agendarDireto(input: {
  anuncio: Anuncio | null
  tutor: Tutor | null
  aluno: UsuarioMonitoria
  monitor: UsuarioMonitoria
  inicio: Date
  duracaoMin: number
  vagas: number
  gratis: boolean
  conteudos: string[]
}): Promise<{ reserva: Reserva; contrato: Contrato }> {
  const { anuncio, tutor, aluno, monitor } = input
  checarAnuncioAtivo(anuncio, tutor)
  const direto = anuncio.modos.direto
  if (!direto || !anuncio.ofertaAssinada) throw new ErroMonitoria(400, 'Este anúncio não tem agendamento direto.')
  // O contrato gerado aqui declara que o monitor aceitou os Termos VIGENTES e
  // a oferta VIGENTE. Oferta de versão antiga, ou Termos não reaceitos, não
  // valem como assinatura dele: o agendamento direto fica indisponível até ele
  // reassinar (o painel avisa).
  if (anuncio.ofertaAssinada.versao !== VERSAO_OFERTA) throw new ErroMonitoria(409, 'O monitor precisa renovar a assinatura da agenda online. Use "Negociar no chat" por enquanto.')
  {
    const cTermos = await cols()
    const aceite = await cTermos.termos.findOne({ userId: String(monitor._id), papel: 'monitor', versao: VERSAO_TERMOS }, { projection: { _id: 1 } })
    if (!aceite) throw new ErroMonitoria(409, 'O monitor precisa aceitar os Termos atualizados. Use "Negociar no chat" por enquanto.')
  }
  if (!inicioNaGrade(input.inicio)) throw new ErroMonitoria(400, 'Horário inválido. Escolha um dos horários da agenda.')
  if (input.inicio.getTime() > Date.now() + DIAS_MAXIMOS_DE_ANTECEDENCIA * 24 * 3_600_000) throw new ErroMonitoria(400, 'Data muito distante.')
  if (mesmaPessoa(aluno, monitor)) throw new ErroMonitoria(400, 'Você não pode contratar a sua própria monitoria.')
  if (input.gratis) {
    if (!anuncio.aulaGratis.ativa) throw new ErroMonitoria(400, 'Este anúncio não oferece aula grátis.')
    if (input.duracaoMin !== anuncio.aulaGratis.duracaoMin || input.vagas !== 1) throw new ErroMonitoria(400, 'Aula grátis: individual e com a duração anunciada.')
  } else if (!duracoesPermitidas(direto.duracaoMinMin, direto.duracaoMaxMin, direto.passoMin).includes(input.duracaoMin)) {
    throw new ErroMonitoria(400, 'Duração fora do que o monitor oferece.')
  }
  const maxVagas = anuncio.grupo.ativo ? anuncio.grupo.maxAlunos : 1
  if (input.vagas < 1 || input.vagas > maxVagas) throw new ErroMonitoria(400, `Número de alunos inválido (máximo ${maxVagas}).`)
  const agora = new Date()
  if (input.inicio.getTime() < agora.getTime() + direto.antecedenciaMinHoras * 3_600_000) {
    throw new ErroMonitoria(400, `Este monitor pede ${direto.antecedenciaMinHoras}h de antecedência.`)
  }
  if (!cabeNaDisponibilidade(tutor!.disponibilidade, input.inicio, input.duracaoMin)) {
    throw new ErroMonitoria(409, 'Esse horário não está na agenda do monitor.')
  }

  const c = await cols()
  const [abertas, pendentesComEste] = await Promise.all([
    contarAbertas(c, String(aluno._id)),
    // Cada agendamento trava horário do monitor por até 30 min sem pagar. Sem
    // este teto, uma pessoa sozinha conseguiria "sequestrar" a agenda inteira.
    c.reservas.countDocuments({
      solicitanteId: String(aluno._id),
      tutorId: idDe(tutor),
      origem: { $in: ['direto', 'gratis'] },
      status: { $in: ['aguardando_assinaturas', 'aguardando_pagamento'] },
    }),
  ])
  if (abertas >= MAX_RESERVAS_ABERTAS_POR_ALUNO) {
    throw new ErroMonitoria(429, 'Você tem pedidos demais em aberto. Conclua ou cancele algum antes.')
  }
  if (pendentesComEste >= MAX_AGENDAMENTOS_PENDENTES_POR_MONITOR) {
    throw new ErroMonitoria(429, 'Você já tem horários reservados com este monitor esperando pagamento. Conclua ou cancele antes de reservar outro.')
  }
  const valor = input.gratis ? 0 : precoPorPessoaCentavos(anuncio, input.duracaoMin, input.vagas)
  const prazo = input.vagas > 1 ? prazoDePagamento(agora, input.inicio) : new Date(agora.getTime() + HOLD_DIRETO_MS)
  const fim = new Date(input.inicio.getTime() + input.duracaoMin * 60_000)
  const reserva: Reserva = {
    anuncioId: idDe(anuncio),
    anuncioTitulo: anuncio.titulo,
    tutorId: idDe(tutor),
    tutorUserId: tutor!.userId,
    solicitanteId: String(aluno._id),
    origem: input.gratis ? 'gratis' : 'direto',
    status: 'aguardando_assinaturas',
    proposta: {
      id: randomUUID(),
      autorId: String(aluno._id),
      inicio: input.inicio,
      duracaoMin: input.duracaoMin,
      conteudos: input.conteudos.length ? input.conteudos : anuncio.conteudos.slice(0, 5),
      vagas: input.vagas,
      valorPorPessoaCentavos: valor,
      gratis: input.gratis,
      criadaEm: agora,
    },
    aceites: { aluno: agora, tutor: anuncio.ofertaAssinada.em },
    inicio: input.inicio,
    fim,
    prazoPagamento: prazo,
    ...(input.vagas > 1 ? { codigoConvite: codigoDeConvite() } : {}),
    materiais: anuncio.materiais || [],
    versao: 0,
    ultimaAtividadeEm: agora,
    createdAt: agora,
    updatedAt: agora,
  }
  const res = await c.reservas.insertOne(reserva as any)
  reserva._id = res.insertedId
  const id = String(res.insertedId)

  const desfazer = async () => {
    await Promise.all([c.reservas.deleteOne({ _id: res.insertedId } as any), c.cotasGratis.deleteMany({ reservaId: id })])
  }
  if (input.gratis) {
    try {
      await c.cotasGratis.insertOne({ alunoId: String(aluno._id), tutorId: idDe(tutor), reservaId: id, em: agora })
    } catch (err) {
      await c.reservas.deleteOne({ _id: res.insertedId } as any)
      if (ehDuplicada(err)) throw new ErroMonitoria(409, 'Você já usou sua aula grátis com este monitor.')
      throw err
    }
  }
  const travou = await reservarBlocos({
    bloqueios: c.bloqueios,
    tutorId: idDe(tutor),
    reservaId: id,
    inicio: input.inicio,
    duracaoMin: input.duracaoMin,
    intervaloMin: tutor!.disponibilidade.intervaloMin,
    expiraEm: new Date(Math.max(prazo.getTime(), agora.getTime() + 30 * 60_000) + FOLGA_HOLD_MS),
  })
  if (!travou) {
    await desfazer()
    throw new ErroMonitoria(409, 'Esse horário acabou de ser reservado por outra pessoa. Escolha outro.')
  }
  const part = await novoAssento(c, reserva, aluno)
  const oferta = anuncio.ofertaAssinada
  const contrato = await emitirContrato({
    reserva,
    participacao: part,
    anuncio,
    aluno,
    monitor,
    assinaturaPrevia: {
      userId: tutor!.userId,
      papel: 'contratado',
      nome: nomeCivil(monitor),
      em: oferta.em,
      ip: oferta.ip,
      userAgent: oferta.userAgent,
      metodo: 'oferta_padrao',
      referencia: `Oferta-padrão ${oferta.versao}`,
      hashOrigem: oferta.hash,
    },
  })
  await mensagemDoSistema(
    c,
    id,
    `Agendamento direto: ${quando(input.inicio)}, ${formatarDuracao(input.duracaoMin)}. Assine o contrato e pague até ${quando(prazo)} para garantir o horário.`,
  )
  return { reserva, contrato }
}

// ─── Grupo: entrar por convite ──────────────────────────────────────────

export async function entrarNoGrupo(input: {
  codigo: string
  aluno: UsuarioMonitoria
}): Promise<{ reserva: Reserva; contrato: Contrato }> {
  const c = await cols()
  const codigo = String(input.codigo || '').trim()
  if (!/^[A-Za-z0-9_-]{8,20}$/.test(codigo)) throw new ErroMonitoria(404, 'Convite inválido.')
  const reserva = await c.reservas.findOne({ codigoConvite: codigo })
  if (!reserva || !reserva.proposta) throw new ErroMonitoria(404, 'Convite inválido.')
  if (reserva.status !== 'aguardando_pagamento' || (reserva.prazoPagamento && reserva.prazoPagamento < new Date())) {
    throw new ErroMonitoria(409, 'Este grupo não está mais aceitando alunos.')
  }
  const alunoId = String(input.aluno._id)
  if (alunoId === reserva.tutorUserId) throw new ErroMonitoria(400, 'Você é o monitor desta aula.')
  const [ativos, organizadorContrato, anuncio, monitor] = await Promise.all([
    c.participacoes.countDocuments({ reservaId: idDe(reserva), status: { $nin: ['expirada', 'cancelada', 'reembolsada'] } }),
    c.contratos.findOne({ reservaId: idDe(reserva), contratanteId: reserva.solicitanteId, status: 'assinado' }),
    c.anuncios.findOne({ _id: new ObjectId(reserva.anuncioId) } as any),
    c.users.findOne({ _id: new ObjectId(reserva.tutorUserId) } as any, { projection: { name: 1, fullName: 1, email: 1, cpf: 1 } }),
  ])
  if (ativos >= reserva.proposta.vagas) throw new ErroMonitoria(409, 'O grupo já está completo.')
  if (!organizadorContrato || !anuncio || !monitor) throw new ErroMonitoria(409, 'O grupo ainda não está pronto para receber alunos.')
  if (mesmaPessoa(input.aluno, { ...(monitor as any), _id: new ObjectId(reserva.tutorUserId) })) {
    throw new ErroMonitoria(400, 'Você não pode entrar como aluno na sua própria monitoria.')
  }
  const assinaturaMonitor = organizadorContrato.assinaturas.find((a) => a.papel === 'contratado')!
  const part = await novoAssento(c, reserva, input.aluno)
  const contrato = await emitirContrato({
    reserva,
    participacao: part,
    anuncio,
    aluno: input.aluno,
    monitor: monitor as unknown as UsuarioMonitoria,
    assinaturaPrevia: {
      userId: reserva.tutorUserId,
      papel: 'contratado',
      nome: assinaturaMonitor.nome,
      em: assinaturaMonitor.em,
      ip: assinaturaMonitor.ip,
      userAgent: assinaturaMonitor.userAgent,
      metodo: 'assinatura_da_reserva',
      referencia: `Contrato do organizador nº ${organizadorContrato.numero}`,
      hashOrigem: assinaturaMonitor.hash,
    },
  })
  await mensagemDoSistema(c, idDe(reserva), `${input.aluno.name} entrou no grupo.`)
  return { reserva, contrato }
}

// ─── Depois de cada assinatura ──────────────────────────────────────────

/**
 * Chamado quando um contrato fica completo (as duas assinaturas). Avança o
 * assento e, se for o do organizador, a reserva.
 */
export async function aposContratoAssinado(contrato: Contrato): Promise<void> {
  const c = await cols()
  const part = await c.participacoes.findOne({ _id: new ObjectId(contrato.participacaoId) } as any)
  if (!part || part.status !== 'aguardando_assinatura') return
  const reserva = await carregarReserva(contrato.reservaId)
  const gratis = !!reserva.proposta?.gratis
  await c.participacoes.updateOne(
    { _id: part._id as any, status: 'aguardando_assinatura' },
    { $set: { status: gratis ? 'gratis' : 'aguardando_pagamento', updatedAt: new Date() } },
  )
  if (reserva.status !== 'aguardando_assinaturas') return
  if (gratis) {
    if (!(await garantirBlocos(reserva))) {
      await transitar(c, reserva, 'expirada', { motivoCancelamento: 'O horário deixou de estar disponível antes da confirmação.' })
      await liberarBlocos(idDe(reserva))
      throw new ErroMonitoria(409, 'Esse horário não está mais disponível. Escolha outro na agenda do monitor.')
    }
    await transitar(c, reserva, 'confirmada')
    await firmarBlocos(idDe(reserva))
    await avisarConfirmacao(reserva)
    return
  }
  await transitar(c, reserva, 'aguardando_pagamento')
}

export async function avisarConfirmacao(reserva: Reserva): Promise<void> {
  const c = await cols()
  const id = idDe(reserva)
  const alunos = await c.participacoes.find({ reservaId: id, status: { $in: ['paga', 'gratis'] } }).toArray()
  const p = reserva.proposta!
  const linhas: Array<[string, string]> = [
    ['Quando', quando(p.inicio)],
    ['Duração', formatarDuracao(p.duracaoMin)],
    ['Alunos', alunos.map((a) => a.alunoNome.split(' ')[0]).join(', ')],
  ]
  await mensagemDoSistema(c, id, 'Monitoria confirmada! O link da reunião aparece aqui na página da reserva.')
  await avisar([
    {
      userId: reserva.tutorUserId,
      titulo: 'Monitoria confirmada ✅',
      mensagem: `"${reserva.anuncioTitulo}" — ${quando(p.inicio)}. Coloque o link da reunião na reserva.`,
      url: urlReserva(id),
      email: {
        assunto: `Monitoria confirmada: ${reserva.anuncioTitulo}`,
        paragrafos: [
          p.gratis ? 'Sua aula grátis está confirmada.' : 'O pagamento foi confirmado e o valor está em garantia. Ele é liberado para você 48 horas após o fim da aula.',
          'Adicione o link da reunião (Meet, Zoom...) na página da reserva — ele só aparece para quem pagou.',
        ],
        linhas,
        botao: 'Abrir a reserva',
      },
    },
    ...alunos.map((a) => ({
      userId: a.alunoId,
      titulo: 'Monitoria confirmada ✅',
      mensagem: `"${reserva.anuncioTitulo}" — ${quando(p.inicio)}.`,
      url: urlReserva(id),
      email: {
        assunto: `Monitoria confirmada: ${reserva.anuncioTitulo}`,
        paragrafos: [
          'Tudo certo! Sua monitoria está confirmada.',
          'O link da reunião aparece na página da reserva quando o monitor adicionar. Contrato e comprovante em PDF também ficam lá.',
        ],
        linhas,
        botao: 'Abrir a reserva',
      },
    })),
  ])
}

// ─── Confirmação manual do monitor (grupo incompleto) ───────────────────

export async function confirmarComQuemPagou(reserva: Reserva, papel: Papel | null): Promise<void> {
  if (papel !== 'monitor') throw new ErroMonitoria(403, 'Só o monitor pode confirmar.')
  if (reserva.status !== 'aguardando_pagamento') throw new ErroMonitoria(409, 'Nada a confirmar agora.')
  const c = await cols()
  const pagos = await c.participacoes.countDocuments({ reservaId: idDe(reserva), status: 'paga' })
  if (pagos === 0) throw new ErroMonitoria(409, 'Ninguém pagou ainda.')
  if (!(await garantirBlocos(reserva))) {
    throw new ErroMonitoria(409, 'O horário desta aula não está mais travado na sua agenda (outra reserva ocupou). Cancele para reembolsar quem pagou, ou fale com o suporte.')
  }
  const atualizada = await transitar(c, reserva, 'confirmada')
  await Promise.all([
    firmarBlocos(idDe(reserva)),
    c.participacoes.updateMany(
      { reservaId: idDe(reserva), status: { $in: ['aguardando_assinatura', 'aguardando_pagamento'] } },
      { $set: { status: 'expirada', updatedAt: new Date() } },
    ),
    rescindirContratosDaReserva(idDe(reserva)),
  ])
  await avisarConfirmacao(atualizada)
}

// ─── Cancelamento ───────────────────────────────────────────────────────

export async function cancelar(input: {
  reserva: Reserva
  ator: UsuarioMonitoria
  papel: Papel
  motivo: string
}): Promise<{ resultado: 'cancelada' | 'reembolsada' | 'suporte'; ticketId?: string }> {
  const { reserva, papel, motivo } = input
  const c = await cols()
  const id = idDe(reserva)
  const atorId = String(input.ator._id)

  // O organizador de um grupo em que OUTROS alunos já entraram não derruba a
  // aula de todo mundo: ele sai só do próprio assento, como um membro.
  let papelEfetivo = papel
  if (papel === 'organizador') {
    const outros = await c.participacoes.countDocuments({
      reservaId: id,
      alunoId: { $ne: atorId },
      status: { $in: ['aguardando_assinatura', 'aguardando_pagamento', 'paga', 'gratis'] },
    })
    if (outros > 0) papelEfetivo = 'membro'
  }

  // Membro do grupo sai só do próprio assento.
  if (papelEfetivo === 'membro') {
    const part = await c.participacoes.findOne({ reservaId: id, alunoId: atorId })
    if (!part) throw new ErroMonitoria(404, 'Não encontrado.')
    // Reembolso que ficou no meio (o Mercado Pago falhou): clicar de novo RETOMA, nunca descarta.
    if (part.status === 'reembolso_processando') {
      const pendente = part.reembolsos.find((x) => x.status === 'processando')
      const r = await reembolsarParticipacao({
        participacaoId: idDe(part),
        valorBaseCentavos: pendente ? pendente.valorCentavos : null,
        motivo: pendente?.motivo || `Cancelado pelo aluno: ${motivo}`,
        por: pendente?.por || atorId,
      })
      if (!r.ok) throw new ErroMonitoria(502, r.erro)
      return { resultado: 'reembolsada' }
    }
    if (['reembolsada', 'chargeback', 'cancelada', 'expirada'].includes(part.status)) {
      throw new ErroMonitoria(409, 'Você já saiu desta monitoria.')
    }
    if (part.cancelamentoPedidoEm) {
      throw new ErroMonitoria(409, 'Seu pedido de cancelamento já está com o suporte. Você recebe a decisão por e-mail.')
    }
    const decisao = decidirCancelamento({ ator: 'aluno', status: reserva.status, inicio: reserva.inicio, agora: new Date(), haPagamento: part.status === 'paga', pagoEm: part.pagoEm })
    if (decisao.tipo === 'proibido') throw new ErroMonitoria(409, decisao.motivo)
    if (decisao.tipo === 'suporte') {
      // Um pedido por assento (marca atômica) — e o repasse dele fica retido até a decisão.
      const marcou = await c.participacoes.updateOne(
        { _id: part._id as any, cancelamentoPedidoEm: { $exists: false } } as any,
        { $set: { cancelamentoPedidoEm: new Date(), updatedAt: new Date() } },
      )
      if (!marcou.modifiedCount) throw new ErroMonitoria(409, 'Seu pedido de cancelamento já está com o suporte.')
      const ticketId = await abrirTicket({ reserva, autor: input.ator, motivo: `Cancelamento com menos de 24h (assento de ${part.alunoNome}): ${motivo}`, participacaoId: idDe(part) })
      await c.participacoes.updateOne({ _id: part._id as any }, { $set: { cancelamentoTicketId: ticketId } })
      return { resultado: 'suporte', ticketId }
    }
    if (decisao.tipo === 'reembolso_total') {
      const r = await reembolsarParticipacao({
        participacaoId: idDe(part),
        valorBaseCentavos: null,
        motivo: `${decisao.arrependimento ? 'Direito de arrependimento (art. 49 do CDC)' : 'Cancelado pelo aluno'}: ${motivo}`,
        por: atorId,
      })
      if (!r.ok) throw new ErroMonitoria(502, r.erro)
      return { resultado: 'reembolsada' }
    }
    // Só assento sem dinheiro vira "cancelada" (o filtro de status impede apagar um pago por corrida).
    const saiu = await c.participacoes.updateOne(
      { _id: part._id as any, status: { $in: ['aguardando_assinatura', 'aguardando_pagamento', 'gratis'] } } as any,
      { $set: { status: 'cancelada', updatedAt: new Date() } },
    )
    if (!saiu.modifiedCount) throw new ErroMonitoria(409, 'Seu assento mudou agora (o pagamento pode ter acabado de cair). Recarregue a página.')
    await c.contratos.updateOne({ participacaoId: idDe(part), status: 'aguardando_assinaturas' }, { $set: { status: 'rescindido', updatedAt: new Date() } })
    return { resultado: 'cancelada' }
  }

  const pagas = await c.participacoes
    .find({ reservaId: id, status: { $in: ['paga', 'reembolso_processando'] } }, { projection: { pagoEm: 1 } })
    .toArray()
  const ator = papel === 'monitor' ? 'monitor' : 'aluno'
  const primeiroPagamento = pagas.map((x) => x.pagoEm).filter(Boolean).sort((a, b) => +a! - +b!)[0]
  const decisao = decidirCancelamento({
    ator,
    status: reserva.status,
    inicio: reserva.inicio,
    agora: new Date(),
    haPagamento: pagas.length > 0,
    pagoEm: primeiroPagamento,
  })
  if (decisao.tipo === 'proibido') throw new ErroMonitoria(409, decisao.motivo)

  if (decisao.tipo === 'suporte') {
    const atualizada = await transitar(c, reserva, 'em_disputa', {
      disputa: { abertaPor: atorId, em: new Date(), motivo: `Cancelamento com menos de 24h: ${motivo}` },
    })
    const ticketId = await abrirTicket({ reserva: atualizada, autor: input.ator, motivo: `Cancelamento com menos de 24h: ${motivo}` })
    await c.reservas.updateOne({ _id: reserva._id as any }, { $set: { ticketId } })
    await avisar([
      {
        userId: reserva.tutorUserId,
        titulo: 'Pedido de cancelamento em análise',
        mensagem: `O aluno pediu para cancelar "${reserva.anuncioTitulo}" com menos de 24h. O suporte vai decidir.`,
        url: urlReserva(id),
      },
    ])
    return { resultado: 'suporte', ticketId }
  }

  const para: StatusReserva = papel === 'monitor' ? 'cancelada_monitor' : 'cancelada_aluno'
  await transitar(c, reserva, para, { motivoCancelamento: motivo, canceladaPor: atorId })
  await Promise.all([
    liberarBlocos(id),
    rescindirContratosDaReserva(id),
    c.cotasGratis.deleteMany({ reservaId: id }),
    c.participacoes.updateMany(
      { reservaId: id, status: { $in: ['aguardando_assinatura', 'aguardando_pagamento', 'gratis'] } },
      { $set: { status: 'cancelada', updatedAt: new Date() } },
    ),
  ])
  // Também cobre o PIX que caiu no mesmo instante do cancelamento (decidido
  // como "sem pagamento" com uma leitura de antes): quem pagou é reembolsado.
  const pagouAgora = decisao.tipo !== 'reembolso_total' && (await c.participacoes.countDocuments({ reservaId: id, status: 'paga' })) > 0
  if (decisao.tipo === 'reembolso_total' || pagouAgora) {
    const porque =
      papel === 'monitor'
        ? 'Cancelado pelo monitor'
        : decisao.tipo === 'reembolso_total' && decisao.arrependimento
          ? 'Direito de arrependimento (art. 49 do CDC)'
          : pagouAgora
            ? 'Reserva cancelada antes da confirmação do pagamento'
            : 'Cancelado pelo aluno com 24h+ de antecedência'
    await reembolsarReserva(id, `${porque}: ${motivo}`, atorId)
  }
  // Termos 7.2: monitor que cancela aula com pagamento recebe strike (grupo parcial inclusive).
  if (papel === 'monitor' && (decisao.tipo === 'reembolso_total' || pagouAgora)) await registrarStrike(c, reserva, `Cancelou: ${motivo}`)

  const outros = papel === 'monitor' ? await alunosDaReserva(c, id) : [reserva.tutorUserId]
  await avisar(
    outros.map((userId) => ({
      userId,
      titulo: 'Monitoria cancelada',
      mensagem: `"${reserva.anuncioTitulo}" foi cancelada${papel === 'monitor' ? ' pelo monitor' : ' pelo aluno'}.`,
      url: urlReserva(id),
      email: {
        assunto: `Monitoria cancelada: ${reserva.anuncioTitulo}`,
        paragrafos: [
          `A monitoria "${reserva.anuncioTitulo}" foi cancelada${papel === 'monitor' ? ' pelo monitor' : ' pelo aluno'}.`,
          decisao.tipo === 'reembolso_total' && papel === 'monitor' ? 'Seu reembolso integral foi solicitado automaticamente ao Mercado Pago.' : '',
        ].filter(Boolean),
        linhas: [['Motivo', motivo]],
        botao: 'Ver detalhes',
      },
    })),
  )
  return { resultado: decisao.tipo === 'reembolso_total' ? 'reembolsada' : 'cancelada' }
}

async function alunosDaReserva(c: Colecoes, reservaId: string): Promise<string[]> {
  const parts = await c.participacoes.find({ reservaId }, { projection: { alunoId: 1 } }).toArray()
  return Array.from(new Set(parts.map((p) => p.alunoId)))
}

export async function registrarStrike(c: Colecoes, reserva: Reserva, motivo: string): Promise<void> {
  const tutor = await c.tutores.findOneAndUpdate(
    { _id: new ObjectId(reserva.tutorId) } as any,
    { $push: { strikes: { em: new Date(), reservaId: idDe(reserva), motivo } }, $set: { updatedAt: new Date() } },
    { returnDocument: 'after' },
  )
  if (tutor && strikesRecentes(tutor.strikes, new Date()) >= STRIKES_PARA_SUSPENDER && tutor.status === 'ativo') {
    await c.tutores.updateOne({ _id: tutor._id as any }, { $set: { status: 'suspenso', updatedAt: new Date() } })
    await c.anuncios.updateMany({ tutorId: idDe(tutor), status: { $in: ['publicado', 'pausado', 'em_analise'] } } as any, { $set: { status: 'suspenso', updatedAt: new Date() } })
    await audit({ action: 'monitoria_tutor_status', targetUserId: tutor.userId, resourceType: 'monitoria_tutor', resourceId: idDe(tutor), metadata: { motivo: 'strikes', strikes: tutor.strikes.length } })
    await avisar([
      {
        userId: tutor.userId,
        titulo: 'Perfil de monitor suspenso',
        mensagem: 'Você atingiu 3 cancelamentos/faltas em 90 dias. Seus anúncios foram pausados.',
        url: '/monitorias/painel',
        email: {
          assunto: 'Seu perfil de monitor foi suspenso',
          paragrafos: [
            'Pelos Termos de Serviço, 3 cancelamentos ou faltas em 90 dias suspendem o perfil de monitor e pausam os anúncios.',
            'Se acha que houve engano, abra um ticket no suporte.',
          ],
        },
      },
    ])
  }
}

// ─── Reporte de problema / disputa ──────────────────────────────────────

export async function reportarProblema(input: { reserva: Reserva; autor: UsuarioMonitoria; papel: Papel; motivo: string }): Promise<string> {
  const { reserva, papel } = input
  if (papel === 'monitor') throw new ErroMonitoria(403, 'Monitor fala com o suporte pela Central de Ajuda.')
  if (!['confirmada', 'realizada'].includes(reserva.status)) throw new ErroMonitoria(409, 'Não é possível reportar problema nesta etapa.')
  // Só quem tem assento pago/grátis desta aula trava o repasse com uma disputa.
  if (!(await assentoPago(reserva, String(input.autor._id)))) throw new ErroMonitoria(403, 'Só quem participa (com pagamento confirmado) pode reportar problema nesta aula.')
  if (!podeReportar(reserva.fim, new Date(), reserva.inicio)) {
    throw new ErroMonitoria(409, 'Problemas podem ser reportados a partir de 15 minutos depois do início e até 48 horas após o fim da aula.')
  }
  const c = await cols()
  const atualizada = await transitar(c, reserva, 'em_disputa', {
    disputa: { abertaPor: String(input.autor._id), em: new Date(), motivo: input.motivo },
  })
  const ticketId = await abrirTicket({ reserva: atualizada, autor: input.autor, motivo: `Problema reportado: ${input.motivo}` })
  await c.reservas.updateOne({ _id: reserva._id as any }, { $set: { ticketId } })
  await avisar([
    {
      userId: reserva.tutorUserId,
      titulo: 'Problema reportado na monitoria',
      mensagem: `Um aluno reportou problema em "${reserva.anuncioTitulo}". O valor fica retido até o suporte decidir.`,
      url: urlReserva(idDe(reserva)),
      email: {
        assunto: `Problema reportado: ${reserva.anuncioTitulo}`,
        paragrafos: ['Um aluno reportou um problema nesta monitoria. O valor fica retido até a análise do suporte.', 'Se quiser, responda no chat da reserva com a sua versão.'],
        linhas: [['Relato', input.motivo.slice(0, 400)]],
        botao: 'Ver reserva',
      },
    },
  ])
  return ticketId
}

/** Abre ticket no suporte já existente (`tickets`), apontando para a reserva, e avisa os admins. */
async function abrirTicket(input: { reserva: Reserva; autor: UsuarioMonitoria; motivo: string; participacaoId?: string }): Promise<string> {
  const db = await getDb()
  const agora = new Date()
  const _id = new ObjectId()
  const ticketId = String(_id)
  const protocolo = protocoloDoTicket(ticketId)
  const titulo = `Monitoria: ${input.reserva.anuncioTitulo}`.slice(0, 120)
  const ticket: Ticket & { _id: ObjectId } = {
    _id,
    userId: String(input.autor._id),
    userName: input.autor.name,
    userEmail: input.autor.email,
    title: titulo,
    category: 'financeiro',
    priority: 'high',
    status: 'open',
    messages: [
      novaMensagem({
        senderId: String(input.autor._id),
        senderName: input.autor.name,
        senderRole: 'user',
        text: input.motivo.slice(0, 3500),
        sentAt: agora,
      }),
      mensagemDoSistemaDoTicket(
        `Ticket #${protocolo} aberto pela seção Monitorias. Reserva: /monitorias/reservas/${idDe(input.reserva)}${
          input.participacaoId ? ` · assento ${input.participacaoId}` : ''
        }. O valor da aula fica retido em garantia até a decisão do suporte.`,
      ),
    ],
    createdAt: agora,
    updatedAt: agora,
  }
  await db.collection<Ticket>('tickets').insertOne(ticket as Ticket)
  const admins = await db.collection('users').find({ role: 'admin' }, { projection: { _id: 1 } }).limit(20).toArray()
  if (admins.length) {
    await db.collection('notifications').insertMany(
      admins.map((a) => ({
        userId: String(a._id),
        type: 'ticket_created',
        message: `Monitoria em disputa (#${protocolo}): "${input.reserva.anuncioTitulo}"`,
        ticketId,
        ticketTitle: titulo,
        read: false,
        createdAt: agora,
      })),
    )
  }
  return ticketId
}
