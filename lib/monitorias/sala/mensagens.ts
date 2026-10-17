/**
 * O formato de tudo o que circula na sala — entre navegador e servidor (sinais)
 * e entre navegadores (canal P2P). Sem `zod` aqui de propósito: este arquivo
 * entra no bundle da sala, e o schema do servidor (que usa zod) mora em
 * `esquemas.ts`.
 *
 * Toda mensagem que chega do OUTRO navegador é dado não confiável: passa por
 * `lerMensagemDoCanal`, que confere tipo e tamanho de cada campo. O React já
 * escapa o texto na tela; isto protege o resto (memória, laços, estados).
 */

import type { PapelNaSala } from '../tipos'

export const SDP_MAX = 16_000
export const CANDIDATOS_POR_MENSAGEM = 30
export const CANDIDATO_MAX = 512
export const CHAT_MAX = 2_000
/** Teto do corpo de qualquer POST de sinal (um SDP grande + folga). */
export const CORPO_MAX_BYTES = 40_000
export const CANAL_MAX_BYTES = 20_000
/** m-lines por SDP: áudio, câmera, tela e dados = 4; folga para 6. */
export const SECOES_MIDIA_MAX = 6

export type TipoDeSinal = 'oferta' | 'resposta' | 'candidatos' | 'reiniciar'

export interface CandidatoIce {
  candidate: string
  sdpMid?: string | null
  sdpMLineIndex?: number | null
  usernameFragment?: string | null
}

export type UsoDaConexao = {
  /** Tipo do par de candidatos escolhido na maior parte do tempo. */
  tipo: 'direta' | 'retransmitida' | null
  /** Bytes que passaram pelo relé desde o último relato (estimativa para o teto do TURN). */
  bytesRelay: number
  /** Segundos conectado desde o último relato. */
  segundos: number
}

export type EnvioDeSinal =
  | { tipo: 'oferta' | 'resposta'; para: string; dados: { sdp: string; neg: string } }
  | { tipo: 'candidatos'; para: string; dados: { lista: CandidatoIce[]; neg: string } }
  | { tipo: 'reiniciar'; para: string; dados: { neg?: string } }
  | { tipo: 'sair'; uso?: UsoDaConexao }
  | { tipo: 'encerrar' }
  | { tipo: 'reabrir' }
  | { tipo: 'remover' | 'readmitir'; alvo: string }
  | { tipo: 'permissoes'; telaAlunos?: boolean; chatAlunos?: boolean }

export interface SinalRecebido {
  seq: number
  de: string
  cx: string
  tipo: TipoDeSinal
  dados: any
  em: string
}

export interface ParticipanteVisivel {
  pid: string
  papel: PapelNaSala
  /** Primeiro nome para os alunos; o monitor vê o nome completo. */
  nome: string
  presente: boolean
  /** Conexão atual: sinal de outra conexão (aba antiga) é descartado. */
  cx: string | null
  eu: boolean
}

export interface RetratoDaSala {
  seq: number
  versao: number
  participantes: ParticipanteVisivel[]
  /** Quantas pessoas a aula espera (monitor + assentos), até o limite da sala. */
  esperados: number
  encerrada: boolean
  /** Encerrada pelo suporte: nem o monitor reabre. */
  encerradaPeloSuporte: boolean
  fechaEm: string
  /** O que o monitor liberou para os alunos. */
  permissoes: { telaAlunos: boolean; chatAlunos: boolean }
  /** Tirados da sala (só o monitor recebe a lista, para liberar a volta). */
  removidos: Array<{ pid: string; nome: string; por: 'monitor' | 'suporte' }>
}

export interface RespostaDoSinal extends RetratoDaSala {
  sinais: SinalRecebido[]
}

/** O que `POST …/sala {acao:'entrar'|'renovar'}` devolve. */
export interface CredenciaisDaSala {
  token: string
  expiraEm: string
  eu: { pid: string; papel: PapelNaSala; nome: string; cx: string; ep: number }
  iceServers: RTCIceServer[]
  turn: boolean
  sala: RetratoDaSala
  config: { compartilharTela: boolean; chatNaSala: boolean; limiteMalha: number }
  janela: { inicio: string; fim: string; abreEm: string; fechaEm: string }
  /** Para a marca d'água: id, título e o nome do monitor. */
  reserva: { id: string; titulo: string; monitor: string }
}

/** O que `GET …/sala` devolve: o saguão antes de entrar. */
export interface EstadoDoSaguao {
  acesso: {
    ok: boolean
    motivo: 'sem_acesso' | 'desligada' | 'status' | 'sem_horario' | 'nao_abriu' | 'fechada' | 'encerrada' | 'cheia' | 'removido' | null
    mensagem: string | null
    abreEm: string | null
    fechaEm: string | null
  }
  papel: PapelNaSala
  reserva: { id: string; titulo: string; inicio: string | null; fim: string | null }
  presentes: Array<{ papel: PapelNaSala; nome: string }>
  config: { compartilharTela: boolean; chatNaSala: boolean }
  /** Plano B: só quando o admin permite e o monitor colocou. */
  linkReuniao: string | null
}

// ─── Canal P2P (RTCDataChannel) ────────────────────────────────────────

