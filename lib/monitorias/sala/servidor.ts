import 'server-only'

/**
 * Operações da sala no servidor. Cada função aqui é chamada por UMA rota.
 *
 * ## O orçamento de banco
 *
 * - Entrar e renovar (raros: uma vez, e a cada ~10 min) leem reserva, assento e
 *   configuração e reconferem TODA a autorização.
 * - Ler sinais (a única operação repetida) é UMA ida ao Mongo: um `findOne` (ou
 *   `findOneAndUpdate`, quando é pulso de presença) com projeção que já filtra,
 *   lá dentro, só os sinais endereçados a quem pergunta.
 * - Enviar sinal é UMA escrita: incrementa a sequência, confere o limite de envio
 *   e empilha o sinal na fila, tudo no mesmo pipeline atômico.
 *
 * A sala NUNCA mexe na reserva: status, `versao`, pagamentos e repasses seguem
 * só as regras de `reservas.ts`/`varredura.ts`.
 */

import { randomBytes } from 'crypto'
import { ObjectId } from 'mongodb'
import { getDb } from '@/lib/mongodb'
import { colecoes, ehDuplicada, idDe } from '../db'
import { carregarReserva, papelPeloAssento } from '../reservas'
import { avisar } from '../avisos'
import type { ConfigSala, PapelNaSala, Reserva, Sala } from '../tipos'
import { bytesDeRelayNoMes, configDaSala, mesDoUso } from './config'
import {
  ASSENTOS_COM_AULA,
  avaliarAcessoSala,
  ENVIOS_POR_MINUTO,
  janelaDaSala,
  FECHA_DEPOIS_MIN,
  FILA_DE_SINAIS,
  presente,
  primeiroNome,
  salaCheia,
  SINAL_TTL_MS,
  situacaoDoTurn,
  statusHttpDaRecusa,
  TOKEN_TTL_MS,
  ttlDoTurnSegundos,
  type MotivoRecusa,
  type ResultadoAcesso,
} from './regras'
import { emitirTokenDaSala, pidDe, vinculoDaSessao, type ClaimsDaSala } from './token'
import { gerarCredenciaisTurn, STUN_PADRAO, turnConfigurado, type ServidorIce } from './turn'
import type { CredenciaisDaSala, EstadoDoSaguao, ParticipanteVisivel, RespostaDoSinal, RetratoDaSala, UsoDaConexao } from './mensagens'
import type { EnvioValidado } from './esquemas'

export interface SessaoDaSala {
  userId: string
  jti?: string
  iat?: number
}

export interface Recusa {
  ok: false
  status: number
  motivo: MotivoRecusa | 'substituida' | 'token'
  mensagem: string
  abreEm?: string
  fechaEm?: string
}

const PROJECAO_SALA = { participantes: 1, versao: 1, seq: 1, esperados: 1, encerradaEm: 1, fim: 1, avisouEntradaMonitor: 1 } as const
type SalaLida = Pick<Sala, 'participantes' | 'versao' | 'seq' | 'esperados' | 'encerradaEm' | 'fim' | 'avisouEntradaMonitor'>

function recusaDe(acesso: Extract<ResultadoAcesso, { ok: false }>): Recusa {
  return {
    ok: false,
    status: statusHttpDaRecusa(acesso.motivo),
    motivo: acesso.motivo,
    mensagem: acesso.mensagem,
    abreEm: acesso.abreEm?.toISOString(),
    fechaEm: acesso.fechaEm?.toISOString(),
  }
}

const SUBSTITUIDA: Recusa = {
  ok: false,
  status: 409,
  motivo: 'substituida',
  mensagem: 'Você abriu a aula em outra aba ou aparelho. Esta janela saiu da sala.',
}

const TOKEN_INVALIDO: Recusa = { ok: false, status: 401, motivo: 'token', mensagem: 'Sua entrada na sala venceu. Entre de novo.' }

// ─── Contexto: tudo que a autorização precisa, numa leva só ────────────

