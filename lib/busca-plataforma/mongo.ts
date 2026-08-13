import { buildAccentInsensitivePattern } from '../manual-clinico-search'

/**
 * Tradução da consulta do usuário para filtro do Mongo.
 *
 * Vive fora da rota para poder ser testada sem banco: o que importa aqui é a
 * SEMÂNTICA do filtro (todos os termos, qualquer campo, sem depender de acento),
 * e ela pode ser conferida executando as expressões regulares geradas.
 *
 * Por que expressão regular e não `$text`: o índice de texto casa palavra
 * inteira depois de radicalizar, e quem digita "cardio" quer ver "cardiologia"
 * antes de terminar a palavra. O custo é varredura — quem chama compensa com
 * `limit` curto e `maxTimeMS`.
 */

/** Mais que isto vira uma varredura em cascata por termo digitado. */
export const MAX_TERMOS_MONGO = 4

export interface CondicaoDeTexto {
  $and: Array<{ $or: Array<Record<string, { $regex: string; $options: string }>> }>
}

/**
 * Filtro que exige TODOS os termos — cada um podendo aparecer em qualquer um
 * dos campos. Buscar "prova cardiologia" não pode devolver toda prova só porque
 * a palavra "prova" está no título.
 */
export function condicaoDeTexto(campos: string[], termos: string[]): CondicaoDeTexto {
  return {
    $and: termos.slice(0, MAX_TERMOS_MONGO).map(termo => {
      const regex = { $regex: buildAccentInsensitivePattern(termo), $options: 'i' }
      return { $or: campos.map(campo => ({ [campo]: regex })) }
    }),
  }
}

/** Texto de banco pronto para a lista: sem marcação, sem quebra, com teto. */
export function textoCurto(valor: unknown, maximo = 160): string | undefined {
  if (typeof valor !== 'string') return undefined
  const limpo = valor.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  if (!limpo) return undefined
  return limpo.length > maximo ? `${limpo.slice(0, maximo - 1)}…` : limpo
}

/** Só as strings de um campo que deveria ser lista — o banco tem de tudo. */
export function listaDeTextos(valor: unknown): string[] {
  if (!Array.isArray(valor)) return []
  return valor.filter((v): v is string => typeof v === 'string').slice(0, 12)
}
