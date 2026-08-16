/**
 * Turmas (§16).
 *
 * O motor de acesso já sabia avaliar `{ tipo: 'grupo' }` e o contexto do usuário
 * já consultava `aulas_grupos` para descobrir de quais turmas ele participa. Só
 * que **nada nunca escrevia nessa coleção**: não havia rota, não havia tela.
 * A funcionalidade inteira existia como código morto — a consulta rodava em toda
 * abertura de aula e voltava sempre vazia.
 *
 * Este módulo é a metade que faltava, e é puro de propósito: normalizar nome,
 * validar e reconciliar a lista de membros é onde os erros de turma acontecem
 * (e-mail repetido, espaço sobrando, alguém removido que volta na próxima
 * colagem), e isso precisa ser testável sem banco.
 */

export const NOME_GRUPO_MAX = 80
export const DESCRICAO_GRUPO_MAX = 240
/** Teto por turma. Acima disso a lista deixa de caber numa tela e vira planilha. */
export const MAX_MEMBROS = 2000

export interface GrupoDeAulas {
  _id?: string
  nome: string
  descricao?: string
  /** Ids de usuários. É o que `montarContextoDoUsuario` consulta. */
  membros: string[]
  criadoEm: Date
  atualizadoEm: Date
}

export interface EntradaDeGrupo {
  nome?: unknown
  descricao?: unknown
}

/** Limpa o que veio da tela. `null` quando não sobra nome. */
export function normalizarGrupo(entrada: EntradaDeGrupo): { nome: string; descricao: string } | null {
  const nome = String(entrada.nome ?? '').trim().slice(0, NOME_GRUPO_MAX)
  if (!nome) return null
  const descricao = String(entrada.descricao ?? '').trim().slice(0, DESCRICAO_GRUPO_MAX)
  return { nome, descricao }
}

/**
 * Separa um texto colado em e-mails.
 *
 * Aceita vírgula, ponto e vírgula, espaço e quebra de linha porque é assim que
 * a lista chega no mundo real: copiada de uma planilha, de um WhatsApp ou de um
 * campo "Para:" de e-mail. Exigir um formato só garantiria que metade das
 * colagens falhasse em silêncio.
 */
export function separarEmails(texto: string): string[] {
  return String(texto || '')
    .split(/[\s,;]+/)
    .map((p) => p.trim().toLowerCase())
    .filter((p) => p.includes('@') && p.length <= 254)
}

/** Remove repetidos preservando a ordem de chegada. */
export function unicos(valores: string[]): string[] {
  const vistos = new Set<string>()
  const saida: string[] = []
  for (const v of valores) {
    if (!v || vistos.has(v)) continue
    vistos.add(v)
    saida.push(v)
  }
  return saida
}

export interface ResultadoDeInclusao {
  membros: string[]
  adicionados: number
  jaEstavam: number
  excedentes: number
}

/**
 * Acrescenta ids à turma respeitando o teto.
 *
 * Devolve os números separados — adicionados, já estavam, não couberam — porque
 * "12 adicionados" e "12 já estavam" são resultados muito diferentes para quem
 * acabou de colar uma lista, e um total só esconderia a diferença.
 */
export function incluirMembros(atuais: string[], novos: string[]): ResultadoDeInclusao {
  const base = unicos(atuais)
  const existentes = new Set(base)

  const candidatos = unicos(novos).filter((id) => !existentes.has(id))
  const jaEstavam = unicos(novos).length - candidatos.length

  const espaco = Math.max(0, MAX_MEMBROS - base.length)
  const cabem = candidatos.slice(0, espaco)

  return {
    membros: [...base, ...cabem],
    adicionados: cabem.length,
    jaEstavam,
    excedentes: candidatos.length - cabem.length,
  }
}

export function removerMembros(atuais: string[], remover: string[]): string[] {
  const fora = new Set(remover)
  return unicos(atuais).filter((id) => !fora.has(id))
}