interface Contexto {
  reserva: Reserva
  reservaId: string
  acesso: ResultadoAcesso
  nome: string
  config: ConfigSala
  sala: SalaLida | null
  esperados: number
}

async function contexto(reservaId: string, userId: string, agora: Date): Promise<Contexto> {
  const reserva = await carregarReserva(reservaId)
  const id = idDe(reserva)
  const ehMonitor = reserva.tutorUserId === userId
  const c = colecoes(await getDb())
  const [part, tutor, config, sala, comAula] = await Promise.all([
    ehMonitor
      ? null
      : c.participacoes.findOne({ reservaId: id, alunoId: userId }, { projection: { status: 1, valorCentavos: 1, reembolsos: 1, alunoNome: 1 } }),
    ehMonitor ? c.tutores.findOne({ _id: new ObjectId(reserva.tutorId) } as any, { projection: { nome: 1 } }) : null,
    configDaSala(),
    c.salas.findOne({ _id: id }, { projection: PROJECAO_SALA }) as Promise<SalaLida | null>,
    c.participacoes.countDocuments({ reservaId: id, status: { $in: ASSENTOS_COM_AULA } } as any),
  ])
  const acesso = avaliarAcessoSala({
    ehMonitor,
    assento: part ? { status: part.status, ativo: !!papelPeloAssento(reserva, userId, part) } : null,
    status: reserva.status,
    inicio: reserva.inicio,
    fim: reserva.fim,
    disputaEm: reserva.disputa?.em,
    encerradaEm: sala?.encerradaEm,
    agora,
    config,
  })
  return {
    reserva,
    reservaId: id,
    acesso,
    nome: (ehMonitor ? tutor?.nome : part?.alunoNome) || 'Participante',
    config,
    sala,
    esperados: Math.min(config.limiteMalha, 1 + comAula),
  }
}

function fechaEmDe(sala: Pick<Sala, 'fim'>): Date {
  return new Date(new Date(sala.fim).getTime() + FECHA_DEPOIS_MIN * 60_000)
}

/** O que cada participante pode ver dos outros: id opaco, papel, nome e presença. */
export function retratoDaSala(sala: SalaLida, meuPid: string, leitor: PapelNaSala, agora: Date): RetratoDaSala {
  const participantes: ParticipanteVisivel[] = []
  for (const [pid, p] of Object.entries(sala.participantes || {})) {
    const eu = pid === meuPid
    const aqui = presente(p, agora)
    if (!aqui && !eu) continue
    participantes.push({
      pid,
      papel: p.papel,
      // O monitor vê o nome completo dos alunos (como no resto das monitorias);
      // entre alunos, só o primeiro nome. O nome do monitor é público no anúncio.
      nome: leitor === 'monitor' || p.papel === 'monitor' ? p.nome : primeiroNome(p.nome),
      presente: aqui,
      cx: aqui ? p.conexao : null,
      eu,
    })
  }
  return {
    seq: sala.seq || 0,
    versao: sala.versao || 0,
    participantes,
    esperados: sala.esperados || 2,
    encerrada: !!sala.encerradaEm,
    fechaEm: fechaEmDe(sala).toISOString(),
  }
}

// ─── Saguão: o estado antes de entrar ──────────────────────────────────

