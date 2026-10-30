/**
 * Temas do Método Socrático, tirados da mesma grade dos cronogramas.
 *
 * Os quatro arquivos de grade somam ~400 KB de módulo; por isso só o servidor
 * os importa (rota `GET /api/dom/temas`, cacheada na borda) e a tela recebe a
 * lista achatada de um período: tópico › subtópico › módulo, com os
 * submódulos como "o que cai" — é isso que o Dom usa para montar a escada de
 * perguntas sem precisar de outro pedido.
 */

import { getMedicinaTopicos } from '@/lib/medicina-periodos-helper'
import { getBiomedicinaTopicos, type BiomedicinaPeriodo } from '@/lib/biomedicina-periodos-helper'
import { getOdontologiaTopicos, type OdontologiaPeriodo } from '@/lib/odontologia-periodos-helper'
import { getPsicologiaTopicos, type PsicologiaPeriodo } from '@/lib/psicologia-periodos-helper'

export type CursoDoDom = 'medicina' | 'biomedicina' | 'odontologia' | 'psicologia'

export const CURSOS_DO_DOM: Array<{ id: CursoDoDom; nome: string; periodos: number }> = [
  { id: 'medicina', nome: 'Medicina', periodos: 5 },
  { id: 'biomedicina', nome: 'Biomedicina', periodos: 7 },
  { id: 'odontologia', nome: 'Odontologia', periodos: 10 },
  { id: 'psicologia', nome: 'Psicologia', periodos: 10 },
]

export interface TemaDoDom {
  id: string
  titulo: string
  /** "SOI I › Bases moleculares" */
  trilha: string
  /** Até seis submódulos, para o Dom saber o que cobrar. */
  itens: string[]
}

function topicosDe(curso: CursoDoDom, periodo: number): any[] {
  switch (curso) {
    case 'medicina':
      return getMedicinaTopicos(periodo as 1 | 2 | 3 | 4 | 5) || []
    case 'biomedicina':
      return getBiomedicinaTopicos(periodo as BiomedicinaPeriodo) || []
    case 'odontologia':
      return getOdontologiaTopicos(periodo as OdontologiaPeriodo) || []
    case 'psicologia':
      return getPsicologiaTopicos(periodo as PsicologiaPeriodo) || []
  }
}

export function temasDoPeriodo(curso: CursoDoDom, periodo: number): TemaDoDom[] {
  const def = CURSOS_DO_DOM.find((c) => c.id === curso)
  if (!def || !Number.isInteger(periodo) || periodo < 1 || periodo > def.periodos) return []
  const saida: TemaDoDom[] = []
  for (const topico of topicosDe(curso, periodo)) {
    for (const sub of topico?.subtopicos || []) {
      for (const modulo of sub?.modulos || []) {
        saida.push({
          id: String(modulo.id),
          titulo: String(modulo.nome),
          trilha: `${topico.nome} › ${sub.nome}`,
          itens: (modulo.submodulos || []).slice(0, 6).map((s: any) => String(s.nome).slice(0, 110)),
        })
      }
    }
  }
  return saida
}

/** Acha um tema pelo id (a rota do chat recebe só o id e remonta o resto). */
export function temaPorId(curso: CursoDoDom, periodo: number, id: string): TemaDoDom | null {
  return temasDoPeriodo(curso, periodo).find((t) => t.id === id) || null
}

export function cursoValido(v: unknown): v is CursoDoDom {
  return typeof v === 'string' && CURSOS_DO_DOM.some((c) => c.id === v)
}
