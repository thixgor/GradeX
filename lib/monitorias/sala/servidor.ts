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

import { createHash, randomBytes } from 'crypto'
import { ObjectId } from 'mongodb'
import { getDb } from '@/lib/mongodb'
import { colecoes, ehDuplicada, idDe } from '../db'
import { carregarReserva, papelPeloAssento } from '../reservas'
import { avisar } from '../avisos'
import type { ConfigSala, PapelNaSala, PermissoesDaSala, Reserva, Sala } from '../tipos'
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
  entrouAlemDoLimite,
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
import { detectarContato } from '../contato-inteligente'
import { avatarPorId } from '../avatares'
import { estadoDoResumoNaSala } from '../resumo/tarefa'

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

const PROJECAO_SALA = {
  participantes: 1,
  versao: 1,
  seq: 1,
  esperados: 1,
  encerradaEm: 1,
  encerradaPeloSuporte: 1,
  removidos: 1,
  permissoes: 1,
  fim: 1,
  avisouEntradaMonitor: 1,
} as const
type SalaLida = Pick<
  Sala,
  'participantes' | 'versao' | 'seq' | 'esperados' | 'encerradaEm' | 'encerradaPeloSuporte' | 'removidos' | 'permissoes' | 'fim' | 'avisouEntradaMonitor'
>

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

function mensagemDeRemovido(por: 'monitor' | 'suporte'): string {
  return por === 'suporte' ? 'O suporte da DomineAqui tirou você desta aula. Fale com o suporte.' : 'O monitor tirou você da sala. Se foi engano, ele pode liberar sua volta.'
}

/** Permissões em vigor (documento sem o campo = tudo liberado). */
export function permissoesDe(sala: Pick<Sala, 'permissoes'> | null | undefined): PermissoesDaSala {
  return { telaAlunos: sala?.permissoes?.telaAlunos !== false, chatAlunos: sala?.permissoes?.chatAlunos !== false }
}

// ─── Contexto: tudo que a autorização precisa, numa leva só ────────────

interface Contexto {
  reserva: Reserva
  reservaId: string
  acesso: ResultadoAcesso
  nome: string
  /** Retrato da conta (id do catálogo): o mesmo do /profile. */
  avatar: string | null
  /** Alunos com assento ativo (pid e nome) — o monitor vê quem ainda não chegou. */
  alunosEsperados: Array<{ pid: string; nome: string }>
  /** Nome do monitor (marca d'água da sala). */
  nomeDoMonitor: string
  config: ConfigSala
  sala: SalaLida | null
  esperados: number
}

async function contexto(reservaId: string, userId: string, agora: Date): Promise<Contexto> {
  const reserva = await carregarReserva(reservaId)
  const id = idDe(reserva)
  const ehMonitor = reserva.tutorUserId === userId
  const c = colecoes(await getDb())
  const [part, tutor, config, sala, assentos, usuario] = await Promise.all([
    ehMonitor
      ? null
      : c.participacoes.findOne({ reservaId: id, alunoId: userId }, { projection: { status: 1, valorCentavos: 1, reembolsos: 1, alunoNome: 1 } }),
    c.tutores.findOne({ _id: new ObjectId(reserva.tutorId) } as any, { projection: { nome: 1 } }),
    configDaSala(),
    c.salas.findOne({ _id: id }, { projection: PROJECAO_SALA }) as Promise<SalaLida | null>,
    c.participacoes
      .find({ reservaId: id, status: { $in: ASSENTOS_COM_AULA } } as any, { projection: { alunoId: 1, alunoNome: 1, status: 1, valorCentavos: 1, reembolsos: 1 } })
      .limit(50)
      .toArray(),
    ObjectId.isValid(userId) ? c.users.findOne({ _id: new ObjectId(userId) } as any, { projection: { avatar: 1, name: 1 } }) : null,
  ])
  // Sala de teste sem perfil de monitor: o nome do monitor é o do admin.
  const nomeDoAdminDeTeste =
    reserva.teste && !tutor
      ? (ehMonitor ? (usuario as { name?: string } | null)?.name : (await c.users.findOne({ _id: new ObjectId(reserva.tutorUserId) } as any, { projection: { name: 1 } }))?.name) ||
        'Equipe DomineAqui'
      : null
  const acesso = avaliarAcessoSala({
    ehMonitor,
    assento: part ? { status: part.status, ativo: !!papelPeloAssento(reserva, userId, part) } : null,
    status: reserva.status,
    inicio: reserva.inicio,
    fim: reserva.fim,
    disputaEm: reserva.disputa?.em,
    encerradaEm: sala?.encerradaEm,
    encerradaPeloSuporte: !!sala?.encerradaPeloSuporte,
    removido: sala?.removidos?.[pidDe(id, userId)] || null,
    agora,
    config,
  })
  return {
    reserva,
    reservaId: id,
    acesso,
    nome: (ehMonitor ? tutor?.nome || nomeDoAdminDeTeste : part?.alunoNome) || 'Participante',
    avatar: avatarPorId((usuario as { avatar?: string } | null)?.avatar)?.id || null,
    nomeDoMonitor: tutor?.nome || nomeDoAdminDeTeste || 'Monitor',
    config,
    sala,
    // Quem está saindo com reembolso integral não é mais esperado (mesma regra do acesso).
    alunosEsperados: assentos.filter((a) => papelPeloAssento(reserva, a.alunoId, a)).map((a) => ({ pid: pidDe(id, a.alunoId), nome: a.alunoNome || 'Aluno' })),
    esperados: Math.min(config.limiteMalha, 1 + assentos.filter((a) => papelPeloAssento(reserva, a.alunoId, a)).length),
  }
}