/** O que o monitor pode pedir a um participante (o navegador dele obedece; nada é forçado no servidor). */
export type PedidoDoMonitor = 'silenciar' | 'desligar_camera' | 'parar_tela' | 'pedir_mic' | 'pedir_camera' | 'baixar_mao'
const PEDIDOS: PedidoDoMonitor[] = ['silenciar', 'desligar_camera', 'parar_tela', 'pedir_mic', 'pedir_camera', 'baixar_mao']

export type MensagemDoCanal =
  | { t: 'estado'; mic: boolean; cam: boolean; tela: boolean; videoPausado: boolean; mao: boolean }
  | { t: 'chat'; id: string; texto: string; em: string }
  | { t: 'sdp'; tipo: 'offer' | 'answer'; sdp: string; neg: string }
  | { t: 'ice'; lista: CandidatoIce[]; neg: string }
  | { t: 'reiniciar' }
  | { t: 'tchau' }
  | { t: 'encerrar' }
  | { t: 'video'; receber: boolean }
  // Só valem vindas do monitor (quem recebe confere o papel pelo retrato do servidor).
  | { t: 'pedido'; acao: PedidoDoMonitor }
  | { t: 'removido'; pid: string }
  | { t: 'permissoes'; telaAlunos: boolean; chatAlunos: boolean }

const ehTexto = (v: unknown, max: number): v is string => typeof v === 'string' && v.length <= max
const ehBool = (v: unknown): v is boolean => typeof v === 'boolean'

export function sdpValido(sdp: unknown): sdp is string {
  if (typeof sdp !== 'string' || sdp.length > SDP_MAX || !sdp.startsWith('v=0')) return false
  const secoes = sdp.match(/^m=/gm)?.length ?? 0
  return secoes >= 1 && secoes <= SECOES_MIDIA_MAX
}

export function candidatoValido(c: unknown): c is CandidatoIce {
  if (!c || typeof c !== 'object') return false
  const x = c as Record<string, unknown>
  if (!ehTexto(x.candidate, CANDIDATO_MAX)) return false
  if (x.sdpMid !== undefined && x.sdpMid !== null && !ehTexto(x.sdpMid, 32)) return false
  if (x.sdpMLineIndex !== undefined && x.sdpMLineIndex !== null && !(Number.isInteger(x.sdpMLineIndex) && (x.sdpMLineIndex as number) >= 0 && (x.sdpMLineIndex as number) <= 16)) return false
  if (x.usernameFragment !== undefined && x.usernameFragment !== null && !ehTexto(x.usernameFragment, 64)) return false
  return true
}

/** Só os campos conhecidos de um candidato (o `toJSON()` do navegador pode trazer mais). */
export function candidatoLimpo(c: RTCIceCandidateInit | RTCIceCandidate): CandidatoIce {
  return {
    candidate: c.candidate || '',
    sdpMid: c.sdpMid ?? null,
    sdpMLineIndex: c.sdpMLineIndex ?? null,
    usernameFragment: c.usernameFragment ?? null,
  }
}

function listaDeCandidatos(v: unknown): v is CandidatoIce[] {
  return Array.isArray(v) && v.length <= CANDIDATOS_POR_MENSAGEM && v.every(candidatoValido)
}

/** Mensagem do outro navegador, conferida campo a campo. Qualquer desvio = descartada. */
export function lerMensagemDoCanal(bruto: unknown): MensagemDoCanal | null {
  if (typeof bruto !== 'string' || bruto.length > CANAL_MAX_BYTES) return null
  let m: Record<string, unknown>
  try {
    const v = JSON.parse(bruto)
    if (!v || typeof v !== 'object' || Array.isArray(v)) return null
    m = v
  } catch {
    return null
  }
  switch (m.t) {
    case 'estado':
      return ehBool(m.mic) && ehBool(m.cam) && ehBool(m.tela)
        ? { t: 'estado', mic: m.mic, cam: m.cam, tela: m.tela, videoPausado: m.videoPausado === true, mao: m.mao === true }
        : null
    case 'chat':
      return ehTexto(m.id, 40) && ehTexto(m.texto, CHAT_MAX) && m.texto.trim() && ehTexto(m.em, 40)
        ? { t: 'chat', id: m.id, texto: m.texto, em: m.em }
        : null
    case 'sdp':
      return (m.tipo === 'offer' || m.tipo === 'answer') && sdpValido(m.sdp) && ehTexto(m.neg, 40)
        ? { t: 'sdp', tipo: m.tipo, sdp: m.sdp, neg: m.neg }
        : null
    case 'ice':
      return listaDeCandidatos(m.lista) && ehTexto(m.neg, 40) ? { t: 'ice', lista: m.lista, neg: m.neg } : null
    case 'video':
      return ehBool(m.receber) ? { t: 'video', receber: m.receber } : null
    case 'pedido':
      return PEDIDOS.includes(m.acao as PedidoDoMonitor) ? { t: 'pedido', acao: m.acao as PedidoDoMonitor } : null
    case 'removido':
      return typeof m.pid === 'string' && /^[A-Za-z0-9_-]{16}$/.test(m.pid) ? { t: 'removido', pid: m.pid } : null
    case 'permissoes':
      return ehBool(m.telaAlunos) && ehBool(m.chatAlunos) ? { t: 'permissoes', telaAlunos: m.telaAlunos, chatAlunos: m.chatAlunos } : null
    case 'reiniciar':
    case 'tchau':
    case 'encerrar':
      return { t: m.t }
    default:
      return null
  }
}
