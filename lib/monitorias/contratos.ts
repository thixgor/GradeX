import 'server-only'

/**
 * Contratos: emissão (dados congelados + hash), assinatura e consulta.
 *
 * Quem precisa assinar cada contrato:
 *  - Aluno: sempre, com código por e-mail.
 *  - Monitor:
 *      · agendamento direto → já assinou a oferta-padrão do anúncio;
 *      · aluno que entra depois num grupo → vale a assinatura do monitor no
 *        contrato do organizador (mesmas condições);
 *      · negociação → assina com código por e-mail, como o aluno.
 */

import { randomBytes } from 'crypto'
import { ObjectId } from 'mongodb'
import { getDb } from '@/lib/mongodb'
import { onlyCpfDigits } from '@/lib/cpf'
import { dividirValor } from './dinheiro'
import { colecoes, idDe } from './db'
import { hashDoContrato, intermediadoraAtual, secoesDoContrato, VERSAO_CONTRATO } from './documentos/contrato'
import type { UsuarioMonitoria } from './servidor'
import type { Anuncio, Contrato, DadosContrato, EvidenciaAssinatura, Participacao, Reserva } from './tipos'

const ALFABETO_VERIFICACAO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function codigoDeVerificacao(): string {
  const bytes = randomBytes(10)
  return Array.from(bytes, (b) => ALFABETO_VERIFICACAO[b % ALFABETO_VERIFICACAO.length]).join('')
}

async function proximoNumero(): Promise<string> {
  const db = await getDb()
  const ano = new Date().getUTCFullYear()
  const contador = await db
    .collection<{ _id: string; valor: number }>('monitorias_contadores')
    .findOneAndUpdate({ _id: `contrato:${ano}` }, { $inc: { valor: 1 } }, { upsert: true, returnDocument: 'after' })
  return `DA-MON-${ano}-${String(contador?.valor ?? 1).padStart(6, '0')}`
}

export function nomeCivil(user: Pick<UsuarioMonitoria, 'fullName' | 'name'>): string {
  return (user.fullName || user.name || '').trim()
}

export async function emitirContrato(input: {
  reserva: Reserva
  participacao: Participacao
  anuncio: Pick<Anuncio, '_id' | 'titulo' | 'materia' | 'ofertaAssinada'>
  aluno: UsuarioMonitoria
  monitor: UsuarioMonitoria
  /** Assinatura do monitor que já vale para este contrato (oferta ou reserva). */
  assinaturaPrevia?: Omit<EvidenciaAssinatura, 'hash'>
}): Promise<Contrato> {
  const { reserva, participacao, anuncio, aluno, monitor } = input
  const db = await getDb()
  const c = colecoes(db)
  const proposta = reserva.proposta!
  const fim = new Date(proposta.inicio.getTime() + proposta.duracaoMin * 60_000)
  const numero = await proximoNumero()
  const dados: DadosContrato = {
    numero,
    modeloVersao: VERSAO_CONTRATO,
    contratante: {
      userId: String(aluno._id),
      nome: nomeCivil(aluno),
      cpf: onlyCpfDigits(aluno.cpf || ''),
      email: aluno.email,
    },
    contratado: {
      userId: String(monitor._id),
      nome: nomeCivil(monitor),
      cpf: onlyCpfDigits(monitor.cpf || ''),
      email: monitor.email,
    },
    anuncio: { id: idDe(anuncio), titulo: anuncio.titulo, materia: anuncio.materia },
    conteudos: proposta.conteudos,
    inicio: proposta.inicio.toISOString(),
    fim: fim.toISOString(),
    duracaoMin: proposta.duracaoMin,
    vagas: proposta.vagas,
    valorCentavos: participacao.valorCentavos,
    taxaPlataformaCentavos: dividirValor(participacao.valorCentavos).taxaPlataformaCentavos,
    gratis: proposta.gratis,
    origem: reserva.origem,
    emitidoEm: new Date().toISOString(),
    intermediadora: intermediadoraAtual(),
  }
  const secoes = secoesDoContrato(dados)
  const hash = hashDoContrato(dados, secoes)
  const assinaturas: EvidenciaAssinatura[] = input.assinaturaPrevia ? [{ ...input.assinaturaPrevia, hash, vinculadaEm: new Date() }] : []
  const agora = new Date()
  const contrato: Contrato = {
    numero,
    reservaId: idDe(reserva),
    participacaoId: idDe(participacao),
    contratanteId: String(aluno._id),
    contratadoId: String(monitor._id),
    dados,
    secoes,
    hash,
    assinaturas,
    status: 'aguardando_assinaturas',
    codigoVerificacao: codigoDeVerificacao(),
    createdAt: agora,
    updatedAt: agora,
  }
  const res = await c.contratos.insertOne(contrato as any)
  contrato._id = res.insertedId
  await c.participacoes.updateOne({ _id: participacao._id as any }, { $set: { contratoId: String(res.insertedId), updatedAt: agora } })
  return contrato
}