export async function estadoDoSaguao(reservaId: string, userId: string, agora: Date): Promise<EstadoDoSaguao | null> {
  const ctx = await contexto(reservaId, userId, agora)
  if (!ctx.acesso.ok && ctx.acesso.motivo === 'sem_acesso') return null
  const papel: PapelNaSala = ctx.reserva.tutorUserId === userId ? 'monitor' : 'aluno'
  const meuPid = pidDe(ctx.reservaId, userId)
  const presentes = ctx.sala
    ? Object.entries(ctx.sala.participantes || {})
        .filter(([pid, p]) => pid !== meuPid && presente(p, agora))
        .map(([, p]) => ({ papel: p.papel, nome: papel === 'monitor' || p.papel === 'monitor' ? p.nome : primeiroNome(p.nome) }))
    : []
  const a = ctx.acesso
  return {
    acesso: a.ok
      ? { ok: true, motivo: null, mensagem: null, abreEm: a.abreEm.toISOString(), fechaEm: a.fechaEm.toISOString() }
      : { ok: false, motivo: a.motivo, mensagem: a.mensagem, abreEm: a.abreEm?.toISOString() || null, fechaEm: a.fechaEm?.toISOString() || null },
    papel,
    reserva: { id: ctx.reservaId, titulo: ctx.reserva.anuncioTitulo, inicio: ctx.reserva.inicio?.toISOString() || null, fim: ctx.reserva.fim?.toISOString() || null },
    presentes,
    config: { compartilharTela: ctx.config.compartilharTela, chatNaSala: ctx.config.chatNaSala },
    linkReuniao: ctx.config.linkExternoPermitido ? ctx.reserva.linkReuniao || null : null,
  }
}

// ─── Entrar ────────────────────────────────────────────────────────────

async function iceServersPara(config: ConfigSala, agora: Date, fechaEm: Date): Promise<{ servidores: ServidorIce[]; usuario: string | null }> {
  if (!config.turnAtivo || !turnConfigurado()) return { servidores: [STUN_PADRAO], usuario: null }
  const situacao = situacaoDoTurn({ config, configurado: true, bytesNoMes: await bytesDeRelayNoMes(agora) })
  if (situacao !== 'ativo') return { servidores: [STUN_PADRAO], usuario: null }
  const cred = await gerarCredenciaisTurn(ttlDoTurnSegundos(agora, fechaEm))
  if (!cred) return { servidores: [STUN_PADRAO], usuario: null }
  const temStun = cred.servidores.some((s) => (Array.isArray(s.urls) ? s.urls : [s.urls]).some((u) => u.startsWith('stun')))
  return { servidores: temStun ? cred.servidores : [STUN_PADRAO, ...cred.servidores], usuario: cred.usuario }
}

export async function entrarNaSala(reservaId: string, sessao: SessaoDaSala, agora = new Date()): Promise<CredenciaisDaSala | Recusa> {
  const ctx = await contexto(reservaId, sessao.userId, agora)
  if (!ctx.acesso.ok) return recusaDe(ctx.acesso)
  const { papel, abreEm, fechaEm } = ctx.acesso
  const pid = pidDe(ctx.reservaId, sessao.userId)
  if (ctx.sala && salaCheia(ctx.sala.participantes || {}, pid, ctx.config.limiteMalha, agora)) {
    return { ok: false, status: 409, motivo: 'cheia', mensagem: `A sala comporta ${ctx.config.limiteMalha} pessoas ao mesmo tempo e já está completa.` }
  }

  // Credencial TURN antes de gravar: o usuário dela fica no participante, para o
  // "cortar agora" do admin poder revogar.
  const ice = await iceServersPara(ctx.config, agora, fechaEm)
  const cx = randomBytes(12).toString('base64url')
  const P = `participantes.${pid}`
  const c = colecoes(await getDb())
  const gravar = () =>
    c.salas.findOneAndUpdate(
      { _id: ctx.reservaId },
      {
        $setOnInsert: { seq: 0, sinais: [], createdAt: agora },
        $set: {
          fim: ctx.reserva.fim!,
          esperados: ctx.esperados,
          updatedAt: agora,
          [`${P}.uid`]: sessao.userId,
          [`${P}.papel`]: papel,
          [`${P}.nome`]: ctx.nome,
          [`${P}.conexao`]: cx,
          [`${P}.entrouEm`]: agora,
          [`${P}.vistoEm`]: agora,
          ...(ice.usuario ? { [`${P}.turnUsuario`]: ice.usuario } : {}),
        },
        $unset: { [`${P}.saiuEm`]: '' },
        $inc: { versao: 1, [`${P}.epoca`]: 1 },
        $push: { registro: { $each: [{ id: cx, pid, papel, entrou: agora, ate: agora }], $slice: -200 } },
      } as any,
      { upsert: true, returnDocument: 'after', projection: PROJECAO_SALA },
    ) as Promise<SalaLida | null>
  let sala: SalaLida | null
  try {
    sala = await gravar()
  } catch (err) {
    // Duas primeiras entradas no mesmo instante: a segunda perde o upsert e repete.
    if (!ehDuplicada(err)) throw err
    sala = await gravar()
  }
  if (!sala) throw new Error('sala não gravada')
  const ep = sala.participantes[pid]?.epoca || 1

  if (papel === 'monitor' && !sala.avisouEntradaMonitor) await avisarEntradaDoMonitor(ctx.reservaId, ctx.reserva.anuncioTitulo, sala, agora)

  const expiraEm = new Date(Math.min(agora.getTime() + TOKEN_TTL_MS, fechaEm.getTime()))
  const token = await emitirTokenDaSala({ sala: ctx.reservaId, uid: sessao.userId, pid, papel, cx, ep, sj: vinculoDaSessao(sessao) }, expiraEm)
  return {
    token,
    expiraEm: expiraEm.toISOString(),
    eu: { pid, papel, nome: ctx.nome, cx, ep },
    iceServers: ice.servidores as RTCIceServer[],
    turn: !!ice.usuario,
    sala: retratoDaSala(sala, pid, papel, agora),
    config: { compartilharTela: ctx.config.compartilharTela, chatNaSala: ctx.config.chatNaSala, limiteMalha: ctx.config.limiteMalha },
    janela: { inicio: ctx.reserva.inicio!.toISOString(), fim: ctx.reserva.fim!.toISOString(), abreEm: abreEm.toISOString(), fechaEm: fechaEm.toISOString() },
    reserva: { id: ctx.reservaId, titulo: ctx.reserva.anuncioTitulo },
  }
}

