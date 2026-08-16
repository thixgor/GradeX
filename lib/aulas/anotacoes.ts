/**
 * Anotações da aula (§9).
 *
 * Dois tipos, e a diferença entre eles é o que torna a funcionalidade útil:
 *
 *  • **vinculada ao vídeo** — carrega o segundo em que foi escrita
 *    ("12:48 — Critérios diagnósticos de FA"). Clicar leva o vídeo até lá, o
 *    que transforma a anotação em índice do próprio conteúdo;
 *  • **livre** — sem momento ("Revisar antes da prova"). Serve para o que é
 *    sobre a aula inteira, não sobre um trecho.
 *
 * Este módulo é puro: normalização, ordenação e busca. A regra que ele carrega
 * e que não pode escapar para a UI é a de ordenação — anotação com timestamp
 * ordena por tempo de vídeo (vira sumário), livre ordena por data (vira
 * caderno). Misturar os dois critérios numa lista só embaralha as duas coisas.
 */

export const ANOTACAO_TAMANHO_MAX = 2000

export interface AnotacaoDaAula {
  _id?: string
  aulaId: string
  usuarioId: string
  conteudo: string
  /** Segundo do vídeo. `null` para anotação livre. */
  segundo: number | null
  /** Marcada pelo aluno como ponto de revisão. */
  destacada?: boolean
  criadoEm: Date
  atualizadoEm: Date
}

export interface EntradaDeAnotacao {
  conteudo: string
  segundo?: number | null
  destacada?: boolean
}

/**
 * Limpa e valida o que veio da tela.
 *
 * Devolve `null` para anotação sem conteúdo — salvar caderno vazio só gera
 * lixo que o aluno terá de apagar depois.
 */
export function normalizarAnotacao(entrada: EntradaDeAnotacao): {
  conteudo: string
  segundo: number | null
  destacada: boolean
} | null {
  const conteudo = String(entrada.conteudo || '').trim().slice(0, ANOTACAO_TAMANHO_MAX)
  if (!conteudo) return null

  const bruto = entrada.segundo
  const segundo =
    bruto === null || bruto === undefined || !Number.isFinite(Number(bruto)) || Number(bruto) < 0
      ? null
      : Math.floor(Number(bruto))

  return { conteudo, segundo, destacada: entrada.destacada === true }
}

/**
 * Ordena para leitura.
 *
 * As com timestamp vêm primeiro, em ordem de vídeo — juntas elas formam o
 * sumário da aula escrito pelo próprio aluno. As livres vêm depois, da mais
 * recente para a mais antiga, como um caderno.
 */
export function ordenarAnotacoes<
  // `criadoEm` aceita Date ou string: no servidor é Date, e do fetch chega como
  // ISO. Exigir Date aqui obrigaria cada tela a converter só para ordenar.
  T extends { segundo: number | null; criadoEm: Date | string },
>(anotacoes: T[]): T[] {
  const comTempo = anotacoes.filter((a) => a.segundo !== null && a.segundo !== undefined)
  const livres = anotacoes.filter((a) => a.segundo === null || a.segundo === undefined)

  comTempo.sort((a, b) => (a.segundo as number) - (b.segundo as number))
  livres.sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime())

  return [...comTempo, ...livres]
}

/**
 * Normaliza para busca: sem acento e sem caixa, para "atrio" achar "átrio".
 *
 * O intervalo vai escrito como escape (`\u0300-\u036f`, os diacríticos
 * combinantes que o NFD separa) e não como os caracteres literais: literais
 * são invisíveis no editor e sobrevivem mal a cópia entre ferramentas — foi
 * exatamente assim que esta função nasceu quebrada.
 */
function paraBusca(texto: string): string {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

/** Busca dentro das anotações (§9) — o caderno só serve se der para achar nele. */
export function filtrarAnotacoes<T extends { conteudo: string }>(
  anotacoes: T[],
  termo: string,
): T[] {
  const alvo = paraBusca(termo).trim()
  if (!alvo) return anotacoes
  return anotacoes.filter((a) => paraBusca(a.conteudo).includes(alvo))
}