export function quemFaltaAssinar(contrato: Contrato): Array<'contratante' | 'contratado'> {
  const feitos = new Set(contrato.assinaturas.map((a) => a.papel))
  return (['contratante', 'contratado'] as const).filter((p) => !feitos.has(p))
}

export type ResultadoAssinatura =
  | { ok: true; contrato: Contrato; completo: boolean }
  | { ok: false; status: number; erro: string }

/**
 * Grava a assinatura. `hashVisto` é o hash que a tela mostrou: se o contrato
 * mudou depois que a pessoa leu (nova proposta, por exemplo), a assinatura é
 * recusada — ninguém assina um texto diferente do que viu.
 */
export async function assinarContrato(input: {
  contratoId: string
  userId: string
  nome: string
  hashVisto: string
  ip: string
  userAgent: string
}): Promise<ResultadoAssinatura> {
  const c = colecoes(await getDb())
  if (!ObjectId.isValid(input.contratoId)) return { ok: false, status: 404, erro: 'Não encontrado.' }
  const contrato = await c.contratos.findOne({ _id: new ObjectId(input.contratoId) as any })
  if (!contrato) return { ok: false, status: 404, erro: 'Não encontrado.' }
  const papel =
    contrato.contratanteId === input.userId ? 'contratante' : contrato.contratadoId === input.userId ? 'contratado' : null
  if (!papel) return { ok: false, status: 404, erro: 'Não encontrado.' }
  if (contrato.status !== 'aguardando_assinaturas') return { ok: false, status: 409, erro: 'Este contrato não aceita mais assinaturas.' }
  if (contrato.hash !== input.hashVisto) {
    return { ok: false, status: 409, erro: 'O contrato mudou desde que você o abriu. Recarregue e leia de novo.' }
  }
  if (contrato.assinaturas.some((a) => a.papel === papel)) {
    return { ok: true, contrato, completo: quemFaltaAssinar(contrato).length === 0 }
  }
  const evidencia: EvidenciaAssinatura = {
    userId: input.userId,
    papel,
    nome: input.nome,
    em: new Date(),
    ip: input.ip,
    userAgent: input.userAgent,
    metodo: 'codigo_email',
    hash: contrato.hash,
  }
  // CAS: só grava se ainda está aguardando, com o mesmo hash e sem assinatura deste papel.
  const atualizado = await c.contratos.findOneAndUpdate(
    { _id: contrato._id as any, status: 'aguardando_assinaturas', hash: contrato.hash, 'assinaturas.papel': { $ne: papel } },
    { $push: { assinaturas: evidencia }, $set: { updatedAt: new Date() } },
    { returnDocument: 'after' },
  )
  if (!atualizado) return { ok: false, status: 409, erro: 'Não foi possível assinar agora. Recarregue a página.' }
  const completo = quemFaltaAssinar(atualizado).length === 0
  if (completo) {
    await c.contratos.updateOne({ _id: atualizado._id as any, status: 'aguardando_assinaturas' }, { $set: { status: 'assinado', updatedAt: new Date() } })
    atualizado.status = 'assinado'
  }
  return { ok: true, contrato: atualizado, completo }
}

export async function rescindirContratosDaReserva(reservaId: string): Promise<void> {
  const c = colecoes(await getDb())
  await c.contratos.updateMany(
    { reservaId, status: 'aguardando_assinaturas' },
    { $set: { status: 'rescindido', updatedAt: new Date() } },
  )
}