/** Um aviso no sino por aula, para quem ainda não está na sala (sem e-mail). */
async function avisarEntradaDoMonitor(reservaId: string, titulo: string, sala: SalaLida, agora: Date): Promise<void> {
  const c = colecoes(await getDb())
  const marcou = await c.salas.updateOne({ _id: reservaId, avisouEntradaMonitor: { $exists: false } }, { $set: { avisouEntradaMonitor: agora } })
  if (!marcou.modifiedCount) return
  const naSala = new Set(Object.values(sala.participantes || {}).filter((p) => presente(p, agora)).map((p) => p.uid))
  const alunos = await c.participacoes.find({ reservaId, status: { $in: ASSENTOS_COM_AULA } } as any, { projection: { alunoId: 1 } }).toArray()
  const avisos = alunos
    .filter((a) => !naSala.has(a.alunoId))
    .map((a) => ({ userId: a.alunoId, titulo: 'O monitor entrou na sala', mensagem: `"${titulo}": a aula já pode começar.`, url: `/monitorias/reservas/${reservaId}/sala` }))
  await avisar(avisos)
}

// ─── Renovar ───────────────────────────────────────────────────────────

/**
 * Reconfere tudo (reembolso, banimento, fim do horário, aula encerrada) e
 * devolve um token novo. É a autorização "viva" da chamada: se a resposta for
 * recusa, a aula termina na tela com o motivo.
 */