function fechaEmDe(sala: Pick<Sala, 'fim'>): Date {
  return new Date(new Date(sala.fim).getTime() + FECHA_DEPOIS_MIN * 60_000)
}

/**
 * Nome como os outros veem. O monitor vê o nome completo dos alunos (como no
 * resto das monitorias); entre alunos, só o primeiro nome. O nome do monitor é
 * público no anúncio. Nome de cadastro com telefone, @ ou link não vai para a
 * tela da sala: vira só a primeira palavra (ou o papel).
 */
export function nomeVisivel(nome: string, papel: PapelNaSala, leitor: PapelNaSala): string {
  const base = leitor === 'monitor' || papel === 'monitor' ? nome : primeiroNome(nome)
  if (detectarContato(base).nivel !== 'bloqueio') return base
  const primeiro = primeiroNome(nome)
  return /^[\p{L}'-]{2,30}$/u.test(primeiro) ? primeiro : papel === 'monitor' ? 'Monitor' : 'Aluno'
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
      nome: nomeVisivel(p.nome, p.papel, leitor),
      foto: avatarPorId(p.avatar)?.url || null,
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
    encerradaPeloSuporte: !!(sala.encerradaEm && sala.encerradaPeloSuporte),
    fechaEm: fechaEmDe(sala).toISOString(),
    permissoes: permissoesDe(sala),
    // Só o monitor vê quem foi tirado (para liberar a volta).
    removidos:
      leitor === 'monitor'
        ? Object.entries(sala.removidos || {}).map(([pid, r]) => ({ pid, nome: r.nome, por: r.por }))
        : [],
    fora: Object.keys(sala.removidos || {}),
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
        .map(([, p]) => ({ papel: p.papel, nome: nomeVisivel(p.nome, p.papel, papel), foto: avatarPorId(p.avatar)?.url || null }))
    : []
  const a = ctx.acesso
  return {
    acesso: a.ok
      ? { ok: true, motivo: null, mensagem: null, abreEm: a.abreEm.toISOString(), fechaEm: a.fechaEm.toISOString() }
      : { ok: false, motivo: a.motivo, mensagem: a.mensagem, abreEm: a.abreEm?.toISOString() || null, fechaEm: a.fechaEm?.toISOString() || null },
    papel,
    reserva: { id: ctx.reservaId, titulo: ctx.reserva.anuncioTitulo, inicio: ctx.reserva.inicio?.toISOString() || null, fim: ctx.reserva.fim?.toISOString() || null },
    presentes,
    foto: avatarPorId(ctx.avatar)?.url || null,
    config: { compartilharTela: ctx.config.compartilharTela, chatNaSala: ctx.config.chatNaSala },
    linkReuniao: ctx.config.linkExternoPermitido ? ctx.reserva.linkReuniao || null : null,
    resumo: await estadoDoResumoNaSala(ctx.reserva, userId).catch(() => null),
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
          ...(ctx.avatar ? { [`${P}.avatar`]: ctx.avatar } : {}),
          [`${P}.conexao`]: cx,
          [`${P}.entrouEm`]: agora,
          [`${P}.vistoEm`]: agora,
          ...(ice.usuario ? { [`${P}.turnUsuario`]: ice.usuario } : {}),
        },
        // Tirou a foto do perfil depois de entrar: a sala acompanha.
        $unset: { [`${P}.saiuEm`]: '', ...(ctx.avatar ? {} : { [`${P}.avatar`]: '' }) },
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
  if (entrouAlemDoLimite(sala.participantes || {}, pid, ctx.config.limiteMalha, agora)) {
    // Duas entradas ao mesmo tempo passaram da conferência de antes: a última desfaz.
    await c.salas.updateOne({ _id: ctx.reservaId, [`${P}.conexao`]: cx } as any, { $set: { [`${P}.conexao`]: null, [`${P}.saiuEm`]: agora }, $inc: { versao: 1 } } as any)
    return { ok: false, status: 409, motivo: 'cheia', mensagem: `A sala comporta ${ctx.config.limiteMalha} pessoas ao mesmo tempo e já está completa.` }
  }

  if (papel === 'monitor' && !sala.avisouEntradaMonitor) await avisarEntradaDoMonitor(ctx.reservaId, ctx.reserva.anuncioTitulo, sala, agora)

  const expiraEm = new Date(Math.min(agora.getTime() + TOKEN_TTL_MS, fechaEm.getTime()))
  const token = await emitirTokenDaSala({ sala: ctx.reservaId, uid: sessao.userId, pid, papel, cx, ep, sj: vinculoDaSessao(sessao) }, expiraEm)
  return {
    token,
    expiraEm: expiraEm.toISOString(),
    eu: { pid, papel, nome: ctx.nome, foto: avatarPorId(ctx.avatar)?.url || null, cx, ep },
    iceServers: ice.servidores as RTCIceServer[],
    turn: !!ice.usuario,
    sala: retratoDaSala(sala, pid, papel, agora),
    config: { compartilharTela: ctx.config.compartilharTela, chatNaSala: ctx.config.chatNaSala, limiteMalha: ctx.config.limiteMalha, video: ctx.config.video },
    janela: { inicio: ctx.reserva.inicio!.toISOString(), fim: ctx.reserva.fim!.toISOString(), abreEm: abreEm.toISOString(), fechaEm: fechaEm.toISOString() },
    reserva: {
      id: ctx.reservaId,
      titulo: ctx.reserva.anuncioTitulo,
      monitor: nomeVisivel(ctx.nomeDoMonitor, 'monitor', papel),
      // Só o monitor: o link para mandar aos alunos (na sala de teste, o convite que dá o assento).
      ...(papel === 'monitor'
        ? {
            convite: ctx.reserva.teste && ctx.reserva.codigoTeste ? `/monitorias/teste/${ctx.reserva.codigoTeste}` : `/monitorias/reservas/${ctx.reservaId}/sala`,
            ...(!ctx.reserva.teste && ctx.reserva.inicio && (ctx.reserva.proposta?.vagas || 1) <= 1 ? { inicioIndividual: ctx.reserva.inicio.toISOString() } : {}),
          }
        : {}),
    },
    ...(papel === 'monitor' ? { esperadosNomes: ctx.alunosEsperados } : {}),
    resumo: await estadoDoResumoNaSala(ctx.reserva, sessao.userId).catch(() => null),
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
): Promise<{ token: string; expiraEm: string; sala: RetratoDaSala; esperadosNomes?: Array<{ pid: string; nome: string }> } | Recusa> {
  if (!claims || claims.sala !== reservaId || claims.uid !== sessao.userId || claims.sj !== vinculoDaSessao(sessao)) return TOKEN_INVALIDO
  const ctx = await contexto(reservaId, sessao.userId, agora)
  const P = `participantes.${claims.pid}`
  const c = colecoes(await getDb())
  if (!ctx.acesso.ok) {
    // Perdeu o acesso no meio da aula (reembolso, cancelamento, fim): solta a
    // conexão gravada. Sem isto ela seguia "presente", ocupando vaga e podendo
    // sinalizar até o token vencer.
    await c.salas.updateOne(
      { _id: ctx.reservaId, [`${P}.conexao`]: claims.cx } as any,
      { $set: { [`${P}.conexao`]: null, [`${P}.saiuEm`]: agora, updatedAt: agora }, $inc: { versao: 1 } } as any,
    )
    return recusaDe(ctx.acesso)
  }
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
  return {
    token,
    expiraEm: expiraEm.toISOString(),
    sala: retratoDaSala(sala, claims.pid, claims.papel, agora),
    ...(claims.papel === 'monitor' ? { esperadosNomes: ctx.alunosEsperados } : {}),
  }
}

// ─── Sinais ────────────────────────────────────────────────────────────

export type ResultadoDaLeitura =
  | { ok: true; resposta: RespostaDoSinal; etag: string }
  | { ok: false; status: number; motivo: 'substituida' | 'fechada' | 'nao_encontrada' | 'removido'; mensagem: string }

/** Conexão que não vale mais: foi tirada da sala ou trocou de aba/aparelho? */
function motivoDaConexaoPerdida(sala: Pick<Sala, 'removidos'> | null, pid: string): Extract<ResultadoDaLeitura, { ok: false }> {
  const removido = sala?.removidos?.[pid]
  if (removido) return { ok: false, status: 403, motivo: 'removido', mensagem: mensagemDeRemovido(removido.por) }
  return { ok: false, status: 409, motivo: 'substituida', mensagem: SUBSTITUIDA.mensagem }
}

/**
 * Muda quando muda o que a tela mostra. Inclui QUEM está presente: a presença
 * vence sozinha (sem escrita, sem `versao` nova) e os outros precisam saber
 * para fechar a conexão direta com quem sumiu.
 */
export function etagDaSala(r: Pick<RetratoDaSala, 'seq' | 'versao' | 'encerrada'> & { participantes?: RetratoDaSala['participantes'] }): string {
  const presentes = (r.participantes || [])
    .filter((p) => p.presente)
    .map((p) => p.pid)
    .sort()
    .join(',')
  const marca = presentes ? createHash('sha1').update(presentes).digest('base64url').slice(0, 8) : '0'
  return `W/"s${r.seq}.v${r.versao}.e${r.encerrada ? 1 : 0}.p${marca}"`
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
    encerradaPeloSuporte: 1,
    removidos: 1,
    permissoes: 1,
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
      const existe = await c.salas.findOne({ _id: claims.sala }, { projection: { [`removidos.${claims.pid}`]: 1 } })
      return existe ? motivoDaConexaoPerdida(existe, claims.pid) : { ok: false, status: 404, motivo: 'nao_encontrada', mensagem: 'Sala não encontrada.' }
    }
  } else {
    sala = (await c.salas.findOne({ _id: claims.sala }, { projection: projection as any })) as any
    if (!sala) return { ok: false, status: 404, motivo: 'nao_encontrada', mensagem: 'Sala não encontrada.' }
    const eu = sala.participantes?.[claims.pid]
    if (!eu || eu.conexao !== claims.cx || eu.epoca !== claims.ep) return motivoDaConexaoPerdida(sala, claims.pid)
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

export type ResultadoDoEnvio = { ok: true } | { ok: false; status: number; mensagem: string; motivo?: 'substituida' | 'removido' }

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
  const sala = await c.salas.findOne({ _id: claims.sala }, { projection: { [P]: 1, [`participantes.${envio.para}.conexao`]: 1, [`removidos.${claims.pid}`]: 1 } })
  const eu = sala?.participantes?.[claims.pid]
  if (!eu || eu.conexao !== claims.cx || eu.epoca !== claims.ep) {
    const perdida = motivoDaConexaoPerdida(sala, claims.pid)
    return { ok: false, status: perdida.status, motivo: perdida.motivo === 'removido' ? 'removido' : 'substituida', mensagem: perdida.mensagem }
  }
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
    { _id: claims.sala, [`${P}.conexao`]: claims.cx, [`${P}.epoca`]: claims.ep, encerradaPeloSuporte: { $ne: true } } as any,
    { $set: { encerradaEm: encerrar ? agora : null, updatedAt: agora }, $inc: { versao: 1 } },
  )
  if (res.matchedCount) return { ok: true }
  const sala = await c.salas.findOne({ _id: claims.sala }, { projection: { encerradaPeloSuporte: 1 } })
  if (sala?.encerradaPeloSuporte) return { ok: false, status: 409, mensagem: 'O suporte encerrou esta aula; só o suporte pode reabrir.' }
  return { ok: false, status: 409, motivo: 'substituida', mensagem: SUBSTITUIDA.mensagem }
}

