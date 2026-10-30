import 'server-only'

/**
 * Leitura dos temas do Método Socrático no banco: a ementa de
 * `/admin/cronogramas`. O cache curto (30 s) e a invalidação na importação já
 * moram em `lib/cronogramas/ementa.ts` — o Dom só reaproveita.
 */

import { getEmenta, getIndiceDeEmentas } from '@/lib/cronogramas/ementa'
import { achatarEmenta, type CursoComTemas, type CursoDoDom, type TemaDoDom } from './temas'

/** Cursos e os períodos que têm ementa importada. */
export async function cursosDoDom(): Promise<CursoComTemas[]> {
  const indice = await getIndiceDeEmentas()
  return indice.map((c) => ({ id: c.id, nome: c.nome, periodos: c.periodos.map((p) => p.periodo) }))
}

export async function temasDoPeriodo(curso: CursoDoDom, periodo: number): Promise<TemaDoDom[]> {
  if (!Number.isInteger(periodo) || periodo < 1 || periodo > 12) return []
  return achatarEmenta(await getEmenta(curso, periodo))
}

/** Acha um tema pelo id (a rota do chat recebe só o id e remonta o resto). */
export async function temaPorId(curso: CursoDoDom, periodo: number, id: string): Promise<TemaDoDom | null> {
  return (await temasDoPeriodo(curso, periodo)).find((t) => t.id === id) || null
}