export async function renovarNaSala(
  reservaId: string,
  sessao: SessaoDaSala,
  claims: ClaimsDaSala | null,
  uso: UsoDaConexao | undefined,
  agora = new Date(),
): Promise<{ token: string; expiraEm: string; sala: RetratoDaSala } | Recusa> {
  if (!claims || claims.sala !== reservaId || claims.uid !== sessao.userId || claims.sj !== vinculoDaSessao(sessao)) return TOKEN_INVALIDO
  const ctx = await contexto(reservaId, sessao.userId, agora)
  if (!ctx.acesso.ok) return recusaDe(ctx.acesso)
  const P = `participantes.${claims.pid}`
  const c = colecoes(await getDb())
  const [sala] = await Promise.all([
    c.salas.findOneAndUpdate(
      { _id: ctx.reservaId, [`${P}.conexao`]: claims.cx, [`${P}.epoca`]: claims.ep } as any,
      {
        $set: {
          [`${P}.vistoEm`]: agora,
          esperados: ctx.esperados,
          'registro.$[r].ate': agora,
          ...(uso?.tipo ? { 'registro.$[r].conexaoTipo': uso.tipo } : {}),
        },
      } as any,
      { arrayFilters: [{ 'r.id': claims.cx }], returnDocument: 'after', projection: PROJECAO_SALA },
    ) as Promise<SalaLida | null>,
    registrarUso(uso, agora),
  ])
  if (!sala) return SUBSTITUIDA
  const expiraEm = new Date(Math.min(agora.getTime() + TOKEN_TTL_MS, ctx.acesso.fechaEm.getTime()))
  const token = await emitirTokenDaSala({ ...claims }, expiraEm)
  return { token, expiraEm: expiraEm.toISOString(), sala: retratoDaSala(sala, claims.pid, claims.papel, agora) }
}

// ─── Sinais ────────────────────────────────────────────────────────────

export type ResultadoDaLeitura =
  | { ok: true; resposta: RespostaDoSinal; etag: string }
  | { ok: false; status: number; motivo: 'substituida' | 'fechada' | 'nao_encontrada'; mensagem: string }

export function etagDaSala(r: Pick<RetratoDaSala, 'seq' | 'versao' | 'encerrada'>): string {
  return `W/"s${r.seq}.v${r.versao}.e${r.encerrada ? 1 : 0}"`
}

/**
 * A volta do polling. `pulso` (a cada ~30 s no máximo) também carimba a
 * presença; as outras voltas só leem. Os sinais saem filtrados pelo próprio
 * Mongo: só os endereçados a quem pergunta, novos e com menos de 2 min.
 */
export async function lerSinais(claims: ClaimsDaSala, desde: number, pulso: boolean, agora = new Date()): Promise<ResultadoDaLeitura> {
  const c = colecoes(await getDb())
  const P = `participantes.${claims.pid}`
  const projection = {
    seq: 1,
    versao: 1,
    esperados: 1,
    encerradaEm: 1,
    fim: 1,
    participantes: 1,
    sinais: {
      $filter: {
        input: { $ifNull: ['$sinais', []] },
        as: 's',
        cond: {
          $and: [{ $eq: ['$$s.para', claims.pid] }, { $gt: ['$$s.seq', desde] }, { $gt: ['$$s.em', new Date(agora.getTime() - SINAL_TTL_MS)] }],
        },
      },
    },
  }
  let sala: (SalaLida & { sinais?: Sala['sinais'] }) | null
  if (pulso) {
    sala = (await c.salas.findOneAndUpdate(
      { _id: claims.sala, [`${P}.conexao`]: claims.cx, [`${P}.epoca`]: claims.ep } as any,
      { $set: { [`${P}.vistoEm`]: agora, 'registro.$[r].ate': agora } } as any,
      { arrayFilters: [{ 'r.id': claims.cx }], returnDocument: 'after', projection: projection as any },
    )) as any
    if (!sala) {
      const existe = await c.salas.findOne({ _id: claims.sala }, { projection: { _id: 1 } })
      return existe
        ? { ok: false, status: 409, motivo: 'substituida', mensagem: SUBSTITUIDA.mensagem }
        : { ok: false, status: 404, motivo: 'nao_encontrada', mensagem: 'Sala não encontrada.' }
    }
  } else {
    sala = (await c.salas.findOne({ _id: claims.sala }, { projection: projection as any })) as any
    if (!sala) return { ok: false, status: 404, motivo: 'nao_encontrada', mensagem: 'Sala não encontrada.' }
    const eu = sala.participantes?.[claims.pid]
    if (!eu || eu.conexao !== claims.cx || eu.epoca !== claims.ep) return { ok: false, status: 409, motivo: 'substituida', mensagem: SUBSTITUIDA.mensagem }
  }
  if (agora.getTime() > fechaEmDe(sala).getTime()) {
    return { ok: false, status: 410, motivo: 'fechada', mensagem: 'O horário desta monitoria terminou e a sala foi fechada.' }
  }
  const retrato = retratoDaSala(sala, claims.pid, claims.papel, agora)
  return {
    ok: true,
    etag: etagDaSala(retrato),
    resposta: {
      ...retrato,
      sinais: (sala.sinais || []).map((s) => ({ seq: s.seq, de: s.de, cx: s.cx, tipo: s.tipo, dados: s.dados, em: new Date(s.em).toISOString() })),
    },
  }
}