// ─── Controles do anfitrião (monitor) ──────────────────────────────────

export type AcaoDoAnfitriao =
  | { tipo: 'remover'; alvo: string }
  | { tipo: 'readmitir'; alvo: string }
  | { tipo: 'permissoes'; telaAlunos?: boolean; chatAlunos?: boolean }

/**
 * O que precisa valer no servidor (e não só na tela do monitor): tirar alguém
 * da sala (não volta até ser liberado) e as permissões dos alunos (o chat
 * pausado vale também na rota de mensagens). Silenciar, desligar câmera ou
 * baixar a mão são pedidos pelo canal P2P, sem custo de servidor.
 */
export async function acaoDoAnfitriao(claims: ClaimsDaSala, acao: AcaoDoAnfitriao, agora = new Date()): Promise<ResultadoDoEnvio> {
  if (claims.papel !== 'monitor') return { ok: false, status: 403, mensagem: 'Só o monitor controla a sala.' }
  const c = colecoes(await getDb())
  const P = `participantes.${claims.pid}`
  const minhaConexao = { _id: claims.sala, [`${P}.conexao`]: claims.cx, [`${P}.epoca`]: claims.ep }
  if (acao.tipo === 'permissoes') {
    if (typeof acao.telaAlunos !== 'boolean' && typeof acao.chatAlunos !== 'boolean') return { ok: false, status: 400, mensagem: 'Nada para mudar.' }
    const set: Record<string, unknown> = { updatedAt: agora }
    if (typeof acao.telaAlunos === 'boolean') set['permissoes.telaAlunos'] = acao.telaAlunos
    if (typeof acao.chatAlunos === 'boolean') set['permissoes.chatAlunos'] = acao.chatAlunos
    const res = await c.salas.updateOne(minhaConexao as any, { $set: set, $inc: { versao: 1 } })
    return res.matchedCount ? { ok: true } : { ok: false, status: 409, motivo: 'substituida', mensagem: SUBSTITUIDA.mensagem }
  }
  if (acao.alvo === claims.pid) return { ok: false, status: 400, mensagem: 'Você não pode tirar a si mesmo.' }
  const sala = await c.salas.findOne(minhaConexao as any, { projection: { [`participantes.${acao.alvo}`]: 1, [`removidos.${acao.alvo}`]: 1 } })
  if (!sala) return { ok: false, status: 409, motivo: 'substituida', mensagem: SUBSTITUIDA.mensagem }
  if (acao.tipo === 'readmitir') {
    if (sala.removidos?.[acao.alvo]?.por === 'suporte') return { ok: false, status: 403, mensagem: 'Quem foi tirado pelo suporte só volta com o suporte.' }
    await c.salas.updateOne({ _id: claims.sala }, { $unset: { [`removidos.${acao.alvo}`]: '' }, $set: { updatedAt: agora }, $inc: { versao: 1 } } as any)
    return { ok: true }
  }
  const alvo = sala.participantes?.[acao.alvo]
  if (!alvo) return { ok: false, status: 404, mensagem: 'Participante não encontrado.' }
  if (alvo.papel === 'monitor') return { ok: false, status: 403, mensagem: 'O monitor não pode ser tirado da sala.' }
  await removerParticipante(claims.sala, acao.alvo, alvo.nome, 'monitor', agora)
  return { ok: true }
}

