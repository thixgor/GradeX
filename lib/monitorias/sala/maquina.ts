/**
 * As máquinas de estado da sala — puras e testadas. Os temporizadores e os
 * eventos do `RTCPeerConnection` só PRODUZEM eventos; quem decide o que fazer é
 * daqui. Assim a tela nunca diz "conectado" porque um relógio passou: ela diz o
 * que o estado diz, e o estado só muda por evento real.
 */

import {
  JANELA_DE_REINICIOS_MS,
  REINICIOS_MAXIMOS,
  type FaseDeSinal,
} from './regras'

// ─── A sala (a tela inteira) ───────────────────────────────────────────

export type FaseDaSala = 'verificando' | 'sem_suporte' | 'saguao' | 'entrando' | 'na_sala' | 'fora'

/**
 * Por que a pessoa está fora da sala. `voce` e `substituida` permitem voltar;
 * `negado` e `fechada` não (a não ser que a situação mude no servidor).
 */
export type MotivoDeSaida = 'voce' | 'encerrada' | 'fechada' | 'substituida' | 'negado' | 'sessao' | 'conexao'

const TRANSICOES: Record<FaseDaSala, FaseDaSala[]> = {
  verificando: ['sem_suporte', 'saguao'],
  sem_suporte: [],
  saguao: ['entrando', 'fora'],
  entrando: ['na_sala', 'saguao', 'fora'],
  na_sala: ['fora', 'entrando'],
  // "Voltar para a aula" (entra de novo) ou "Ajustar câmera" (volta ao saguão).
  fora: ['entrando', 'saguao'],
}

export function podeIrPara(de: FaseDaSala, para: FaseDaSala): boolean {
  return TRANSICOES[de].includes(para)
}

// ─── Cada par (uma conexão P2P com outra pessoa) ───────────────────────

export type FaseDoPar = 'novo' | 'negociando' | 'conectado' | 'instavel' | 'reiniciando' | 'perdido'

export interface EstadoDoPar {
  fase: FaseDoPar
  /** Instantes dos reinícios de ICE recentes (janela deslizante). */
  reinicios: number[]
  /** Já houve uma reconstrução completa do par? (Só uma, antes de desistir.) */
  reconstruido: boolean
}

export type EventoDoPar =
  | { tipo: 'negociacao_iniciada' }
  | { tipo: 'conectou' }
  | { tipo: 'oscilou' }
  | { tipo: 'falhou' }
  | { tipo: 'espera_venceu' }
  | { tipo: 'negociacao_expirou' }
  | { tipo: 'saiu' }

/**
 * O que o par deve fazer depois da transição:
 *  - `agendar_espera`: ICE oscilou; espera alguns segundos (costuma voltar sozinho);
 *  - `reiniciar_ice`: novo ICE (quem ofereceu oferece de novo; o outro pede);
 *  - `reconstruir`: fecha e abre um RTCPeerConnection novo (uma vez);
 *  - `desistir`: chega de tentar sozinho — a tela oferece "Tentar de novo".
 */
export type AcaoDoPar = 'agendar_espera' | 'reiniciar_ice' | 'reconstruir' | 'desistir' | null

export const PAR_NOVO: EstadoDoPar = { fase: 'novo', reinicios: [], reconstruido: false }

function tentarDeNovo(e: EstadoDoPar, agora: number): { estado: EstadoDoPar; acao: AcaoDoPar } {
  const recentes = e.reinicios.filter((t) => agora - t < JANELA_DE_REINICIOS_MS)
  if (recentes.length < REINICIOS_MAXIMOS) {
    return { estado: { ...e, fase: 'reiniciando', reinicios: [...recentes, agora] }, acao: 'reiniciar_ice' }
  }
  if (!e.reconstruido) return { estado: { fase: 'negociando', reinicios: [], reconstruido: true }, acao: 'reconstruir' }
  return { estado: { ...e, fase: 'perdido', reinicios: recentes }, acao: 'desistir' }
}

export function transicaoDoPar(e: EstadoDoPar, ev: EventoDoPar, agora: number): { estado: EstadoDoPar; acao: AcaoDoPar } {
  if (e.fase === 'perdido') {
    // Só uma negociação nova (o outro voltou, ou "Tentar de novo") tira daqui.
    return ev.tipo === 'negociacao_iniciada' ? { estado: { fase: 'negociando', reinicios: [], reconstruido: false }, acao: null } : { estado: e, acao: null }
  }
  switch (ev.tipo) {
    case 'saiu':
      return { estado: { ...e, fase: 'perdido' }, acao: null }
    case 'negociacao_iniciada':
      return e.fase === 'novo' ? { estado: { ...e, fase: 'negociando' }, acao: null } : { estado: e, acao: null }
    case 'conectou':
      return { estado: { ...e, fase: 'conectado' }, acao: null }
    case 'oscilou':
      return e.fase === 'conectado' ? { estado: { ...e, fase: 'instavel' }, acao: 'agendar_espera' } : { estado: e, acao: null }
    case 'espera_venceu':
      return e.fase === 'instavel' ? tentarDeNovo(e, agora) : { estado: e, acao: null }
    case 'falhou':
      return tentarDeNovo(e, agora)
    case 'negociacao_expirou':
      return e.fase === 'negociando' || e.fase === 'reiniciando' ? tentarDeNovo(e, agora) : { estado: e, acao: null }
  }
}

// ─── Quanto a sala precisa do servidor agora ───────────────────────────

/**
 * A fase de sinalização sai dos pares, não de um palpite: um par negociando
 * precisa de respostas rápidas; um par caído precisa do servidor (o canal P2P
 * caiu junto); todos conectados, só o pulso.
 */
export function faseDeSinal(input: { pares: FaseDoPar[]; outrosPresentes: number; esperados: number }): FaseDeSinal {
  const { pares, outrosPresentes, esperados } = input
  // Par perdido espera o "Tentar de novo" da pessoa: não mantém a sala acelerada.
  const vivos = pares.filter((f) => f !== 'perdido')
  if (vivos.some((f) => f === 'instavel' || f === 'reiniciando')) return 'reconectando'
  if (vivos.some((f) => f === 'negociando' || f === 'novo')) return 'negociando'
  const conectados = vivos.filter((f) => f === 'conectado').length
  if (conectados === 0) return outrosPresentes > 0 && vivos.length === pares.length ? 'negociando' : 'sozinho'
  if (conectados + 1 < esperados) return 'incompleta'
  return 'em_aula'
}
