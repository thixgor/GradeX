import { diaEmBrasilia } from '@/lib/fuso-brasilia'

/**
 * O ritmo de estudo dos flashcards: a meta diária e a sequência de dias.
 *
 * Os dois moram no aparelho. A meta é preferência pessoal; a sequência é
 * marcada aqui sempre que um card é avaliado e, no painel de /flashcards,
 * também quando o servidor diz que hoje já houve revisão (`reviewedToday`) —
 * assim quem estudou no celular vê o dia marcado no computador.
 */

const CHAVE_DIAS = 'gdx:flashcards-dias'
const CHAVE_META = 'gdx:flashcards-meta'
export const EVENTO_RITMO = 'gdx:flashcards-ritmo'

export const METAS_DIARIAS = [10, 20, 50, 100] as const
export const META_PADRAO = 20

function lerDias(): string[] {
  try {
    const bruto = JSON.parse(window.localStorage.getItem(CHAVE_DIAS) || '[]')
    return Array.isArray(bruto) ? bruto.filter((d): d is string => typeof d === 'string') : []
  } catch {
    return []
  }
}

/** Marca hoje (dia de Brasília) como dia de estudo. */
export function registrarDiaDeEstudo(instante: Date = new Date()) {
  if (typeof window === 'undefined') return
  const hoje = diaEmBrasilia(instante)
  const dias = lerDias()
  if (dias.includes(hoje)) return
  const proximos = [...dias, hoje].sort().slice(-90)
  try {
    window.localStorage.setItem(CHAVE_DIAS, JSON.stringify(proximos))
    window.dispatchEvent(new Event(EVENTO_RITMO))
  } catch {}
}

/** "AAAA-MM-DD" do dia anterior, sem passar por fuso (é aritmética de calendário). */
function diaAnterior(dia: string): string {
  const [a, m, d] = dia.split('-').map(Number)
  const data = new Date(Date.UTC(a, m - 1, d - 1))
  return data.toISOString().slice(0, 10)
}

/**
 * Dias seguidos de estudo terminando hoje — ou ontem, porque a sequência só
 * quebra quando o dia de hoje acaba sem estudo, não na virada da meia-noite.
 */
export function lerSequencia(instante: Date = new Date()): { dias: number; estudouHoje: boolean } {
  if (typeof window === 'undefined') return { dias: 0, estudouHoje: false }
  const conjunto = new Set(lerDias())
  const hoje = diaEmBrasilia(instante)
  const estudouHoje = conjunto.has(hoje)
  let cursor = estudouHoje ? hoje : diaAnterior(hoje)
  let dias = 0
  while (conjunto.has(cursor)) {
    dias += 1
    cursor = diaAnterior(cursor)
  }
  return { dias, estudouHoje }
}

export function lerMetaDiaria(): number {
  if (typeof window === 'undefined') return META_PADRAO
  try {
    const valor = Number(window.localStorage.getItem(CHAVE_META))
    return (METAS_DIARIAS as readonly number[]).includes(valor) ? valor : META_PADRAO
  } catch {
    return META_PADRAO
  }
}

export function salvarMetaDiaria(meta: number) {
  try {
    window.localStorage.setItem(CHAVE_META, String(meta))
    window.dispatchEvent(new Event(EVENTO_RITMO))
  } catch {}
}