/** Tira da sala: a conexão deixa de valer na hora e a entrada fica recusada. */
async function removerParticipante(salaId: string, pid: string, nome: string, por: 'monitor' | 'suporte', agora: Date): Promise<void> {
  const c = colecoes(await getDb())
  const P = `participantes.${pid}`
  await c.salas.updateOne(
    { _id: salaId },
    {
      $set: {
        [`removidos.${pid}`]: { em: agora, por, nome },
        [`${P}.conexao`]: null,
        [`${P}.saiuEm`]: agora,
        updatedAt: agora,
        'registro.$[r].saiu': agora,
      },
      $inc: { versao: 1 },
    } as any,
    { arrayFilters: [{ 'r.pid': pid, 'r.saiu': { $exists: false } }] },
  )
}

/**
 * Chat dos alunos pausado pelo monitor? Só durante a janela da sala (fora dela
 * o chat da reserva é sempre livre) — e só então custa uma leitura.
 */
export async function chatDosAlunosPausado(reserva: Pick<Reserva, '_id' | 'inicio' | 'fim'>, agora = new Date()): Promise<boolean> {
  if (!reserva.inicio || !reserva.fim) return false
  const { abreEm, fechaEm } = janelaDaSala(reserva.inicio, reserva.fim, 'monitor')
  if (agora < abreEm || agora > fechaEm) return false
  const c = colecoes(await getDb())
  const sala = await c.salas.findOne({ _id: idDe(reserva) }, { projection: { permissoes: 1 } })
  return !permissoesDe(sala).chatAlunos
}

