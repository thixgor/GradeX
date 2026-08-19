import { Db, Document, ObjectId } from 'mongodb'

/**
 * Apagar questões do Banco levando junto tudo que aponta para elas.
 *
 * ## Por que não basta `deleteMany` em `banco_questoes`
 *
 * As questões são referenciadas em quatro lugares, e cada um quebra de um jeito
 * diferente quando a referência morre:
 *
 * - **`banco_resolucoes`** — o histórico do aluno mostraria linhas vazias e a
 *   estatística contaria acertos de questões que não existem mais;
 * - **`banco_listas_usuario`** — a lista abre com menos questões do que diz
 *   ter, ou vazia;
 * - **`banco_questoes_reports`** — o relato fica na fila do admin apontando
 *   para o nada;
 * - **`users.bancoQuestoesLiberadas`** — é o saldo gratuito. O id de uma
 *   questão apagada continuaria contando como questão gasta, e a pessoa
 *   perderia para sempre um crédito que consumiu em conteúdo inexistente.
 *
 * A rota de "apagar tudo" já fazia essa limpeza; a exclusão de um módulo ou
 * tópico não fazia nenhuma. Agora as duas passam por aqui.
 *
 * ## Ordem
 *
 * As referências caem ANTES das questões, de propósito. Se a chamada morrer no
 * meio, o pior estado possível é "resolução apagada, questão de pé" — visível e
 * recuperável. O contrário deixa histórico órfão para sempre.
 */

export interface RemocaoDeQuestoes {
  questoes: number
  resolucoes: number
  listas: number
  relatos: number
  saldos: number
}

/** `$in` gigante é uma consulta gigante; o lote mantém cada uma sob controle. */
const TAMANHO_DO_LOTE = 1000

function emLotes<T>(itens: T[]): T[][] {
  const lotes: T[][] = []
  for (let i = 0; i < itens.length; i += TAMANHO_DO_LOTE) {
    lotes.push(itens.slice(i, i + TAMANHO_DO_LOTE))
  }
  return lotes
}

export async function removerQuestoes(db: Db, filtro: Document): Promise<RemocaoDeQuestoes> {
  const alvos = await db
    .collection('banco_questoes')
    .find(filtro, { projection: { _id: 1 } })
    .toArray()

  const ids = alvos.map((q) => q._id as ObjectId)
  const total: RemocaoDeQuestoes = { questoes: 0, resolucoes: 0, listas: 0, relatos: 0, saldos: 0 }
  if (ids.length === 0) return total

  for (const lote of emLotes(ids)) {
    const comoTexto = lote.map(String)

    const resolucoes = await db.collection('banco_resolucoes').deleteMany({ questaoId: { $in: lote } })
    total.resolucoes += resolucoes.deletedCount || 0

    const listas = await db
      .collection('banco_listas_usuario')
      .updateMany({ questaoIds: { $in: lote } }, { $pull: { questaoIds: { $in: lote } } as any })
    total.listas += listas.modifiedCount || 0

    // O relato guarda a questão em `questionId` (ver a rota de relatos).
    const relatos = await db.collection('banco_questoes_reports').deleteMany({ questionId: { $in: lote } })
    total.relatos += relatos.deletedCount || 0

    // O saldo gratuito guarda o id como texto (ver lib/banco/acesso-servidor.ts).
    const saldos = await db
      .collection('users')
      .updateMany(
        { bancoQuestoesLiberadas: { $in: comoTexto } },
        { $pull: { bancoQuestoesLiberadas: { $in: comoTexto } } as any },
      )
    total.saldos += saldos.modifiedCount || 0

    const apagadas = await db.collection('banco_questoes').deleteMany({ _id: { $in: lote } })
    total.questoes += apagadas.deletedCount || 0
  }

  return total
}
