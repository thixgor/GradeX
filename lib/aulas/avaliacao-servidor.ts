import { ObjectId, type Db } from 'mongodb'
import { exigeAvaliacao, type AvaliacaoDaAula } from '@/lib/aulas/avaliacao'

/**
 * A parte da avaliação (§39) que precisa do banco.
 *
 * Separada de `lib/aulas/avaliacao.ts` porque aquele arquivo é lido pelo editor
 * e pela página da aula, que rodam no navegador — importar `mongodb` de lá
 * arrastaria o driver para dentro do bundle do cliente.
 */

/**
 * A pessoa já entregou esta prova?
 *
 * "Entregou", e não "passou": a nota é assunto do sistema de provas, com
 * correção manual, discursivas e recurso. Barrar a conclusão da aula por nota
 * transformaria a aula num segundo lugar onde se decide aprovação, com uma
 * régua que ninguém configurou.
 */
export async function fezAvaliacao(db: Db, usuarioId: string, examId: string): Promise<boolean> {
  if (!usuarioId || !ObjectId.isValid(examId)) return false
  const alternativas: unknown[] = [examId]
  // As rotas de prova gravam `examId` como texto, mas documentos antigos podem
  // trazer ObjectId. Aceitar as duas formas evita recusar a conclusão de quem
  // realmente fez a prova.
  alternativas.push(new ObjectId(examId))

  const encontrada = await db.collection('submissions').countDocuments(
    { userId: usuarioId, examId: { $in: alternativas } },
    { limit: 1 },
  )
  return encontrada > 0
}

/**
 * A prova apontada ainda existe?
 *
 * /provas apaga provas sem saber quem aponta para elas, então o vínculo da aula
 * pode ficar pendurado. Quem pergunta isto é a tela do aluno, para não oferecer
 * um botão que abre um erro.
 */
export async function provaExiste(db: Db, examId: string): Promise<boolean> {
  if (!ObjectId.isValid(examId)) return false
  const achou = await db.collection('exams').countDocuments(
    { _id: new ObjectId(examId), isDeleted: { $ne: true } },
    { limit: 1 },
  )
  return achou > 0
}

/**
 * Pode marcar esta aula como concluída?
 *
 * Devolve `true` de imediato quando não há avaliação obrigatória — que é o caso
 * da esmagadora maioria das aulas — para não custar uma consulta extra no
 * caminho normal.
 */
export async function liberadoParaConcluir(
  db: Db,
  usuarioId: string,
  avaliacao: AvaliacaoDaAula | null | undefined,
): Promise<boolean> {
  if (!exigeAvaliacao(avaliacao)) return true
  if (await fezAvaliacao(db, usuarioId, avaliacao!.examId)) return true

  /*
   * Prova apagada não tranca o curso.
   *
   * O vínculo é por id, e o sistema de provas apaga provas sem saber quem
   * aponta para elas. Sem esta saída, uma prova removida deixaria a aula
   * impossível de concluir para sempre — e a aula continuaria pedindo uma
   * prova que não abre. O admin vê o vínculo quebrado no editor e conserta;
   * o aluno não fica preso enquanto isso.
   */
  return !(await provaExiste(db, avaliacao!.examId))
}