// ─── Suporte (admin) ───────────────────────────────────────────────────

export type AcaoDoSuporte =
  | { acao: 'encerrar' }
  | { acao: 'reabrir' }
  | { acao: 'remover'; pid: string }
  | { acao: 'readmitir'; pid: string }

/**
 * O admin encerra/reabre a aula ou tira alguém. Os participantes descobrem no
 * próximo pulso (até ~30 s) ou na renovação. Encerrar uma sala que ainda não
 * existe cria o documento já encerrado (ninguém entra).
 */
export async function acaoDoSuporte(reserva: Reserva, a: AcaoDoSuporte, agora = new Date()): Promise<{ ok: true } | { ok: false; status: number; mensagem: string }> {
  const c = colecoes(await getDb())
  const id = idDe(reserva)
  if (a.acao === 'encerrar' || a.acao === 'reabrir') {
    if (!reserva.fim) return { ok: false, status: 409, mensagem: 'A monitoria não tem horário.' }
    const encerrar = a.acao === 'encerrar'
    await c.salas.updateOne(
      { _id: id },
      {
        $setOnInsert: { seq: 0, sinais: [], registro: [], participantes: {}, createdAt: agora, fim: reserva.fim },
        $set: { encerradaEm: encerrar ? agora : null, encerradaPeloSuporte: encerrar, updatedAt: agora },
        $inc: { versao: 1 },
      } as any,
      { upsert: true },
    )
    return { ok: true }
  }
  const sala = await c.salas.findOne({ _id: id }, { projection: { [`participantes.${a.pid}`]: 1 } })
  const alvo = sala?.participantes?.[a.pid]
  if (!alvo) return { ok: false, status: 404, mensagem: 'Participante não encontrado.' }
  if (alvo.papel === 'monitor') return { ok: false, status: 409, mensagem: 'Para tirar o monitor, encerre a aula.' }
  if (a.acao === 'readmitir') {
    await c.salas.updateOne({ _id: id }, { $unset: { [`removidos.${a.pid}`]: '' }, $set: { updatedAt: agora }, $inc: { versao: 1 } } as any)
    return { ok: true }
  }
  await removerParticipante(id, a.pid, alvo.nome, 'suporte', agora)
  return { ok: true }
}

export interface SalaParaOSuporte {
  reservaId: string
  encerrada: boolean
  encerradaPeloSuporte: boolean
  permissoes: PermissoesDaSala
  participantes: Array<{ pid: string; papel: PapelNaSala; nome: string; presente: boolean; entrouEm: string; removido: null | 'monitor' | 'suporte' }>
}

/** Retrato completo para o admin (nomes completos, presentes e removidos). */
export function salaParaOSuporte(sala: Pick<Sala, '_id' | 'participantes' | 'encerradaEm' | 'encerradaPeloSuporte' | 'removidos' | 'permissoes'>, agora: Date): SalaParaOSuporte {
  return {
    reservaId: String(sala._id),
    encerrada: !!sala.encerradaEm,
    encerradaPeloSuporte: !!(sala.encerradaEm && sala.encerradaPeloSuporte),
    permissoes: permissoesDe(sala),
    participantes: Object.entries(sala.participantes || {}).map(([pid, p]) => ({
      pid,
      papel: p.papel,
      nome: p.nome,
      presente: presente(p, agora),
      entrouEm: new Date(p.entrouEm).toISOString(),
      removido: sala.removidos?.[pid]?.por || null,
    })),
  }
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