export type ResultadoDoEnvio = { ok: true } | { ok: false; status: number; mensagem: string; motivo?: 'substituida' }

/**
 * Empilha um sinal para outro participante, numa escrita só: a sequência sobe,
 * o limite de envio por minuto é conferido e contado, e o sinal entra na fila
 * (que guarda só os últimos 60). O que veio do navegador entra como `$literal`:
 * nenhum campo dele vira expressão ou operador do Mongo.
 */
export async function enviarSinal(claims: ClaimsDaSala, envio: Extract<EnvioValidado, { para: string }>, agora = new Date()): Promise<ResultadoDoEnvio> {
  if (envio.para === claims.pid) return { ok: false, status: 400, mensagem: 'Destinatário inválido.' }
  const c = colecoes(await getDb())
  const P = `participantes.${claims.pid}`
  const limite = new Date(agora.getTime() - 60_000)
  const res = await c.salas.updateOne(
    {
      _id: claims.sala,
      [`${P}.conexao`]: claims.cx,
      [`${P}.epoca`]: claims.ep,
      [`participantes.${envio.para}.conexao`]: { $type: 'string' },
      $or: [{ [`${P}.envio.inicio`]: { $not: { $gt: limite } } }, { [`${P}.envio.n`]: { $lt: ENVIOS_POR_MINUTO } }],
    } as any,
    [
      {
        $set: {
          seq: { $add: [{ $ifNull: ['$seq', 0] }, 1] },
          updatedAt: agora,
          [`${P}.envio`]: {
            $cond: [
              { $gt: [{ $ifNull: [`$${P}.envio.inicio`, new Date(0)] }, limite] },
              { inicio: `$${P}.envio.inicio`, n: { $add: [{ $ifNull: [`$${P}.envio.n`, 0] }, 1] } },
              { inicio: agora, n: 1 },
            ],
          },
        },
      },
      {
        $set: {
          sinais: {
            $slice: [
              {
                $concatArrays: [
                  { $ifNull: ['$sinais', []] },
                  [{ $mergeObjects: [{ $literal: { de: claims.pid, cx: claims.cx, para: envio.para, tipo: envio.tipo, dados: envio.dados, em: agora } }, { seq: '$seq' }] }],
                ],
              },
              -FILA_DE_SINAIS,
            ],
          },
        },
      },
    ] as any,
  )
  if (res.matchedCount) return { ok: true }
  // Não gravou: descobre o porquê (caminho raro, uma leitura a mais).
  const sala = await c.salas.findOne({ _id: claims.sala }, { projection: { [P]: 1, [`participantes.${envio.para}.conexao`]: 1 } })
  const eu = sala?.participantes?.[claims.pid]
  if (!eu || eu.conexao !== claims.cx || eu.epoca !== claims.ep) return { ok: false, status: 409, motivo: 'substituida', mensagem: SUBSTITUIDA.mensagem }
  if (!sala?.participantes?.[envio.para]?.conexao) return { ok: false, status: 409, mensagem: 'Esse participante saiu da sala.' }
  return { ok: false, status: 429, mensagem: 'Muitos sinais seguidos. Aguarde alguns segundos.' }
}

