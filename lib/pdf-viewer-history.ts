/**
 * Desfazer/refazer das anotações do leitor de PDF.
 *
 * De novo: só a LÓGICA, sem DOM e sem React. O leitor
 * (`components/materiais/secure-pdf-viewer.tsx`) grava aqui o que o usuário
 * acabou de fazer e, ao desfazer, executa o inverso.
 *
 * Duas ideias sustentam o desenho:
 *
 * 1. **Toda ação é reversível por outra ação do próprio leitor.** Criar é o
 *    inverso de apagar, apagar é o inverso de criar e uma edição é o inverso da
 *    edição contrária. Assim desfazer não precisa de endpoint novo nem de
 *    "lixeira" no servidor: reusa criar/apagar/atualizar, que já existem e já
 *    sabem lidar com falha de rede.
 *
 * 2. **A identidade é do CLIENTE, não do banco.** Uma anotação nasce com id
 *    temporário e ganha o id do banco quando a resposta chega; guardar o id do
 *    banco no histórico faria "desfazer" apontar para o nada quando a resposta
 *    ainda não voltou. O `clientId` é sorteado na criação e sobrevive à troca,
 *    então uma entrada do histórico continua encontrando a anotação em qualquer
 *    momento — inclusive depois de ela ser apagada e recriada por um desfazer.
 *
 * Uma entrada do histórico é uma LISTA de operações (um "lote"), porque uma
 * única ação do usuário pode mexer em várias anotações: uma passada da borracha
 * apaga três traços e parte um quarto ao meio, e desfazer isso tem que devolver
 * tudo de uma vez, não em quatro toques.
 */

export type HistoryOp<T> =
  | { kind: 'add'; clientId: string; payload: T }
  | { kind: 'remove'; clientId: string; payload: T }
  | { kind: 'update'; clientId: string; before: T; after: T }

export type HistoryEntry<T> = Array<HistoryOp<T>>

/**
 * Quantas ações ficam guardadas. Cada entrada carrega o traço inteiro (pontos
 * incluídos), então a pilha é memória de verdade — 80 passos cobrem qualquer
 * arrependimento real de leitura sem virar um vazamento em sessão longa.
 */
export const HISTORY_LIMIT = 80

export function invertOp<T>(op: HistoryOp<T>): HistoryOp<T> {
  if (op.kind === 'add') return { kind: 'remove', clientId: op.clientId, payload: op.payload }
  if (op.kind === 'remove') return { kind: 'add', clientId: op.clientId, payload: op.payload }
  return { kind: 'update', clientId: op.clientId, before: op.after, after: op.before }
}

/**
 * O inverso de um lote é o inverso de cada operação, DE TRÁS PARA A FRENTE.
 * A ordem importa: se um lote apaga um traço e cria dois pedaços no lugar,
 * desfazer precisa remover os pedaços antes de devolver o original — senão os
 * três coexistem por um instante e a tela pisca com traço repetido.
 */
export function invertEntry<T>(entry: HistoryEntry<T>): HistoryEntry<T> {
  const inverted: HistoryEntry<T> = []
  for (let index = entry.length - 1; index >= 0; index--) {
    inverted.push(invertOp(entry[index]))
  }
  return inverted
}

/** Empilha respeitando o teto. Lote vazio não vira passo de desfazer. */
export function pushEntry<T>(
  stack: Array<HistoryEntry<T>>,
  entry: HistoryEntry<T>,
  limit = HISTORY_LIMIT
): Array<HistoryEntry<T>> {
  if (entry.length === 0) return stack
  const next = [...stack, entry]
  return next.length > limit ? next.slice(next.length - limit) : next
}
