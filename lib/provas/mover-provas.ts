import type { GrupoNaArvore } from '@/lib/provas/arvore-grupos'

/**
 * Quem pode mover qual prova para onde.
 *
 * A regra já existia, escrita à mão dentro da rota que move UMA prova. Movendo
 * várias de uma vez ela precisa ser aplicada por prova — mover 40 provas não
 * pode virar uma decisão só, senão uma prova de grupo geral entraria na leva de
 * um usuário comum sem ninguém perceber.
 *
 * Por isso a decisão é uma função pura, e a rota só a executa: é a mesma
 * resposta para uma prova ou para quarenta.
 */

export interface ProvaMovivel {
  _id?: unknown
  groupId?: string | null
  createdBy?: string
  isPersonalExam?: boolean
}

export interface Vereditodemover {
  ok: boolean
  motivo?: string
}

export function podeMoverProva(
  prova: ProvaMovivel,
  grupoAtual: GrupoNaArvore | null | undefined,
  grupoDestino: GrupoNaArvore | null | undefined,
  usuario: { id: string; ehAdmin: boolean },
): Vereditodemover {
  // Tirar prova de um grupo geral é decisão de admin: ela está publicada para
  // todo mundo e sumir dali afeta quem já a via.
  if (grupoAtual?.type === 'general' && !usuario.ehAdmin) {
    return { ok: false, motivo: 'Apenas administradores movem provas de grupos gerais' }
  }

  if (!usuario.ehAdmin && prova.createdBy !== usuario.id) {
    return { ok: false, motivo: 'Esta prova é de outra pessoa' }
  }

  if (grupoDestino) {
    if (grupoDestino.type === 'general' && !usuario.ehAdmin) {
      return { ok: false, motivo: 'Apenas administradores movem provas para grupos gerais' }
    }
    if (
      grupoDestino.type === 'personal' &&
      grupoDestino.createdBy &&
      grupoDestino.createdBy !== usuario.id
    ) {
      return { ok: false, motivo: 'Este grupo é de outra pessoa' }
    }
  }

  return { ok: true }
}

/**
 * Resume o resultado de uma leva.
 *
 * Uma mudança em lote que responde só "ok" esconde o caso mais provável: parte
 * moveu e parte não. A frase precisa dizer o que ficou para trás, senão o admin
 * fecha o diálogo achando que terminou.
 */
export function resumirMovimentacao(movidas: number, recusadas: number): string {
  if (movidas === 0) return 'Nenhuma prova foi movida.'
  const inicio = movidas === 1 ? '1 prova movida' : `${movidas} provas movidas`
  if (recusadas === 0) return `${inicio}.`
  return `${inicio} — ${recusadas === 1 ? '1 ficou' : `${recusadas} ficaram`} para trás por falta de permissão.`
}