/** Saída (botão Sair, aba fechada pelo beacon): fecha a presença. Idempotente. */
export async function sairDaSala(claims: ClaimsDaSala, uso: UsoDaConexao | undefined, agora = new Date()): Promise<void> {
  const c = colecoes(await getDb())
  const P = `participantes.${claims.pid}`
  await Promise.all([
    c.salas.updateOne(
      { _id: claims.sala, [`${P}.conexao`]: claims.cx } as any,
      {
        $set: {
          [`${P}.conexao`]: null,
          [`${P}.saiuEm`]: agora,
          updatedAt: agora,
          'registro.$[r].saiu': agora,
          'registro.$[r].ate': agora,
          ...(uso?.tipo ? { 'registro.$[r].conexaoTipo': uso.tipo } : {}),
        },
        $inc: { versao: 1 },
      } as any,
      { arrayFilters: [{ 'r.id': claims.cx }] },
    ),
    registrarUso(uso, agora),
  ])
}

/** O monitor encerra (ou reabre) a aula para todos. Não muda nada na reserva. */
export async function encerrarOuReabrir(claims: ClaimsDaSala, encerrar: boolean, agora = new Date()): Promise<ResultadoDoEnvio> {
  if (claims.papel !== 'monitor') return { ok: false, status: 403, mensagem: 'Só o monitor encerra a aula para todos.' }
  const c = colecoes(await getDb())
  const P = `participantes.${claims.pid}`
  const res = await c.salas.updateOne(
    { _id: claims.sala, [`${P}.conexao`]: claims.cx, [`${P}.epoca`]: claims.ep } as any,
    { $set: { encerradaEm: encerrar ? agora : null, updatedAt: agora }, $inc: { versao: 1 } },
  )
  return res.matchedCount ? { ok: true } : { ok: false, status: 409, motivo: 'substituida', mensagem: SUBSTITUIDA.mensagem }
}

// ─── Consumo (teto do TURN) ────────────────────────────────────────────

/** Teto de um relato: ~2,5 Mbps no tempo relatado. Relato inflado não esgota o teto dos outros. */
export function usoPlausivel(uso: UsoDaConexao | undefined): UsoDaConexao | null {
  if (!uso || (uso.bytesRelay <= 0 && uso.segundos <= 0)) return null
  const segundos = Math.min(uso.segundos, 20 * 60)
  const bytesRelay = uso.tipo === 'retransmitida' ? Math.min(uso.bytesRelay, Math.ceil((segundos * 2_500_000) / 8)) : 0
  return { tipo: uso.tipo, bytesRelay, segundos }
}

async function registrarUso(uso: UsoDaConexao | undefined, agora: Date): Promise<void> {
  const u = usoPlausivel(uso)
  if (!u) return
  const c = colecoes(await getDb())
  await c.usoDaSala.updateOne(
    { _id: mesDoUso(agora) },
    { $inc: { bytesRelay: u.bytesRelay, [u.tipo === 'retransmitida' ? 'segundosRelay' : 'segundosDireta']: u.segundos }, $set: { atualizadoEm: agora } },
    { upsert: true },
  )
}

// ─── Presença resumida (página da reserva) ─────────────────────────────

/**
 * "O monitor já está na sala" na página da reserva, que já faz polling de 15 s
 * por mensagens: a presença vai de carona, sem requisição a mais. Só lê a sala
 * dentro da janela da aula; fora dela não custa nada.
 */
export async function presencaResumida(
  reserva: Pick<Reserva, '_id' | 'status' | 'inicio' | 'fim' | 'tutorUserId'>,
  userId: string,
  agora = new Date(),
): Promise<{ presentes: number; monitorPresente: boolean } | null> {
  if (!reserva.inicio || !reserva.fim || !['confirmada', 'realizada', 'em_disputa'].includes(reserva.status)) return null
  const { abreEm, fechaEm } = janelaDaSala(reserva.inicio, reserva.fim, 'monitor')
  if (agora < abreEm || agora > fechaEm) return null
  const c = colecoes(await getDb())
  const sala = await c.salas.findOne({ _id: idDe(reserva) }, { projection: { participantes: 1 } })
  const outros = Object.values(sala?.participantes || {}).filter((p) => p.uid !== userId && presente(p, agora))
  return { presentes: outros.length, monitorPresente: outros.some((p) => p.uid === reserva.tutorUserId) }
}
