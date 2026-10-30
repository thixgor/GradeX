/**
 * Temas do Método Socrático: a ementa que o admin importa em
 * `/admin/cronogramas` (coleção `cronograma_ementas`), a MESMA que monta os
 * cronogramas em `/cronogramas`. Corrigiu um assunto lá, o Dom já pergunta
 * sobre o assunto corrigido — sem deploy. A leitura do banco fica em
 * `temas-servidor.ts`; aqui só o que é puro (e testável).
 *
 * A tela recebe a lista achatada de um período: tópico › subtópico › módulo,
 * com os submódulos como "o que cai" — é isso que o Dom usa para montar a
 * escada de perguntas sem precisar de outro pedido.
 */

import { isSecaoCurso, type EmentaTopico, type SecaoCurso } from '@/lib/cronogramas/tipos'

export type CursoDoDom = SecaoCurso

export interface CursoComTemas {
  id: CursoDoDom
  nome: string
  /** Períodos que têm ementa importada (os únicos que o seletor oferece). */
  periodos: number[]
}

export interface TemaDoDom {
  id: string
  titulo: string
  /** "SOI I › Bases moleculares" */
  trilha: string
  /** Até seis submódulos, para o Dom saber o que cobrar. */
  itens: string[]
}

/**
 * Achata a ementa em temas (um por módulo). O que o admin desmarcou
 * (`incluido: false`) fica de fora, como no gerador de cronogramas.
 */
export function achatarEmenta(topicos: EmentaTopico[]): TemaDoDom[] {
  const saida: TemaDoDom[] = []
  for (const topico of topicos || []) {
    if (topico?.incluido === false) continue
    for (const sub of topico.subtopicos || []) {
      if (sub?.incluido === false) continue
      for (const modulo of sub.modulos || []) {
        if (modulo?.incluido === false) continue
        saida.push({
          id: String(modulo.id),
          titulo: String(modulo.nome).slice(0, 160),
          trilha: `${topico.nome} › ${sub.nome}`,
          itens: (modulo.submodulos || []).slice(0, 6).map((s) => String(s.nome).slice(0, 110)),
        })
      }
    }
  }
  return saida
}

export function cursoValido(v: unknown): v is CursoDoDom {
  return isSecaoCurso(v)
}
