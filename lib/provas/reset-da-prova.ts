import type { Db } from 'mongodb'
import { ObjectId } from 'mongodb'
import { COLECAO_DE_ENTRADAS } from './entrada-na-prova'
import { COLECAO_DE_PROGRESSO } from './retomada'
import { EXAM_ATTEMPTS_COLLECTION } from '@/lib/tracking/exam-attempts'

/**
 * Zerar uma prova: apagar tudo o que os alunos deixaram nela.
 *
 * ## O que "zerar" apagava antes
 *
 * Só `submissions`. O botão prometia devolver a prova ao estado de quem nunca
 * a fez, e devolvia pela metade — o que sobrava não era invisível, era pior:
 *
 *  - **`exam_progress`** (o rascunho da retomada) sobrevivia com
 *    `resumesUsed` já gasto. O aluno refazia a prova zerada, caía, e a
 *    retomada dele já estava consumida por uma tentativa que não existe mais.
 *    Pior: ao abrir a prova ele reencontrava as respostas antigas e o
 *    `startedAt` da tentativa anterior — cronômetro já correndo.
 *  - **`exam_attempts`** mantinha a tentativa aberta no painel ao vivo, então
 *    o admin via gente "fazendo" uma prova que foi zerada.
 *  - **anotações e relatos de questão** continuavam presos a uma aplicação
 *    que deixou de existir.
 *
 * ## O critério do que entra aqui
 *
 * Tudo que é **do aluno e desta prova**. Nada que seja da prova em si: o
 * documento em `exams` não é tocado — questões, datas, portões e configurações
 * ficam exatamente como estavam. Zerar é sobre quem respondeu, não sobre o que
 * foi perguntado.
 */

/** As coleções que guardam dados de aluno presos a uma prova. */
export interface ContagemDoReset {
  submissoes: number
  rascunhos: number
  tentativas: number
  anotacoes: number
  relatosDeQuestao: number
  /**
   * Quem tinha passado pelo portão.
   *
   * Ficava de fora, e por isso o reset não devolvia a prova ao estado inicial:
   * as entregas sumiam e a turma continuava "dentro" — pronta para começar de
   * novo sem passar pelo portão outra vez.
   */
  entradas: number
}

export const TOTAL_ZERADO = (contagem: ContagemDoReset): number =>
  contagem.submissoes +
  contagem.rascunhos +
  contagem.tentativas +
  contagem.anotacoes +
  contagem.relatosDeQuestao +
  contagem.entradas

/**
 * Uma frase em português com o que foi apagado, para o toast do painel.
 *
 * Enumerar só o que teve contagem maior que zero: "0 anotações" numa prova sem
 * anotações é ruído que faz a mensagem parecer um relatório de erro.
 */
export function descreverReset(contagem: ContagemDoReset): string {
  const partes: string[] = []
  const empilhar = (n: number, singular: string, plural: string) => {
    if (n > 0) partes.push(`${n} ${n === 1 ? singular : plural}`)
  }

  empilhar(contagem.submissoes, 'entrega', 'entregas')
  empilhar(contagem.rascunhos, 'rascunho', 'rascunhos')
  empilhar(contagem.tentativas, 'tentativa registrada', 'tentativas registradas')
  empilhar(contagem.anotacoes, 'anotação', 'anotações')
  empilhar(contagem.relatosDeQuestao, 'relato de questão', 'relatos de questão')

  if (partes.length === 0) return 'A prova já estava zerada — não havia dados de aluno para apagar.'
  if (partes.length === 1) return `Prova zerada: ${partes[0]} apagada(s).`

  const ultima = partes.pop()!
  return `Prova zerada: ${partes.join(', ')} e ${ultima} apagados.`
}

/**
 * Apaga os dados de aluno desta prova e devolve a contagem por coleção.
 *
 * As remoções são independentes entre si e rodam em paralelo: nenhuma depende
 * do resultado da outra, e falhar em uma não deve deixar as demais de pé.
 */
export async function zerarDadosDaProva(db: Db, examId: string): Promise<ContagemDoReset> {
  // `banco_questoes_reports` grava `examId` como ObjectId (as outras usam
  // texto). Um filtro com o tipo errado não dá erro — ele simplesmente não
  // encontra nada, que é a forma mais silenciosa de um reset ficar pela metade.
  const examObjectId = ObjectId.isValid(examId) ? new ObjectId(examId) : null

  const [submissoes, rascunhos, tentativas, anotacoes, relatosDeQuestao, entradas] =
    await Promise.all([
      db.collection('submissions').deleteMany({ examId }),
      db.collection(COLECAO_DE_PROGRESSO).deleteMany({ examId }),
      db.collection(EXAM_ATTEMPTS_COLLECTION).deleteMany({ examId }),
      db.collection('user_anotacoes').deleteMany({ examId }),
      examObjectId
        ? db.collection('banco_questoes_reports').deleteMany({ examId: examObjectId })
        : Promise.resolve({ deletedCount: 0 }),
      // Sem isto o reset deixava a turma "dentro": as entregas sumiam e todo
      // mundo continuava autorizado a começar sem passar pelo portão de novo.
      db.collection(COLECAO_DE_ENTRADAS).deleteMany({ examId }),
    ])

  return {
    submissoes: submissoes.deletedCount ?? 0,
    rascunhos: rascunhos.deletedCount ?? 0,
    tentativas: tentativas.deletedCount ?? 0,
    anotacoes: anotacoes.deletedCount ?? 0,
    relatosDeQuestao: relatosDeQuestao.deletedCount ?? 0,
    entradas: entradas.deletedCount ?? 0,
  }
}
