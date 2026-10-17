/**
 * Anotações por cima da tela compartilhada (estilo Zoom) e reações — regras
 * puras, usadas pelo navegador de quem desenha e de quem recebe.
 *
 * O traço viaja como VETOR pelo canal P2P (coordenadas de 0 a 1 sobre a imagem
 * da tela), e cada navegador desenha a camada por cima do vídeo: nada de
 * reprocessar a tela, nenhum byte pelo servidor.
 */

import type { PapelNaSala } from '../tipos'

export const CORES_DE_ANOTACAO = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7', '#ffffff', '#111827'] as const
export type CorDeAnotacao = (typeof CORES_DE_ANOTACAO)[number]
export type Ferramenta = 'caneta' | 'marca' | 'seta'

/** Pontos por mensagem (x,y achatados): cabe folgado nos 20 KB do canal. */
export const PONTOS_POR_MENSAGEM = 300
/** Pontos por traço e traços por tela: um limite contra quem tentar travar a tela dos outros. */
export const PONTOS_POR_TRACO = 4_000
export const TRACOS_POR_TELA = 300

export interface Traco {
  id: string
  /** Quem desenhou (pid). */
  de: string
  ferramenta: Ferramenta
  cor: CorDeAnotacao
  /** x0, y0, x1, y1… de 0 a 1 sobre a imagem da tela. */
  pontos: number[]
  fim: boolean
}

export type MensagemDeAnotacao =
  | { t: 'anotacao'; op: 'traco'; id: string; ferramenta: Ferramenta; cor: CorDeAnotacao; pontos: number[]; fim: boolean }
  | { t: 'anotacao'; op: 'apagar'; id: string }
  | { t: 'anotacao'; op: 'limpar' }

export const REACOES = ['👏', '❤️', '😂', '😮', '🎉', '👍', '🤯', '💡'] as const
export type Reacao = (typeof REACOES)[number]
/** Uma reação a cada 700 ms por pessoa (quem envia segura; quem recebe descarta o excesso). */
export const INTERVALO_DE_REACAO_MS = 700

/**
 * Quem pode riscar uma tela: o monitor, em qualquer tela compartilhada; quem
 * está compartilhando, na própria tela.
 */
export function podeAnotar(s: { papel: PapelNaSala; donoDaTela: boolean }): boolean {
  return s.papel === 'monitor' || s.donoDaTela
}

const ehId = (v: unknown): v is string => typeof v === 'string' && /^[A-Za-z0-9_-]{1,24}$/.test(v)

/** Confere uma anotação vinda do canal (campos, tamanhos, faixa das coordenadas). */
export function lerAnotacao(m: Record<string, unknown>): MensagemDeAnotacao | null {
  if (m.op === 'limpar') return { t: 'anotacao', op: 'limpar' }
  if (m.op === 'apagar') return ehId(m.id) ? { t: 'anotacao', op: 'apagar', id: m.id } : null
  if (m.op !== 'traco' || !ehId(m.id)) return null
  if (m.ferramenta !== 'caneta' && m.ferramenta !== 'marca' && m.ferramenta !== 'seta') return null
  if (!CORES_DE_ANOTACAO.includes(m.cor as CorDeAnotacao)) return null
  const p = m.pontos
  if (!Array.isArray(p) || p.length % 2 !== 0 || p.length > PONTOS_POR_MENSAGEM * 2) return null
  if (!p.every((n) => typeof n === 'number' && Number.isFinite(n) && n >= -0.05 && n <= 1.05)) return null
  return { t: 'anotacao', op: 'traco', id: m.id, ferramenta: m.ferramenta, cor: m.cor as CorDeAnotacao, pontos: p as number[], fim: m.fim === true }
}

export function lerReacao(m: Record<string, unknown>): { t: 'reacao'; e: Reacao } | null {
  return REACOES.includes(m.e as Reacao) ? { t: 'reacao', e: m.e as Reacao } : null
}

/**
 * Aplica uma anotação à lista de traços. Cada traço é de quem o desenhou:
 * "apagar" só tira o próprio traço; "limpar" do monitor (ou do dono da tela)
 * limpa tudo, de outro só os dele. Imutável (vai direto para o estado da tela).
 */
export function aplicarAnotacao(tracos: Traco[], de: string, m: MensagemDeAnotacao, podeLimparTudo: boolean): Traco[] {
  if (m.op === 'limpar') return podeLimparTudo ? [] : tracos.filter((t) => t.de !== de)
  if (m.op === 'apagar') return tracos.filter((t) => !(t.id === m.id && t.de === de))
  const i = tracos.findIndex((t) => t.id === m.id && t.de === de)
  if (i === -1) {
    if (tracos.length >= TRACOS_POR_TELA) return tracos
    return [...tracos, { id: m.id, de, ferramenta: m.ferramenta, cor: m.cor, pontos: m.pontos.slice(0, PONTOS_POR_TRACO * 2), fim: m.fim }]
  }
  const atual = tracos[i]
  if (atual.fim) return tracos
  const pontos = atual.pontos.length >= PONTOS_POR_TRACO * 2 ? atual.pontos : [...atual.pontos, ...m.pontos].slice(0, PONTOS_POR_TRACO * 2)
  const novo = [...tracos]
  novo[i] = { ...atual, pontos, fim: m.fim }
  return novo
}

/** Arredonda para 4 casas (≈ 0,2 px numa tela 4K): mensagens menores. */
export function arredondar(n: number): number {
  return Math.round(Math.min(1.05, Math.max(-0.05, n)) * 10_000) / 10_000
}
