/**
 * As conversas salvas do Dom, no aparelho (`localStorage`), por conta.
 *
 * O servidor não guarda conversa nenhuma (nem custa escrita, nem guarda dado
 * de saúde de ninguém); quem guarda é o navegador. A chave leva a
 * identificação anônima da conta (`StatusDoDom.conta`): duas contas no mesmo
 * aparelho não veem as conversas uma da outra. As falas do Dom continuam com
 * a assinatura do servidor, então reabrir uma conversa antiga e seguir nela
 * funciona — e histórico editado à mão continua descartado.
 *
 * Funções puras sobre a lista (testadas em `__tests__/dom/arquivo.test.ts`);
 * a leitura e a gravação ficam nas duas últimas.
 */

import type { ModoDoDom } from '@/lib/dom/config'

export interface ConversaSalva<M = unknown, S = unknown> {
  id: string
  modo: ModoDoDom
  titulo: string
  atualizadaEm: number
  mensagens: M[]
  /** Estado da sessão socrática (tema, etapa, progresso), quando é desse modo. */
  socratico?: S
}

/** Teto do arquivo: passou de 25, as mais antigas saem para as novas entrarem. */
export const MAX_CONVERSAS = 25
/** Só as últimas falas de cada conversa (o modelo só lê as 8 últimas mesmo). */
export const MAX_MENSAGENS_POR_CONVERSA = 24

export function novoIdDeConversa(): string {
  return `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

/** Título: a primeira fala do aluno, curta. */
export function tituloDe(mensagens: Array<{ papel?: string; texto?: string }>, padrao = 'Nova conversa'): string {
  const primeira = mensagens.find((m) => m.papel === 'aluno')?.texto?.replace(/\s+/g, ' ').trim()
  if (!primeira) return padrao
  const sem = primeira.replace(/^quero estudar pelo método socrático:\s*/i, 'Socrático: ')
  return sem.length > 60 ? `${sem.slice(0, 57)}…` : sem
}

/** Insere ou atualiza a conversa, a mais recente primeiro, com teto. Conversa vazia não entra. */
export function salvarNaLista<M, S>(lista: ConversaSalva<M, S>[], conversa: ConversaSalva<M, S>): ConversaSalva<M, S>[] {
  const resto = lista.filter((c) => c.id !== conversa.id)
  if (!conversa.mensagens.length) return resto
  // Leve: sem as sugestões (efêmeras) e no máximo 24 falas.
  const enxuta = {
    ...conversa,
    mensagens: conversa.mensagens.slice(-MAX_MENSAGENS_POR_CONVERSA).map((m) => {
      if (!m || typeof m !== 'object') return m
      const { sugestoes: _s, ...resto } = m as Record<string, unknown>
      return resto as M
    }),
  }
  return [enxuta, ...resto].sort((a, b) => b.atualizadaEm - a.atualizadaEm).slice(0, MAX_CONVERSAS)
}

export function removerDaLista<M, S>(lista: ConversaSalva<M, S>[], id: string): ConversaSalva<M, S>[] {
  return lista.filter((c) => c.id !== id)
}

export type GrupoDeData = 'Hoje' | 'Ontem' | 'Últimos 7 dias' | 'Antes'

export function grupoDaData(quando: number, agora = Date.now()): GrupoDeData {
  // Dia do aparelho, o mesmo fuso da hora mostrada ao lado do título.
  const dia = (t: number) => new Date(t).setHours(0, 0, 0, 0)
  const dias = Math.round((dia(agora) - dia(quando)) / 86_400_000)
  if (dias <= 0) return 'Hoje'
  if (dias === 1) return 'Ontem'
  if (dias < 7) return 'Últimos 7 dias'
  return 'Antes'
}

const chave = (conta: string) => `dom:conversas:v1:${conta || 'anon'}`

export function lerConversas<M, S>(conta: string): ConversaSalva<M, S>[] {
  try {
    const bruto = localStorage.getItem(chave(conta))
    const lista = bruto ? (JSON.parse(bruto) as ConversaSalva<M, S>[]) : []
    return Array.isArray(lista) ? lista.filter((c) => c && typeof c.id === 'string' && Array.isArray(c.mensagens)) : []
  } catch {
    return []
  }
}

export function gravarConversas<M, S>(conta: string, lista: ConversaSalva<M, S>[]): void {
  try {
    localStorage.setItem(chave(conta), JSON.stringify(lista))
  } catch {
    // Cheio: guarda só a metade mais recente e tenta de novo.
    try {
      localStorage.setItem(chave(conta), JSON.stringify(lista.slice(0, Math.ceil(lista.length / 2))))
    } catch {
      /* sem armazenamento: as conversas vivem só nesta visita */
    }
  }
}
