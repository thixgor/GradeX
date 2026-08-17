/**
 * Avisos (§36).
 *
 * O curso precisa de um lugar para falar com quem está matriculado: "a aula de
 * quinta mudou de horário", "o módulo 4 foi regravado". Sem isso, o recado vai
 * para o WhatsApp e some — e quem entra depois nunca fica sabendo.
 *
 * A coleção `aulas_avisos` já existia, com um aviso GLOBAL da plataforma (e sem
 * nenhuma tela consumindo). Os avisos de curso passam a morar nela também,
 * distinguidos por `setorId`. Isso obriga uma regra que é a razão deste módulo
 * existir:
 *
 *     **toda consulta precisa dizer o escopo.**
 *
 * O POST global desativava TODOS os avisos ativos antes de criar o novo
 * (`updateMany({ ativo: true })`). Com avisos de curso na mesma coleção, isso
 * apagaria silenciosamente os recados de todos os cursos toda vez que alguém
 * publicasse um aviso geral. Os filtros abaixo existem para que esse tipo de
 * vazamento entre escopos não dependa de ninguém lembrar.
 */

export type TipoDeAviso = 'info' | 'warning' | 'success' | 'error'

export const TIPOS_DE_AVISO: TipoDeAviso[] = ['info', 'warning', 'success', 'error']

export const TITULO_AVISO_MAX = 120
export const MENSAGEM_AVISO_MAX = 1000
/** Teto por curso: um mural, não um histórico. */
export const MAX_AVISOS_POR_CURSO = 20

export interface AvisoDeAula {
  _id?: string
  /** Ausente = aviso global da plataforma. Presente = aviso daquele curso. */
  setorId?: string | null
  titulo: string
  mensagem: string
  tipo: TipoDeAviso
  /** Fica no topo, acima dos demais. Para o recado que não pode passar batido. */
  fixado?: boolean
  ativo: boolean
  criadoEm: Date
  atualizadoEm: Date
  criadoPor?: string
  criadoPorNome?: string
}

/**
 * Filtro do aviso GLOBAL.
 *
 * Precisa excluir explicitamente os avisos de curso. Sem isso,
 * `findOne({ ativo: true })` poderia devolver o recado da turma de Cardiologia
 * como se fosse anúncio da plataforma inteira — para todo mundo.
 */
export function filtroGlobal() {
  return { ativo: true, $or: [{ setorId: { $exists: false } }, { setorId: null }] }
}

/** Filtro dos avisos de um curso. */
export function filtroDoCurso(setorId: string) {
  return { ativo: true, setorId }
}

export interface EntradaDeAviso {
  titulo?: unknown
  mensagem?: unknown
  tipo?: unknown
  fixado?: unknown
}

/** Limpa e valida o que veio da tela. `null` quando falta título ou mensagem. */
export function normalizarAviso(entrada: EntradaDeAviso): {
  titulo: string
  mensagem: string
  tipo: TipoDeAviso
  fixado: boolean
} | null {
  const titulo = String(entrada.titulo ?? '').trim().slice(0, TITULO_AVISO_MAX)
  const mensagem = String(entrada.mensagem ?? '').trim().slice(0, MENSAGEM_AVISO_MAX)
  if (!titulo || !mensagem) return null

  const bruto = String(entrada.tipo ?? 'info') as TipoDeAviso
  // Tipo inválido vira "info" em vez de recusar: o aviso é o conteúdo, e perder
  // o recado inteiro por causa de um rótulo de cor seria desproporcional.
  const tipo = TIPOS_DE_AVISO.includes(bruto) ? bruto : 'info'

  return { titulo, mensagem, tipo, fixado: entrada.fixado === true }
}

/**
 * Ordena para leitura: fixados primeiro, depois do mais novo para o mais velho.
 *
 * O fixado existe justamente para escapar da ordem cronológica — um recado
 * importante de duas semanas atrás não pode afundar embaixo de três avisos de
 * rotina.
 */
export function ordenarAvisos<T extends { fixado?: boolean; criadoEm: Date | string }>(
  avisos: T[],
): T[] {
  return avisos.slice().sort((a, b) => {
    const fixo = Number(b.fixado === true) - Number(a.fixado === true)
    if (fixo !== 0) return fixo
    return new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime()
  })
}
